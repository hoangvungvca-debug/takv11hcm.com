
## Quyền chỉnh sửa hai sổ công văn
- [x] Chỉ tài khoản chủ hệ thống theo `ADMIN_EMAIL` được thêm, sửa và xóa dữ liệu trong Sổ công văn đến và Sổ công văn đi; tài khoản khác chỉ được xem và tra cứu.
- [x] Hai sổ công văn có nút Sửa/Xóa cho chủ hệ thống, xác nhận trước khi xóa và kiểm tra quyền ở máy chủ, không chỉ ẩn ở giao diện.

## Điểm danh cán bộ bằng QR
- [x] Nhập 61 cán bộ từ file danh sách đã cung cấp vào bảng dữ liệu riêng phía máy chủ; không đưa mã định danh cá nhân vào JavaScript/public assets.
- [x] Chủ hệ thống có nút “Tạo điểm danh” để mở phiên mới; mã QR được tạo mới, token băm ở máy chủ, hết hạn sau 60 giây và chỉ dùng một lần.
- [x] Tài khoản đã được phê duyệt quét liên kết QR, chọn đúng tên của mình và gửi yêu cầu điểm danh; mỗi cán bộ chỉ được ghi nhận một lần trong một phiên.
- [x] Chủ hệ thống xem danh sách Có mặt/Vắng mặt, thời điểm điểm danh và tải báo cáo Word.
- [x] Route điểm danh và API yêu cầu đăng nhập; API điểm danh hộ không được coi là có thể ngăn tuyệt đối ảnh chụp màn hình, nên hệ thống dùng token 60 giây, token một lần, tài khoản đã duyệt và khóa thiết bị phiên như biện pháp giảm thiểu.
- [x] Khu vực kết quả đặt cạnh mã QR, hiển thị ngay danh sách Có mặt/Vắng mặt và bảng chi tiết tự cập nhật sau khi cán bộ quét; chủ hệ thống xuất Word sau khi kiểm tra kết quả.
