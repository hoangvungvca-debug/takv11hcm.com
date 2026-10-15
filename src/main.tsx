import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Module = { icon: string; title: string; description: string; href: string; tone: string; tag: string };

const modules: Module[] = [
  { icon: '▥', title: 'Báo cáo — Thống kê', description: 'Tổng hợp số liệu, báo cáo nghiệp vụ và biểu mẫu thống kê.', href: 'https://tk.toaan.gov.vn/Login/', tone: 'blue', tag: 'Nghiệp vụ' },
  { icon: '▣', title: 'Lịch xét xử', description: 'Theo dõi lịch xét xử và các phiên tòa đã được sắp xếp.', href: 'https://docs.google.com/spreadsheets/d/1BM_e1mOkqr3l6HqeL4SmrWLmTvkdzwTS3dwKLJ_QILI/edit?gid=853317092#gid=853317092', tone: 'gold', tag: 'Nghiệp vụ' },
  { icon: '▤', title: 'Phần mềm chuyển kháng cáo', description: 'Tiếp nhận và quản lý quy trình chuyển hồ sơ kháng cáo.', href: 'https://quanly.tahcmc.vn/login', tone: 'terracotta', tag: 'Nghiệp vụ' },
  { icon: '↗', title: 'E-QLTA (QLA toàn trình)', description: 'Hệ thống quản lý tòa án điện tử toàn trình.', href: 'https://e-qlta.toaan.gov.vn', tone: 'teal', tag: 'Nghiệp vụ' },
  { icon: '▦', title: 'Lịch làm việc theo tuần', description: 'Lịch công tác, phân công và lịch làm việc trong tuần.', href: 'https://docs.google.com/document/d/1zpDjH9EkvJ6ktjymfaSfAR_UL0yVWWpg/edit?usp=sharing&ouid=104268435571682100822&rtpof=true&sd=true', tone: 'gold', tag: 'Điều hành' },
  { icon: '➜', title: 'Tống đạt thừa phát lại', description: 'Theo dõi và cập nhật tình trạng tống đạt hồ sơ.', href: 'https://docs.google.com/spreadsheets/d/1QEx69CMJgr8YE_w_s9uKuCt_TqtAhOyp/edit?usp=sharing&ouid=117303282830124686971', tone: 'blue', tag: 'Nghiệp vụ' },
  { icon: '✦', title: 'AI Tòa án', description: 'Tra cứu và hỗ trợ xử lý thông tin bằng AI.', href: 'https://ai.toaan.gov.vn/#/chat', tone: 'violet', tag: 'Chuyển đổi số' },
  { icon: '⚖', title: 'Quản lý Tòa án', description: 'Quản lý nghiệp vụ, tài khoản và thông tin vận hành.', href: 'https://qlta.toaan.gov.vn/Login.aspx', tone: 'navy', tag: 'Quản trị' },
  { icon: '▤', title: 'Công văn đi — đến', description: 'Quản lý văn bản, công văn đến và công văn đi.', href: 'https://vbdh.toaan.gov.vn/Pages/login.zul', tone: 'terracotta', tag: 'Điều hành' },
  { icon: '◈', title: 'Trợ lý ảo', description: 'Kênh hỗ trợ nhanh cho cán bộ, công chức.', href: 'https://trolyao.toaan.gov.vn/', tone: 'violet', tag: 'Chuyển đổi số' },
  { icon: '♙', title: 'Thông tin CBCC', description: 'Tra cứu, cập nhật thông tin cán bộ, công chức.', href: 'https://cbccvc.toaan.gov.vn/web/login', tone: 'teal', tag: 'Quản trị' },
  { icon: '⌖', title: 'Tìm kiếm địa chỉ sau sáp nhập', description: 'Tra cứu địa chỉ, đơn vị hành chính sau sắp xếp.', href: 'https://diachi.io/?utm_source=zalo&utm_medium=zalo&utm_campaign=zalo', tone: 'gold', tag: 'Tiện ích' },
  { icon: '✉', title: 'Email công vụ', description: 'Truy cập hệ thống thư điện tử công vụ của ngành.', href: 'https://mail.toaan.gov.vn/owa/#path=/mail/inbox', tone: 'blue', tag: 'Tiện ích' },
  { icon: '⌁', title: 'Tra cứu án phí', description: 'Công cụ tham khảo và tính mức án phí, lệ phí.', href: 'https://thuvienphapluat.vn/banan/tinh-an-phi?ThuTuc=0&GiaNgach=0&LinhVuc=2&SoTien=324979938', tone: 'terracotta', tag: 'Tiện ích' },
  { icon: '▰', title: 'Phần mềm xét xử trực tuyến', description: 'Đăng ký và hỗ trợ tổ chức phiên tòa trực tuyến.', href: 'http://hotro.tahcmc.vn/call/dangky.php', tone: 'navy', tag: 'Chuyển đổi số' },
];

