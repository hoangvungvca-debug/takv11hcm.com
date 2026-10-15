import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

type Module = { icon: string; title: string; description: string; href: string; tone: string; tag: string };

const modules: Module[] = [
  { icon: '▥', title: 'Báo cáo — Thống kê', description: 'Tổng hợp số liệu, báo cáo nghiệp vụ và các biểu mẫu thống kê.', href: 'https://tk.toaan.gov.vn/Login/', tone: 'blue', tag: 'Nghiệp vụ' },
  { icon: '▣', title: 'Lịch xét xử', description: 'Theo dõi lịch xét xử và các phiên tòa đã được sắp xếp.', href: 'https://docs.google.com/spreadsheets/d/1BM_e1mOkqr3l6HqeL4SmrWLmTvkdzwTS3dwKLJ_QILI/edit?gid=853317092#gid=853317092', tone: 'gold', tag: 'Lịch làm việc' },
  { icon: '▤', title: 'Phần mềm chuyển kháng cáo', description: 'Tiếp nhận và quản lý quy trình chuyển hồ sơ kháng cáo.', href: 'https://quanly.tahcmc.vn/login', tone: 'terracotta', tag: 'Quản lý hồ sơ' },
  { icon: '↗', title: 'E-QLTA (QLA toàn trình)', description: 'Hệ thống quản lý tòa án điện tử toàn trình.', href: 'https://e-qlta.toaan.gov.vn', tone: 'teal', tag: 'Hệ thống điện tử' },
  { icon: '▦', title: 'Lịch làm việc theo tuần', description: 'Lịch công tác, phân công và lịch làm việc trong tuần.', href: 'https://docs.google.com/document/d/1zpDjH9EkvJ6ktjymfaSfAR_UL0yVWWpg/edit?usp=sharing&ouid=104268435571682100822&rtpof=true&sd=true', tone: 'gold', tag: 'Điều phối' },
  { icon: '➜', title: 'Tống đạt thừa phát lại', description: 'Theo dõi và cập nhật tình trạng tống đạt hồ sơ.', href: 'https://docs.google.com/spreadsheets/d/1QEx69CMJgr8YE_w_s9uKuCt_TqtAhOyp/edit?usp=sharing&ouid=117303282830124686971', tone: 'blue', tag: 'Hỗ trợ tố tụng' },
  { icon: '✦', title: 'AI Tòa án', description: 'Tra cứu, hỗ trợ tìm kiếm và xử lý thông tin bằng AI.', href: 'https://ai.toaan.gov.vn/#/chat', tone: 'violet', tag: 'Công nghệ mới' },
  { icon: '⚖', title: 'Quản lý Tòa án', description: 'Quản lý nghiệp vụ, tài khoản và thông tin vận hành.', href: 'https://qlta.toaan.gov.vn/Login.aspx', tone: 'navy', tag: 'Quản trị' },
  { icon: '▤', title: 'Công văn đi — đến', description: 'Quản lý văn bản, công văn đến và công văn đi.', href: 'https://vbdh.toaan.gov.vn/Pages/login.zul', tone: 'terracotta', tag: 'Văn thư' },
  { icon: '◈', title: 'Trợ lý ảo', description: 'Kênh hỗ trợ nhanh cho cán bộ, công chức và người dùng nội bộ.', href: 'https://trolyao.toaan.gov.vn/', tone: 'violet', tag: 'Hỗ trợ' },
  { icon: '♙', title: 'Thông tin CBCC', description: 'Tra cứu, cập nhật thông tin cán bộ, công chức.', href: 'https://cbccvc.toaan.gov.vn/web/login', tone: 'teal', tag: 'Nhân sự' },
  { icon: '⌖', title: 'Tìm kiếm địa chỉ sau sáp nhập', description: 'Tra cứu địa chỉ, đơn vị hành chính sau sắp xếp.', href: 'https://diachi.io/?utm_source=zalo&utm_medium=zalo&utm_campaign=zalo', tone: 'gold', tag: 'Tra cứu' },
  { icon: '✉', title: 'Email công vụ', description: 'Truy cập hệ thống thư điện tử công vụ của ngành.', href: 'https://mail.toaan.gov.vn/owa/#path=/mail/inbox', tone: 'blue', tag: 'Liên lạc' },
  { icon: '⌁', title: 'Tra cứu án phí', description: 'Công cụ tham khảo và tính mức án phí, lệ phí.', href: 'https://thuvienphapluat.vn/banan/tinh-an-phi?ThuTuc=0&GiaNgach=0&LinhVuc=2&SoTien=324979938', tone: 'terracotta', tag: 'Công cụ' },
  { icon: '▰', title: 'Phần mềm xét xử trực tuyến', description: 'Đăng ký và hỗ trợ tổ chức phiên tòa trực tuyến.', href: 'http://hotro.tahcmc.vn/call/dangky.php', tone: 'navy', tag: 'Trực tuyến' },
];

