import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import './account-admin.css';

type Account = {
  openId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  deletedAt?: string | null;
  previousStatus?: string | null;
};
type Action = 'approve' | 'reject' | 'edit' | 'delete' | 'restore';
type Tab = 'pending' | 'active' | 'other' | 'deleted';
type Selection = { account: Account; action: Action };
const statuses: Record<string, string> = {
  pending: 'Chờ phê duyệt', approved: 'Đã phê duyệt', admin: 'Đang hoạt động',
  rejected: 'Đã từ chối', disabled: 'Đã vô hiệu hóa', deleted: 'Trong thùng rác',
};
const actions: Record<Action, string> = {
  approve: 'Phê duyệt', reject: 'Từ chối', edit: 'Sửa tài khoản',
  delete: 'Xóa tài khoản', restore: 'Khôi phục tài khoản',
};
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const dateLabel = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short',
  }).format(date);
};
const belongs = (account: Account, tab: Tab) => tab === 'active'
  ? ['approved', 'admin'].includes(account.status)
  : tab === 'other' ? !['pending', 'approved', 'admin', 'deleted'].includes(account.status)
    : account.status === tab;

export default function AccountAdminPage() {
  const [me, setMe] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');
  const [tab, setTab] = useState<Tab>('pending');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Selection | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [modalError, setModalError] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  const fetchAccounts = async () => {
    const response = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Không thể tải danh sách tài khoản.');
    setAccounts(data.users || []);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
        if (!response.ok) throw new Error('Chưa kiểm tra được phiên đăng nhập.');
        const data = await response.json();
        if (!active) return;
        setMe(data.user || null);
        if (!data.user?.isAdmin) { setState('denied'); return; }
        const listing = await fetch('/api/admin/users', { credentials: 'include', cache: 'no-store' });
        const result = await listing.json();
        if (!listing.ok) throw new Error(result.error || 'Không thể tải danh sách tài khoản.');
        if (active) { setAccounts(result.users || []); setState('ready'); }
      } catch (cause) {
        if (active) { setError(cause instanceof Error ? cause.message : 'Lỗi kết nối máy chủ.'); setState('error'); }
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selected]);

  const openAction = (account: Account, action: Action) => {
    setSelected({ account, action });
    setEditName(account.name);
    setEditEmail(account.email);
    setModalError('');
  };
  const close = () => { if (!busy) { dialog.current?.close(); setSelected(null); } };
  const refresh = async () => {
    setRefreshing(true); setError('');
    try { await fetchAccounts(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải lại danh sách.'); }
    finally { setRefreshing(false); }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true); setModalError(''); setNotice(''); setError('');
    const { account, action } = selected;
    try {
      const payload = action === 'edit'
        ? { action, name: editName.trim(), email: editEmail.trim().toLowerCase() }
        : { action };
      const response = await fetch(`/api/admin/users/${encodeURIComponent(account.openId)}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không thể thực hiện thao tác.');
      setNotice(result.message || `Đã ${actions[action].toLowerCase()}: ${account.email}.`);
      dialog.current?.close(); setSelected(null);
      if (action === 'edit' && account.openId === me?.openId
          && editEmail.trim().toLowerCase() !== account.email.toLowerCase()) {
        setNotice('Email đã được cập nhật. Vui lòng đăng nhập lại bằng email mới.');
        setMe(null); setState('denied');
      } else {
        try { await fetchAccounts(); }
        catch { setError('Thao tác đã được lưu nhưng chưa tải lại được danh sách. Bấm Tải lại để cập nhật.'); }
      }
    } catch (cause) {
      setModalError(cause instanceof Error ? cause.message : 'Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally { setBusy(false); }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'pending', label: 'Chờ phê duyệt' }, { key: 'active', label: 'Đang hoạt động' },
    { key: 'other', label: 'Tài khoản khác' }, { key: 'deleted', label: 'Thùng rác' },
  ];
  const visible = useMemo(() => accounts.filter((account) => belongs(account, tab)
    && normalize(`${account.name} ${account.email}`).includes(normalize(query.trim()))), [accounts, tab, query]);
  const targetStatus = selected?.account.previousStatus;
  const restoredStatus = targetStatus && ['pending', 'approved', 'admin', 'rejected', 'disabled'].includes(targetStatus)
    ? targetStatus : 'pending';

  return <div className="internal-shell account-admin">
    <header className="internal-header">
      <div><p className="eyebrow">QUẢN TRỊ HỆ THỐNG</p><h1>Quản lý tài khoản</h1>
        <span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div>
      <div className="internal-user">{me?.name || 'Khu vực quản trị'}<a href="/">← Trang chủ</a></div>
    </header>
    <main className="ledger-main">
      {state === 'loading' && <div className="aa-state" role="status">Đang kiểm tra quyền quản trị và tải tài khoản…</div>}
      {state === 'error' && <div className="aa-state" role="alert"><h2>Chưa kết nối được khu vực quản trị</h2><p>{error}</p>
        <button className="aa-button" onClick={() => window.location.reload()}>Thử lại</button></div>}
      {state === 'denied' && <div className="aa-state"><h2>Cần quyền quản trị</h2>
        {notice && <p role="status">{notice}</p>}
        <p>Chỉ quản trị viên đã được phê duyệt mới được quản lý tài khoản.</p>
        <a className="aa-button" href="/dang-nhap">Đăng nhập</a> <a href="/">Quay về trang chủ</a></div>}
      {state === 'ready' && <>
        <section className="aa-intro"><div><p className="eyebrow">TÀI KHOẢN NỘI BỘ</p>
          <h2>Phê duyệt và quản lý người dùng</h2>
          <p>Sửa thông tin, chuyển tài khoản vào thùng rác và khôi phục khi cần.</p></div>
          <button className="aa-button aa-secondary" onClick={refresh} disabled={refreshing || busy}>
            {refreshing ? 'Đang tải…' : 'Tải lại danh sách'}</button></section>
        <div className="aa-hint"><strong>Xóa có thể khôi phục.</strong> Tài khoản bị xóa không thể đăng nhập.
          Dữ liệu công văn và tin nhắn vẫn được giữ nguyên. Khôi phục không tự phê duyệt tài khoản đang chờ.</div>
        {notice && <p className="aa-notice" role="status">{notice}</p>}
        {error && <p className="aa-error" role="alert">{error}</p>}
        <nav className="aa-tabs" aria-label="Lọc trạng thái tài khoản">
          {tabs.map((item) => <button key={item.key} className={tab === item.key ? 'is-active' : ''}
            aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>
            {item.label}<span>{accounts.filter((account) => belongs(account, item.key)).length}</span></button>)}
        </nav>
        <section className="ledger-table-wrap">
          <div className="aa-toolbar"><label>Tìm tài khoản<input value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo họ tên hoặc email…" /></label><span>{visible.length} tài khoản</span></div>
          <div className="ledger-table-scroll"><table>
            <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th>
              <th>{tab === 'deleted' ? 'Ngày xóa' : 'Ngày đăng ký'}</th><th>Thao tác</th></tr></thead>
            <tbody>{visible.map((account) => {
              const protectedAccount = account.isOwner || account.openId === me?.openId;
              return <tr key={account.openId}>
                <td><strong>{account.name}</strong>{account.isOwner && <small className="aa-owner">Chủ hệ thống</small>}</td>
                <td>{account.email}</td><td>{account.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}</td>
                <td><span className={`aa-status aa-status-${account.status}`}>{statuses[account.status] || account.status}</span>
                  {account.status === 'deleted' && <small className="aa-owner">Trước khi xóa: {statuses[account.previousStatus || 'pending'] || 'Chờ phê duyệt'}</small>}</td>
                <td>{dateLabel(tab === 'deleted' ? account.deletedAt : account.createdAt)}</td>
                <td><div className="aa-row-actions">
                  {account.status === 'deleted'
                    ? <button className="aa-button" onClick={() => openAction(account, 'restore')} disabled={busy || account.isOwner}>Khôi phục</button>
                    : <>
                      {['pending', 'rejected', 'disabled'].includes(account.status) && <button className="aa-button" onClick={() => openAction(account, 'approve')} disabled={busy}>Phê duyệt</button>}
                      <button className="aa-button aa-secondary" onClick={() => openAction(account, 'edit')} disabled={busy}>Sửa</button>
                      {account.status === 'pending' && <button className="aa-button aa-secondary" onClick={() => openAction(account, 'reject')} disabled={busy || protectedAccount}>Từ chối</button>}
                      <button className="aa-button aa-danger" onClick={() => openAction(account, 'delete')} disabled={busy || protectedAccount}
                        title={protectedAccount ? 'Không xóa chính mình hoặc chủ hệ thống' : 'Chuyển vào thùng rác'}>Xóa</button>
                    </>}
                </div></td>
              </tr>;
            })}</tbody>
          </table></div>
          {visible.length === 0 && <div className="aa-empty">{query ? 'Không tìm thấy tài khoản phù hợp trong nhóm này.'
            : tab === 'deleted' ? 'Thùng rác chưa có tài khoản.' : 'Chưa có tài khoản trong nhóm này.'}</div>}
        </section>
      </>}
    </main>
    {selected && <dialog ref={dialog} className="aa-dialog" onCancel={(event) => { event.preventDefault(); close(); }}>
      <form onSubmit={submit}>
        <header><h2>{actions[selected.action]}</h2><button type="button" className="aa-close" onClick={close}
          disabled={busy} aria-label="Đóng hộp thoại">×</button></header>
        <div className="aa-target"><strong>{selected.account.name}</strong><span>{selected.account.email}</span></div>
        {selected.action === 'edit' ? <>
          <label>Họ và tên<input value={editName} onChange={(event) => setEditName(event.target.value)} required maxLength={255} autoFocus /></label>
          <label>Email<input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} required
            maxLength={255} readOnly={selected.account.isOwner} /></label>
          <p className="aa-modal-note">{selected.account.isOwner ? 'Email của chủ hệ thống được giữ cố định.'
            : 'Đổi email không đổi mật khẩu hoặc vai trò. Các phiên cũ sẽ hết hiệu lực; người dùng phải đăng nhập lại bằng email mới.'}</p>
        </> : <p className="aa-modal-note">
          {selected.action === 'delete' && 'Tài khoản sẽ được chuyển vào thùng rác và mọi phiên hiện tại hết hiệu lực. Không xóa công văn hoặc tin nhắn. Có thể khôi phục sau.'}
          {selected.action === 'restore' && `Khôi phục về trạng thái “${statuses[restoredStatus]}”. Người dùng phải đăng nhập lại; phiên trước khi xóa không được sử dụng lại.`}
          {selected.action === 'approve' && 'Tài khoản sẽ được quyền đăng nhập và truy cập các chức năng nội bộ của hệ thống.'}
          {selected.action === 'reject' && 'Tài khoản không được đăng nhập. Bạn có thể phê duyệt lại trong tab Tài khoản khác.'}
        </p>}
        {modalError && <p className="aa-error" role="alert">{modalError}</p>}
        <footer><button className="aa-button aa-secondary" type="button" onClick={close} disabled={busy}>Hủy</button>
          <button className={`aa-button ${selected.action === 'delete' ? 'aa-danger' : ''}`} type="submit" disabled={busy}>
            {busy ? 'Đang lưu…' : selected.action === 'edit' ? 'Lưu thay đổi' : `Xác nhận ${actions[selected.action].toLowerCase()}`}
          </button></footer>
      </form>
    </dialog>}
  </div>;
}
