
## Lịch làm việc – Nhắc việc
- [x] Mỗi tài khoản có lịch riêng; chủ lịch tạo, sửa, xóa và theo dõi lịch của mình.
- [x] Có thể chia sẻ lịch cho tài khoản đã được phê duyệt bằng email; người được chia sẻ chỉ có quyền xem.
- [x] Nhắc việc bằng thông báo trong website, hỗ trợ bật thông báo trình duyệt; không có lịch lặp.
- [x] Lưu tập trung trong database, có lọc quyền ở backend và hiển thị lịch được chia sẻ.

## Lưu trữ bưu gửi
- [x] Có mục riêng “Lưu trữ bưu gửi” trong sidebar, trang chủ và route `/luu-tru-buu-gui`.
- [x] Bảng lưu trữ gồm thời gian ghi nhận, ngày gửi, tên đương sự, nội dung, thẩm phán/phân loại, thư ký, mã vận đơn, kết quả và ảnh bì thư.
- [x] Chủ hệ thống có thể tải ảnh bì thư JPG/PNG/WEBP, dùng OCR AI để tự điền trường dữ liệu, kiểm tra lại trước khi lưu, sau đó sửa hoặc xóa bản ghi.
- [x] Có tìm kiếm theo tên/nội dung/thư ký/mã vận đơn, lọc theo thẩm phán/phân loại và khoảng ngày.
- [x] Có tải dữ liệu đang lọc về PDF, Word hoặc Excel; người dùng đã duyệt có quyền xem, thao tác sửa/xóa được bảo vệ ở backend chỉ cho chủ hệ thống.

- [x] Mỗi tài khoản chỉ xem, thêm, sửa, xóa và xuất các bản ghi Lưu trữ bưu gửi do chính tài khoản đó tạo; backend lọc theo email tài khoản, không trả toàn bộ dữ liệu.
- [x] Click ảnh bì thư mở cửa sổ xem ảnh; có nút phóng to, thu nhỏ, đóng và tải ảnh về.
- [x] Cạnh mã vận đơn có nút Copy mã và nút Tra cứu bưu gửi mở https://ipostal.vnpost.vn/tra-cuu-buu-gui.

## Trang chủ – Lịch cần làm
- [x] Xóa khối chào mừng đỏ “HỆ THỐNG NỘI BỘ / Xin chào…” khỏi đầu trang chủ.
- [x] Tăng cỡ chữ và độ tương phản của tiêu đề, tên lịch, thời gian và ghi chú trong khu vực “Lịch cần làm”; vẫn giữ bố cục hai cột trên màn hình nhỏ.

## Điều hướng sidebar
- [x] Đặt “Lưu trữ bưu gửi” ngay bên dưới “Lịch làm việc – Nhắc việc”; giữ nguyên đường dẫn `/luu-tru-buu-gui` và các mục khác.

## Đăng xuất tài khoản
- [x] Xóa các nút “Đăng xuất tài khoản” lặp lại ở phần đầu các trang nội bộ.
- [x] Chỉ giữ một nút “Đăng xuất tài khoản” ở cuối Sidebar của trang chủ.

## Đăng xuất tài khoản – hoàn tất
- [x] Chỉ còn duy nhất một nút “Đăng xuất tài khoản” ở cuối Sidebar; không còn nút đăng xuất trong header hoặc nội dung các trang nghiệp vụ.

## Hiển thị nút đăng xuất
- [x] Sidebar chỉ cuộn phần danh sách menu; vùng trạng thái và nút “Đăng xuất tài khoản” được cố định ở đáy Sidebar để luôn nhìn thấy khi menu dài.

## Bản vá hiển thị đăng xuất
- [x] Neo nút “Đăng xuất tài khoản” bằng vị trí tuyệt đối ở đáy Sidebar, tăng tương phản nút và chừa khoảng riêng để không bị khuất bởi danh sách menu.

## Thứ tự Sidebar
- [x] Đặt nút “Đăng xuất tài khoản” ngay bên dưới mục “Duyệt tài khoản”; trạng thái “Hệ thống đang hoạt động” nằm dưới nút đăng xuất.

## Giao diện điểm danh
- [x] Tối ưu màn hình Điểm danh cán bộ theo bố cục trắng-đỏ cân đối: tiêu đề và nút thao tác rõ ràng, QR căn giữa, bảng kết quả gọn, có trạng thái trực quan và hiển thị tốt trên điện thoại.

## Cập nhật điểm danh
- [x] Xóa cán bộ “Trịnh Xuân Luyến” và “Huỳnh Ngọc Trí” khỏi dữ liệu nguồn và bảng cán bộ điểm danh.
- [x] Đổi thời hạn mã QR điểm danh từ 60 giây thành 5 phút ở backend, bộ đếm giao diện và nội dung hướng dẫn trên màn hình.

## Lịch được chia sẻ – quyền thao tác
- [x] Lịch được chia sẻ hiển thị cột “Thao tác” với các nút Sửa, Xóa và Tải về cho người nhận.
- [x] Backend cho phép người nhận lịch đã được chia sẻ sửa hoặc xóa đúng bản ghi; quyền được kiểm tra bằng tài khoản đăng nhập và quan hệ chia sẻ.
- [x] Bổ sung tải lịch dạng `.ics` để mở trên ứng dụng lịch máy tính/điện thoại.
