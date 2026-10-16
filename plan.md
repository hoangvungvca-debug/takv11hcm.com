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

## Quyết định cập nhật sau nghiệm thu
Trang chủ chính thức sử dụng lại component App và cách sắp xếp ứng dụng của phiên bản cũ theo yêu cầu người dùng. Dashboard nghiệp vụ mới chỉ giữ lại như mã tham khảo/demonstration, không thay thế trang chủ mặc định. Các thay đổi tiếp theo chỉ thực hiện ở đúng mục được yêu cầu.

## Sidebar theo yêu cầu mới
Giữ nhận diện trắng–đỏ và sidebar cố định hiện có; dùng lại nhóm ứng dụng của bản trước dashboard, ghim E-QLTA ở đầu danh sách. Không thay đổi danh mục/thứ tự thẻ ở nội dung trang chủ, form đăng nhập, cookie, route hay dữ liệu. Các mục nội bộ hiện có được giữ lại.

## Quản trị tài khoản — bổ sung
Chỉ mở rộng trang `/admin`: quản trị viên đã được duyệt có thể phê duyệt, sửa họ tên/email, chuyển tài khoản vào thùng rác và khôi phục. Giữ nguyên giao diện trang chủ, sidebar, thứ tự E-QLTA, form đăng nhập và dữ liệu nghiệp vụ.
Xóa là xóa mềm: giữ bản ghi, lưu thời điểm xóa và trạng thái trước khi xóa; ngăn đăng nhập ngay, hủy hiệu lực các phiên cũ. Khôi phục trả lại trạng thái trước đó, không tự duyệt tài khoản đang chờ; người dùng phải đăng nhập lại. Không xóa hoặc vô hiệu hóa chính mình hay tài khoản quản trị chủ hệ thống, không thay email của tài khoản chủ hệ thống. Sửa không cho phép tự nâng vai trò; email phải hợp lệ và không trùng kể cả tài khoản trong thùng rác.
Các thao tác có hộp xác nhận với tên/email và tác động chính xác, lỗi được hiển thị rõ; danh sách chia tab chờ duyệt, đang hoạt động, tài khoản khác và thùng rác, có tìm kiếm. Backend kiểm tra quyền trên mọi API, chặn nguồn yêu cầu khác website và ghi nhật ký thao tác trong cùng giao dịch. Không thử xóa/sửa/duyệt tài khoản người dùng thật.
Tách `src/admin/AccountAdminPage.tsx` và CSS có phạm vi `.account-admin`; `server/account-management.mjs` xử lý chuyển trạng thái, validation, giao dịch và nhật ký; migration cộng thêm cột qua script dùng lịch sử migration. Kiểm thử với kho dữ liệu giả lập, không ghi vào database dùng chung. Bản bổ sung được lưu và gửi Preview; không tự xuất bản nếu chưa có yêu cầu mới.

Migration quản trị đã chạy riêng thành công, không thay trạng thái hay xóa tài khoản. Runtime chỉ kiểm tra lịch sử migration. Kiểm thử giả lập và kiểm tra HTTP chưa đăng nhập đạt; không thực hiện thao tác quản trị với tài khoản thật.

## Đặt lại mật khẩu và tự đăng nhập
Bổ sung nút Đặt lại mật khẩu tại quản trị: quản trị viên đặt mật khẩu mới (8–128 ký tự), xác nhận lại; không tự duyệt hoặc thay vai trò tài khoản, thu hồi phiên/token cũ, không lưu mật khẩu rõ trong nhật ký. Đổi mật khẩu chính mình yêu cầu mật khẩu hiện tại và tạo phiên mới sau khi thành công; không cho quản trị viên khác đặt lại mật khẩu của chủ hệ thống. Tài khoản đã xóa phải khôi phục trước.
Ghi nhớ mặc định bật. Phiên Remember Me hợp lệ tự vào hệ thống, được gia hạn thêm 30 ngày khi gần hết hạn và người dùng vẫn truy cập. Giữ lựa chọn bỏ ghi nhớ cho máy dùng chung. Không đăng nhập dựa vào email localStorage: thiết bị mới, cookie bị xóa, đăng xuất, phiên hết hạn/thu hồi vẫn phải xác thực. Kiểm tra cookie sau đăng nhập trước chuyển trang để tránh vòng lặp. Chỉ sửa các chức năng xác thực được yêu cầu, không đổi HTML/CSS trang chủ hoặc sidebar. Bản mới giữ Preview, không tự xuất bản.

Kiểm tra bản mật khẩu/ghi nhớ: 22 kiểm thử giả lập đạt, kiểm tra độc lập không phát hiện lỗi trong phạm vi. Preview chặn reset quản trị chưa xác thực (403), liên kết sai (400); không thử đổi mật khẩu tài khoản thật. Địa chỉ gửi RESEND_FROM_EMAIL chưa cấu hình nên email Quên mật khẩu chưa gửi được; quản trị đặt lại trực tiếp không phụ thuộc email.

## Sidebar hiện tên trên mọi thiết bị
Giữ sidebar cố định và thứ tự E-QLTA ở đầu. Bỏ chế độ thanh chỉ biểu tượng trên mobile: hiện biểu tượng, tên ứng dụng tự xuống dòng và tên nhóm. Chiều rộng trên mobile dùng clamp(132px,38vw,180px), đồng bộ khoảng lề nội dung và footer toàn chiều ngang; desktop giữ kích thước cũ. Không sửa component trang chủ, đăng nhập, quản trị hoặc dữ liệu.


