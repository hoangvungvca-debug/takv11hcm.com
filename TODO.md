
- [x] Trang đăng nhập tự kiểm tra phiên đã lưu; nếu còn phiên hợp lệ sẽ chuyển thẳng vào hệ thống.
- [x] Sau khi đăng nhập thành công, gửi cookie phiên rõ ràng với `credentials: include`, ghi nhớ phiên 30 ngày; chỉ lưu email để điền sẵn, không lưu mật khẩu.
- [x] Hiển thị thông báo lỗi kết nối rõ ràng thay vì để form không phản hồi.
- [x] Chat chung nội bộ cho tài khoản đã được duyệt, lưu tin nhắn tập trung, giới hạn 1.000 ký tự/tin.
- [x] Footer hiển thị tổng lượt truy cập và lượt truy cập trong ngày từ thống kê server, không lưu IP.
- [x] Thêm nút hiện/ẩn mật khẩu trên trang đăng nhập.
- [x] Thêm luồng yêu cầu khôi phục mật khẩu, token một lần hết hạn sau 30 phút và không tiết lộ email có tồn tại hay không.
- [ ] Cấu hình email gửi đi chính thức (`RESEND_API_KEY` và địa chỉ người gửi đã xác minh) để liên kết khôi phục được gửi đến hộp thư.
- [x] Thêm checkbox Remember Me: phiên 30 ngày khi chọn, phiên tạm thời khi bỏ chọn.
- [x] Tự điền email lần sau bằng localStorage; không lưu mật khẩu.
- [x] Khôi phục trang chủ về bố cục App cũ theo yêu cầu; không thay đổi đăng nhập, Remember Me, Sổ công văn, danh bạ và biểu mẫu.

- [x] Khôi phục sidebar theo các nhóm ứng dụng của bản cũ; đưa E-QLTA lên liên kết đầu tiên, không lặp lại trong nhóm Nghiệp vụ. Giữ nguyên phần còn lại của trang chủ và xác thực.

## Quản trị tài khoản
- [x] Chỉ quản trị viên đã duyệt được xem danh sách và phê duyệt tài khoản; tab chờ duyệt, hoạt động, tài khoản khác, thùng rác có tìm kiếm, trạng thái tiếng Việt, thông báo lỗi và kết quả rõ ràng.
- [x] Sửa họ tên và email hợp lệ, không trùng email kể cả tài khoản đã xóa; không nâng quyền hoặc thay mật khẩu qua biểu mẫu sửa. Không cho thay email quản trị chủ hệ thống.
- [x] Xóa mềm có xác nhận rõ tên/email: giữ dữ liệu tài khoản và nghiệp vụ, đưa vào thùng rác, chặn đăng nhập và thu hồi phiên cũ. Không xóa chính mình hoặc quản trị chủ hệ thống.
- [x] Khôi phục tài khoản từ thùng rác về trạng thái trước khi xóa; tài khoản chờ duyệt vẫn chờ duyệt, tài khoản được duyệt phải đăng nhập lại, không tái sử dụng phiên cũ.
- [x] Phân quyền backend, chặn yêu cầu thao tác từ nguồn khác website, ghi nhật ký cùng giao dịch; kiểm thử không thao tác tài khoản thật. Giữ nguyên trang chủ, sidebar, form đăng nhập và dữ liệu khác.
