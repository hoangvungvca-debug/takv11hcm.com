import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');
const port = Number(process.env.PORT || 3000);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };

const safePath = (requestPath) => {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const resolved = path.resolve(root, `.${decoded}`);
  return resolved.startsWith(`${root}${path.sep}`) || resolved === root ? resolved : null;
};

const server = http.createServer(async (req, res) => {
  if (req.url === '/_app/health') { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(JSON.stringify({ ok: true })); }
  const requestPath = new URL(req.url || '/', 'http://localhost').pathname;
  const candidate = safePath(requestPath);
  try {
    const file = candidate && await fs.stat(candidate).then((info) => info.isFile() ? candidate : null);
    const target = file || path.join(root, 'index.html');
    const content = await fs.readFile(target);
    const ext = path.extname(target).toLowerCase();
    const headers = { 'Content-Type': mime[ext] || 'application/octet-stream' };
    if (ext === '.doc' || ext === '.docx') headers['Content-Disposition'] = `attachment; filename="${path.basename(target)}"`;
    res.writeHead(200, headers); res.end(content);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); }
});

server.listen(port, '0.0.0.0', () => console.log(`TAND static server listening on ${port}`));
