import { useEffect, useState } from 'react';
import './media.css';

type User = { email: string; name: string; status: string };
type MediaItem = { id: number; ownerEmail?: string; filename: string; contentType: string; size: number; createdAt: string };

const formatSize = (value: number) => value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;
const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

export default function MediaLibraryPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const response = await fetch('/api/media-library', { credentials: 'include', cache: 'no-store' });
    if (response.ok) setItems((await response.json()).items || []);
    else setNotice('Không tải được thư viện ảnh.');
  };

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' }).then((response) => response.json()).then((data) => {
      setUser(data.user || null);
      if (data.authenticated) load();
    }).catch(() => setUser(null));
  }, []);

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setNotice('Vui lòng chọn một ảnh hoặc video.');
    setLoading(true); setNotice('');
    const body = new FormData(); body.append('file', file);
    try {
      const response = await fetch('/api/media-library', { method: 'POST', credentials: 'include', body });
      const data = await response.json();
      if (!response.ok) return setNotice(data.error || 'Không thể tải tệp lên.');
      setNotice('Đã tải tệp lên thư viện.'); setFile(null);
      const input = document.getElementById('media-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      load();
    } catch { setNotice('Không kết nối được máy chủ.'); }
    finally { setLoading(false); }
  };

  const remove = async (item: MediaItem) => {
    if (!window.confirm(`Xóa tệp “${item.filename}” khỏi thư viện?`)) return;
    const response = await fetch(`/api/media-library/${item.id}`, { method: 'DELETE', credentials: 'include' });
    setNotice(response.ok ? 'Đã xóa tệp.' : 'Không thể xóa tệp.');
    if (response.ok) load();
  };

  if (user === undefined) return <div className="login-shell"><div className="login-card"><p>Đang kiểm tra phiên đăng nhập...</p></div></div>;
  if (!user) return <div className="login-shell"><div className="login-card"><p>Bạn cần đăng nhập để mở Thư viện ảnh.</p><a className="admin-back" href="/dang-nhap">Đăng nhập</a></div></div>;

  return <div className="internal-shell media-shell"><header className="internal-header"><div><p className="eyebrow">HỆ THỐNG PHẦN MỀM TAND</p><h1>Thư viện ảnh</h1><span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div><div className="internal-user">{user.name || user.email}<a href="/">Trang chủ</a></div></header><main className="media-main"><div className="media-heading"><div><p className="eyebrow">LƯU TRỮ NỘI BỘ</p><h2>Thư viện ảnh & video</h2><p>Kho ảnh/video dùng chung nội bộ cho tất cả tài khoản đã được duyệt.</p></div><span className="secure-badge">● Kho chung nội bộ</span></div><form className="media-upload-card" onSubmit={upload}><div><h3>Tải ảnh hoặc video lên</h3><p>Định dạng ảnh/video, tối đa 40MB mỗi tệp.</p></div><label className="media-file-picker"><span>{file ? file.name : 'Chọn tệp ảnh hoặc video'}</span><input id="media-file-input" type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><button className="primary-button" type="submit" disabled={loading || !file}>{loading ? 'Đang tải lên…' : 'Tải lên thư viện'}</button></form>{notice && <p className="form-notice media-notice">{notice}</p>}<section className="media-list-card"><div className="media-list-head"><div><h3>Kho ảnh chung</h3><p>Mọi tài khoản đã được duyệt đều có thể xem và tải tệp lên kho chung; chỉ người tải lên mới được xóa.</p></div><strong>{items.length} tệp</strong></div>{items.length === 0 ? <div className="media-empty">Chưa có ảnh hoặc video nào. Hãy tải tệp đầu tiên lên.</div> : <div className="media-grid">{items.map((item) => { const url = `/api/media-library/${item.id}/file`; return <article className="media-card" key={item.id}><div className="media-preview">{item.contentType.startsWith('video/') ? <video src={url} controls preload="metadata" /> : <img src={url} alt={item.filename} loading="lazy" />}</div><div className="media-card-body"><strong title={item.filename}>{item.filename}</strong><small>Tải bởi {item.ownerEmail || 'tài khoản nội bộ'} · {formatSize(item.size)} · {formatDate(item.createdAt)}</small><div className="media-actions"><a href={`${url}?download=1`} download={item.filename}>Tải xuống</a><button type="button" onClick={() => remove(item)}>Xóa</button></div></div></article>; })}</div>}</section></main></div>;
}
