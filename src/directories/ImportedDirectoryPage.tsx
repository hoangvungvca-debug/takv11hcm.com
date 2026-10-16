import { useEffect, useMemo, useState } from 'react';
import { filterDirectory, isNeighborhoodLeader, sortedDirectoryOptions } from './directory-utils';
import type { Contact, DirectoryFilters } from './directory-utils';
import './directories.css';

export default function ImportedDirectoryPage({ category }: { category: 'jurors' | 'neighborhoods' }) {
  const jurors = category === 'jurors';
  const title = jurors ? 'Hội thẩm nhân dân' : 'Danh sách khu phố trưởng';
  const initialFilters: DirectoryFilters = { query: '', ward: '', neighborhood: '', role: jurors ? 'all' : 'leaders' };
  const [entries, setEntries] = useState<Contact[]>([]);
  const [filters, setFilters] = useState<DirectoryFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/directories/${category}`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) { window.location.replace('/dang-nhap'); return; }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không thể tải danh bạ.');
        setEntries(data.entries || []);
      }).catch((failure) => { if (failure.name !== 'AbortError') setError(failure.message || 'Không kết nối được máy chủ.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, reload]);
  const filtered = useMemo(() => filterDirectory(entries, filters, jurors), [entries, filters, jurors]);
  const wards = useMemo(() => sortedDirectoryOptions(entries.map((entry) => entry.ward)), [entries]);
  const neighborhoods = useMemo(() => sortedDirectoryOptions(entries.filter((entry) => !filters.ward || entry.ward === filters.ward).map((entry) => entry.neighborhood)), [entries, filters.ward]);
  const leaderCount = entries.filter(isNeighborhoodLeader).length;
  const change = (key: keyof DirectoryFilters, value: string) => setFilters((current) => ({ ...current, [key]: value, ...(key === 'ward' ? { neighborhood: '' } : {}) }));
  const hasFilters = Boolean(filters.query || filters.ward || filters.neighborhood || filters.role !== initialFilters.role);
  const phoneCell = (entry: Contact) => <>
    {entry.phones.length ? entry.phones.map((phone) => <a className="imported-phone" href={`tel:${phone}`} key={phone}>{phone}</a>) : <span className="imported-phone">{entry.phone || 'Chưa ghi trong nguồn'}</span>}
    {entry.needsReview && <small className="contact-review">Cần đối chiếu nguồn</small>}
  </>;
  return <div className="internal-shell directory-shell imported-directory">
    <header className="internal-header"><div><p className="eyebrow">HỆ THỐNG PHẦN MỀM TAND</p><h1>{title}</h1><span>TAND KHU VỰC 11 - TP HỒ CHÍ MINH</span></div><div className="internal-user">Danh bạ nội bộ<a href="/">← Trang chủ</a></div></header>
    <main className="directory-main">
      <div className="directory-hero"><div className="directory-icon">{jurors ? '♙' : '⌖'}</div><div><p className="eyebrow">{jurors ? 'NHIỆM KỲ 2026–2031' : 'DANH BẠ PHỐI HỢP ĐỊA PHƯƠNG'}</p><h2>{title}</h2><p>{jurors ? 'Danh sách đầy đủ theo thứ tự của tài liệu đã cung cấp.' : 'Sắp xếp theo phường và số khu phố, đối chiếu khu phố cũ–mới theo tài liệu nguồn.'}</p></div><span className="secure-badge">● Nội bộ</span></div>
      <div className="data-note"><strong>Dữ liệu đã nhập</strong><span>Chỉ tài khoản đã được duyệt mới xem được. Số điện thoại thiếu hoặc bất thường được giữ theo nguồn và đánh dấu cần đối chiếu.</span></div>
      {!jurors && <div className="directory-role-tabs" aria-label="Nhóm chức danh">
        {[['leaders', `Trưởng khu phố (${leaderCount})`], ['groups', 'Tổ trưởng dân cư'], ['other', 'Bí thư / Mặt trận'], ['all', `Toàn bộ (${entries.length})`]].map(([value, label]) => <button type="button" key={value} className={filters.role === value ? 'active' : ''} aria-pressed={filters.role === value} onClick={() => change('role', value)}>{label}</button>)}
      </div>}
      <form className="directory-toolbar imported-toolbar" role="search" onSubmit={(event) => { event.preventDefault(); }}>
        <label className="directory-search"><span aria-hidden="true">⌕</span><input type="search" value={filters.query} onChange={(event) => change('query', event.target.value)} placeholder={jurors ? 'Tìm tên, điện thoại, chuyên môn…' : 'Tìm tên, điện thoại, khu phố…'} aria-label="Tìm kiếm danh bạ" /></label>
        <select aria-label="Lọc phường hoặc khu vực" value={filters.ward} onChange={(event) => change('ward', event.target.value)}><option value="">Tất cả phường / khu vực</option>{wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}</select>
        {!jurors && <select aria-label="Lọc khu phố" value={filters.neighborhood} onChange={(event) => change('neighborhood', event.target.value)}><option value="">Tất cả khu phố</option>{neighborhoods.map((item) => <option key={item} value={item}>{item}</option>)}</select>}
        <button type="submit" className="directory-find-button">Tìm kiếm</button><button type="button" className="directory-clear-button" onClick={() => setFilters({ ...initialFilters })} disabled={!hasFilters}>Xóa lọc</button>
        <span className="result-count" aria-live="polite">{filtered.length}/{entries.length} liên hệ</span>
      </form>
      {loading && <p className="empty" role="status">Đang tải danh bạ…</p>}
      {error && <div className="directory-error" role="alert">{error}<button onClick={() => setReload((value) => value + 1)}>Thử lại</button></div>}
      {!loading && !error && <div className="directory-table-wrap"><table className={`directory-table ${jurors ? 'juror-table' : 'neighborhood-table'}`}>
        <caption className="directory-caption">{jurors ? 'HỘI THẨM NHÂN DÂN — NHIỆM KỲ 2026–2031' : 'DANH BẠ KHU PHỐ — PHƯỚC THẮNG, RẠCH DỪA, TAM THẮNG, VŨNG TÀU'}</caption>
        <thead><tr>{jurors ? <><th>STT</th><th>Họ và tên</th><th>Ngày sinh</th><th>Nơi ở hiện nay</th><th>Chuyên môn, nghiệp vụ</th><th>Nghề nghiệp, chức vụ</th><th>Số điện thoại</th></> : <><th>Phường / khu phố</th><th>Họ và tên</th><th>Chức danh</th><th>Ngày / năm sinh</th><th>Địa chỉ</th><th>Số điện thoại</th><th>Ghi chú / địa bàn</th></>}</tr></thead>
        <tbody>{filtered.map((entry) => <tr key={entry.id}>{jurors ? <><td>{entry.sourceOrder}</td><td><strong>{entry.name || 'Chưa ghi trong nguồn'}</strong></td><td>{entry.birthDate || '—'}</td><td>{entry.address || '—'}</td><td>{entry.qualification || '—'}</td><td>{entry.occupation || '—'}</td><td>{phoneCell(entry)}</td></> : <><td><strong>{entry.ward}</strong><span className="contact-area">{entry.neighborhood}</span></td><td><strong>{entry.name || 'Chưa ghi trong nguồn'}</strong></td><td>{entry.detail || '—'}</td><td>{entry.birthDate || '—'}</td><td>{entry.address || '—'}</td><td>{phoneCell(entry)}</td><td><span className="contact-note">{entry.note || '—'}</span></td></>}</tr>)}</tbody>
      </table>{!filtered.length && <p className="empty">Không tìm thấy liên hệ phù hợp. Hãy đổi điều kiện hoặc xóa lọc.</p>}</div>}
      <p className="directory-source-note">Nguồn: tài liệu do quản trị viên cung cấp. {jurors ? 'Hiển thị toàn bộ danh sách, không chia trang.' : 'Tab Trưởng khu phố hiển thị danh sách chính; các chức danh khác được giữ ở tab tương ứng.'}</p>
    </main>
  </div>;
}
