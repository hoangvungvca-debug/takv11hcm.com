import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { assignedToUser, dateKey, deadlineState, displayDate, normalizeSearch,
  type DashboardLetter, type DashboardUser } from './dashboard-utils';
import './dashboard.css';

export type DashboardModule = {
  title: string; description: string; href: string; tag: string;
};
type IconName = 'home' | 'file' | 'calendar' | 'forms' | 'users' | 'pin' | 'shield' |
  'bell' | 'apps' | 'search' | 'arrow' | 'external' | 'logout' | 'clock' | 'help' | 'check' | 'chat';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v12h5v-7h4v7h5V9" /></>,
    file: <><path d="M14 3H5v18h14V8z" /><path d="M14 3v5h5M8 12h8M8 16h5" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M7 14h3M14 14h3M7 17h3" /></>,
    forms: <><path d="M4 3h12v15H4zM8 7h5M8 11h5M8 15h3M19 6h2v15H9v-1" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" /><path d="m8 12 3 3 5-6" /></>,
    bell: <><path d="M5 17h14l-2-4V9a5 5 0 0 0-10 0v4zM10 21h4M12 2v2" /></>,
    apps: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    external: <><path d="M14 3h7v7M21 3 11 13M10 3H3v18h18v-7" /></>,
    logout: <><path d="M9 3H3v18h6M8 12h13m-5-5 5 5-5 5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    chat: <><path d="M20 11.5a7 7 0 0 1-7.5 7L7 21v-3.2A7 7 0 1 1 20 11.5Z" /><path d="M8 11h.01M12 11h.01M16 11h.01" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function PanelHeading({ label, title, children }: { label: string; title: string; children?: ReactNode }) {
  return <div className="db-section-heading"><div><p className="db-kicker">{label}</p><h2>{title}</h2></div>{children}</div>;
}

const directories: { title: string; short: string; description: string; href: string; icon: IconName }[] = [
  { title: 'Hội thẩm nhân dân', short: 'Hội thẩm', description: 'Thông tin hội thẩm, đơn vị và liên hệ.', href: '/hoi-tham', icon: 'users' },
  { title: 'Khu phố trưởng', short: 'Khu phố', description: 'Tra cứu theo phường và khu phố.', href: '/khu-pho-truong', icon: 'pin' },
  { title: 'Cảnh sát khu vực', short: 'CSKV', description: 'Cán bộ phụ trách từng địa bàn.', href: '/canh-sat-khu-vuc', icon: 'shield' },
];
const templateGroups = [
  { title: 'Công văn & hành chính', description: 'Biểu mẫu văn bản, phiếu xử lý', icon: 'file' as const },
  { title: 'Nghiệp vụ & hội thẩm', description: 'Biểu mẫu phục vụ công tác xét xử', icon: 'users' as const },
  { title: 'Báo cáo & danh bạ', description: 'Mẫu tổng hợp, báo cáo phối hợp', icon: 'forms' as const },
];
type ChatMessage = { id: number; userEmail: string; userName: string; message: string; createdAt: string };
type VisitStats = { totalVisits: number; todayVisits: number };
type DashboardEvent = { id: number; title: string; startsAt: string; location?: string; notes?: string; ownerName?: string; ownerEmail?: string; sharedReadOnly: boolean };
const localCalendarDate = (value: string) => { const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/); return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]) - 7, Number(match[5]), Number(match[6] || 0))) : new Date(value); };
const calendarLabel = (value: string) => localCalendarDate(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });

