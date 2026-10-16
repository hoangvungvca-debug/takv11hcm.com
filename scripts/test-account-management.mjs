import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { assertAccountSchema, buildAccountChange, hasCurrentSession, hashAccountPassword, rememberedSessionRenewal, sameAdminOrigin, updateManagedAccount } from '../server/account-management.mjs';

const ownerEmail = 'owner@example.test';
const actor = { openId: 'admin_test', email: ownerEmail, name: 'Quản trị giả lập', role: 'admin', status: 'approved', sessionVersion: 0 };
const target = { openId: 'user_test', email: 'user@example.test', name: 'Tài khoản giả lập', role: 'viewer', status: 'pending', sessionVersion: 0 };
const fail = (fn, status) => assert.throws(fn, (error) => error.status === status);

class MemoryPool {
  constructor(accounts = [actor, target]) {
    this.accounts = new Map(accounts.map((user) => [user.openId, structuredClone(user)]));
    this.audit = [];
    this.invalidated = [];
    this.released = 0;
  }
  async getConnection() {
    const self = this;
    let snapshot;
    return {
      beginTransaction: async () => { snapshot = structuredClone({ accounts: [...self.accounts], audit: self.audit, invalidated: self.invalidated }); },
      execute: async (sql, args) => {
        if (sql.includes('WHERE open_id IN')) return [[...self.accounts.values()].filter((user) => args.includes(user.openId))];
        if (sql.includes('LOWER(TRIM(email))')) return [[...self.accounts.values()].filter((user) => user.email.trim().toLowerCase() === args[0] && user.openId !== args[1])];
        if (sql.startsWith('UPDATE app_users SET password_hash')) {
          const [hash, salt, id] = args;
          self.accounts.set(id, { ...self.accounts.get(id), passwordHash: hash, passwordSalt: salt });
          return [{ affectedRows: 1 }];
        }
        if (sql.startsWith('UPDATE app_users')) {
          const [name, email, status, deletedAt, previousStatus, sessionVersion, id] = args;
          self.accounts.set(id, { ...self.accounts.get(id), name, email, status, deletedAt, previousStatus, sessionVersion });
          return [{ affectedRows: 1 }];
        }
        if (sql.startsWith('UPDATE password_reset_tokens')) { self.invalidated.push(args[0]); return [{ affectedRows: 1 }]; }
        if (sql.startsWith('INSERT INTO account_admin_audit')) {
          if (self.failAudit) throw new Error('Lỗi nhật ký giả lập');
          self.audit.push(args); return [{ insertId: self.audit.length }];
        }
        throw new Error(`SQL chưa có fixture: ${sql}`);
      },
      commit: async () => {},
      rollback: async () => { self.accounts = new Map(snapshot.accounts); self.audit = snapshot.audit; self.invalidated = snapshot.invalidated; },
      release: () => { self.released += 1; },
    };
  }
}

test('Chỉ quản trị viên đã duyệt được thao tác', () => {
  fail(() => buildAccountChange({ ...actor, role: 'viewer' }, target, { action: 'approve' }, ownerEmail), 403);
  fail(() => buildAccountChange({ ...actor, status: 'pending' }, target, { action: 'delete' }, ownerEmail), 403);
  fail(() => buildAccountChange(actor, null, { action: 'edit' }, ownerEmail), 404);
  fail(() => buildAccountChange(actor, target, { action: 'unknown' }, ownerEmail), 400);
});

test('Phê duyệt không nâng vai trò và không thay thông tin tài khoản', async () => {
  const pool = new MemoryPool();
  const user = await updateManagedAccount(pool, actor, target.openId, { action: 'approve' }, ownerEmail);
  assert.equal(user.status, 'approved'); assert.equal(user.role, 'viewer'); assert.equal(user.email, target.email);
  assert.equal(pool.audit.length, 1); assert.equal(pool.released, 1);
});

