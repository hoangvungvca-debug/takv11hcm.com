import http from 'node:http';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import { AccountError, accountFields, assertAccountSchema, hasCurrentSession, rememberedSessionRenewal, sameAdminOrigin, updateManagedAccount } from './server/account-management.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const adminEmail = (process.env.ADMIN_EMAIL || 'hoangvungvca@gmail.com').trim().toLowerCase();
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const projectId = process.env.MANUS_PROJECT_ID || '';
const jwtSecret = process.env.MANUS_JWT_SECRET || '';
const oauthPortal = process.env.MANUS_OAUTH_PORTAL_URL || '';
const oauthApi = process.env.MANUS_OAUTH_API_URL || '';
let pool;
let schemaPromise;
let lettersSchemaPromise;
let passwordSchemaPromise;
let chatSchemaPromise;
let visitsSchemaPromise;
let resetSchemaPromise;
let accountSchemaPromise;

const base64url = (value) => Buffer.from(value).toString('base64url');
const parseJson = (value) => { try { return JSON.parse(value); } catch { return null; } };
const sign = (payload) => {
  const head = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', jwtSecret).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${signature}`;
};
const verify = (token) => {
  if (!jwtSecret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expected = createHmac('sha256', jwtSecret).update(`${parts[0]}.${parts[1]}`).digest('base64url');
  if (expected.length !== parts[2].length || !timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) return null;
  const payload = parseJson(Buffer.from(parts[1], 'base64url').toString('utf8'));
  if (!payload || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (projectId && payload.appId !== projectId) return null;
  return payload;
};
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key]) => key));
const appendCookie = (res, cookie) => { const current = res.getHeader('Set-Cookie'); res.setHeader('Set-Cookie', current ? (Array.isArray(current) ? [...current, cookie] : [current, cookie]) : cookie); };
const setCookie = (res, name, value, maxAge = 60 * 60 * 24 * 7) => appendCookie(res, `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=None; Secure`);
const setSessionCookie = (res, name, value, remember) => remember ? setCookie(res, name, value, SESSION_MAX_AGE) : appendCookie(res, `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=None; Secure`);
const clearCookie = (res, name) => appendCookie(res, `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=None; Secure`);
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const readBody = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; return parseJson(raw) || {}; };
const originFor = (req) => `${req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')}://${req.headers.host}`;

async function db() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = mysql.createPool(process.env.DATABASE_URL);
  if (!schemaPromise) schemaPromise = pool.query(`CREATE TABLE IF NOT EXISTS app_users (
    open_id VARCHAR(191) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'viewer',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_app_users_email (email),
    INDEX idx_app_users_status (status)
  )`);
  await schemaPromise;
  if (!passwordSchemaPromise) passwordSchemaPromise = Promise.all([
    pool.query('ALTER TABLE app_users ADD COLUMN password_hash VARCHAR(255) NULL'),
    pool.query('ALTER TABLE app_users ADD COLUMN password_salt VARCHAR(255) NULL')
  ]).catch((error) => { if (error.code !== 'ER_DUP_FIELDNAME') throw error; });
  await passwordSchemaPromise;
  if (!lettersSchemaPromise) lettersSchemaPromise = pool.query(`CREATE TABLE IF NOT EXISTS incoming_letters (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incoming_number VARCHAR(80) NOT NULL,
    received_date DATE NOT NULL,
    sender VARCHAR(255) NOT NULL,
    document_number VARCHAR(120) NULL,
    document_date DATE NULL,
    summary TEXT NOT NULL,
    handler VARCHAR(255) NULL,
    deadline DATE NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Chưa xử lý',
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_incoming_letters_date (received_date),
    INDEX idx_incoming_letters_status (status)
  )`);
  await lettersSchemaPromise;
  if (!chatSchemaPromise) chatSchemaPromise = pool.query(`CREATE TABLE IF NOT EXISTS internal_chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_created_at (created_at)
  )`);
  await chatSchemaPromise;
  if (!visitsSchemaPromise) visitsSchemaPromise = pool.query(`CREATE TABLE IF NOT EXISTS site_visit_stats (
    visit_date DATE PRIMARY KEY,
    visit_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await visitsSchemaPromise;
  if (!resetSchemaPromise) resetSchemaPromise = pool.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    open_id VARCHAR(191) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reset_open_id (open_id),
    INDEX idx_reset_expires_at (expires_at)
  )`);
  await resetSchemaPromise;
  if (!accountSchemaPromise) accountSchemaPromise = assertAccountSchema(pool);
  await accountSchemaPromise;
  return pool;
}

