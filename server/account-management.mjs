export class AccountError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const canAdminister = (user) => user?.role === 'admin' && user?.status === 'approved';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const reversibleStatuses = ['pending', 'approved', 'admin', 'rejected', 'disabled'];
export const accountFields = `open_id AS openId, email, display_name AS name, role, status,
  created_at AS createdAt, last_login_at AS lastLoginAt, deleted_at AS deletedAt,
  previous_status AS previousStatus, session_version AS sessionVersion`;

export async function ensureAccountSchema(connection) {
  await connection.query(`CREATE TABLE IF NOT EXISTS app_schema_migrations (
    version VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  const version = '20261016_account_management_v1';
  const [applied] = await connection.execute('SELECT version FROM app_schema_migrations WHERE version=?', [version]);
  if (applied.length) return;
  const [columns] = await connection.query('SHOW COLUMNS FROM app_users');
  const names = new Set(columns.map((column) => column.Field));
  for (const [name, definition] of [
    ['deleted_at', 'DATETIME NULL'],
    ['previous_status', 'VARCHAR(32) NULL'],
    ['session_version', 'BIGINT UNSIGNED NOT NULL DEFAULT 0'],
  ]) {
    if (!names.has(name)) {
      try { await connection.query(`ALTER TABLE app_users ADD COLUMN ${name} ${definition}`); }
      catch (error) { if (error.code !== 'ER_DUP_FIELDNAME') throw error; }
    }
  }
  const [indexes] = await connection.query('SHOW INDEX FROM app_users');
  if (!indexes.some((index) => index.Key_name === 'uq_app_users_email')) {
    try { await connection.query('ALTER TABLE app_users ADD UNIQUE INDEX uq_app_users_email (email)'); }
    catch (error) { if (error.code !== 'ER_DUP_KEYNAME') throw error; }
  }
  await connection.query(`CREATE TABLE IF NOT EXISTS account_admin_audit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id VARCHAR(191) NOT NULL,
    target_id VARCHAR(191) NOT NULL,
    action VARCHAR(32) NOT NULL,
    before_data JSON NOT NULL,
    after_data JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account_audit_target (target_id)
  )`);
  await connection.execute('INSERT IGNORE INTO app_schema_migrations (version) VALUES (?)', [version]);
}

export async function assertAccountSchema(connection) {
  try {
    const [applied] = await connection.execute('SELECT version FROM app_schema_migrations WHERE version=?', ['20261016_account_management_v1']);
    if (!applied.length) throw new Error('Cần chạy pnpm db:migrate:accounts trước khi khởi động phiên bản quản trị.');
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') throw new Error('Cần chạy pnpm db:migrate:accounts trước khi khởi động phiên bản quản trị.');
    throw error;
  }
}

export function buildAccountChange(actor, target, body, ownerEmail) {
  if (!canAdminister(actor)) throw new AccountError(403, 'Bạn không có quyền quản trị.');
  if (!target) throw new AccountError(404, 'Không tìm thấy tài khoản.');
  const action = body.action;
  if (!['approve', 'reject', 'disable', 'edit', 'delete', 'restore'].includes(action)) {
    throw new AccountError(400, 'Thao tác không hợp lệ.');
  }
  const owner = normalizeEmail(target.email) === normalizeEmail(ownerEmail);
  const self = target.openId === actor.openId;
  if ((owner || self) && ['delete', 'disable', 'reject'].includes(action)) {
    throw new AccountError(409, 'Không thể xóa hoặc vô hiệu hóa chính mình hay tài khoản chủ hệ thống.');
  }
  const next = { ...target };
  if (action === 'restore') {
    if (target.status !== 'deleted') throw new AccountError(409, 'Tài khoản không nằm trong thùng rác.');
    if (owner) throw new AccountError(409, 'Tài khoản chủ hệ thống cần được xử lý riêng.');
    next.status = reversibleStatuses.includes(target.previousStatus) ? target.previousStatus : 'pending';
    next.deletedAt = null;
    next.previousStatus = null;
    next.sessionVersion = Number(target.sessionVersion || 0) + 1;
  } else {
    if (target.status === 'deleted') throw new AccountError(409, 'Cần khôi phục tài khoản trước khi chỉnh sửa hoặc phê duyệt.');
    if (action === 'edit') {
      if (['role', 'status', 'password', 'passwordHash', 'passwordSalt'].some((key) => Object.hasOwn(body, key))) {
        throw new AccountError(400, 'Biểu mẫu sửa chỉ cho phép đổi họ tên và email.');
      }
      const name = String(body.name || '').trim();
      const email = normalizeEmail(body.email);
      if (!name || name.length > 255 || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AccountError(400, 'Họ tên không được trống (tối đa 255 ký tự); email phải hợp lệ.');
      }
      if (owner && email !== normalizeEmail(ownerEmail)) throw new AccountError(409, 'Không thể thay email của tài khoản chủ hệ thống.');
      if (!owner && email === normalizeEmail(ownerEmail)) throw new AccountError(409, 'Email này dành cho tài khoản chủ hệ thống.');
      next.name = name;
      next.email = email;
      if (email !== normalizeEmail(target.email)) next.sessionVersion = Number(target.sessionVersion || 0) + 1;
    } else if (action === 'delete') {
      next.previousStatus = target.status;
      next.status = 'deleted';
      next.deletedAt = new Date();
      next.sessionVersion = Number(target.sessionVersion || 0) + 1;
    } else if (action === 'approve') {
      if (!['pending', 'rejected', 'disabled'].includes(target.status)) throw new AccountError(409, 'Tài khoản không cần phê duyệt lại.');
      next.status = 'approved';
      next.sessionVersion = Number(target.sessionVersion || 0) + 1;
    } else if (action === 'reject') {
      if (target.status !== 'pending') throw new AccountError(409, 'Chỉ có thể từ chối tài khoản đang chờ duyệt.');
      next.status = 'rejected';
      next.sessionVersion = Number(target.sessionVersion || 0) + 1;
    } else if (action === 'disable') {
      if (!['approved', 'admin'].includes(target.status)) throw new AccountError(409, 'Tài khoản không đang hoạt động.');
      next.status = 'disabled';
      next.sessionVersion = Number(target.sessionVersion || 0) + 1;
    }
  }
  return { action, next };
}

export function hasCurrentSession(payload, user) {
  return Boolean(user && ['approved', 'admin'].includes(user.status)
    && Number(payload?.sessionVersion || 0) === Number(user.sessionVersion || 0));
}

export function sameAdminOrigin(req, allowedOrigins = []) {
  const origin = req.headers.origin;
  if (!origin || req.headers['sec-fetch-site'] === 'cross-site') return false;
  try {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return parsed.host === req.headers.host || allowedOrigins.includes(parsed.origin);
  } catch { return false; }
}

export async function updateManagedAccount(pool, actor, targetId, body, ownerEmail) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(`SELECT ${accountFields} FROM app_users
      WHERE open_id IN (?,?) ORDER BY open_id FOR UPDATE`, [actor.openId, targetId]);
    const freshActor = rows.find((row) => row.openId === actor.openId);
    if (!canAdminister(freshActor) || Number(freshActor.sessionVersion || 0) !== Number(actor.sessionVersion || 0)) {
      throw new AccountError(403, 'Quyền quản trị hoặc phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.');
    }
    const target = rows.find((row) => row.openId === targetId);
    const { action, next } = buildAccountChange(freshActor, target, body, ownerEmail);
    if (action === 'edit') {
      const [duplicates] = await connection.execute(
        'SELECT open_id FROM app_users WHERE LOWER(TRIM(email))=? AND open_id<>? LIMIT 1', [next.email, targetId]);
      if (duplicates.length) throw new AccountError(409, 'Email đã được sử dụng (kể cả tài khoản trong thùng rác).');
    }
    await connection.execute(`UPDATE app_users SET display_name=?, email=?, status=?,
      deleted_at=?, previous_status=?, session_version=? WHERE open_id=?`, [next.name, next.email,
      next.status, next.deletedAt || null, next.previousStatus || null, Number(next.sessionVersion || 0), targetId]);
    if (Number(next.sessionVersion || 0) !== Number(target.sessionVersion || 0)) {
      await connection.execute('UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE open_id=? AND used_at IS NULL', [targetId]);
    }
    const audit = (value) => JSON.stringify({ name: value.name, email: value.email, role: value.role,
      status: value.status, deletedAt: value.deletedAt, previousStatus: value.previousStatus });
    await connection.execute(`INSERT INTO account_admin_audit
      (actor_id,target_id,action,before_data,after_data) VALUES (?,?,?,?,?)`,
    [freshActor.openId, targetId, action, audit(target), audit(next)]);
    await connection.commit();
    return next;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') throw new AccountError(409, 'Email đã được sử dụng bởi tài khoản khác.');
    throw error;
  } finally { connection.release(); }
}
