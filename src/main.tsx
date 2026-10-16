import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import AccountAdminPage from './admin/AccountAdminPage';

type SessionUser = { email: string; name: string; role: string; status: string; isAdmin?: boolean };
type Letter = { id: number; incomingNumber: string; receivedDate: string; sender: string; documentNumber?: string; documentDate?: string; summary: string; handler?: string; deadline?: string; status: string; createdBy?: string };

function LoginPage({ message = 'Đăng nhập bằng tài khoản email đã đăng ký để truy cập khu vực nội bộ.' }: { message?: string }) {
  const params = new URLSearchParams(window.location.search);
  const pending = params.get('login') === 'pending';
  const resetToken = params.get('reset') || '';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetMode, setResetMode] = useState(Boolean(resetToken));
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState(() => window.localStorage.getItem('tand_saved_email') || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => window.localStorage.getItem('tand_remember_me') !== '0');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (pending || resetToken) { setCheckingSession(false); return; }
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }).then((response) => response.json()).then((data) => {
      if (data.authenticated) window.location.replace('/'); else setCheckingSession(false);
    }).catch(() => setCheckingSession(false));
  }, [pending]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name, remember: rememberMe }) });
      const data = await response.json();
      if (!response.ok) return setError(data.error || 'Không thể xử lý tài khoản.');
      window.localStorage.setItem('tand_saved_email', email.trim().toLowerCase()); window.localStorage.setItem('tand_remember_me', rememberMe ? '1' : '0');
      if (data.pending) return setNotice(data.message || 'Tài khoản đã đăng ký và đang chờ quản trị viên phê duyệt.');
      window.location.replace('/');
    } catch { setError('Không kết nối được máy chủ. Vui lòng thử lại sau ít giây.'); }
  };

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase() }) });
      const data = await response.json();
      if (!response.ok) return setError(data.error || 'Chưa thể gửi yêu cầu khôi phục.');
      setNotice(data.message || 'Nếu email tồn tại, hướng dẫn khôi phục đã được gửi.');
    } catch { setError('Không kết nối được máy chủ. Vui lòng thử lại sau ít giây.'); }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setNotice('');
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: resetToken, password: newPassword }) });
      const data = await response.json();
      if (!response.ok) return setError(data.error || 'Không thể đặt lại mật khẩu.');
      setNotice('Mật khẩu đã được cập nhật. Đang chuyển vào hệ thống…'); window.setTimeout(() => window.location.replace('/'), 500);
    } catch { setError('Không kết nối được máy chủ. Vui lòng thử lại sau ít giây.'); }
  };

  if (checkingSession) return <div className="login-shell"><div className="login-card"><p>Đang kiểm tra phiên đăng nhập đã lưu...</p></div></div>;
  const heading = resetMode ? 'Đặt lại mật khẩu' : forgotMode ? 'Quên mật khẩu' : pending ? 'Đang chờ phê duyệt' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
  const description = resetMode ? 'Tạo mật khẩu mới tối thiểu 8 ký tự cho tài khoản của bạn.' : forgotMode ? 'Nhập email đã đăng ký. Hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu nếu email tồn tại.' : pending ? 'Tài khoản đã được ghi nhận. Vui lòng chờ quản trị viên phê duyệt quyền truy cập.' : message;
  return <div className="login-shell"><div className="login-card"><section className="login-brand"><div className="brand-orbit"><span /><span /><span /></div><img src="/court-logo.png" alt="Logo Tòa án nhân dân" /><p className="brand-kicker">CỔNG TRUY CẬP NỘI BỘ</p><h1>Hệ thống phần mềm<br /><strong>nội bộ TAND</strong></h1><p className="brand-subtitle">TAND khu vực 11 - Thành phố Hồ Chí Minh</p><div className="brand-rule" /><p className="brand-caption">Kết nối nghiệp vụ · Điều hành · Chuyển đổi số</p></section><section className="login-form-panel"><div className="form-heading"><p className="eyebrow">XIN CHÀO</p><h2>{heading}</h2><p>{description}</p></div>{resetMode && <form className="auth-form" onSubmit={resetPassword}><label>Mật khẩu mới<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Tối thiểu 8 ký tự" /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)}>{showPassword ? 'Ẩn' : 'Hiện'}</button></div></label><button className="admin-login-button" type="submit">Cập nhật mật khẩu</button></form>}{forgotMode && <form className="auth-form" onSubmit={requestReset}><label>Email<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tenban@example.com" /></label><button className="admin-login-button" type="submit">Gửi hướng dẫn khôi phục</button><small className="auth-remember">Liên kết khôi phục chỉ dùng một lần và có thời hạn ngắn.</small></form>}{!forgotMode && !pending && <form className="auth-form" onSubmit={submit}>{mode === 'register' && <label>Họ và tên<input value={name} onChange={(e) => setName(e.target.value)} required /></label>}<label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tenban@example.com" /></label><label>Mật khẩu riêng của website<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Tối thiểu 8 ký tự" /><button type="button" className="password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? 'Ẩn' : 'Hiện'}</button></div></label><label className="remember-row"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> <span>Ghi nhớ đăng nhập trên thiết bị này</span></label><button className="admin-login-button" type="submit">{mode === 'login' ? 'Đăng nhập vào hệ thống' : 'Đăng ký tài khoản'}</button><small className="auth-remember">{rememberMe ? 'Phiên sẽ được ghi nhớ 30 ngày; chỉ email được điền sẵn, không lưu mật khẩu.' : 'Phiên chỉ tồn tại đến khi đóng trình duyệt; mật khẩu không được lưu.'}</small></form>}{error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}{!pending && !resetMode && <div className="auth-links">{!forgotMode && mode === 'login' && <button className="auth-forgot" onClick={() => { setForgotMode(true); setError(''); setNotice(''); }}>Quên mật khẩu?</button>}{forgotMode && <button className="auth-forgot" onClick={() => { setForgotMode(false); setError(''); setNotice(''); }}>← Quay lại đăng nhập</button>}{!forgotMode && <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}</button>}</div>}<a className="admin-back" href="/">← Quay về trang chủ</a></section><footer className="login-footer">Phần mềm được thiết kế bởi <strong>Hoàng Vững</strong></footer></div></div>;
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
  return <AccountAdminPage />;
}