const sidebarGroups = [
  { label: 'Tổng quan', items: [] },
  { label: 'Nghiệp vụ Tòa án', items: modules.slice(0, 4) },
  { label: 'Điều hành & quản trị', items: modules.slice(4, 6).concat(modules.slice(7, 9), modules.slice(10, 11)) },
  { label: 'Chuyển đổi số', items: [modules[6], modules[9], modules[14]] },
  { label: 'Tiện ích dùng chung', items: modules.slice(11, 14) },
];



type SessionUser = { email: string; name: string; role: string; status: string; isAdmin?: boolean };
type Letter = { id: number; incomingNumber: string; receivedDate: string; sender: string; documentNumber?: string; documentDate?: string; summary: string; handler?: string; deadline?: string; status: string; createdBy?: string };

function LoginPage({ message = 'Đăng nhập bằng tài khoản Manus để truy cập khu vực nội bộ.' }: { message?: string }) {
  const pending = new URLSearchParams(window.location.search).get('login') === 'pending';
  return <div className="login-shell"><div className="login-card"><img src="/court-logo.png" alt="Logo Tòa án nhân dân" /><p className="eyebrow">KHU VỰC NỘI BỘ</p><h1>{pending ? 'Đang chờ phê duyệt' : 'Đăng nhập hệ thống'}</h1><p>{pending ? 'Tài khoản đã được ghi nhận. Vui lòng chờ quản trị viên phê duyệt quyền truy cập.' : message}</p>{!pending && <a className="admin-login-button" href="/auth/login">Đăng nhập bằng Manus</a>}<a className="admin-back" href="/">Quay về trang chủ</a></div></div>;
}

