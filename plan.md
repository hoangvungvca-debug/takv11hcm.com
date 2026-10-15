# Dashboard nghiệp vụ TAND khu vực 11

## Phạm vi được chốt
Chuyển trang chủ hiện tại thành dashboard trắng–đỏ, gọn và phù hợp cổng điều hành nội bộ. Giữ nguyên trang đăng nhập đã được duyệt, các route danh bạ, biểu mẫu, sổ công văn và phân quyền hiện có. Chưa xuất bản lần thay đổi này.

Thứ tự trang chủ: thanh thời gian đỏ chữ trắng; header tối giản có logo, tên hệ thống, tài khoản và đăng xuất; lời chào; bốn lối tắt (Sổ công văn đến, Lịch xét xử, Hệ thống biểu mẫu, Danh bạ phối hợp); công việc và thông báo; ba danh bạ; kho biểu mẫu; ứng dụng dùng chung thu gọn; hỗ trợ và footer trải dài cả hai vùng.

Sidebar cố định trên desktop, thanh biểu tượng có nhãn ngắn luôn hiện trên mobile. Năm nhóm: Tổng quan, Nghiệp vụ, Danh bạ phối hợp, Kho dùng chung, Quản trị (chỉ khi có quyền). Không tạo đường dẫn giả cho các chức năng chưa triển khai.

## Thiết kế và triển khai
Dùng ngôn ngữ dashboard hành chính hiện đại: nền xám trắng, thẻ trắng bo nhẹ, đường phân cách mảnh, đỏ chỉ cho nhận diện/trọng tâm, typography sans-serif dễ đọc. Bỏ banner lớn để ưu tiên công việc. Biểu tượng SVG nhất quán, focus bàn phím rõ, kích thước chạm tối thiểu 44px. Responsive tại tablet/mobile, không ép nội dung vào cột hẹp.

Giao diện viết HTML ngữ nghĩa bằng JSX React và CSS tách riêng, không thêm thư viện UI. Session lấy từ `/api/auth/me`; nút đăng xuất dùng API hiện có. Công văn lấy read-only từ `/api/letters`, lọc theo người xử lý khớp tên/email; không tự nhận mọi công văn là công việc cá nhân. Phân biệt trạng thái tải, rỗng và lỗi. Chưa có nguồn lịch/thông báo nội bộ: hiển thị trạng thái chưa kết nối và liên kết lịch đã có, không tạo thông báo/ngày họp giả. Danh bạ và biểu mẫu tiếp tục ghi rõ minh họa, không công bố số điện thoại thật hay tài liệu giả.

## Cấu trúc
- `src/dashboard/Dashboard.tsx`: trang chủ, điều hướng, session và các khối dashboard.
- `src/dashboard/dashboard.css`: toàn bộ CSS dashboard được giới hạn bằng class riêng; không ghi đè CSS đăng nhập.
- `src/dashboard/dashboard-utils.ts`: tìm kiếm không dấu, lọc công việc, xử lý ngày.
- `src/main.tsx`: các trang cũ giữ nguyên, thay App bằng Dashboard và truyền danh mục ứng dụng hiện có.
- `public/manus-routes.json`: giữ bộ route hiện có, không thêm route bỏ qua đăng nhập.
- Bản HTML/CSS minh họa độc lập được xuất riêng để người dùng xem mã; không chứa dữ liệu thật, secret hoặc backend xác thực.

## Chat và thống kê
Chat được giới hạn cho tài khoản `approved`/`admin`, lưu tên, email, nội dung và thời gian trong bảng `internal_chat_messages`; mỗi tin tối đa 1.000 ký tự. API trả tối đa 100 tin mới nhất và React escape nội dung khi hiển thị. Không hỗ trợ chat công khai.

Footer hiển thị tổng lượt truy cập và lượt trong ngày từ bảng `site_visit_stats`. Chỉ ghi nhận khi người dùng đã đăng nhập mở trang chủ; không lưu IP hoặc dấu vân tay thiết bị. API thống kê cũng yêu cầu tài khoản được duyệt.