export default function Dashboard({ modules, preview = false }: { modules: DashboardModule[]; preview?: boolean }) {
  const [now, setNow] = useState(() => new Date());
  const [user, setUser] = useState<DashboardUser | null>(preview
    ? { name: 'Người dùng minh họa', email: '', role: 'viewer', status: 'approved' } : null);
  const [authState, setAuthState] = useState<'loading' | 'ready' | 'error'>(preview ? 'ready' : 'loading');
  const [letters, setLetters] = useState<DashboardLetter[]>([]);
  const [letterState, setLetterState] = useState<'loading' | 'ready' | 'error'>(preview ? 'ready' : 'loading');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatState, setChatState] = useState<'loading' | 'ready' | 'error'>(preview ? 'ready' : 'loading');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [visitStats, setVisitStats] = useState<VisitStats | null>(preview ? { totalVisits: 0, todayVisits: 0 } : null);
  const [calendarEvents, setCalendarEvents] = useState<DashboardEvent[]>([]);
  const [taskScope, setTaskScope] = useState<'mine' | 'all'>('mine');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('Tất cả');
  const [appsExpanded, setAppsExpanded] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/auth/me', { signal: controller.signal, credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error('session');
        const data = await response.json();
        if (!data.user || !['approved', 'admin'].includes(data.user.status)) {
          window.location.replace('/dang-nhap');
          return;
        }
        setUser(data.user);
        setAuthState('ready');
      } catch {
        if (!controller.signal.aborted) setAuthState('error');
        return;
      }
      try {
        const [letterResponse, chatResponse, statsResponse, calendarResponse] = await Promise.all([
          fetch('/api/letters', { signal: controller.signal, credentials: 'include', cache: 'no-store' }),
          fetch('/api/chat', { signal: controller.signal, credentials: 'include', cache: 'no-store' }),
          fetch('/api/stats/visits', { signal: controller.signal, credentials: 'include', cache: 'no-store' }),
          fetch('/api/work-calendar', { signal: controller.signal, credentials: 'include', cache: 'no-store' }),
        ]);
        if (letterResponse.status === 403 || letterResponse.status === 401 || chatResponse.status === 403 || statsResponse.status === 403 || calendarResponse.status === 403) {
          window.location.replace('/dang-nhap');
          return;
        }
        if (!letterResponse.ok) throw new Error('letters');
        const letterData = await letterResponse.json();
        setLetters(Array.isArray(letterData.letters) ? letterData.letters : []);
        setLetterState('ready');
        if (chatResponse.ok) { const chatData = await chatResponse.json(); setChatMessages(Array.isArray(chatData.messages) ? chatData.messages : []); setChatState('ready'); } else setChatState('error');
        if (statsResponse.ok) setVisitStats(await statsResponse.json());
        if (calendarResponse.ok) { const calendarData = await calendarResponse.json(); setCalendarEvents(Array.isArray(calendarData.events) ? calendarData.events : []); }
      } catch {
        if (!controller.signal.aborted) { setLetterState('error'); setChatState('error'); }
      }
    }
    void load();
    return () => controller.abort();
  }, [preview]);

  useEffect(() => {
    if (preview || authState !== 'ready') return;
    const timer = window.setInterval(async () => {
      const response = await fetch('/api/work-calendar', { credentials: 'include', cache: 'no-store' });
      if (response.ok) { const data = await response.json(); setCalendarEvents(Array.isArray(data.events) ? data.events : []); }
    }, 30000);
    return () => window.clearInterval(timer);
  }, [preview, authState]);

  async function logout() {
    if (preview) return;
    setLoggingOut(true);
    setActionError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('logout');
      window.location.replace('/dang-nhap');
    } catch {
      setActionError('Chưa thể đăng xuất. Vui lòng thử lại.');
      setLoggingOut(false);
    }
  }

  async function sendChat(event: React.FormEvent) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message || preview || chatSending) return;
    setChatSending(true); setActionError('');
    try {
      const response = await fetch('/api/chat', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể gửi tin nhắn.');
      setChatDraft('');
      const refreshed = await fetch('/api/chat', { credentials: 'include', cache: 'no-store' });
      if (refreshed.ok) { const chatData = await refreshed.json(); setChatMessages(Array.isArray(chatData.messages) ? chatData.messages : []); }
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Không thể gửi tin nhắn.'); }
    finally { setChatSending(false); }
  }

  const personalLetters = useMemo(() => letters.filter((letter) => assignedToUser(letter, user)), [letters, user]);
  const taskLetters = taskScope === 'mine' ? personalLetters : letters;
  const openLetters = taskLetters.filter((letter) => letter.status !== 'Đã hoàn thành');
  const todayLetters = letters.filter((letter) => dateKey(letter.receivedDate) === dateKey(now));
  const soonLetters = openLetters.filter((letter) => deadlineState(letter, now) !== 'normal');
  const filteredModules = modules.filter((item) => (tag === 'Tất cả' || item.tag === tag)
    && normalizeSearch(`${item.title} ${item.description} ${item.tag}`).includes(normalizeSearch(query)));
  const tags = ['Tất cả', ...Array.from(new Set(modules.map((item) => item.tag)))];
  const calendarUrl = modules.find((item) => item.title === 'Lịch xét xử')?.href || '#';
  const weeklyUrl = modules.find((item) => item.title === 'Lịch làm việc theo tuần')?.href || calendarUrl;
  const reportUrl = modules.find((item) => item.title.startsWith('Báo cáo'))?.href || '#db-apps';
  const quickLinks: { title: string; description: string; href: string; icon: IconName; external?: boolean }[] = [
    { title: 'Sổ công văn đến', description: 'Ghi nhận & theo dõi văn bản', href: '/so-cong-van', icon: 'file' },
    { title: 'Lịch xét xử', description: 'Xem lịch phiên tòa', href: calendarUrl, icon: 'calendar', external: true },
    { title: 'Hệ thống biểu mẫu', description: 'Kho dùng chung của đơn vị', href: '/bieu-mau', icon: 'forms' },
    { title: 'Danh bạ phối hợp', description: 'Tra cứu liên hệ nghiệp vụ', href: '#db-directories', icon: 'users' },
  ];
  const visibleCalendarEvents = calendarEvents
    .filter((event) => localCalendarDate(event.startsAt).getTime() >= Date.now() - 60 * 60 * 1000)
    .sort((a, b) => localCalendarDate(a.startsAt).getTime() - localCalendarDate(b.startsAt).getTime())
    .slice(0, 5);
  const clock = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
  const date = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(now);
  const fullName = user?.name || user?.email || 'bạn';
  const initials = (user?.name || 'TAND').split(' ').filter(Boolean).slice(-2).map((value) => value[0]).join('').toUpperCase();
  const navLink = (title: string, short: string, icon: IconName, href: string, external = false) => (
    <a className="db-nav-link" href={href} title={title} aria-label={title} key={title}
      target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      <Icon name={icon} /><span className="db-nav-label">{title}</span><span className="db-nav-short">{short}</span>
      {external && <span className="db-nav-external"><Icon name="external" size={12} /></span>}
    </a>
  );

  if (authState !== 'ready') return <div className="db-session-state" role="status">
    <img src="/court-logo.png" alt="Logo Tòa án nhân dân" width="64" height="64" />
    <h1>Hệ thống phần mềm nội bộ TAND</h1>
    <p>{authState === 'loading' ? 'Đang kiểm tra phiên đăng nhập…' : 'Chưa thể kiểm tra phiên đăng nhập. Vui lòng thử lại.'}</p>
    {authState === 'error' && <button onClick={() => window.location.reload()}>Thử lại</button>}
  </div>;

  return <div className="db-shell">
    <a className="db-skip" href="#db-main">Bỏ qua điều hướng</a>
    <aside className="db-sidebar" aria-label="Điều hướng hệ thống">
      <a href="/" className="db-sidebar-brand" aria-label="Trang chủ TAND khu vực 11">
        <img src="/court-logo.png" alt="Logo Tòa án nhân dân" width="46" height="46" />
        <div><strong>TAND KHU VỰC 11</strong><span>Cổng điều hành nội bộ</span></div>
      </a>
      <nav className="db-navigation">
        <div className="db-nav-group"><p>Tổng quan</p>
          <a href="/" className="db-nav-link db-nav-current" aria-current="page" aria-label="Trang chủ" title="Trang chủ"><Icon name="home" /><span className="db-nav-label">Trang chủ</span><span className="db-nav-short">Trang chủ</span></a>
          {navLink('Thông báo nội bộ', 'Tin mới', 'bell', '#db-notices')}
          {navLink('Chat nội bộ', 'Chat', 'chat', '#db-chat')}
          {navLink('Lịch làm việc', 'Lịch', 'calendar', weeklyUrl, true)}
        </div>
        <div className="db-nav-group"><p>Nghiệp vụ</p>
          {navLink('Sổ công văn đến', 'Công văn', 'file', '/so-cong-van')}
          {navLink('Lịch xét xử', 'Xét xử', 'calendar', calendarUrl, true)}
          {navLink('Báo cáo — thống kê', 'Báo cáo', 'apps', reportUrl, true)}
        </div>
        <div className="db-nav-group"><p>Danh bạ phối hợp</p>
          {directories.map((item) => navLink(item.title, item.short, item.icon, item.href))}
        </div>
        <div className="db-nav-group"><p>Kho dùng chung</p>
          {navLink('Hệ thống biểu mẫu', 'Mẫu', 'forms', '/bieu-mau')}
          {navLink('Ứng dụng dùng chung', 'Ứng dụng', 'apps', '#db-apps')}
        </div>
        {user?.isAdmin && <div className="db-nav-group"><p>Quản trị</p>{navLink('Duyệt tài khoản', 'Duyệt', 'shield', '/admin')}</div>}
      </nav>
      <a href="#db-support" className="db-sidebar-help" aria-label="Hỗ trợ hệ thống" title="Hỗ trợ hệ thống"><Icon name="help" /><span className="db-help-label">Hỗ trợ hệ thống</span><span className="db-help-short">Hỗ trợ</span></a>
    </aside>

    <div className="db-main-column">
      <div className="db-timebar"><span><Icon name="shield" size={14} /> Khu vực nội bộ</span><time dateTime={now.toISOString()}><Icon name="clock" size={14} /><b>Thời gian</b><span>{clock}</span><span className="db-date">{date}</span></time></div>
      <header className="db-header">
        <div className="db-header-brand"><img src="/court-logo.png" alt="" width="42" height="42" /><div><strong>Hệ thống phần mềm nội bộ TAND</strong><span>TAND khu vực 11 - Thành phố Hồ Chí Minh</span></div></div>
        <div className="db-account"><span className="db-avatar" aria-hidden="true">{initials}</span><div><strong>{fullName}</strong><small>{user?.isAdmin ? 'Quản trị viên' : 'Người dùng nội bộ'}</small></div><button onClick={logout} disabled={loggingOut || preview} aria-label="Đăng xuất" title="Đăng xuất"><Icon name="logout" /><span>{loggingOut ? 'Đang thoát…' : 'Đăng xuất'}</span></button></div>
      </header>

      <main className="db-content" id="db-main" tabIndex={-1}>
        {actionError && <p className="db-error" role="alert">{actionError}</p>}
        {preview && <p className="db-preview-note">Bản HTML/CSS minh họa — không chứa dữ liệu cá nhân hoặc phiên đăng nhập thật.</p>}
        <section className="db-welcome"><div><p className="db-kicker">TRANG CHỦ / TỔNG QUAN</p><h1>Chào {fullName},<br className="db-mobile-break" /> một ngày làm việc hiệu quả.</h1><p>Tập trung công việc. Kết nối nghiệp vụ. Tra cứu thuận tiện.</p></div><span className="db-access-badge"><Icon name="check" size={15} /> Truy cập đã được phê duyệt</span></section>

        <section className="db-quick-section" aria-labelledby="db-quick-title"><h2 id="db-quick-title" className="db-compact-title">Truy cập nhanh</h2><div className="db-quick-grid">{quickLinks.map((item, index) => <a className={`db-quick-card ${index === 0 ? 'db-quick-primary' : ''}`} href={item.href} key={item.title} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined}><span className="db-icon-tile"><Icon name={item.icon} size={23} /></span><div><strong>{item.title}</strong><small>{item.description}</small></div><Icon name={item.external ? 'external' : 'arrow'} size={17} /></a>)}</div></section>

        <div className="db-work-row">
          <section className="db-panel db-work-panel" aria-labelledby="db-work-title">
            <div className="db-panel-head"><div><p className="db-kicker">THEO DÕI XỬ LÝ</p><h2 id="db-work-title">Công việc & văn bản</h2></div><a href="/so-cong-van" className="db-text-link">Mở sổ <Icon name="arrow" size={16} /></a></div>
            <div className="db-work-tabs" role="group" aria-label="Phạm vi công việc"><button aria-pressed={taskScope === 'mine'} className={taskScope === 'mine' ? 'is-active' : ''} onClick={() => setTaskScope('mine')}>Công việc của tôi</button><button aria-pressed={taskScope === 'all'} className={taskScope === 'all' ? 'is-active' : ''} onClick={() => setTaskScope('all')}>Toàn bộ công văn</button></div>
            <div className="db-work-metrics"><div><small>{taskScope === 'mine' ? 'Được phân công' : 'Công văn đã ghi sổ'}</small><strong>{letterState === 'ready' ? taskLetters.length : '—'}</strong></div><div><small>Chưa hoàn thành</small><strong>{letterState === 'ready' ? openLetters.length : '—'}</strong></div><div className="db-metric-amber"><small>Sắp / quá hạn</small><strong>{letterState === 'ready' ? soonLetters.length : '—'}</strong></div></div>
            {letterState === 'loading' && <div className="db-empty" role="status"><Icon name="clock" size={26} /><p>Đang tải dữ liệu công văn…</p></div>}
            {letterState === 'error' && <div className="db-empty" role="alert"><Icon name="help" size={26} /><strong>Chưa tải được công văn</strong><p>Không hiển thị số liệu thay thế khi kết nối lỗi.</p><button onClick={() => window.location.reload()} className="db-text-button">Thử lại</button></div>}
            {letterState === 'ready' && (openLetters.length ? <ul className="db-task-list">{openLetters.slice(0, 3).map((letter) => <li key={letter.id}><span className={`db-task-dot ${deadlineState(letter, now)}`} /><div><a href="/so-cong-van">{letter.summary}</a><small>Số đến {letter.incomingNumber} · {letter.sender}</small></div><span className={`db-task-status ${deadlineState(letter, now)}`}>{displayDate(letter.deadline)}</span></li>)}</ul> : <div className="db-empty"><span className="db-empty-icon"><Icon name="file" size={26} /></span><strong>{taskScope === 'mine' ? 'Chưa có công văn được phân công' : 'Không có công văn chờ xử lý'}</strong><p>{taskScope === 'mine' ? 'Công việc xuất hiện khi trường Người xử lý khớp tên hoặc email của bạn.' : 'Các công văn chưa hoàn thành sẽ được hiển thị ở đây.'}</p><a href="/so-cong-van" className="db-text-link">Đến sổ công văn <Icon name="arrow" size={15} /></a></div>)}
            <div className="db-panel-foot"><Icon name="file" size={14} /><span>{letterState === 'ready' ? `${todayLetters.length} công văn đến trong ngày · Dữ liệu từ sổ công văn` : 'Nguồn dữ liệu: Sổ công văn đến'}</span></div>
          </section>

          <section className="db-panel db-notice-panel" id="db-notices" aria-labelledby="db-notice-title"><div className="db-panel-head"><div><p className="db-kicker">THÔNG TIN ĐƠN VỊ</p><h2 id="db-notice-title">Thông báo mới</h2></div><span className="db-icon-soft"><Icon name="bell" /></span></div>{visibleCalendarEvents.length ? <div className="db-calendar-notices">{visibleCalendarEvents.map((event) => <article className="db-calendar-notice" key={event.id}><span className="db-calendar-notice-icon"><Icon name="calendar" size={17} /></span><div><strong>{event.title}</strong><time>{calendarLabel(event.startsAt)}{event.location ? ` · ${event.location}` : ''}</time>{event.notes && <small>{event.notes}</small>}<small>{event.sharedReadOnly ? `Chia sẻ bởi ${event.ownerName || event.ownerEmail || 'tài khoản nội bộ'}` : 'Lịch của tôi'}</small></div></article>)}</div> : <div className="db-empty db-notice-empty"><Icon name="bell" size={28} /><strong>Chưa có lịch cần làm</strong><p>Lịch làm việc được tạo hoặc chia sẻ sẽ hiển thị tại đây cho tài khoản có quyền xem.</p></div>}<div className="db-calendar-card"><div className="db-icon-tile"><Icon name="calendar" /></div><div><strong>Lịch làm việc tuần</strong><p>Xem, tạo và chia sẻ lịch làm việc.</p><a href="/lich-lam-viec" className="db-text-link">Mở lịch làm việc <Icon name="external" size={13} /></a></div></div></section>
        </div>

        <section className="db-panel db-chat-panel" id="db-chat" aria-labelledby="db-chat-title">
          <div className="db-panel-head"><div><p className="db-kicker">TRAO ĐỔI NỘI BỘ</p><h2 id="db-chat-title">Chat chung của đơn vị</h2></div><span className="db-chat-private"><Icon name="shield" size={14} /> Chỉ tài khoản đã duyệt</span></div>
          {chatState === 'loading' && <div className="db-chat-empty" role="status"><Icon name="chat" size={26} /><p>Đang tải cuộc trò chuyện…</p></div>}
          {chatState === 'error' && <div className="db-chat-empty" role="alert"><Icon name="help" size={26} /><strong>Chưa kết nối được khung chat</strong><p>Vui lòng thử lại sau hoặc liên hệ quản trị viên.</p></div>}
          {chatState === 'ready' && <>
            <div className="db-chat-log" aria-live="polite">{chatMessages.length ? chatMessages.slice(-30).map((item) => <article className={`db-chat-message ${item.userEmail === user?.email ? 'is-own' : ''}`} key={item.id}><div className="db-chat-avatar">{(item.userName || 'ND').split(' ').filter(Boolean).slice(-2).map((value) => value[0]).join('').toUpperCase()}</div><div><div className="db-chat-meta"><strong>{item.userName}</strong><time>{new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.createdAt))}</time></div><p>{item.message}</p></div></article>) : <div className="db-chat-empty"><Icon name="chat" size={26} /><strong>Chưa có tin nhắn</strong><p>Hãy gửi lời chào hoặc trao đổi công việc đầu tiên.</p></div>}</div>
            <form className="db-chat-form" onSubmit={sendChat}><label htmlFor="db-chat-input" className="db-sr-only">Nội dung tin nhắn</label><textarea id="db-chat-input" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} maxLength={1000} rows={2} placeholder={preview ? 'Bản minh họa không gửi dữ liệu.' : 'Viết tin nhắn cho mọi người…'} disabled={preview || chatSending} /><div><small>{chatDraft.length}/1000</small><button type="submit" disabled={preview || chatSending || !chatDraft.trim()}><Icon name="chat" size={15} /> {chatSending ? 'Đang gửi…' : 'Gửi tin nhắn'}</button></div></form>
          </>}
        </section>

        <section className="db-directory-section" id="db-directories"><PanelHeading label="KẾT NỐI NGHIỆP VỤ" title="Danh bạ phối hợp"><span className="db-muted-note"><Icon name="shield" size={14} /> Chỉ dùng nội bộ</span></PanelHeading><div className="db-directory-grid">{directories.map((item) => <a href={item.href} className="db-directory-card" key={item.title}><span className="db-icon-tile"><Icon name={item.icon} size={22} /></span><div><h3>{item.title}</h3><p>{item.description}</p><small>Chờ danh sách chính thức</small></div><Icon name="arrow" size={17} /></a>)}</div></section>

        <section className="db-panel db-forms-panel" id="db-forms"><PanelHeading label="TÀI NGUYÊN DÙNG CHUNG" title="Hệ thống biểu mẫu"><a href="/bieu-mau" className="db-text-link">Mở thư viện <Icon name="arrow" size={16} /></a></PanelHeading><div className="db-form-groups">{templateGroups.map((item) => <a href="/bieu-mau" key={item.title}><Icon name={item.icon} /><div><strong>{item.title}</strong><small>{item.description}</small></div><Icon name="arrow" size={15} /></a>)}</div><p className="db-form-note">Danh mục hiện là minh họa. File Word, Excel và PDF sẽ bổ sung khi đơn vị cung cấp.</p></section>

        <section className="db-panel db-apps-panel" id="db-apps"><details open={appsExpanded} onToggle={(event) => setAppsExpanded(event.currentTarget.open)}><summary><span className="db-apps-title"><span className="db-icon-tile"><Icon name="apps" /></span><span><strong>Ứng dụng dùng chung</strong><small>{modules.length} ứng dụng nghiệp vụ, điều hành và chuyển đổi số</small></span></span><span className="db-apps-expand">{appsExpanded ? 'Thu gọn' : 'Xem tất cả'}<span className="db-chevron">⌄</span></span></summary><div className="db-apps-body"><div className="db-apps-tools"><label className="db-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm ứng dụng, nhập không dấu…" aria-label="Tìm ứng dụng dùng chung" /></label><div className="db-filter-tags" role="group" aria-label="Lọc nhóm ứng dụng">{tags.map((item) => <button key={item} aria-pressed={tag === item} className={tag === item ? 'is-active' : ''} onClick={() => setTag(item)}>{item}</button>)}</div></div><div className="db-app-grid">{filteredModules.map((item) => <a href={item.href} target="_blank" rel="noopener noreferrer" key={item.title}><div><span>{item.tag}</span><h3>{item.title}</h3><p>{item.description}</p></div><Icon name="external" size={15} /></a>)}</div>{!filteredModules.length && <p className="db-search-empty" role="status">Không tìm thấy ứng dụng phù hợp. Thử tên hoặc nhóm khác.</p>}</div></details></section>

        <section className="db-support" id="db-support"><div><Icon name="help" size={22} /><div><strong>Hỗ trợ vận hành hệ thống</strong><span>Thứ Hai – Thứ Sáu · 07:30 – 17:00</span></div></div><a href="tel:0913742969">0913 742 969 <Icon name="arrow" size={15} /></a></section>
      </main>
    </div>

    <footer className="db-footer"><div><strong>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</strong><span>Hệ thống phần mềm nội bộ</span></div><div className="db-visit-stats"><span><Icon name="apps" size={13} /> Tổng lượt truy cập <strong>{visitStats ? visitStats.totalVisits.toLocaleString('vi-VN') : '—'}</strong></span><span>Hôm nay <strong>{visitStats ? visitStats.todayVisits.toLocaleString('vi-VN') : '—'}</strong></span></div><p>Phần mềm được thiết kế bởi <strong>Hoàng Vững</strong><span>Bản quyền: Hoàng Vững · © {now.getFullYear()}</span></p></footer>
  </div>;
}
