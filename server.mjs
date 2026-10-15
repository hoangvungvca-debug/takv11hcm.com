import http from 'node:http';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const adminEmail = (process.env.ADMIN_EMAIL || 'hoangvungvca@gmail.com').trim().toLowerCase();
const projectId = process.env.MANUS_PROJECT_ID || '';
const jwtSecret = process.env.MANUS_JWT_SECRET || '';
const oauthPortal = process.env.MANUS_OAUTH_PORTAL_URL || '';
const oauthApi = process.env.MANUS_OAUTH_API_URL || '';
let pool;
let schemaPromise;

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
    role VARCHAR(32) NOT NULL DEFAULT 'viewer',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    INDEX idx_app_users_email (email),
    INDEX idx_app_users_status (status)
  )`);
  await schemaPromise;
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

async function currentUser(req) {
  const payload = verify(cookies(req).webdev_app_session);
  if (!payload?.openId) return null;
  const connection = await db();
  if (!connection) return payload;
  const [rows] = await connection.execute('SELECT open_id AS openId, email, display_name AS name, role, status FROM app_users WHERE open_id=?', [payload.openId]);
  return rows[0] || null;
}

const isAdmin = (user) => user?.role === 'admin' && user?.status === 'approved';

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
  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const user = await currentUser(req);
    return json(res, 200, { authenticated: Boolean(user), user: user ? { ...user, isAdmin: isAdmin(user) } : null });
  }
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') { clearCookie(res, 'webdev_app_session'); return json(res, 200, { ok: true }); }
  if (url.pathname === '/api/admin/users' && req.method === 'GET') {
    const user = await currentUser(req); if (!isAdmin(user)) return json(res, 403, { error: 'Bạn không có quyền quản trị.' });
    const connection = await db(); const [rows] = await connection.execute('SELECT open_id AS openId, email, display_name AS name, role, status, created_at AS createdAt, last_login_at AS lastLoginAt FROM app_users ORDER BY status="pending" DESC, created_at DESC');
    return json(res, 200, { users: rows });
  }
  const actionMatch = url.pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (actionMatch && req.method === 'POST') {
    const user = await currentUser(req); if (!isAdmin(user)) return json(res, 403, { error: 'Bạn không có quyền quản trị.' });
    const body = await readBody(req); const nextStatus = body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : body.action === 'disable' ? 'disabled' : null;
    if (!nextStatus) return json(res, 400, { error: 'Thao tác không hợp lệ.' });
    const connection = await db(); await connection.execute('UPDATE app_users SET status=?, role=IF(?="approved" AND email=?, "viewer", role) WHERE open_id=?', [nextStatus, nextStatus, adminEmail, actionMatch[1]]);
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: 'Không tìm thấy API.' });
}

async function handle(req, res) {
  const url = new URL(req.url, originFor(req));
  try {
    if (url.pathname.startsWith('/api/') || url.pathname === '/_app/health') return await api(req, res, url);
    if (url.pathname === '/auth/login') {
      if (!oauthPortal || !projectId) return json(res, 503, { error: 'OAuth Manus chưa được cấu hình.' });
      const nonce = randomBytes(18).toString('hex'); const redirectUri = `${originFor(req)}/manus-oauth/callback`;
      const state = base64url(JSON.stringify({ redirectUri, nonce })); setCookie(res, 'oauth_state', `${state}.${nonce}`, 600);
      const authUrl = new URL(`${oauthPortal}/app-auth`); authUrl.searchParams.set('appId', projectId); authUrl.searchParams.set('redirectUri', redirectUri); authUrl.searchParams.set('state', state); authUrl.searchParams.set('responseType', 'code');
      res.writeHead(302, { Location: authUrl.toString() }); return res.end();
    }
    if (url.pathname === '/manus-oauth/callback') {
      const stateCookie = cookies(req).oauth_state; const state = parseJson(Buffer.from(url.searchParams.get('state') || '', 'base64url').toString('utf8'));
      if (!stateCookie || !state || stateCookie !== `${url.searchParams.get('state')}.${state.nonce}` || !url.searchParams.get('code')) return json(res, 400, { error: 'Phiên đăng nhập không hợp lệ.' });
      const token = await exchangeCode(url.searchParams.get('code'), state.redirectUri); const identity = await getIdentity(token.accessToken);
      const user = await upsertUser({ openId: identity.openId, email: (identity.email || '').toLowerCase(), name: identity.name || identity.email || 'Người dùng Manus' });
      const session = sign({ appId: projectId, openId: user.openId, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }); setCookie(res, 'webdev_app_session', session, 60 * 60 * 24 * 7); clearCookie(res, 'oauth_state');
      res.writeHead(302, { Location: user.status === 'pending' ? '/?login=pending' : '/admin' }); return res.end();
    }
    if (req.method === 'GET' && url.pathname === '/api/auth/login-url') return json(res, 200, { url: '/auth/login' });
    return null;
  } catch (error) { console.error(error); return json(res, 500, { error: 'Có lỗi máy chủ. Vui lòng thử lại.' }); }
}

async function start() {
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