type DirectoryEntry = { name: string; area: string; phone: string; detail: string; note: string };
const jurors: DirectoryEntry[] = [
  { name: 'Nguyễn Văn A', area: 'TAND khu vực 11', phone: 'Chưa cập nhật', detail: 'Hội thẩm nhân dân', note: 'Dữ liệu minh họa' },
  { name: 'Trần Thị B', area: 'Phường Phước Thắng', phone: 'Chưa cập nhật', detail: 'Hội thẩm nhân dân', note: 'Dữ liệu minh họa' },
  { name: 'Lê Văn C', area: 'Phường Bình Thuận', phone: 'Chưa cập nhật', detail: 'Hội thẩm nhân dân', note: 'Dữ liệu minh họa' },
];
const neighborhoodLeaders: DirectoryEntry[] = [
  { name: 'Nguyễn Văn A', area: 'Phường Phước Thắng · Khu phố 01', phone: 'Chưa cập nhật', detail: 'Khu phố trưởng', note: 'Dữ liệu minh họa' },
  { name: 'Trần Thị B', area: 'Phường Phước Thắng · Khu phố 02', phone: 'Chưa cập nhật', detail: 'Khu phố trưởng', note: 'Dữ liệu minh họa' },
  { name: 'Lê Văn C', area: 'Phường Bình Thuận · Khu phố 01', phone: 'Chưa cập nhật', detail: 'Khu phố trưởng', note: 'Dữ liệu minh họa' },
];
const localPolice: DirectoryEntry[] = [
  { name: 'Nguyễn Văn A', area: 'Phường Phước Thắng · Khu vực 01', phone: 'Chưa cập nhật', detail: 'Cảnh sát khu vực', note: 'Dữ liệu minh họa' },
  { name: 'Trần Thị B', area: 'Phường Bình Thuận · Khu vực 02', phone: 'Chưa cập nhật', detail: 'Cảnh sát khu vực', note: 'Dữ liệu minh họa' },
  { name: 'Lê Văn C', area: 'Phường An Lạc · Khu vực 01', phone: 'Chưa cập nhật', detail: 'Cảnh sát khu vực', note: 'Dữ liệu minh họa' },
];
const wards = ['Tất cả phường', 'Phường Phước Thắng', 'Phường Bình Thuận', 'Phường An Lạc'];

