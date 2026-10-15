import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const directory = path.resolve(process.argv[2] || '/home/ubuntu/deliverables/tand-dashboard');
const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { default: Dashboard } = await vite.ssrLoadModule('/src/dashboard/Dashboard.tsx');
  const { modules } = await vite.ssrLoadModule('/src/dashboard/apps.ts');
  let markup = renderToStaticMarkup(createElement(Dashboard, { modules, preview: true }));
  markup = markup.replaceAll('src="/court-logo.png"', 'src="court-logo.png"');
  markup = markup.replace(/href="(\/[^"#]*)"/g, (_, route) => route === '/'
    ? 'href="index.html"' : `href="#db-offline-message" data-route="${route}"`);
  markup = markup.replace('href="tel:0913742969"', 'href="#db-offline-message" data-route="Hỗ trợ vận hành"')
    .replaceAll('0913 742 969', 'Thông tin hỗ trợ');
  await fs.mkdir(directory, { recursive: true });
  await fs.copyFile('src/dashboard/dashboard.css', path.join(directory, 'dashboard.css'));
  await fs.copyFile('public/court-logo.png', path.join(directory, 'court-logo.png'));
  await fs.writeFile(path.join(directory, 'index.html'), `<!doctype html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard nghiệp vụ — TAND khu vực 11</title>
  <meta name="description" content="Bản HTML/CSS minh họa dashboard nội bộ TAND khu vực 11.">
  <link rel="stylesheet" href="dashboard.css">
  <style>*,*::before,*::after{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Arial,sans-serif}a{text-decoration:none;color:inherit}button{font:inherit}button,input{font-family:inherit}.offline-dialog{max-width:420px;width:calc(100% - 36px);border:1px solid #e8e9ed;border-radius:10px;padding:24px;color:#252d38;box-shadow:0 20px 70px #0003}.offline-dialog::backdrop{background:#252d3855}.offline-dialog h2{font-size:20px}.offline-dialog p{font-size:14px;line-height:1.6}.offline-dialog button{border:0;border-radius:6px;background:#9d1d2e;color:white;padding:12px 20px;cursor:pointer}</style>
</head>
<body>${markup}
<dialog id="db-offline-message" class="offline-dialog"><h2>Bản giao diện minh họa</h2><p>Chức năng này cần backend và đăng nhập trên website nội bộ. Bộ HTML/CSS độc lập không lưu tài khoản hoặc dữ liệu công việc.</p><form method="dialog"><button>Đã hiểu</button></form></dialog>
<script>
  // Tương tác minh họa chỉ chạy trên dữ liệu ứng dụng công khai, không xác thực/lưu dữ liệu.
  document.querySelectorAll('a[data-route]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); document.getElementById('db-offline-message').showModal(); }));
  const normalize = value => value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  const details = document.querySelector('.db-apps-panel details');
  const expand = document.querySelector('.db-apps-expand');
  details.addEventListener('toggle', () => { expand.firstChild.textContent = details.open ? 'Thu gọn' : 'Xem tất cả'; });
  const search = document.querySelector('.db-search input');
  const filters = [...document.querySelectorAll('.db-filter-tags button')];
  const cards = [...document.querySelectorAll('.db-app-grid > a')];
  let activeTag = 'Tất cả';
  const empty = document.createElement('p'); empty.className = 'db-search-empty'; empty.textContent = 'Không tìm thấy ứng dụng phù hợp.';
  document.querySelector('.db-apps-body').append(empty); empty.hidden = true;
  function filter() {
    let count = 0;
    cards.forEach(card => { const tag = card.querySelector('span').textContent; const show = (activeTag === 'Tất cả' || tag === activeTag) && normalize(card.textContent).includes(normalize(search.value)); card.hidden = !show; card.style.display = show ? '' : 'none'; if(show) count++; });
    empty.hidden = count !== 0;
  }
  search.addEventListener('input', filter);
  filters.forEach(button => button.addEventListener('click', () => { activeTag = button.textContent; filters.forEach(item => { const active = item === button; item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', active); }); filter(); }));
  document.querySelectorAll('.db-work-tabs button').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('.db-work-tabs button').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', item === button); }); }));
  function clock() {
    const now = new Date(); const time = document.querySelector('.db-timebar time'); time.dateTime = now.toISOString();
    time.querySelector('span').textContent = new Intl.DateTimeFormat('vi-VN', { timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false }).format(now);
    time.querySelector('.db-date').textContent = new Intl.DateTimeFormat('vi-VN', { timeZone:'Asia/Ho_Chi_Minh',weekday:'long',day:'2-digit',month:'2-digit',year:'numeric' }).format(now);
  }
  clock(); setInterval(clock, 1000);
</script>
</body>
</html>
`);
  console.log(`Đã xuất HTML/CSS minh họa tại ${directory}`);
} finally {
  await vite.close();
}