test('Duyệt lại tài khoản vô hiệu hóa không khôi phục JWT cũ, kể cả tài khoản phiên bản trước', async () => {
  const pool = new MemoryPool([actor, { ...target, status: 'disabled' }]);
  const user = await updateManagedAccount(pool, actor, target.openId, { action: 'approve' }, ownerEmail);
  assert.equal(user.status, 'approved'); assert.equal(user.sessionVersion, 1);
  assert.equal(hasCurrentSession({}, user), false); assert.equal(hasCurrentSession({ sessionVersion: 1 }, user), true);
  assert.equal(pool.invalidated.length, 1);
});

test('Runtime chỉ kiểm tra lịch sử migration, không chạy DDL', async () => {
  let queries = 0;
  await assertAccountSchema({ execute: async (sql) => { assert.ok(sql.startsWith('SELECT')); queries++; return [[{ version: 'applied' }]]; } });
  assert.equal(queries, 1);
  await assert.rejects(assertAccountSchema({ execute: async () => [[]] }), /db:migrate:accounts/);
});

test('Xóa và khôi phục giữ chờ duyệt; token cũ không sống lại', async () => {
  const pool = new MemoryPool();
  const deleted = await updateManagedAccount(pool, actor, target.openId, { action: 'delete' }, ownerEmail);
  assert.equal(deleted.status, 'deleted'); assert.equal(deleted.previousStatus, 'pending'); assert.ok(deleted.deletedAt);
  assert.equal(hasCurrentSession({ sessionVersion: 0 }, deleted), false);
  const restored = await updateManagedAccount(pool, actor, target.openId, { action: 'restore' }, ownerEmail);
  assert.equal(restored.status, 'pending'); assert.equal(restored.deletedAt, null); assert.equal(restored.sessionVersion, 2);
  assert.equal(hasCurrentSession({ sessionVersion: 0 }, restored), false);
  assert.equal(pool.audit.length, 2); assert.equal(pool.invalidated.length, 2);
});

test('Khôi phục đúng trạng thái đã duyệt và phải tạo phiên mới', async () => {
  const pool = new MemoryPool([actor, { ...target, status: 'approved' }]);
  const deleted = await updateManagedAccount(pool, actor, target.openId, { action: 'delete' }, ownerEmail);
  const restored = await updateManagedAccount(pool, actor, target.openId, { action: 'restore' }, ownerEmail);
  assert.equal(deleted.previousStatus, 'approved'); assert.equal(restored.status, 'approved');
  assert.equal(hasCurrentSession({ sessionVersion: 0 }, restored), false);
  assert.equal(hasCurrentSession({ sessionVersion: 2 }, restored), true);
});

test('Phiên hợp lệ hiện tại vẫn dùng được; phiên chờ duyệt, từ chối, vô hiệu hóa bị chặn', () => {
  assert.equal(hasCurrentSession({}, { ...target, status: 'approved' }), true);
  for (const status of ['pending', 'rejected', 'disabled', 'deleted']) assert.equal(hasCurrentSession({}, { ...target, status }), false);
  assert.equal(hasCurrentSession({ sessionVersion: 1 }, { ...target, status: 'approved', sessionVersion: 2 }), false);
});

test('Không xóa/vô hiệu hóa/từ chối chính mình và chủ hệ thống', () => {
  for (const action of ['delete', 'disable', 'reject']) {
    fail(() => buildAccountChange(actor, actor, { action }, ownerEmail), 409);
    fail(() => buildAccountChange({ ...actor, openId: 'admin2', email: 'admin2@example.test' }, actor, { action }, ownerEmail), 409);
  }
});