function DirectoryPage({ title, eyebrow, description, entries, icon }: { title: string; eyebrow: string; description: string; entries: DirectoryEntry[]; icon: string }) {
  const [query, setQuery] = useState(''); const [ward, setWard] = useState('Tất cả phường');
  const filtered = entries.filter((entry) => `${entry.name} ${entry.area} ${entry.phone}`.toLowerCase().includes(query.trim().toLowerCase()) && (ward === 'Tất cả phường' || entry.area.includes(ward)));
  return <div className="internal-shell directory-shell"><header className="internal-header"><div><p className="eyebrow">HỆ THỐNG PHẦN MỀM TAND</p><h1>{title}</h1><span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div><div className="internal-user">Danh bạ phối hợp<a href="/">← Trang chủ</a></div></header><main className="directory-main"><div className="directory-hero"><div className="directory-icon">{icon}</div><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><p>{description}</p></div><span className="secure-badge">● Nội bộ</span></div><div className="data-note"><strong>Thông tin minh họa</strong><span>Danh sách và số điện thoại sẽ được cập nhật khi bạn cung cấp dữ liệu chính thức. Chỉ tài khoản đã được phê duyệt mới xem được nội dung.</span></div><div className="directory-toolbar"><label className="directory-search">⌕<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo họ tên, phường..." /></label><select value={ward} onChange={(e) => setWard(e.target.value)}>{wards.map((item) => <option key={item}>{item}</option>)}</select><span className="result-count">{filtered.length} kết quả</span></div><div className="directory-table-wrap"><table className="directory-table"><thead><tr><th>Họ và tên</th><th>Đơn vị / khu vực</th><th>Chức danh</th><th>Số điện thoại</th><th>Ghi chú</th></tr></thead><tbody>{filtered.map((entry) => <tr key={`${entry.name}-${entry.area}`}><td><strong>{entry.name}</strong></td><td>{entry.area}</td><td>{entry.detail}</td><td><span className="phone-cell">{entry.phone}</span></td><td><span className="demo-badge">{entry.note}</span></td></tr>)}</tbody></table>{filtered.length === 0 && <p className="empty">Không tìm thấy thông tin phù hợp.</p>}</div></main></div>;
}

