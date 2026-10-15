import { useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type NewsItem = {
  category: string;
  date: string;
  title: string;
  summary: string;
  featured?: boolean;
};

type ScheduleItem = {
  date: string;
  time: string;
  room: string;
  code: string;
  title: string;
  type: string;
  status: string;
};

type IconName = 'search' | 'arrow' | 'calendar' | 'document' | 'book' | 'phone' | 'pin' | 'mail' | 'menu' | 'close' | 'download' | 'external' | 'chevron';

const news: NewsItem[] = [
  {
    category: 'Hoạt động',
    date: '14.10.2026',
    title: 'Tòa án nhân dân thành phố tổ chức Hội nghị triển khai nhiệm vụ quý IV',
    summary: 'Tập trung nâng cao chất lượng xét xử, đẩy mạnh cải cách tư pháp và phục vụ người dân.',
    featured: true,
  },
  {
    category: 'Cải cách tư pháp',
    date: '10.10.2026',
    title: 'Ra mắt khu vực hỗ trợ tra cứu thủ tục trực tuyến',
    summary: 'Các hướng dẫn được sắp xếp theo từng nhu cầu để người dân dễ tìm và chuẩn bị hồ sơ.',
  },
  {
    category: 'Phổ biến pháp luật',
    date: '06.10.2026',
    title: 'Chương trình tuyên truyền pháp luật học đường năm 2026',
    summary: 'Lan tỏa kiến thức pháp luật cơ bản và kỹ năng tiếp cận công lý cho học sinh, sinh viên.',
  },
];

const announcements = [
  { date: '12.10.2026', title: 'Thông báo về việc tiếp nhận hồ sơ tại bộ phận một cửa' },
  { date: '08.10.2026', title: 'Lịch làm việc và tiếp công dân tháng 10 năm 2026' },
  { date: '01.10.2026', title: 'Công khai danh mục thủ tục hành chính thuộc thẩm quyền' },
  { date: '26.09.2026', title: 'Hướng dẫn đăng ký nhận văn bản tố tụng qua đường bưu chính' },
];

const schedules: ScheduleItem[] = [
  { date: '20/10/2026', time: '08:00', room: 'Phòng xử 01', code: 'HS-2026-001', title: 'Phiên tòa hình sự sơ thẩm', type: 'Hình sự', status: 'Đã xếp lịch' },
  { date: '20/10/2026', time: '13:30', room: 'Phòng xử 03', code: 'DS-2026-017', title: 'Tranh chấp hợp đồng dân sự', type: 'Dân sự', status: 'Đã xếp lịch' },
  { date: '21/10/2026', time: '08:00', room: 'Phòng xử 02', code: 'HN-2026-008', title: 'Yêu cầu công nhận thuận tình ly hôn', type: 'Hôn nhân & gia đình', status: 'Đã xếp lịch' },
  { date: '22/10/2026', time: '08:00', room: 'Phòng xử 01', code: 'KD-2026-004', title: 'Tranh chấp nghĩa vụ thanh toán', type: 'Kinh doanh thương mại', status: 'Đã xếp lịch' },
  { date: '23/10/2026', time: '13:30', room: 'Phòng xử 04', code: 'HC-2026-003', title: 'Khiếu kiện quyết định hành chính', type: 'Hành chính', status: 'Đã xếp lịch' },
];

const procedures = [
  { icon: 'document' as IconName, number: '01', title: 'Nộp đơn khởi kiện', text: 'Điều kiện, thành phần hồ sơ và các bước nộp đơn tại Tòa án.' },
  { icon: 'book' as IconName, number: '02', title: 'Án phí và lệ phí', text: 'Mức thu, đối tượng được miễn giảm và cách thức nộp.' },
  { icon: 'calendar' as IconName, number: '03', title: 'Tham gia phiên tòa', text: 'Quyền, nghĩa vụ và những điều cần chuẩn bị trước ngày xét xử.' },
  { icon: 'phone' as IconName, number: '04', title: 'Tiếp công dân', text: 'Lịch tiếp, cách đăng ký và kênh gửi ý kiến, phản ánh.' },
];

const forms = [
  { type: 'Mẫu 01', title: 'Đơn khởi kiện', detail: 'Dùng trong vụ án dân sự, hôn nhân và gia đình, kinh doanh thương mại.' },
  { type: 'Mẫu 02', title: 'Đơn yêu cầu giải quyết việc dân sự', detail: 'Biểu mẫu tham khảo cho các yêu cầu thuộc thẩm quyền của Tòa án.' },
  { type: 'Mẫu 03', title: 'Đơn đề nghị sao chụp hồ sơ', detail: 'Dành cho đương sự, người đại diện hoặc người được ủy quyền hợp lệ.' },
];

function Icon({ name }: { name: IconName }) {
  const symbols: Record<IconName, string> = {
    search: '⌕', arrow: '↗', calendar: '□', document: '▤', book: '▥', phone: '◌', pin: '⌖', mail: '✉', menu: '☰', close: '×', download: '↓', external: '↗', chevron: '⌄',
  };
  return <span className={`icon icon-${name}`} aria-hidden="true">{symbols[name]}</span>;
}

function SectionHeading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {text && <p className="section-lead">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleType, setScheduleType] = useState('Tất cả lĩnh vực');
  const [selectedSession, setSelectedSession] = useState<ScheduleItem | null>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  const filteredSchedule = useMemo(() => scheduleType === 'Tất cả lĩnh vực' ? schedules : schedules.filter((item) => item.type === scheduleType), [scheduleType]);
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    const candidates = [
      ...news.map((item) => ({ kind: 'Tin tức', title: item.title, detail: item.summary, anchor: 'tin-tuc' })),
      ...announcements.map((item) => ({ kind: 'Thông báo', title: item.title, detail: item.date, anchor: 'thong-bao' })),
      ...procedures.map((item) => ({ kind: 'Thủ tục', title: item.title, detail: item.text, anchor: 'thu-tuc' })),
      ...forms.map((item) => ({ kind: 'Biểu mẫu', title: item.title, detail: item.detail, anchor: 'bieu-mau' })),
    ];
    return candidates.filter((item) => `${item.title} ${item.detail} ${item.kind}`.toLowerCase().includes(term));
  }, [searchTerm]);

  const downloadForm = (title: string) => {
    const content = `BẢN MẪU MINH HỌA\n\n${title}\n\nLưu ý: Đây là tệp minh họa cho giao diện, không phải biểu mẫu pháp lý chính thức. Vui lòng liên hệ Tòa án để được hướng dẫn bản hiện hành.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replaceAll(' ', '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="site-shell">
      <div className="topline">
        <div className="container top-line-inner">
          <span>TOÀ ÁN NHÂN DÂN THÀNH PHỐ MINH HỌA</span>
          <span className="topline-note">Công khai · Minh bạch · Vì công lý</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container header-inner">
          <button className="brand" onClick={() => scrollTo('trang-chu')} aria-label="Về trang chủ">
            <span className="seal"><img src="/court-seal.svg" alt="" /></span>
            <span className="brand-copy"><strong>CỔNG THÔNG TIN</strong><span>TÒA ÁN NHÂN DÂN</span></span>
          </button>
          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}><Icon name={menuOpen ? 'close' : 'menu'} /></button>
          <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Điều hướng chính">
            <button className="active" onClick={() => scrollTo('trang-chu')}>Trang chủ</button>
            <button onClick={() => scrollTo('tin-tuc')}>Tin tức</button>
            <button onClick={() => scrollTo('lich-xet-xu')}>Lịch xét xử</button>
            <button onClick={() => scrollTo('thu-tuc')}>Thủ tục</button>
            <button onClick={() => scrollTo('bieu-mau')}>Biểu mẫu</button>
            <button onClick={() => scrollTo('lien-he')}>Liên hệ</button>
          </nav>
          <button className="header-search" onClick={() => document.getElementById('global-search')?.focus()} aria-label="Tìm kiếm"><Icon name="search" /></button>
        </div>
      </header>

      <main>
        <section className="hero" id="trang-chu">
          <div className="hero-grid container">
            <div className="hero-copy">
              <p className="eyebrow light">CỔNG THÔNG TIN ĐIỆN TỬ</p>
              <h1>Công lý bắt đầu từ<br /><em>thông tin rõ ràng.</em></h1>
              <p className="hero-text">Tra cứu thông tin công khai, thủ tục hành chính và hướng dẫn cần thiết trong quá trình tiếp cận công lý.</p>
              <div className="hero-search">
                <Icon name="search" />
                <input id="global-search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Bạn đang tìm kiếm điều gì?" aria-label="Tìm kiếm nội dung" />
                <button onClick={() => document.getElementById('tim-kiem')?.scrollIntoView({ behavior: 'smooth' })}>Tìm kiếm</button>
              </div>
              <div className="hero-links"><button onClick={() => scrollTo('lich-xet-xu')}>Xem lịch xét xử <Icon name="arrow" /></button><button onClick={() => scrollTo('thu-tuc')}>Hướng dẫn thủ tục <Icon name="arrow" /></button></div>
            </div>
            <div className="hero-panel">
              <div className="hero-panel-top"><span className="panel-label">THÔNG TIN HÔM NAY</span><span className="panel-date">15.10.2026</span></div>
              <div className="hero-stat"><span>12</span><p>phiên tòa<br />dự kiến</p></div>
              <div className="hero-rule" />
              <div className="hero-stat small"><span>04</span><p>thông báo<br />mới cập nhật</p></div>
              <p className="hero-panel-foot">Dữ liệu đang hiển thị là dữ liệu minh họa.</p>
            </div>
          </div>
          <div className="hero-pattern" aria-hidden="true" />
        </section>

        <section className="notice-wrap container">
          <div className="notice-banner"><span className="notice-mark">!</span><div><strong>Lưu ý quan trọng</strong><p>Website đang sử dụng dữ liệu minh họa để trình bày giao diện. Không sử dụng thông tin tại đây để thay thế thông báo hoặc văn bản chính thức.</p></div><button onClick={() => scrollTo('lien-he')}>Liên hệ xác nhận <Icon name="arrow" /></button></div>
        </section>

        <section className="quick-links container" aria-label="Truy cập nhanh">
          <button onClick={() => scrollTo('lich-xet-xu')}><span className="quick-icon"><Icon name="calendar" /></span><span><strong>Lịch xét xử</strong><small>Tra cứu theo ngày</small></span><Icon name="arrow" /></button>
          <button onClick={() => scrollTo('thu-tuc')}><span className="quick-icon"><Icon name="document" /></span><span><strong>Thủ tục & hướng dẫn</strong><small>Chuẩn bị hồ sơ</small></span><Icon name="arrow" /></button>
          <button onClick={() => scrollTo('bieu-mau')}><span className="quick-icon"><Icon name="book" /></span><span><strong>Thư viện biểu mẫu</strong><small>Tải mẫu minh họa</small></span><Icon name="arrow" /></button>
          <button onClick={() => scrollTo('lien-he')}><span className="quick-icon"><Icon name="phone" /></span><span><strong>Tiếp công dân</strong><small>Kênh liên hệ</small></span><Icon name="arrow" /></button>
        </section>

        {searchTerm && <section className="search-results container" id="tim-kiem"><div className="search-results-head"><div><p className="eyebrow">KẾT QUẢ TRA CỨU</p><h2>{searchResults.length} kết quả cho “{searchTerm}”</h2></div><button className="text-button" onClick={() => setSearchTerm('')}>Xóa tìm kiếm ×</button></div>{searchResults.length > 0 ? <div className="result-list">{searchResults.map((result) => <button key={`${result.kind}-${result.title}`} onClick={() => scrollTo(result.anchor)}><span className="result-kind">{result.kind}</span><strong>{result.title}</strong><small>{result.detail}</small><Icon name="arrow" /></button>)}</div> : <div className="empty-state">Chưa tìm thấy nội dung phù hợp. Hãy thử từ khóa khác như “đơn”, “lịch” hoặc “thông báo”.</div>}</section>}

        <section className="section container news-section" id="tin-tuc">
          <SectionHeading eyebrow="CẬP NHẬT MỚI NHẤT" title="Tin tức & thông báo" text="Những thông tin được công khai để người dân chủ động theo dõi." action={<button className="outline-button">Xem tất cả <Icon name="arrow" /></button>} />
          <div className="news-grid">
            <article className="featured-news"><div className="featured-media"><span className="media-stamp">TAND</span><span className="media-caption">MINH BẠCH TRONG TỪNG BƯỚC</span></div><div className="news-body"><div className="meta"><span>{news[0].category}</span><time>{news[0].date}</time></div><h3>{news[0].title}</h3><p>{news[0].summary}</p><button className="read-more">Đọc tin <Icon name="arrow" /></button></div></article>
            <div className="news-list">{news.slice(1).map((item) => <article className="news-list-item" key={item.title}><div className="meta"><span>{item.category}</span><time>{item.date}</time></div><h3>{item.title}</h3><p>{item.summary}</p><button className="read-more">Đọc tin <Icon name="arrow" /></button></article>)}<div className="announcement-box" id="thong-bao"><div className="box-heading"><div><p className="eyebrow">MỚI CẬP NHẬT</p><h3>Thông báo công khai</h3></div><Icon name="external" /></div>{announcements.slice(0, 3).map((item) => <button className="announcement-item" key={item.title}><time>{item.date}</time><span>{item.title}</span><Icon name="arrow" /></button>)}</div></div>
          </div>
        </section>

        <section className="section schedule-section" id="lich-xet-xu">
          <div className="container"><SectionHeading eyebrow="CÔNG KHAI LỊCH LÀM VIỆC" title="Lịch xét xử" text="Tra cứu lịch xét xử minh họa theo lĩnh vực. Vui lòng xác nhận với Tòa án trước khi đến làm việc." action={<button className="outline-button">Tải lịch <Icon name="download" /></button>} />
            <div className="schedule-toolbar"><div className="date-tabs"><button className="selected">Tất cả</button><button>Hôm nay · 15/10</button><button>Ngày mai · 16/10</button><button>Tuần này</button></div><label className="select-wrap"><span>Lọc lĩnh vực</span><select value={scheduleType} onChange={(event) => setScheduleType(event.target.value)}><option>Tất cả lĩnh vực</option><option>Hình sự</option><option>Dân sự</option><option>Hôn nhân & gia đình</option><option>Kinh doanh thương mại</option><option>Hành chính</option></select><Icon name="chevron" /></label></div>
            <div className="schedule-table-wrap"><table className="schedule-table"><thead><tr><th>Ngày / giờ</th><th>Phòng xử</th><th>Mã minh họa</th><th>Nội dung phiên tòa</th><th>Trạng thái</th><th><span className="sr-only">Chi tiết</span></th></tr></thead><tbody>{filteredSchedule.map((item) => <tr key={`${item.date}-${item.time}-${item.code}`}><td><strong>{item.date}</strong><span>{item.time}</span></td><td>{item.room}</td><td><span className="case-code">{item.code}</span></td><td><strong>{item.title}</strong><span>{item.type}</span></td><td><span className="status"><i />{item.status}</span></td><td><button className="row-arrow" onClick={() => setSelectedSession(item)} aria-label={`Xem ${item.title}`}><Icon name="arrow" /></button></td></tr>)}</tbody></table></div>
            <div className="data-note"><span>i</span><p>Lịch xét xử trên đây chỉ là dữ liệu mẫu phục vụ minh họa giao diện. Lịch chính thức có thể thay đổi theo quyết định của Hội đồng xét xử.</p></div>
          </div>
        </section>

        <section className="section container guide-section" id="thu-tuc"><SectionHeading eyebrow="ĐỒNG HÀNH CÙNG NGƯỜI DÂN" title="Thủ tục & hướng dẫn" text="Các nội dung được trình bày ngắn gọn, theo từng bước để bạn dễ chuẩn bị." action={<button className="outline-button">Xem toàn bộ <Icon name="arrow" /></button>} /><div className="procedure-grid">{procedures.map((item) => <button className="procedure-card" key={item.number}><span className="procedure-number">{item.number}</span><span className="procedure-icon"><Icon name={item.icon} /></span><h3>{item.title}</h3><p>{item.text}</p><span className="card-link">Xem hướng dẫn <Icon name="arrow" /></span></button>)}</div></section>

        <section className="section forms-section" id="bieu-mau"><div className="container"><SectionHeading eyebrow="TẢI VỀ VÀ THAM KHẢO" title="Thư viện biểu mẫu" text="Mẫu biểu được cung cấp để tham khảo. Hãy kiểm tra phiên bản chính thức trước khi sử dụng." action={<button className="outline-button">Danh mục đầy đủ <Icon name="arrow" /></button>} /><div className="forms-list">{forms.map((form) => <div className="form-row" key={form.type}><div className="form-file"><span className="file-icon">PDF</span><div><span className="form-type">{form.type}</span><h3>{form.title}</h3></div></div><p>{form.detail}</p><button className="download-button" onClick={() => downloadForm(form.title)}><Icon name="download" /> Tải mẫu</button></div>)}</div></div></section>

        <section className="contact-section" id="lien-he"><div className="container contact-grid"><div><p className="eyebrow light">KẾT NỐI VỚI CHÚNG TÔI</p><h2>Cần hỗ trợ thêm<br /><em>về thủ tục?</em></h2><p className="contact-lead">Bộ phận tiếp nhận và trả kết quả sẵn sàng hướng dẫn các thông tin công khai trong giờ làm việc.</p><button className="solid-light-button" onClick={() => window.location.href = 'tel:02473000000'}>Gọi bộ phận một cửa <Icon name="phone" /></button></div><div className="contact-details"><div className="contact-item"><span className="contact-icon"><Icon name="pin" /></span><div><strong>Địa chỉ</strong><p>Số 01, đường Công Lý, phường Minh Bạch,<br />thành phố Minh Họa</p></div></div><div className="contact-item"><span className="contact-icon"><Icon name="phone" /></span><div><strong>Điện thoại</strong><p>(024) 7300 0000 · (024) 7300 0001</p></div></div><div className="contact-item"><span className="contact-icon"><Icon name="mail" /></span><div><strong>Thư điện tử</strong><p>congthongtin@toaan-minhhoa.gov.vn</p></div></div><div className="contact-hours"><span>Giờ làm việc</span><strong>Thứ Hai – Thứ Sáu · 07:30 – 17:00</strong></div></div></div></section>
      </main>

      <footer className="site-footer"><div className="container footer-grid"><div className="footer-brand"><div className="brand-mark-small"><img src="/court-seal.svg" alt="" /></div><div><strong>CỔNG THÔNG TIN<br />TÒA ÁN NHÂN DÂN</strong><p>Thông tin công khai · Minh bạch · Vì công lý</p></div></div><div className="footer-links"><div><span>Điều hướng</span><button onClick={() => scrollTo('trang-chu')}>Trang chủ</button><button onClick={() => scrollTo('tin-tuc')}>Tin tức</button><button onClick={() => scrollTo('lich-xet-xu')}>Lịch xét xử</button></div><div><span>Hỗ trợ</span><button onClick={() => scrollTo('thu-tuc')}>Thủ tục & hướng dẫn</button><button onClick={() => scrollTo('bieu-mau')}>Biểu mẫu</button><button onClick={() => scrollTo('lien-he')}>Liên hệ</button></div></div></div><div className="container footer-bottom"><span>© 2026 Cổng thông tin Tòa án · Bản giao diện minh họa</span><span>Không phải cổng thông tin chính thức</span></div></footer>

      {selectedSession && <div className="modal-backdrop" onClick={() => setSelectedSession(null)}><div className="session-modal" role="dialog" aria-modal="true" aria-labelledby="session-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelectedSession(null)} aria-label="Đóng"><Icon name="close" /></button><p className="eyebrow">CHI TIẾT LỊCH MINH HỌA</p><h2 id="session-title">{selectedSession.title}</h2><div className="modal-meta"><div><span>Ngày giờ</span><strong>{selectedSession.date} · {selectedSession.time}</strong></div><div><span>Địa điểm</span><strong>{selectedSession.room}</strong></div><div><span>Mã minh họa</span><strong>{selectedSession.code}</strong></div><div><span>Lĩnh vực</span><strong>{selectedSession.type}</strong></div></div><div className="data-note"><span>i</span><p>Thông tin trong cửa sổ này là dữ liệu mẫu và không có giá trị thay thế giấy triệu tập hoặc thông báo chính thức.</p></div></div></div>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