function App() {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('Tất cả');
  const [menuOpen, setMenuOpen] = useState(false);

  const tags = ['Tất cả', ...Array.from(new Set(modules.map((item) => item.tag)))];
  const filtered = useMemo(() => modules.filter((item) => {
    const matchesTag = activeTag === 'Tất cả' || item.tag === activeTag;
    const text = `${item.title} ${item.description} ${item.tag}`.toLowerCase();
    return matchesTag && text.includes(query.trim().toLowerCase());
  }), [activeTag, query]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="portal">
      <div className="top-ribbon"><div className="wrap ribbon-inner"><span>TÒA ÁN NHÂN DÂN KHU VỰC 11 — THÀNH PHỐ HỒ CHÍ MINH</span><span className="ribbon-right">Cổng phần mềm nội bộ <b>●</b> 2026</span></div></div>
      <header className="header"><div className="wrap header-inner"><button className="wordmark" onClick={() => go('top')}><span className="mark"><img src="/court-seal.svg" alt="" /></span><span><strong>PHẦN MỀM NỘI BỘ</strong><small>TAND KHU VỰC 11</small></span></button><button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Mở menu">{menuOpen ? '×' : '☰'}</button><nav className={menuOpen ? 'open' : ''}><button className="selected" onClick={() => go('top')}>Trang chủ</button><button onClick={() => go('modules')}>Danh mục phần mềm</button><button onClick={() => go('contact')}>Liên hệ hỗ trợ</button></nav><button className="help-btn" onClick={() => go('contact')}>Trợ giúp <span>?</span></button></div></header>

      <main id="top">
        <section className="hero"><div className="wrap hero-inner"><div className="hero-copy"><div className="hero-kicker"><span className="kicker-line" /> CỔNG KẾT NỐI NGHIỆP VỤ</div><h1>Một nơi cho mọi<br /><em>công việc của Tòa án.</em></h1><p>Truy cập nhanh các phần mềm, công cụ nghiệp vụ và kênh hỗ trợ dành cho cán bộ, công chức Tòa án nhân dân khu vực 11.</p><div className="hero-actions"><button className="primary-btn" onClick={() => go('modules')}>Mở danh mục phần mềm <span>↗</span></button><button className="text-link" onClick={() => go('contact')}>Cần hỗ trợ? <span>→</span></button></div></div><div className="hero-art" aria-hidden="true"><div className="sun" /><div className="arch arch-one" /><div className="arch arch-two" /><div className="column column-a" /><div className="column column-b" /><div className="scale"><span /><i /><b /></div><div className="hero-stamp">TAND<br /><small>KHU VỰC 11</small></div></div></div></section>

        <section className="intro wrap"><div className="intro-label"><span>01</span><i /></div><div className="intro-copy"><p className="eyebrow">QUẢN LÝ TẬP TRUNG</p><h2>Công cụ đúng lúc.<br /><em>Quy trình thông suốt.</em></h2></div><p className="intro-text">Trang này tập hợp các hệ thống đang được sử dụng trong công tác nghiệp vụ, điều hành và hỗ trợ nội bộ. Chọn một mục để bắt đầu.</p></section>

        <section className="modules-section" id="modules"><div className="wrap"><div className="section-head"><div><p className="eyebrow">DANH MỤC HỆ THỐNG</p><h2>Tất cả công cụ</h2></div><div className="count"><strong>{filtered.length.toString().padStart(2, '0')}</strong><span>hệ thống<br />hiển thị</span></div></div><div className="toolbar"><div className="pills">{tags.map((tag) => <button key={tag} className={activeTag === tag ? 'active' : ''} onClick={() => setActiveTag(tag)}>{tag}</button>)}</div><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm phần mềm..." aria-label="Tìm phần mềm" /></label></div><div className="module-grid">{filtered.map((item, index) => <a className={`module-card ${item.tone}`} href={item.href} target="_blank" rel="noreferrer" key={item.title}><div className="card-top"><span className="module-icon">{item.icon}</span><span className="card-number">{String(index + 1).padStart(2, '0')}</span></div><div className="module-card-body"><span className="module-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.description}</p></div><span className="card-arrow">↗</span></a>)}</div>{filtered.length === 0 && <div className="no-results">Không tìm thấy phần mềm phù hợp với từ khóa “{query}”.</div>}</div></section>

        <section className="support wrap" id="contact"><div className="support-main"><span className="support-icon">?</span><div><p className="eyebrow">BẠN CẦN HỖ TRỢ?</p><h2>Liên hệ bộ phận<br /><em>vận hành hệ thống.</em></h2><p>Chúng tôi hỗ trợ giải đáp trong giờ làm việc và tiếp nhận các phản hồi liên quan đến tài khoản, phần mềm và dữ liệu.</p></div></div><div className="support-details"><div><span>Địa chỉ</span><strong>Số 989 đường 2/9, phường Phước Thắng,<br />TP. Hồ Chí Minh</strong></div><div><span>Điện thoại hỗ trợ</span><a href="tel:0913742969">0913 742 969</a></div><div><span>Giờ làm việc</span><strong>Thứ Hai — Thứ Sáu<br />07:30 — 17:00</strong></div></div></section>
      </main>

      <footer className="footer"><div className="wrap footer-inner"><div className="footer-brand"><img src="/court-seal.svg" alt="" /><div><strong>TÒA ÁN NHÂN DÂN KHU VỰC 11</strong><p>Thành phố Hồ Chí Minh</p></div></div><div className="footer-note"><span>Thiết kế và vận hành bởi</span><strong>Thư ký TAND khu vực 11</strong></div><div className="footer-end">Bản quyền nội bộ · 2026</div></div></footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