type FormTemplate = { title: string; code: string; category: string; description: string; format: string; updated: string };
const formTemplates: FormTemplate[] = [
  { title: 'Phiếu đề xuất xử lý công văn đến', code: 'BM-CV-01', category: 'Công văn', description: 'Mẫu phiếu ghi nhận và chuyển xử lý văn bản đến.', format: 'DOCX', updated: 'Mẫu minh họa' },
  { title: 'Danh sách hội thẩm nhân dân', code: 'BM-HT-01', category: 'Hội thẩm', description: 'Mẫu tổng hợp thông tin hội thẩm theo nhiệm kỳ.', format: 'XLSX', updated: 'Mẫu minh họa' },
  { title: 'Báo cáo công tác phối hợp địa phương', code: 'BM-BC-02', category: 'Báo cáo', description: 'Mẫu báo cáo phục vụ tổng hợp công tác phối hợp.', format: 'DOCX', updated: 'Mẫu minh họa' },
  { title: 'Phiếu theo dõi kết quả xử lý', code: 'BM-NV-03', category: 'Nghiệp vụ', description: 'Mẫu theo dõi tiến độ và kết quả công việc.', format: 'DOCX', updated: 'Mẫu minh họa' },
  { title: 'Biểu tổng hợp danh bạ phường', code: 'BM-DB-01', category: 'Danh bạ', description: 'Mẫu nhập danh sách khu phố trưởng và cảnh sát khu vực.', format: 'XLSX', updated: 'Mẫu minh họa' },
];
function FormsPage() {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Tất cả'); const [notice, setNotice] = useState('');
  const categories = ['Tất cả', ...Array.from(new Set(formTemplates.map((item) => item.category)))];
  const filtered = formTemplates.filter((item) => (category === 'Tất cả' || item.category === category) && `${item.title} ${item.code} ${item.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <div className="internal-shell forms-shell"><header className="internal-header"><div><p className="eyebrow">HỆ THỐNG PHẦN MỀM TAND</p><h1>Hệ thống biểu mẫu</h1><span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div><div className="internal-user">Kho dùng chung<a href="/">← Trang chủ</a></div></header><main className="forms-main"><div className="directory-hero"><div className="directory-icon">▤</div><div><p className="eyebrow">KHO BIỂU MẪU</p><h2>Hệ thống biểu mẫu</h2><p>Tập hợp các biểu mẫu nghiệp vụ, hành chính, hội thẩm và phối hợp địa phương.</p></div><span className="secure-badge">● Nội bộ</span></div><div className="data-note"><strong>Mẫu minh họa</strong><span>Các biểu mẫu thật sẽ được bổ sung sau khi bạn gửi danh mục và file chính thức.</span></div><div className="forms-toolbar"><label className="directory-search">⌕<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên hoặc mã biểu mẫu..." /></label><div className="filter-pills">{categories.map((item) => <button className={category === item ? 'active' : ''} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></div><div className="forms-grid">{filtered.map((item) => <article className="form-card" key={item.code}><div className="form-card-top"><span className="form-file">{item.format}</span><span>{item.code}</span></div><p className="form-category">{item.category}</p><h3>{item.title}</h3><p>{item.description}</p><div className="form-card-bottom"><small>{item.updated}</small><button onClick={() => setNotice(`Biểu mẫu ${item.code} sẽ được bổ sung file chính thức.`)}>Xem / tải mẫu ↗</button></div></article>)}</div>{notice && <div className="form-toast">{notice}</div>}</main></div>;
}

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




function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false); const [query, setQuery] = useState(''); const [activeTag, setActiveTag] = useState('Tất cả'); const [now, setNow] = useState(() => new Date());
  const clock = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const tags = ['Tất cả', ...Array.from(new Set(modules.map((item) => item.tag)))]; const filtered = useMemo(() => modules.filter((item) => (activeTag === 'Tất cả' || item.tag === activeTag) && `${item.title} ${item.description} ${item.tag}`.toLowerCase().includes(query.trim().toLowerCase())), [activeTag, query]);
  const eqlta = modules.find((item) => item.title.startsWith('E-QLTA'));
  const closeSidebar = () => setSidebarOpen(false); const quickLinks = [{ icon: '▣', title: 'Sổ công văn đến', desc: 'Ghi sổ và tra cứu văn bản đến', href: '/so-cong-van', tone: 'terracotta' }, { icon: '♙', title: 'Hội thẩm nhân dân', desc: 'Danh sách và thông tin liên hệ', href: '/hoi-tham', tone: 'gold' }, { icon: '▤', title: 'Hệ thống biểu mẫu', desc: 'Kho biểu mẫu dùng chung', href: '/bieu-mau', tone: 'blue' }, { icon: '⌖', title: 'Danh bạ phối hợp', desc: 'Khu phố trưởng và cảnh sát khu vực', href: '/khu-pho-truong', tone: 'teal' }];
  const sidebarLink = (title: string, icon: string, href: string, external = false) => <a className="side-link" title={title} aria-label={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} onClick={closeSidebar}><span className="side-icon">{icon}</span><span>{title}</span><b>↗</b></a>;
  return <div className="app-shell"><aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}><div className="sidebar-brand"><img className="official-logo" src="/court-logo.png" alt="Logo Tòa án nhân dân" /><div><strong>HỆ THỐNG<br />PHẦN MỀM TAND</strong><small>TAND KHU VỰC 11</small></div></div><div className="sidebar-rule" /><nav className="side-nav" aria-label="Danh mục phần mềm">
          {eqlta && <div className="side-group"><a className="side-link" href={eqlta.href} target="_blank" rel="noreferrer" title={eqlta.title} aria-label={eqlta.title} onClick={closeSidebar}><span className={`side-icon ${eqlta.tone}`}>{eqlta.icon}</span><span>{eqlta.title}</span><b>↗</b></a></div>}
          {sidebarGroups.map((group) => <div className="side-group" key={group.label}>
            <p>{group.label}</p>
            {group.items.length === 0 ? <a className="side-link current" href="/" aria-current="page" title="Trang chủ" aria-label="Trang chủ" onClick={closeSidebar}><span className="side-icon">⌂</span><span>Trang chủ</span></a> : group.items.filter((item) => item !== eqlta).map((item) => <a className="side-link" href={item.href} target="_blank" rel="noreferrer" key={`${group.label}-${item.title}`} title={item.title} aria-label={item.title} onClick={closeSidebar}><span className={`side-icon ${item.tone}`}>{item.icon}</span><span>{item.title}</span><b>↗</b></a>)}
          </div>)}
          <div className="side-group internal-nav"><p>Nội bộ</p>{sidebarLink('Sổ công văn đến', '▣', '/so-cong-van')}{sidebarLink('Hệ thống biểu mẫu', '▤', '/bieu-mau')}</div>
          <div className="side-group"><p>Danh bạ phối hợp</p>{sidebarLink('Hội thẩm nhân dân', '♙', '/hoi-tham')}{sidebarLink('Khu phố trưởng', '⌖', '/khu-pho-truong')}{sidebarLink('Cảnh sát khu vực', '◈', '/canh-sat-khu-vuc')}</div>
          <div className="side-group"><p>Quản trị hệ thống</p>{sidebarLink('Duyệt tài khoản', '⚙', '/admin')}</div>
        </nav><div className="sidebar-bottom"><div className="online-dot" /><span>Hệ thống đang hoạt động</span></div></aside>{sidebarOpen && <button className="sidebar-overlay" onClick={closeSidebar} aria-label="Đóng menu" />}<div className="main-area"><div className="topbar"><div className="topbar-left"><button className="mobile-toggle" onClick={() => setSidebarOpen(true)} aria-label="Mở sidebar">☰</button><span className="breadcrumb">Trang chủ <b>/</b> Hệ thống phần mềm</span></div><div className="topbar-right"><span className="system-status"><i /> Hệ thống nội bộ</span><span className="clock"><b className="clock-label">Thời gian</b>{clock}</span></div></div><header className="main-header"><div><p className="eyebrow">CỔNG KẾT NỐI NGHIỆP VỤ</p><h1>Hệ thống phần mềm TAND</h1><p className="subtitle">TAND KHU VỰC 11 - TP HỒ CHÍ MINH</p></div><div className="header-actions"><button className="support-button" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Hỗ trợ hệ thống <span>?</span></button><a className="support-button login-link" href="/dang-nhap">Tài khoản</a></div></header><main><section className="digital-hero"><div className="hero-content"><span className="hero-badge">CHUYỂN ĐỔI SỐ TÒA ÁN</span><h2>Công cụ đúng lúc.<br /><em>Quy trình thông suốt.</em></h2><p>Một không gian tập trung cho nghiệp vụ, điều hành, danh bạ phối hợp và biểu mẫu dùng chung.</p><button className="hero-link" onClick={() => document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })}>Khám phá hệ thống <span>↓</span></button></div><div className="hero-scale" aria-label="Biểu tượng Tòa án nhân dân"><div className="hero-emblem"><img src="/court-logo.png" alt="Biểu trưng Tòa án nhân dân" /></div><div className="orbit orbit-a" /><div className="orbit orbit-b" /></div></section><section className="quick-section" id="workspace"><div className="section-title"><div><p className="eyebrow">TRUY CẬP NHANH</p><h2>Không gian làm việc</h2></div><span className="section-note">04 nhóm thường dùng</span></div><div className="quick-grid">{quickLinks.map((item) => <a className={`quick-card ${item.tone}`} href={item.href} key={item.title}><span className="quick-icon">{item.icon}</span><div><small>NỘI BỘ</small><strong>{item.title}</strong><span className="quick-desc">{item.desc}</span></div><b>↗</b></a>)}</div></section><section className="directory-shortcuts"><div className="section-title"><div><p className="eyebrow">DANH BẠ PHỐI HỢP</p><h2>Tra cứu nhanh</h2></div><span className="section-note">Dữ liệu nội bộ</span></div><div className="shortcut-grid"><a href="/khu-pho-truong"><span>⌖</span><div><strong>Khu phố trưởng</strong><small>Danh sách theo phường và khu phố</small></div>↗</a><a href="/canh-sat-khu-vuc"><span>◈</span><div><strong>Cảnh sát khu vực</strong><small>Danh sách cán bộ theo địa bàn</small></div>↗</a><a href="/hoi-tham"><span>♙</span><div><strong>Hội thẩm nhân dân</strong><small>Danh sách và thông tin nhiệm kỳ</small></div>↗</a></div></section><section className="all-apps" id="all-apps"><div className="section-title"><div><p className="eyebrow">DANH MỤC HỆ THỐNG</p><h2>Tất cả ứng dụng</h2></div><span className="app-count"><strong>{String(filtered.length).padStart(2, '0')}</strong> ứng dụng</span></div><div className="filter-row"><div className="filter-pills">{tags.map((tag) => <button className={activeTag === tag ? 'active' : ''} key={tag} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm ứng dụng..." aria-label="Tìm ứng dụng" /></label></div><div className="app-grid">{filtered.map((item, index) => <a className={`app-card ${item.tone}`} href={item.href} target="_blank" rel="noreferrer" key={item.title}><div className="app-card-top"><span className="app-symbol">{item.icon}</span><span className="app-index">{String(index + 1).padStart(2, '0')}</span></div><span className="app-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.description}</p><span className="app-arrow">↗</span></a>)}</div>{filtered.length === 0 && <div className="empty">Không tìm thấy ứng dụng phù hợp.</div>}</section><section className="notice-panel"><div><p className="eyebrow">LƯU Ý DỮ LIỆU</p><h2>Danh bạ nội bộ, tra cứu đúng người.</h2><p>Các mục danh bạ chỉ dành cho tài khoản đã được phê duyệt. Số điện thoại và thông tin liên hệ sẽ được cập nhật theo danh sách chính thức do đơn vị cung cấp.</p></div><a href="/bieu-mau">Mở kho biểu mẫu ↗</a></section><section className="contact" id="contact"><div className="contact-heading"><span className="contact-mark">?</span><div><p className="eyebrow">BẠN CẦN HỖ TRỢ?</p><h2>Liên hệ bộ phận vận hành hệ thống.</h2></div></div><div className="contact-items"><div><small>Địa chỉ</small><strong>Số 989 đường 2/9, phường Phước Thắng,<br />TP. Hồ Chí Minh</strong></div><div><small>Điện thoại</small><a href="tel:0913742969">0913 742 969</a></div><div><small>Giờ làm việc</small><strong>Thứ Hai — Thứ Sáu<br />07:30 — 17:00</strong></div></div></section></main><footer className="footer"><div><strong>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</strong><span>Hệ thống phần mềm nội bộ</span></div><p>Bản quyền: Hoàng Vững</p><span>© 2026</span></footer></div></div>;
}

function Root() { if (window.location.pathname.startsWith('/so-cong-van')) return <LedgerPage />; if (window.location.pathname.startsWith('/hoi-tham')) return <DirectoryPage title="Hội thẩm nhân dân" eyebrow="DANH BẠ HỘI THẨM" description="Danh sách hội thẩm nhân dân theo đơn vị và nhiệm kỳ." entries={jurors} icon="♙" />; if (window.location.pathname.startsWith('/khu-pho-truong')) return <DirectoryPage title="Danh sách khu phố trưởng" eyebrow="DANH BẠ ĐỊA PHƯƠNG" description="Tra cứu khu phố trưởng theo phường và khu phố." entries={neighborhoodLeaders} icon="⌖" />; if (window.location.pathname.startsWith('/canh-sat-khu-vuc')) return <DirectoryPage title="Cảnh sát khu vực các phường" eyebrow="DANH BẠ PHỐI HỢP" description="Tra cứu cán bộ cảnh sát khu vực theo địa bàn phụ trách." entries={localPolice} icon="◈" />; if (window.location.pathname.startsWith('/bieu-mau')) return <FormsPage />; if (window.location.pathname.startsWith('/dang-nhap')) return <LoginPage />; if (window.location.pathname.startsWith('/admin')) return <AdminPage />; return <App />; }

createRoot(document.getElementById('root')!).render(<Root />);
