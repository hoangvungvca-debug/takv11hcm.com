import { useEffect, useState } from 'react';

type PresenceStats = { onlineUsers: number; todayVisits: number; totalVisits: number };
let latestStats: PresenceStats | null = null;
const emit = (stats: PresenceStats | null) => {
  latestStats = stats;
  window.dispatchEvent(new CustomEvent('tand-presence', { detail: stats }));
};

export function SitePresenceTracker() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/dang-nhap')) return;
    let stopped = false;
    let busy = false;
    const heartbeat = async () => {
      if (document.visibilityState !== 'visible' || busy) return;
      busy = true;
      try {
        const response = await fetch('/api/presence', { method: 'POST', credentials: 'include', cache: 'no-store' });
        if (!response.ok) { if (!stopped) emit(null); return; }
        const data = await response.json();
        if (!stopped) emit({ onlineUsers: Number(data.onlineUsers), todayVisits: Number(data.todayVisits), totalVisits: Number(data.totalVisits) });
      } catch { if (!stopped) emit(null); }
      finally { busy = false; }
    };
    void heartbeat();
    const timer = window.setInterval(heartbeat, 60000);
    document.addEventListener('visibilitychange', heartbeat);
    return () => { stopped = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', heartbeat); };
  }, []);
  return null;
}

export function HomePresenceStats() {
  const [stats, setStats] = useState<PresenceStats | null>(latestStats);
  useEffect(() => {
    const update = (event: Event) => setStats((event as CustomEvent<PresenceStats | null>).detail);
    window.addEventListener('tand-presence', update);
    return () => window.removeEventListener('tand-presence', update);
  }, []);
  const number = (value: number | undefined) => value === undefined ? '—' : value.toLocaleString('vi-VN');
  return <div className="home-visit-stats" aria-live="polite" title="Online: tài khoản đã duyệt hoạt động trong 2 phút gần nhất; mỗi tài khoản tính một lần. Lượt truy cập: số lần mở trang chủ, không phải số người duy nhất.">
    <span><i aria-hidden="true" />Đang online: <strong>{number(stats?.onlineUsers)}</strong></span>
    <span>Lượt hôm nay: <strong>{number(stats?.todayVisits)}</strong></span>
    <span>Tổng lượt: <strong>{number(stats?.totalVisits)}</strong></span>
  </div>;
}

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const logout = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error();
      latestStats = null;
      window.location.replace('/dang-nhap');
    } catch { setError('Chưa đăng xuất được. Vui lòng thử lại.'); setBusy(false); }
  };
  return <div className="sidebar-logout"><button type="button" onClick={logout} disabled={busy}><span aria-hidden="true">↪</span>{busy ? 'Đang đăng xuất…' : 'Đăng xuất tài khoản'}</button>{error && <small role="alert">{error}</small>}</div>;
}
