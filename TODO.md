
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

## Mật khẩu và tự đăng nhập
- [x] Nút Đặt lại mật khẩu trong quản trị có nhập và xác nhận mật khẩu mới, nút hiện/ẩn, validation 8–128 ký tự; giữ trạng thái/vai trò, hủy hiệu lực phiên và token cũ, không lộ mật khẩu trong nhật ký.
- [x] Đổi mật khẩu chính mình yêu cầu mật khẩu hiện tại; quản trị viên khác không được đổi mật khẩu chủ hệ thống; tài khoản trong thùng rác không được đặt lại trước khi khôi phục.
- [x] Mặc định ghi nhớ; cùng trình duyệt với phiên hợp lệ tự vào trang chủ, gia hạn phiên sắp hết hạn; bỏ ghi nhớ không gia hạn, không tự đăng nhập chỉ dựa vào email đã lưu; kiểm tra phiên sau đăng nhập để tránh chuyển trang lặp.
- [x] Giữ nguyên trang chủ, sidebar, CSS và dữ liệu nghiệp vụ; kiểm thử không đặt lại mật khẩu tài khoản thật.

- [x] Sidebar luôn hiện cả biểu tượng và tên ứng dụng, kể cả điện thoại; tên dài xuống dòng, không cần chạm/hover mới thấy. Giữ E-QLTA đầu danh sách, sidebar cố định, footer toàn chiều ngang và các phần khác.


## Sổ công văn đi
- [x] Tạo route nội bộ riêng; người dùng đã đăng nhập và được phê duyệt mới xem/ghi sổ.
- [x] Biểu mẫu gồm ngày tháng gửi, số công văn cấp tự động, nội dung, nơi nhận, thẩm phán, thư ký và ghi chú.
- [x] Cấp số sau khi lưu theo dạng CVĐ-năm-số thứ tự cơ sở dữ liệu.
- [x] Có nút xuất PDF, Word và Excel; danh sách phân trang khi quá 10 dòng.

## Bộ lọc công văn đi
- [x] Tìm nhanh theo số công văn đi, hỗ trợ một phần số và kết hợp lọc từ ngày–đến ngày (ngày biên được tính, một đầu mốc tùy chọn).
- [x] Đổi điều kiện về trang 1, phân trang 10 dòng theo kết quả, có xóa lọc và thông báo không tìm thấy/ngày không hợp lệ.
- [x] Nút xuất dùng toàn bộ kết quả lọc, không đổi sổ đến, bố cục trang chủ/sidebar hay dữ liệu đã lưu.

## Danh bạ người dùng cung cấp và chữ đăng nhập
- [x] Nhập đầy đủ 42 Hội thẩm nhân dân nhiệm kỳ 2026–2031, hiển thị STT, họ tên, ngày sinh, nơi ở, chuyên môn, nghề nghiệp/chức vụ, điện thoại; có tìm kiếm.
- [x] Nhập liên hệ Phước Thắng, Rạch Dừa, Tam Thắng, Vũng Tàu đúng nguồn; sắp theo phường/khu phố, lọc phường/khu phố/chức danh, tìm kiếm và xóa lọc; giữ các chức danh không phải khu phố trưởng để không bỏ dữ liệu.
- [x] Danh bạ chỉ xem được với tài khoản đã duyệt; không đặt dữ liệu/số điện thoại trong tài nguyên công khai.
- [x] Chữ đăng nhập rõ nét, dễ đọc, đồng nhất font/màu và nhãn cùng dòng; giữ nguyên các chức năng đăng nhập, trang chủ, sidebar, công văn, biểu mẫu và quản trị.
- [ ] Xuất bản bản cập nhật lên website chính thức và xác minh deployment.
- [x] Tăng nhẹ cỡ chữ trang chủ để dễ đọc, giữ nguyên bố cục và thứ tự ứng dụng.
- [x] Nút Đăng xuất cuối sidebar xóa phiên trên trình duyệt, không xóa tài khoản; footer có số người online (tài khoản đã duyệt hoạt động 2 phút gần nhất), lượt hôm nay và tổng lượt mở trang chủ.