test('Sửa họ tên/email hợp lệ; không đổi vai trò, mật khẩu, email chủ hệ thống', () => {
  const change = buildAccountChange(actor, target, { action: 'edit', name: 'Tên Mới', email: ' NEW@example.test ' }, ownerEmail);
  assert.equal(change.next.email, 'new@example.test'); assert.equal(change.next.name, 'Tên Mới');
  assert.equal(change.next.role, 'viewer'); assert.equal(change.next.sessionVersion, 1);
  fail(() => buildAccountChange(actor, target, { action: 'edit', name: 'A', email: 'bad' }, ownerEmail), 400);
  fail(() => buildAccountChange(actor, target, { action: 'edit', name: '', email: 'a@example.test' }, ownerEmail), 400);
  fail(() => buildAccountChange(actor, target, { action: 'edit', name: 'A', email: 'a@example.test', role: 'admin' }, ownerEmail), 400);
  fail(() => buildAccountChange(actor, actor, { action: 'edit', name: 'A', email: 'another@example.test' }, ownerEmail), 409);
  fail(() => buildAccountChange(actor, target, { action: 'edit', name: 'A', email: ownerEmail }, ownerEmail), 409);
});

test('Tên mới không thu hồi phiên; email mới thu hồi phiên và token khôi phục cũ', async () => {
  const pool = new MemoryPool([actor, { ...target, status: 'approved' }]);
  const renamed = await updateManagedAccount(pool, actor, target.openId, { action: 'edit', name: 'Đổi tên', email: target.email }, ownerEmail);
  assert.equal(renamed.sessionVersion, 0); assert.equal(pool.invalidated.length, 0);
  const renamedEmail = await updateManagedAccount(pool, actor, target.openId, { action: 'edit', name: 'Đổi tên', email: 'new@example.test' }, ownerEmail);
  assert.equal(renamedEmail.sessionVersion, 1); assert.equal(pool.invalidated.length, 1);
  assert.equal(hasCurrentSession({ sessionVersion: 0 }, renamedEmail), false);
});

test('Email trùng tài khoản trong thùng rác bị từ chối, giao dịch rollback', async () => {
  const pool = new MemoryPool([actor, target, { ...target, openId: 'deleted_test', email: 'used@example.test', status: 'deleted' }]);
  await assert.rejects(updateManagedAccount(pool, actor, target.openId, { action: 'edit', name: 'A', email: 'used@example.test' }, ownerEmail), (error) => error.status === 409);
  assert.equal(pool.accounts.get(target.openId).email, target.email); assert.equal(pool.audit.length, 0); assert.equal(pool.released, 1);
});

test('Ghi nhật ký thất bại rollback toàn bộ thay đổi', async () => {
  const pool = new MemoryPool(); pool.failAudit = true;
  await assert.rejects(updateManagedAccount(pool, actor, target.openId, { action: 'delete' }, ownerEmail));
  assert.equal(pool.accounts.get(target.openId).status, 'pending'); assert.equal(pool.invalidated.length, 0);
  assert.equal(pool.audit.length, 0); assert.equal(pool.released, 1);
});

test('Quyền/phiên quản trị thay đổi khi giao dịch bắt đầu phải bị từ chối', async () => {
  const pool = new MemoryPool([{ ...actor, sessionVersion: 1 }, target]);
  await assert.rejects(updateManagedAccount(pool, actor, target.openId, { action: 'approve' }, ownerEmail), (error) => error.status === 403);
  assert.equal(pool.accounts.get(target.openId).status, 'pending');
});

test('Chặn thao tác trên tài khoản đã xóa và chuyển trạng thái không hợp lệ', () => {
  for (const action of ['approve', 'edit', 'delete']) fail(() => buildAccountChange(actor, { ...target, status: 'deleted' }, { action }, ownerEmail), 409);
  fail(() => buildAccountChange(actor, target, { action: 'restore' }, ownerEmail), 409);
  assert.equal(buildAccountChange(actor, { ...target, status: 'deleted', previousStatus: 'unknown' }, { action: 'restore' }, ownerEmail).next.status, 'pending');
});

test('CSRF: chỉ chấp nhận Origin của chính website', () => {
  const req = (origin, site = 'same-origin') => ({ headers: { origin, host: 'www.takv11hcm.com', 'sec-fetch-site': site } });
  assert.equal(sameAdminOrigin(req('https://www.takv11hcm.com')), true);
  assert.equal(sameAdminOrigin(req('https://evil.example')), false);
  assert.equal(sameAdminOrigin(req(undefined)), false);
  assert.equal(sameAdminOrigin(req('https://www.takv11hcm.com', 'cross-site')), false);
  assert.equal(sameAdminOrigin(req('null')), false);
});

