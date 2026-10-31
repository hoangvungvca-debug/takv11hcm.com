
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

## Điều chỉnh thao tác lịch
- [x] Bỏ nút “Tải về” và mã tải ICS khỏi giao diện lịch; chỉ giữ nút “Sửa” và “Xóa” cho lịch được chia sẻ.

## Tinh gọn Trang chủ
- [x] Gỡ Khu phố trưởng, Cảnh sát khu vực và Hội thẩm nhân dân khỏi các thẻ nội dung Trang chủ; giữ nguyên các mục và đường dẫn tương ứng trong Sidebar cùng các trang tra cứu.

## Tinh gọn Trang chủ – đợt 2
- [x] Gỡ các thẻ Hội thẩm nhân dân, Hệ thống biểu mẫu và Danh bạ phối hợp khỏi phần Không gian làm việc trên Trang chủ; giữ nguyên đầy đủ các mục tương ứng trong Sidebar.

## Thiết kế Không gian làm việc
- [x] Thu gọn tiêu đề, khoảng cách, chiều cao thẻ, biểu tượng và cỡ chữ của bốn chức năng còn lại trên Trang chủ; giữ khả năng đọc rõ và bố cục cân đối trên màn hình nhỏ.

## Thiết kế thẻ nghiệp vụ – phiên bản chuyên nghiệp
- [x] Làm mới Lịch cần làm và Không gian làm việc bằng thẻ nền sáng, bo góc nhẹ, đổ bóng tinh tế, điểm nhấn đỏ nhất quán và font chữ lớn hơn để dễ đọc.

## Tinh gọn đầu Trang chủ
- [x] Xóa cụm nút “Hỗ trợ hệ thống” và “Tài khoản” khỏi phần đầu Trang chủ; giữ nguyên các chức năng đăng nhập và quản trị trong Sidebar cùng các route tương ứng.

## Khôi phục lời chào Trang chủ
- [x] Khôi phục “Xin chào, [tên cán bộ]” ở bên phải tiêu đề Trang chủ; không khôi phục lại nút “Hỗ trợ hệ thống” hoặc “Tài khoản”.

## Danh sách chia sẻ lịch
- [x] Hiển thị tài khoản được chia sẻ theo danh sách dọc, có ô tìm kiếm theo tên hoặc email, giữ nút Chọn tất cả và hiển thị rõ trường hợp không có kết quả.

## Giao diện bảng Lưu trữ bưu gửi
- [x] Tăng cỡ chữ và độ thoáng cho tiêu đề cột, dữ liệu, mã vận đơn, kết quả và nút thao tác; căn giữa tiêu đề cột và các trường ngắn, giữ nội dung dài căn trái.