async function upsertUser(identity) {
  const connection = await db();
  if (!connection) return { ...identity, role: identity.email === adminEmail ? 'admin' : 'pending', status: identity.email === adminEmail ? 'approved' : 'pending' };
  const role = identity.email === adminEmail ? 'admin' : 'viewer';
  const status = identity.email === adminEmail ? 'approved' : 'pending';
  await connection.execute(`INSERT INTO app_users (open_id,email,display_name,role,status,last_login_at) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE email=VALUES(email), display_name=VALUES(display_name), last_login_at=CURRENT_TIMESTAMP,
    role=IF(email=?, 'admin', role), status=IF(email=?, 'approved', status)`, [identity.openId, identity.email, identity.name, role, status, adminEmail, adminEmail]);
  const [rows] = await connection.execute('SELECT open_id AS openId, email, display_name AS name, role, status FROM app_users WHERE open_id=?', [identity.openId]);
  return rows[0];
}

async function currentUser(req, res) {
  const payload = verify(cookies(req).webdev_app_session);
  if (!payload?.openId) return null;
  const connection = await db();
  if (!connection) return null;
  const [rows] = await connection.execute(`SELECT ${accountFields} FROM app_users WHERE open_id=?`, [payload.openId]);
  if (!hasCurrentSession(payload, rows[0])) return null;
  const renewal = res ? rememberedSessionRenewal(payload) : null;
  if (renewal) setSessionCookie(res, 'webdev_app_session', sign(renewal), true);
  return rows[0];
}

const isAdmin = (user) => user?.role === 'admin' && user?.status === 'approved';
const passwordHash = (password, salt = randomBytes(16).toString('hex')) => ({ salt, hash: scryptSync(password, salt, 64).toString('hex') });
const passwordMatches = (password, salt, expected) => { if (!salt || !expected) return false; const actual = Buffer.from(passwordHash(password, salt).hash, 'hex'); const target = Buffer.from(expected, 'hex'); return actual.length === target.length && timingSafeEqual(actual, target); };
const resetTokenHash = (token) => createHmac('sha256', jwtSecret || 'local-reset-token').update(token).digest('hex');
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

async function sendResetEmail(to, link) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject: 'Khôi phục mật khẩu — Hệ thống phần mềm TAND', text: `Bạn đã yêu cầu khôi phục mật khẩu. Mở liên kết sau trong vòng 30 phút: ${link}\n\nNếu không phải bạn, hãy bỏ qua email này.`, html: `<p>Bạn đã yêu cầu khôi phục mật khẩu cho Hệ thống phần mềm TAND.</p><p><a href="${link}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 30 phút. Nếu không phải bạn, hãy bỏ qua email này.</p>` }) });
  return response.ok;
}


async function exchangeCode(code, redirectUri) {
  if (!oauthApi || !projectId) throw new Error('OAuth chưa được cấu hình trong môi trường máy chủ');
  const response = await fetch(`${oauthApi}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: projectId, grantType: 'authorization_code', code, redirectUri }) });
  if (!response.ok) throw new Error(`OAuth exchange failed: ${response.status}`);
  return response.json();
}

async function getIdentity(accessToken) {
  const response = await fetch(`${oauthApi}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken }) });
  if (!response.ok) throw new Error(`OAuth identity failed: ${response.status}`);
  return response.json();
}