## Sổ công văn đi — đã triển khai
Tái sử dụng vùng giao diện sổ nội bộ, thêm bảng `outgoing_letters`, API GET/POST được bảo vệ, cấp số sau insert, xuất file phía trình duyệt và phân trang 10 dòng. “pqf” được hiểu là PDF. Không thay đổi sổ công văn đến.

## Tìm nhanh Sổ công văn đi
Thêm tìm số công văn một phần, không phân biệt hoa/thường hoặc dấu (CVĐ/CVD); lọc ngày gửi từ ngày–đến ngày, bao gồm cả hai ngày biên, cho phép chỉ chọn một đầu mốc và kết hợp với số. Ngày JSON có múi giờ được đối chiếu theo Việt Nam. Thay bộ lọc trở về trang 1, giữ phân trang 10 dòng và hiển thị số kết quả. Có xóa bộ lọc, thông báo khoảng ngày không hợp lệ/không có kết quả. Xuất toàn bộ kết quả đang lọc. Không đổi backend, dữ liệu, sidebar hoặc các trang khác.

## Nhập danh bạ HTND và khu phố trưởng từ hồ sơ người dùng
Nhập đầy đủ Hội thẩm nhiệm kỳ 2026–2031 và các liên hệ địa phương của bốn phường từ tài liệu gửi ngày 16/10/2026. API chỉ trả danh bạ cho người đã đăng nhập được duyệt; dữ liệu nguồn lưu riêng phía server, không đóng gói vào JavaScript hay thư mục public. Mục HTND hiển thị toàn bộ trường trong bảng gốc và tìm kiếm có/không dấu. Mục khu phố sắp theo phường, số khu phố tự nhiên, có lọc phường/khu phố/chức danh và tìm kiếm; giữ phân biệt khu phố cũ–mới của Vũng Tàu theo cột KP mới, không suy đoán phường theo địa chỉ. Số điện thoại thiếu/sai định dạng giữ nguyên nguồn kèm cảnh báo cần đối chiếu. Sửa font đăng nhập thành Arial hỗ trợ tiếng Việt, tăng độ tương phản, hiển thị nhãn trên một dòng, không thay cơ chế xác thực hay bố cục các trang khác.

Bổ sung theo yêu cầu: tăng nhẹ cỡ chữ trang chủ bằng CSS có phạm vi .app-shell; giữ nguyên bố cục, thứ tự sidebar và các trang nghiệp vụ khác. Danh bạ lưu tập trung trong bảng MySQL directory_contacts, script nhập theo mã nguồn ổn định; không tự chạy nhập lại lúc khởi động.

Bổ sung: Đăng xuất tài khoản ở cuối sidebar, xóa cookie phiên và trạng thái online (không xóa tài khoản). Theo dõi online cho tài khoản đã được duyệt trên các trang nội bộ bằng heartbeat 60 giây khi tab hiển thị; mỗi tài khoản một dòng, hết hoạt động sau 2 phút. Footer hiển thị số online, lượt hôm nay theo giờ Việt Nam và tổng lượt mở trang chủ; lỗi kết nối hiển thị dấu — thay vì số giả.

## Cỡ chữ và căn chỉnh hai thanh
Chỉ tăng chữ thanh ngày giờ/điều hướng trên cùng và chân trang, dùng Arial 14–15px desktop, tối thiểu 12px mobile. Giữ nền đỏ/chữ trắng trên cùng; breadcrumb bên trái, trạng thái và ngày giờ bên phải. Footer giữ chiều ngang hiện tại, sắp tên hệ thống và bản quyền bên trái, năm ở giữa, thống kê bên phải; tự xuống hàng hợp lý khi hẹp. Không đổi sidebar, thứ tự ứng dụng, danh bạ, đăng nhập, API hay dữ liệu.

## Tăng chữ các trang mục con
Chỉ bổ sung CSS có phạm vi .internal-shell cho sổ công văn đến/đi, danh bạ, biểu mẫu và quản trị. Nội dung bảng 15px, nhãn/nút/bộ lọc 14px, ô nhập 16px, chú thích 12–13px, tiêu đề tăng nhẹ. Giữ nguyên trang chủ, đăng nhập, hai thanh vừa chốt, thứ tự, phân trang 10 dòng, lọc/tìm kiếm, xuất PDF/Word/Excel, API và dữ liệu. Trên điện thoại ô nhập không nhỏ hơn 16px, bảng vẫn cuộn ngang trong khung.

## Cảnh sát khu vực Tam Thắng từ ảnh
Nhập 22 cán bộ, 25 khu phố (3 trường hợp kiêm nhiệm), 23 số di động, địa chỉ tổ CSKV và số trực ban đúng ảnh. Tái sử dụng bảng MySQL directory_contacts, API chỉ tài khoản được duyệt; danh bạ tìm không dấu/tên/số, lọc phường và tất cả địa bàn kể cả kiêm nhiệm. Giữ nguyên các danh bạ đã nhập, không tự sửa số hoặc bổ sung các phường chưa gửi.