function LedgerPage() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({ incomingNumber: '', receivedDate: '', sender: '', documentNumber: '', documentDate: '', summary: '', handler: '', deadline: '', status: 'Chưa xử lý' });
  const load = async () => { const response = await fetch('/api/letters'); if (response.ok) setLetters((await response.json()).letters || []); };
  useEffect(() => { fetch('/api/auth/me').then((response) => response.json()).then((data) => { setUser(data.user || null); if (data.authenticated) load(); }).catch(() => setUser(null)); }, []);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: React.FormEvent) => { event.preventDefault(); setNotice(''); const response = await fetch('/api/letters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); const data = await response.json(); if (!response.ok) return setNotice(data.error || 'Không thể lưu công văn.'); setNotice('Đã lưu công văn vào sổ.'); setForm({ incomingNumber: '', receivedDate: '', sender: '', documentNumber: '', documentDate: '', summary: '', handler: '', deadline: '', status: 'Chưa xử lý' }); load(); };
  if (user === undefined) return <div className="login-shell"><div className="login-card"><p>Đang kiểm tra phiên đăng nhập...</p></div></div>;
  if (!user) return <LoginPage message="Sổ công văn đến là khu vực nội bộ. Bạn cần đăng nhập để tiếp tục." />;
  return <div className="internal-shell"><header className="internal-header"><div><p className="eyebrow">HỆ THỐNG PHẦN MỀM TAND</p><h1>Sổ công văn đến</h1><span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div><div className="internal-user">{user.name || user.email}<a href="/">Trang chủ</a></div></header><main className="ledger-main"><div className="ledger-heading"><div><p className="eyebrow">QUẢN LÝ VĂN BẢN</p><h2>Sổ công văn đến</h2><p>Nhập, lưu và tra cứu công văn đến trong phạm vi người dùng đã được phê duyệt.</p></div><span className="secure-badge">● Nội bộ</span></div><form className="ledger-form" onSubmit={save}><label>Số đến *<input value={form.incomingNumber} onChange={(e) => update('incomingNumber', e.target.value)} required placeholder="VD: 125/2026" /></label><label>Ngày đến *<input type="date" value={form.receivedDate} onChange={(e) => update('receivedDate', e.target.value)} required /></label><label>Cơ quan/người gửi *<input value={form.sender} onChange={(e) => update('sender', e.target.value)} required /></label><label>Số, ký hiệu văn bản<input value={form.documentNumber} onChange={(e) => update('documentNumber', e.target.value)} /></label><label>Ngày văn bản<input type="date" value={form.documentDate} onChange={(e) => update('documentDate', e.target.value)} /></label><label>Người xử lý<input value={form.handler} onChange={(e) => update('handler', e.target.value)} /></label><label>Hạn xử lý<input type="date" value={form.deadline} onChange={(e) => update('deadline', e.target.value)} /></label><label>Trạng thái<select value={form.status} onChange={(e) => update('status', e.target.value)}><option>Chưa xử lý</option><option>Đang xử lý</option><option>Đã hoàn thành</option></select></label><label className="wide-field">Trích yếu nội dung *<textarea value={form.summary} onChange={(e) => update('summary', e.target.value)} required rows={3} placeholder="Tóm tắt nội dung công văn" /></label><div className="ledger-actions"><button className="primary-button" type="submit">Lưu vào sổ công văn</button>{notice && <span className="form-notice">{notice}</span>}</div></form><section className="ledger-table-wrap"><div className="ledger-table-heading"><h3>Danh sách công văn đã ghi sổ</h3><span>{letters.length} văn bản</span></div><div className="ledger-table-scroll"><table><thead><tr><th>Số đến</th><th>Ngày đến</th><th>Nơi gửi</th><th>Trích yếu</th><th>Người xử lý</th><th>Trạng thái</th></tr></thead><tbody>{letters.map((letter) => <tr key={letter.id}><td>{letter.incomingNumber}</td><td>{letter.receivedDate}</td><td>{letter.sender}</td><td>{letter.summary}</td><td>{letter.handler || '—'}</td><td><span className="status-pill">{letter.status}</span></td></tr>)}</tbody></table>{letters.length === 0 && <p className="empty">Chưa có công văn nào được ghi sổ.</p>}</div></section></main></div>;
}

function AdminPage() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined); const [users, setUsers] = useState<SessionUser[]>([]);
  const load = async () => { const response = await fetch('/api/admin/users'); if (response.ok) setUsers((await response.json()).users || []); };
  useEffect(() => { fetch('/api/auth/me').then((response) => response.json()).then((data) => { setUser(data.user || null); if (data.user?.isAdmin) load(); }).catch(() => setUser(null)); }, []);
  const act = async (openId: string, action: string) => { await fetch(`/api/admin/users/${encodeURIComponent(openId)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) }); load(); };
  if (user === undefined) return <div className="login-shell"><div className="login-card"><p>Đang kiểm tra quyền quản trị...</p></div></div>;
  if (!user?.isAdmin) return <LoginPage message="Khu vực này chỉ dành cho quản trị viên đã được cấp quyền." />;
  return <div className="internal-shell"><header className="internal-header"><div><p className="eyebrow">QUẢN TRỊ HỆ THỐNG</p><h1>Duyệt tài khoản</h1></div><a className="internal-user" href="/so-cong-van">Sổ công văn đến →</a></header><main className="ledger-main"><div className="ledger-table-wrap"><div className="ledger-table-heading"><h3>Tài khoản người dùng</h3><span>{users.length} tài khoản</span></div><div className="ledger-table-scroll"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{users.map((item: any) => <tr key={item.openId}><td>{item.name}</td><td>{item.email}</td><td>{item.role}</td><td>{item.status}</td><td>{item.status === 'pending' && <><button className="table-action" onClick={() => act(item.openId, 'approve')}>Duyệt</button><button className="table-action danger" onClick={() => act(item.openId, 'reject')}>Từ chối</button></>}</td></tr>)}</tbody></table></div></div></main></div>;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Tất cả');
  const [now, setNow] = useState(() => new Date());

  const clock = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);

  const tags = ['Tất cả', ...Array.from(new Set(modules.map((item) => item.tag)))];
  const filtered = useMemo(() => modules.filter((item) => {
    const matchesTag = activeTag === 'Tất cả' || item.tag === activeTag;
    return matchesTag && `${item.title} ${item.description} ${item.tag}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [activeTag, query]);

  const closeSidebar = () => setSidebarOpen(false);
  const quickModules = [modules[0], modules[1], modules[3], modules[6]];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand"><img className="official-logo" src="/court-logo.png" alt="Logo Tòa án nhân dân" /><div><strong>HỆ THỐNG<br />PHẦN MỀM TAND</strong><small>TAND KHU VỰC 11</small></div></div>
        <div className="sidebar-rule" />
        <nav className="side-nav" aria-label="Danh mục phần mềm">
          {sidebarGroups.map((group) => <div className="side-group" key={group.label}><p>{group.label}</p>{group.items.length === 0 ? <button className="side-link current" onClick={closeSidebar}><span className="side-icon">⌂</span>Trang chủ</button> : group.items.map((item) => <a className="side-link" href={item.href} target="_blank" rel="noreferrer" key={`${group.label}-${item.title}`} onClick={closeSidebar}><span className={`side-icon ${item.tone}`}>{item.icon}</span><span>{item.title}</span><b>↗</b></a>)}</div>)}
        </nav>
        <div className="side-group internal-nav"><p>Nội bộ</p><a className="side-link" href="/so-cong-van" onClick={closeSidebar}><span className="side-icon">▣</span><span>Sổ công văn đến</span><b>↗</b></a><a className="side-link" href="/dang-nhap" onClick={closeSidebar}><span className="side-icon">◉</span><span>Đăng nhập nội bộ</span><b>↗</b></a></div>
        <div className="sidebar-bottom"><div className="online-dot" /><span>Hệ thống đang hoạt động</span></div>
      </aside>
      {sidebarOpen && <button className="sidebar-overlay" onClick={closeSidebar} aria-label="Đóng menu" />}

      <div className="main-area">
        <div className="topbar"><div className="topbar-left"><button className="mobile-toggle" onClick={() => setSidebarOpen(true)} aria-label="Mở sidebar">☰</button><span className="breadcrumb">Trang chủ <b>/</b> Hệ thống phần mềm</span></div><div className="topbar-right"><span className="system-status"><i /> Hệ thống nội bộ</span><span className="clock"><b className="clock-label">Thời gian</b>{clock}</span></div></div>
        <header className="main-header"><div><p className="eyebrow">CỔNG KẾT NỐI NGHIỆP VỤ</p><h1>Hệ thống phần mềm TAND</h1><p className="subtitle">TAND KHU VỰC 11 - TP HỒ CHÍ MINH</p></div><div className="header-actions"><button className="support-button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Hỗ trợ hệ thống <span>?</span></button><a className="support-button login-link" href="/dang-nhap">Đăng nhập nội bộ</a></div></header>

        <main>
          <section className="digital-hero"><div className="hero-content"><span className="hero-badge">CHUYỂN ĐỔI SỐ TÒA ÁN</span><h2>Công cụ đúng lúc.<br /><em>Quy trình thông suốt.</em></h2><p>Một không gian tập trung cho các phần mềm nghiệp vụ, điều hành và tiện ích dùng chung của Tòa án nhân dân khu vực 11.</p><button className="hero-link" onClick={() => document.getElementById('all-apps')?.scrollIntoView({ behavior: 'smooth' })}>Xem tất cả ứng dụng <span>↓</span></button></div><div className="hero-scale" aria-label="Biểu tượng Tòa án nhân dân"><div className="hero-emblem"><img src="/court-logo.png" alt="Biểu trưng Tòa án nhân dân" /></div><div className="orbit orbit-a" /><div className="orbit orbit-b" /></div></section>

          <section className="quick-section"><div className="section-title"><div><p className="eyebrow">TRUY CẬP NHANH</p><h2>Ứng dụng nổi bật</h2></div><span className="section-note">04 lối tắt thường dùng</span></div><div className="quick-grid">{quickModules.map((item) => <a className={`quick-card ${item.tone}`} href={item.href} target="_blank" rel="noreferrer" key={item.title}><span className="quick-icon">{item.icon}</span><div><small>{item.tag}</small><strong>{item.title}</strong></div><b>↗</b></a>)}</div></section>

          <section className="all-apps" id="all-apps"><div className="section-title"><div><p className="eyebrow">DANH MỤC HỆ THỐNG</p><h2>Tất cả ứng dụng</h2></div><span className="app-count"><strong>{String(filtered.length).padStart(2, '0')}</strong> ứng dụng</span></div><div className="filter-row"><div className="filter-pills">{tags.map((tag) => <button className={activeTag === tag ? 'active' : ''} key={tag} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm ứng dụng..." aria-label="Tìm ứng dụng" /></label></div><div className="app-grid">{filtered.map((item, index) => <a className={`app-card ${item.tone}`} href={item.href} target="_blank" rel="noreferrer" key={item.title}><div className="app-card-top"><span className="app-symbol">{item.icon}</span><span className="app-index">{String(index + 1).padStart(2, '0')}</span></div><span className="app-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.description}</p><span className="app-arrow">↗</span></a>)}</div>{filtered.length === 0 && <div className="empty">Không tìm thấy ứng dụng phù hợp.</div>}</section>

          <section className="contact" id="contact"><div className="contact-heading"><span className="contact-mark">?</span><div><p className="eyebrow">BẠN CẦN HỖ TRỢ?</p><h2>Liên hệ bộ phận vận hành hệ thống.</h2></div></div><div className="contact-items"><div><small>Địa chỉ</small><strong>Số 989 đường 2/9, phường Phước Thắng,<br />TP. Hồ Chí Minh</strong></div><div><small>Điện thoại</small><a href="tel:0913742969">0913 742 969</a></div><div><small>Giờ làm việc</small><strong>Thứ Hai — Thứ Sáu<br />07:30 — 17:00</strong></div></div></section>
        </main>

        <footer className="footer"><div><strong>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</strong><span>Hệ thống phần mềm nội bộ</span></div><p>Bản quyền: Hoàng Vững</p><span>© 2026</span></footer>
      </div>
    </div>
  );
}

function Root() { if (window.location.pathname.startsWith('/so-cong-van')) return <LedgerPage />; if (window.location.pathname.startsWith('/dang-nhap')) return <LoginPage />; if (window.location.pathname.startsWith('/admin')) return <AdminPage />; return <App />; }

createRoot(document.getElementById('root')!).render(<Root />);