async function api(req, res, url) {
  if (url.pathname === '/_app/health') return json(res, 200, { ok: true });
  if (url.pathname === '/api/auth/register' && req.method === 'POST') {
    const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || ''); const name = String(body.name || email.split('@')[0]).trim();
    if (!validEmail(email) || password.length < 8 || !name) return json(res, 400, { error: 'Vui lòng nhập họ tên, email hợp lệ và mật khẩu từ 8 ký tự.' });
    const connection = await db(); const [existing] = await connection.execute('SELECT open_id FROM app_users WHERE email=? LIMIT 1', [email]); if (existing.length) return json(res, 409, { error: 'Email này đã được đăng ký.' });
    const identityId = `local_${randomBytes(12).toString('hex')}`; const admin = email === adminEmail; const hashed = passwordHash(password); const status = admin ? 'approved' : 'pending'; const role = admin ? 'admin' : 'viewer';
    await connection.execute('INSERT INTO app_users (open_id,email,display_name,password_hash,password_salt,role,status,last_login_at) VALUES (?,?,?,?,?,?,?,CURRENT_TIMESTAMP)', [identityId, email, name, hashed.hash, hashed.salt, role, status]);
    if (!admin) return json(res, 201, { ok: true, pending: true, message: 'Tài khoản đã đăng ký và đang chờ quản trị viên phê duyệt.' });
    const remember = body.remember !== false; const session = sign({ appId: projectId, openId: identityId, email, remember, sessionVersion: 0, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }); setSessionCookie(res, 'webdev_app_session', session, remember); return json(res, 201, { ok: true, pending: false });
  }
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || ''); const connection = await db(); const [rows] = await connection.execute('SELECT open_id AS openId, email, display_name AS name, password_hash AS passwordHash, password_salt AS passwordSalt, role, status, session_version AS sessionVersion FROM app_users WHERE email=? LIMIT 1', [email]); const user = rows[0];
    if (!user || !passwordMatches(password, user.passwordSalt, user.passwordHash)) return json(res, 401, { error: 'Email hoặc mật khẩu riêng của website không đúng. Mật khẩu Gmail/Manus không dùng được ở đây.' });
    if (!['approved', 'admin'].includes(user.status)) return json(res, 403, { pending: user.status === 'pending', error: user.status === 'deleted' ? 'Tài khoản đã bị xóa. Vui lòng liên hệ quản trị viên để khôi phục.' : user.status === 'pending' ? 'Tài khoản đang chờ quản trị viên phê duyệt.' : 'Tài khoản chưa được phép truy cập. Vui lòng liên hệ quản trị viên.' });
    const remember = body.remember !== false; await connection.execute('UPDATE app_users SET last_login_at=CURRENT_TIMESTAMP WHERE open_id=?', [user.openId]); const session = sign({ appId: projectId, openId: user.openId, email: user.email, remember, sessionVersion: Number(user.sessionVersion || 0), exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }); setSessionCookie(res, 'webdev_app_session', session, remember); return json(res, 200, { ok: true, remember, user: { email: user.email, name: user.name, role: user.role, status: user.status, isAdmin: isAdmin(user) } });
  }
  if (url.pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase();
    if (!validEmail(email)) return json(res, 400, { error: 'Vui lòng nhập email hợp lệ.' });
    const connection = await db(); if (!connection) return json(res, 503, { error: 'Máy chủ chưa sẵn sàng cho chức năng khôi phục mật khẩu.' });
    const [rows] = await connection.execute('SELECT open_id AS openId, email FROM app_users WHERE email=? AND status<>"deleted" LIMIT 1', [email]);
    if (!rows.length) return json(res, 200, { ok: true, message: 'Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư.' });
    const token = randomBytes(32).toString('hex'); const tokenHash = resetTokenHash(token);
    await connection.execute('UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE open_id=? AND used_at IS NULL', [rows[0].openId]);
    await connection.execute('INSERT INTO password_reset_tokens (open_id, token_hash, expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 MINUTE))', [rows[0].openId, tokenHash]);
    const delivered = await sendResetEmail(email, `${originFor(req)}/dang-nhap?reset=${token}`);
    if (!delivered) return json(res, 503, { error: 'Hệ thống chưa cấu hình email gửi đi. Vui lòng liên hệ quản trị viên để đặt lại mật khẩu.' });
    return json(res, 200, { ok: true, message: 'Nếu email đã đăng ký, hướng dẫn khôi phục sẽ được gửi đến hộp thư.' });
  }
  if (url.pathname === '/api/auth/reset-password' && req.method === 'POST') {
    const body = await readBody(req);
    const token = String(body.token || '').trim();
    const password = String(body.password || '');
    if (!token || password.length < 8 || password.length > 128) return json(res, 400, { error: 'Liên kết không hợp lệ hoặc mật khẩu mới chưa đủ từ 8 đến 128 ký tự.' });
    const database = await db();
    if (!database) return json(res, 503, { error: 'Máy chủ chưa sẵn sàng. Vui lòng thử lại sau.' });
    const connection = await database.getConnection();
    let user;
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(`SELECT u.open_id AS openId, u.email, u.display_name AS name,
        u.role, u.status, u.session_version AS sessionVersion FROM password_reset_tokens t
        JOIN app_users u ON u.open_id=t.open_id
        WHERE t.token_hash=? AND t.used_at IS NULL AND t.expires_at > NOW() AND u.status<>"deleted" LIMIT 1 FOR UPDATE`, [resetTokenHash(token)]);
      if (!rows.length) throw new AccountError(400, 'Liên kết đã hết hạn hoặc đã được sử dụng. Vui lòng yêu cầu liên kết mới.');
      user = rows[0];
      const hashed = passwordHash(password);
      user.sessionVersion = Number(user.sessionVersion || 0) + 1;
      await connection.execute('UPDATE app_users SET password_hash=?, password_salt=?, session_version=? WHERE open_id=?', [hashed.hash, hashed.salt, user.sessionVersion, user.openId]);
      await connection.execute('UPDATE password_reset_tokens SET used_at=CURRENT_TIMESTAMP WHERE open_id=? AND used_at IS NULL', [user.openId]);
      await connection.commit();
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
    if (!['approved', 'admin'].includes(user.status)) return json(res, 200, { ok: true, pending: true, message: 'Mật khẩu đã cập nhật. Tài khoản vẫn cần được quản trị viên phê duyệt để truy cập.' });
    const session = sign({ appId: projectId, openId: user.openId, email: user.email,
      sessionVersion: user.sessionVersion, remember: true, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE });
    setSessionCookie(res, 'webdev_app_session', session, true);
    return json(res, 200, { ok: true });
  }
  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const user = await currentUser(req, res);
    return json(res, 200, { authenticated: Boolean(user), user: user ? { ...user, isAdmin: isAdmin(user) } : null });
  }
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') { clearCookie(res, 'webdev_app_session'); return json(res, 200, { ok: true }); }
  if (url.pathname === '/api/admin/users' && req.method === 'GET') {
    const user = await currentUser(req); if (!isAdmin(user)) return json(res, 403, { error: 'Bạn không có quyền quản trị.' });
    const connection = await db();
    const [rows] = await connection.execute(`SELECT ${accountFields} FROM app_users ORDER BY status="pending" DESC, created_at DESC`);
    const users = rows.map(({ sessionVersion, ...account }) => ({ ...account, isOwner: account.email.trim().toLowerCase() === adminEmail }));
    return json(res, 200, { users });
  }
  if (url.pathname === '/api/letters' && req.method === 'GET') {
    const user = await currentUser(req); if (!user || !['approved', 'admin'].includes(user.status)) return json(res, 403, { error: 'Bạn cần được phê duyệt để xem sổ công văn.' });
    const connection = await db(); const [rows] = await connection.execute(`SELECT id, incoming_number AS incomingNumber, received_date AS receivedDate, sender, document_number AS documentNumber, document_date AS documentDate, summary, handler, deadline, status, created_by AS createdBy, created_at AS createdAt FROM incoming_letters ORDER BY received_date DESC, id DESC`);
    return json(res, 200, { letters: rows });
  }
  if (url.pathname === '/api/letters' && req.method === 'POST') {
    const user = await currentUser(req); if (!user || !['approved', 'admin'].includes(user.status)) return json(res, 403, { error: 'Bạn cần được phê duyệt để ghi sổ công văn.' });
    const body = await readBody(req); if (!body.incomingNumber || !body.receivedDate || !body.sender || !body.summary) return json(res, 400, { error: 'Vui lòng nhập đủ số đến, ngày đến, nơi gửi và trích yếu.' });
    const connection = await db(); const [result] = await connection.execute(`INSERT INTO incoming_letters (incoming_number, received_date, sender, document_number, document_date, summary, handler, deadline, status, created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`, [body.incomingNumber, body.receivedDate, body.sender, body.documentNumber || null, body.documentDate || null, body.summary, body.handler || null, body.deadline || null, body.status || 'Chưa xử lý', user.email || user.openId]);
    return json(res, 201, { ok: true, id: result.insertId });
  }
  if (url.pathname === '/api/chat' && req.method === 'GET') {
    const user = await currentUser(req); if (!user || !['approved', 'admin'].includes(user.status)) return json(res, 403, { error: 'Bạn cần được phê duyệt để xem khung chat.' });
    const connection = await db(); if (!connection) return json(res, 503, { error: 'Chưa kết nối được cơ sở dữ liệu.' });
    const [rows] = await connection.execute(`SELECT id, user_email AS userEmail, user_name AS userName, message, created_at AS createdAt FROM internal_chat_messages ORDER BY id DESC LIMIT 100`);
    return json(res, 200, { messages: rows.reverse() });
  }
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    const user = await currentUser(req); if (!user || !['approved', 'admin'].includes(user.status)) return json(res, 403, { error: 'Bạn cần được phê duyệt để gửi tin nhắn.' });
    const body = await readBody(req); const message = String(body.message || '').trim();
    if (!message || message.length > 1000) return json(res, 400, { error: 'Tin nhắn không được để trống và tối đa 1.000 ký tự.' });
    const connection = await db(); if (!connection) return json(res, 503, { error: 'Chưa kết nối được cơ sở dữ liệu.' });
    const [result] = await connection.execute('INSERT INTO internal_chat_messages (user_email, user_name, message) VALUES (?,?,?)', [user.email || user.openId, user.name || user.email || 'Người dùng', message]);
    return json(res, 201, { ok: true, id: result.insertId });
  }
  if (url.pathname === '/api/stats/visits' && req.method === 'GET') {
    const user = await currentUser(req); if (!user || !['approved', 'admin'].includes(user.status)) return json(res, 403, { error: 'Bạn cần được phê duyệt để xem thống kê.' });
    const connection = await db(); if (!connection) return json(res, 503, { error: 'Chưa kết nối được cơ sở dữ liệu.' });
    const [rows] = await connection.execute('SELECT COALESCE(SUM(visit_count), 0) AS totalVisits, COALESCE(SUM(CASE WHEN visit_date = CURRENT_DATE THEN visit_count ELSE 0 END), 0) AS todayVisits FROM site_visit_stats');
    return json(res, 200, { totalVisits: Number(rows[0]?.totalVisits || 0), todayVisits: Number(rows[0]?.todayVisits || 0) });
  }
  const actionMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (actionMatch && req.method === 'POST') {
    const user = await currentUser(req);
    if (!isAdmin(user)) return json(res, 403, { error: 'Bạn không có quyền quản trị.' });
    const allowedOrigins = ['https://www.takv11hcm.com',
      'https://8328-iimmioj2x8ckxo7u2pd7m-668fbeda.sg2.manus.computer'];
    if (!sameAdminOrigin(req, allowedOrigins)) return json(res, 403, { error: 'Nguồn yêu cầu không hợp lệ. Vui lòng thao tác trong website.' });
    const body = await readBody(req);
    const connection = await db();
    const account = await updateManagedAccount(connection, user, decodeURIComponent(actionMatch[1]), body, adminEmail);
    const messages = {
      approve: 'Tài khoản đã được phê duyệt.', reject: 'Tài khoản đã bị từ chối.',
      disable: 'Tài khoản đã được vô hiệu hóa.', edit: 'Thông tin tài khoản đã được cập nhật.',
      delete: 'Đã chuyển tài khoản vào thùng rác. Các phiên cũ đã hết hiệu lực.',
      restore: 'Đã khôi phục trạng thái trước khi xóa. Người dùng cần đăng nhập lại.',
      resetPassword: 'Mật khẩu đã được đặt lại. Các phiên và liên kết khôi phục cũ đã hết hiệu lực.',
    };
    if (body.action === 'resetPassword' && account.openId === user.openId) {
      const prior = verify(cookies(req).webdev_app_session);
      const remember = prior?.remember !== false;
      const session = sign({ appId: projectId, openId: account.openId, email: account.email,
        sessionVersion: Number(account.sessionVersion || 0), remember, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE });
      setSessionCookie(res, 'webdev_app_session', session, remember);
    }
    return json(res, 200, { ok: true, message: messages[body.action], user: { openId: account.openId,
      name: account.name, email: account.email, role: account.role, status: account.status } });
  }
  return json(res, 404, { error: 'Không tìm thấy API.' });
}