test('Giữ nguyên trang chủ, sidebar, danh bạ, biểu mẫu, CSS và route', async () => {
  const before = execFileSync('git', ['show', '25053ba:src/main.tsx'], { encoding: 'utf8' });
  const after = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const withoutAdmin = (source) => source.replace("import AccountAdminPage from './admin/AccountAdminPage';\n", '')
    .replace(/function AdminPage\(\)[\s\S]*?(?=type DirectoryEntry)/, '');
  assert.equal(withoutAdmin(before).slice(withoutAdmin(before).indexOf('type DirectoryEntry')), withoutAdmin(after).slice(withoutAdmin(after).indexOf('type DirectoryEntry')));
  const styles = await readFile(new URL('../src/styles.css', import.meta.url));
  const originalStyles = execFileSync('git', ['show', '25053ba:src/styles.css']);
  const withoutMobileNavigation = (value) => {
    const css = value.toString();
    const marker = css.indexOf('/* Mobile');
    const start = css.indexOf('  .topbar{height:auto', marker);
    return (css.slice(0, marker) + css.slice(start))
      .replace(/  \.footer\{margin-left:(?:-72px|calc\(-1 \* var\(--mobile-sidebar-width\)\));width:calc\(100% \+ (?:72px|var\(--mobile-sidebar-width\))\)/,
        '  .footer{margin-left:MOBILE_SIDEBAR;width:MOBILE_SIDEBAR');
  };
  assert.equal(withoutMobileNavigation(styles), withoutMobileNavigation(originalStyles));
  assert.ok(styles.toString().includes('.side-link>span:not(.side-icon){display:block;'));
  assert.ok(styles.toString().includes('white-space:normal;overflow-wrap:anywhere'));
  assert.ok(!styles.toString().includes('.side-link>span:not(.side-icon),.side-link>b,.sidebar-bottom span{display:none}'));
  const routes = await readFile(new URL('../public/manus-routes.json', import.meta.url));
  assert.deepEqual(routes, execFileSync('git', ['show', '25053ba:public/manus-routes.json']));
});


test('Đặt lại mật khẩu người dùng: băm với salt, hủy phiên/token cũ, không tự duyệt và không ghi mật khẩu vào nhật ký', async () => {
  const pool = new MemoryPool();
  const newPassword = 'Fixture-New-Password-9!';
  const result = await updateManagedAccount(pool, actor, target.openId, { action: 'resetPassword', newPassword, passwordConfirmation: newPassword }, ownerEmail);
  const saved = pool.accounts.get(target.openId);
  assert.equal(saved.status, 'pending'); assert.equal(saved.role, 'viewer'); assert.equal(saved.sessionVersion, 1);
  assert.equal(saved.passwordHash, hashAccountPassword(newPassword, saved.passwordSalt).hash);
  assert.notEqual(saved.passwordHash, newPassword); assert.equal(pool.invalidated.length, 1);
  assert.equal(JSON.stringify(pool.audit).includes(newPassword), false);
  assert.equal(Object.hasOwn(result, 'passwordHash'), false);
});

test('Mật khẩu không khớp/quá ngắn/quá dài bị từ chối; không reset tài khoản đã xóa', () => {
  fail(() => buildAccountChange(actor, target, { action: 'resetPassword', newPassword: 'short', passwordConfirmation: 'short' }, ownerEmail), 400);
  fail(() => buildAccountChange(actor, target, { action: 'resetPassword', newPassword: 'Fixture-Password-8', passwordConfirmation: 'Other-Password-8' }, ownerEmail), 400);
  fail(() => buildAccountChange(actor, target, { action: 'resetPassword', newPassword: 'a'.repeat(129), passwordConfirmation: 'a'.repeat(129) }, ownerEmail), 400);
  fail(() => buildAccountChange(actor, { ...target, status: 'deleted' }, { action: 'resetPassword' }, ownerEmail), 409);
  fail(() => buildAccountChange({ ...actor, role: 'viewer' }, target, { action: 'resetPassword' }, ownerEmail), 403);
});

test('Chính chủ đổi mật khẩu yêu cầu mật khẩu cũ; quản trị khác không được reset chủ hệ thống', async () => {
  const old = hashAccountPassword('Fixture-Old-Password-9!');
  const account = { ...actor, passwordHash: old.hash, passwordSalt: old.salt };
  const pool = new MemoryPool([account, target]);
  const body = { action: 'resetPassword', newPassword: 'Fixture-New-Password-9!', passwordConfirmation: 'Fixture-New-Password-9!' };
  await assert.rejects(updateManagedAccount(pool, actor, actor.openId, { ...body, currentPassword: 'incorrect' }, ownerEmail), (error) => error.status === 401);
  assert.equal(pool.accounts.get(actor.openId).sessionVersion, 0);
  const result = await updateManagedAccount(pool, actor, actor.openId, { ...body, currentPassword: 'Fixture-Old-Password-9!' }, ownerEmail);
  assert.equal(result.sessionVersion, 1); assert.equal(Object.hasOwn(result, 'passwordHash'), false);
  fail(() => buildAccountChange({ ...actor, openId: 'another_admin' }, actor, body, ownerEmail), 403);
});

test('Đặt lại mật khẩu lỗi nhật ký rollback cả hash và phiên', async () => {
  const old = hashAccountPassword('Fixture-Old-Password-9!');
  const pool = new MemoryPool([actor, { ...target, passwordHash: old.hash, passwordSalt: old.salt }]); pool.failAudit = true;
  await assert.rejects(updateManagedAccount(pool, actor, target.openId, { action: 'resetPassword', newPassword: 'Fixture-New-Password-9!', passwordConfirmation: 'Fixture-New-Password-9!' }, ownerEmail));
  assert.equal(pool.accounts.get(target.openId).passwordHash, old.hash); assert.equal(pool.accounts.get(target.openId).sessionVersion, 0);
  assert.equal(pool.audit.length, 0);
});

test('Chỉ gia hạn phiên ghi nhớ còn hiệu lực và gần hết hạn; không khôi phục phiên hết hạn/bỏ ghi nhớ', () => {
  const now = 1000000;
  const renewal = rememberedSessionRenewal({ openId: target.openId, sessionVersion: 3, exp: now + 60, remember: true }, now);
  assert.equal(renewal.exp, now + 30 * 24 * 60 * 60); assert.equal(renewal.sessionVersion, 3);
  assert.equal(rememberedSessionRenewal({ exp: now + 60, remember: false }, now), null);
  assert.equal(rememberedSessionRenewal({ exp: now - 1, remember: true }, now), null);
  assert.equal(rememberedSessionRenewal({ exp: now + 30 * 24 * 60 * 60, remember: true }, now), null);
  assert.equal(rememberedSessionRenewal({ remember: true }, now), null);
  assert.ok(rememberedSessionRenewal({ exp: now + 60 }, now));
});

test('Luồng đăng nhập kiểm tra phiên máy chủ, không dùng email đã lưu để cấp quyền', async () => {
  const main = await readFile(new URL('../src/main.tsx', import.meta.url), 'utf8');
  const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
  assert.ok(main.includes('const [rememberMe, setRememberMe] = useState(true)'));
  assert.ok(main.includes('!sessionResponse.ok || !sessionData.authenticated'));
  assert.ok(main.includes('!forgotMode && !pending && !resetMode'));
  assert.ok(server.indexOf('if (!hasCurrentSession(payload, rows[0])) return null') < server.indexOf('rememberedSessionRenewal(payload)'));
  assert.ok(server.includes('const user = await currentUser(req, res)'));
});
