import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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
  const [viewer, setViewer] = useState<MediaItem | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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

  const upload = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) return setNotice('Vui lòng chọn một ảnh hoặc video.');
    setLoading(true); setNotice('');
    const body = new FormData(); body.append('file', file);
    try {
      const response = await fetch('/api/media-library', { method: 'POST', credentials: 'include', body });
      const data = await response.json();
      if (!response.ok) return setNotice(data.error || 'Không thể tải tệp lên.');
      setNotice('Đã tải tệp lên kho chung.'); setFile(null);
      const input = document.getElementById('media-file-input') as HTMLInputElement | null;
      if (input) input.value = '';
      load();
    } catch { setNotice('Không kết nối được máy chủ.'); }
    finally { setLoading(false); }
  };

  const closeViewer = () => { setViewer(null); setEditMode(false); setZoom(1); setRotation(0); };
  const openViewer = (item: MediaItem, editing = false) => { setViewer(item); setEditMode(editing && item.contentType.startsWith('image/')); setZoom(1); setRotation(0); };
  const owns = (item: MediaItem) => Boolean(user && item.ownerEmail && item.ownerEmail.toLowerCase() === user.email.toLowerCase());

  const saveEditedImage = async () => {
    if (!viewer || !viewer.contentType.startsWith('image/')) return;
    setSavingEdit(true); setNotice('');
    try {
      const response = await fetch(`/api/media-library/${viewer.id}/file`, { credentials: 'include' });
      if (!response.ok) throw new Error('Không đọc được ảnh gốc.');
      const blob = await response.blob(); const sourceUrl = URL.createObjectURL(blob);
      const image = new Image();
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Không thể mở ảnh.')); image.src = sourceUrl; });
      const scale = Math.max(1, Math.min(2, zoom)); const quarterTurn = Math.abs(rotation % 180) === 90;
      const canvas = document.createElement('canvas'); canvas.width = Math.round((quarterTurn ? image.naturalHeight : image.naturalWidth) * scale); canvas.height = Math.round((quarterTurn ? image.naturalWidth : image.naturalHeight) * scale);
      const context = canvas.getContext('2d'); if (!context) throw new Error('Trình duyệt không hỗ trợ chỉnh sửa ảnh.');
      context.translate(canvas.width / 2, canvas.height / 2); context.rotate(rotation * Math.PI / 180); context.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale);
      URL.revokeObjectURL(sourceUrl);
      const dataUrl = canvas.toDataURL(viewer.contentType === 'image/png' ? 'image/png' : 'image/jpeg', 0.9);
      const saveResponse = await fetch(`/api/media-library/${viewer.id}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl }) });
      const data = await saveResponse.json(); if (!saveResponse.ok) throw new Error(data.error || 'Không thể lưu ảnh đã chỉnh sửa.');
      setNotice('Đã lưu ảnh sau khi chỉnh sửa.'); closeViewer(); load();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể chỉnh sửa ảnh.'); }
    finally { setSavingEdit(false); }
  };

  const remove = async (item: MediaItem) => {
    if (!owns(item)) return setNotice('Chỉ người tải tệp lên mới có quyền xóa hoặc chỉnh sửa tệp này.');
    if (!window.confirm(`Xóa tệp “${item.filename}” khỏi kho chung?`)) return;
    const response = await fetch(`/api/media-library/${item.id}`, { method: 'DELETE', credentials: 'include' });
    setNotice(response.ok ? 'Đã xóa tệp khỏi kho chung.' : 'Không thể xóa tệp.');
    if (response.ok) { if (viewer?.id === item.id) closeViewer(); load(); }
  };

  if (user === undefined) return <div className="login-shell"><div className="login-card"><p>Đang kiểm tra phiên đăng nhập...</p></div></div>;
  if (!user) return <div className="login-shell"><div className="login-card"><p>Bạn cần đăng nhập để mở Thư viện ảnh.</p><a className="admin-back" href="/dang-nhap">Đăng nhập</a></div></div>;

  return <div className="internal-shell media-shell"><header className="internal-header"><div><p className="eyebrow">HỆ THỐNG PHẦN MỀM TAND</p><h1>Thư viện ảnh</h1><span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div><div className="internal-user">{user.name || user.email}<a href="/">Trang chủ</a></div></header><main className="media-main"><div className="media-heading"><div><p className="eyebrow">LƯU TRỮ NỘI BỘ</p><h2>Thư viện ảnh & video</h2><p>Kho ảnh/video dùng chung nội bộ cho tất cả tài khoản đã được duyệt.</p></div><span className="secure-badge">● Kho chung nội bộ</span></div><form className="media-upload-card" onSubmit={upload}><div><h3>Tải ảnh hoặc video lên</h3><p>Định dạng ảnh/video, tối đa 40MB mỗi tệp.</p></div><label className="media-file-picker"><span>{file ? file.name : 'Chọn tệp ảnh hoặc video'}</span><input id="media-file-input" type="file" accept="image/*,video/*" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label><button className="primary-button" type="submit" disabled={loading || !file}>{loading ? 'Đang tải lên…' : 'Tải lên thư viện'}</button></form>{notice && <p className="form-notice media-notice">{notice}</p>}<section className="media-list-card"><div className="media-list-head"><div><h3>Kho ảnh chung</h3><p>Mọi tài khoản đã được duyệt đều có thể xem và tải tệp lên kho chung; chỉ người tải lên mới được chỉnh sửa hoặc xóa.</p></div><strong>{items.length} tệp</strong></div>{items.length === 0 ? <div className="media-empty">Chưa có ảnh hoặc video nào. Hãy tải tệp đầu tiên lên.</div> : <div className="media-grid">{items.map((item) => { const url = `/api/media-library/${item.id}/file`; return <article className="media-card" key={item.id}><div className="media-preview">{item.contentType.startsWith('video/') ? <video src={url} controls preload="metadata" /> : <img src={url} alt={item.filename} loading="lazy" onClick={() => openViewer(item)} />}</div><div className="media-card-body"><strong title={item.filename}>{item.filename}</strong><small>Tải bởi {item.ownerEmail || 'tài khoản nội bộ'} · {formatSize(item.size)} · {formatDate(item.createdAt)}</small></div></article>; })}</div>}</section></main>{viewer && <div className="media-lightbox" role="dialog" aria-modal="true" onClick={closeViewer}><div className="media-lightbox-panel" onClick={(event) => event.stopPropagation()}><div className="media-lightbox-toolbar"><strong>{editMode ? 'Chỉnh sửa ảnh' : 'Xem tệp'}</strong><div><button type="button" onClick={() => setZoom(value => Math.max(.5, Number((value - .25).toFixed(2))))}>−</button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom(value => Math.min(3, Number((value + .25).toFixed(2))))}>+</button>{viewer.contentType.startsWith('image/') && owns(viewer) && <button type="button" onClick={() => setRotation(value => value + 90)}>Xoay</button>}{viewer.contentType.startsWith('image/') && owns(viewer) && <button type="button" onClick={() => setEditMode(value => !value)}>{editMode ? 'Xem trước' : 'Chỉnh sửa'}</button>}<a className="media-download" href={`/api/media-library/${viewer.id}/file?download=1`} download={viewer.filename}>Tải xuống</a>{owns(viewer) && <button type="button" onClick={() => remove(viewer)}>Xóa</button>}<button type="button" className="media-close" onClick={closeViewer}>Đóng</button></div></div><div className="media-lightbox-stage">{viewer.contentType.startsWith('video/') ? <video src={`/api/media-library/${viewer.id}/file`} controls autoPlay className="media-lightbox-video" /> : <img src={`/api/media-library/${viewer.id}/file`} alt={viewer.filename} style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }} className="media-lightbox-image" />}</div>{editMode && viewer.contentType.startsWith('image/') && <div className="media-edit-note">Chỉnh sửa nhanh: phóng to/thu nhỏ và xoay ảnh, sau đó bấm “Lưu chỉnh sửa”.</div>}{editMode && viewer.contentType.startsWith('image/') && <div className="media-save-bar"><button className="primary-button" type="button" onClick={saveEditedImage} disabled={savingEdit}>{savingEdit ? 'Đang lưu…' : 'Lưu chỉnh sửa'}</button><button type="button" onClick={() => { setZoom(1); setRotation(0); }}>Đặt lại</button></div>}</div></div>}</div>;
}