async function handle(req, res) {
  const url = new URL(req.url, originFor(req));
  try {
    if (url.pathname.startsWith('/api/') || url.pathname === '/_app/health') return await api(req, res, url);
    if (req.method === 'GET' && ['/', '/so-cong-van', '/hoi-tham', '/khu-pho-truong', '/canh-sat-khu-vuc', '/bieu-mau', '/admin'].includes(url.pathname)) {
      const user = await currentUser(req, res);
      if (!user || !['approved', 'admin'].includes(user.status)) { res.writeHead(302, { Location: `/dang-nhap${url.search}` }); return res.end(); }
      if (url.pathname === '/admin' && !isAdmin(user)) { res.writeHead(302, { Location: '/so-cong-van' }); return res.end(); }
      if (url.pathname === '/' && user) {
        const connection = await db();
        if (connection) await connection.execute('INSERT INTO site_visit_stats (visit_date, visit_count) VALUES (CURRENT_DATE, 1) ON DUPLICATE KEY UPDATE visit_count = visit_count + 1');
      }
    }
    return null;
  } catch (error) { if (error instanceof AccountError) return json(res, error.status, { error: error.message }); console.error(error); return json(res, 500, { error: 'Có lỗi máy chủ. Vui lòng thử lại.' }); }
}

async function start() {
  await db();
  const isProduction = process.env.NODE_ENV === 'production';
  let vite;
  if (!isProduction) vite = await createViteServer({ server: { middlewareMode: true, hmr: false }, appType: 'spa' });
  const server = http.createServer(async (req, res) => {
    const handled = await handle(req, res);
    if (handled !== null || res.writableEnded) return;
    if (vite) return vite.middlewares(req, res, async () => { res.statusCode = 404; res.end('Not found'); });
    const requested = req.url === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname;
    const file = path.join(__dirname, 'dist', requested.replace(/^\/+/, ''));
    try { const content = await fs.readFile(file); const contentType = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.json') ? 'application/json; charset=utf-8' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'application/octet-stream'; res.writeHead(200, { 'Content-Type': contentType }); res.end(content); } catch { const index = await fs.readFile(path.join(__dirname, 'dist/index.html')); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(index); }
  });
  server.listen(port, '0.0.0.0', () => console.log(`TAND server listening on ${port}`));
}
start();
