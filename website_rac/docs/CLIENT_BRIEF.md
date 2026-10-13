# Website tích điểm phân loại rác học đường

## Điều chỉnh mới nhất — lớp động
Admin có quyền quản lý lớp. Excel có tên lớp chưa có sẽ tự tạo lớp cùng lúc xác nhận import. Bỏ giới hạn cứng 11T1–11T3; đây chỉ là dữ liệu khởi tạo. Bộ lọc lớp, đăng ký, thi đua và xuất Excel dùng danh sách lớp động. Đổi tên lớp bảo toàn liên kết học sinh và điểm; chỉ xóa lớp trống chưa có dữ liệu.

## Cập nhật mới nhất — danh sách học sinh bằng Excel
- Admin import Excel: mã học sinh tùy chọn, họ tên, lớp; xem trước rồi xác nhận. Mã trống tự sinh.
- Bảng học sinh có mã/tên/lớp/tài khoản/trạng thái; lọc lớp và xuất mã/tên của từng lớp để gửi học sinh.
- Chỉ học sinh có mã đã nhập được đăng ký bằng mã + đúng tên + email (giữ mật khẩu để đăng nhập). Mã dùng một lần, lớp tự gắn từ danh sách; thay thế đăng ký mở và chọn lớp tự do.
- Chế độ cần admin duyệt hoặc tham gia ngay vẫn áp dụng khi đăng ký.
- Ảnh tham khảo chỉ minh họa chức năng, không dùng nhận diện/màu cam của ảnh. Giữ tông xanh, thêm nền lá cây và viền nhẹ phân tách menu/nội dung.
- Frontend tiếp tục dùng dữ liệu trình duyệt. Đồng bộ roster và quyền đăng ký trên thiết bị khác cần backend/Firebase.

## Quyết định mới nhất — triển khai frontend A3
- Ngày 13/10/2026, người dùng gửi ảnh A3 và yêu cầu tiếp tục tạo web. Thiết kế A3 được chốt cho triển khai, thay thế các ghi chú đang chờ chốt bên dưới.
- Người dùng xác nhận admin có thể chọn hai chế độ tại cài đặt: cần admin duyệt hoặc chọn lớp là tham gia ngay.
- Chế độ áp dụng cho yêu cầu mới; yêu cầu đang chờ vẫn do admin xử lý. Chưa được duyệt thì chưa tích điểm cho lớp.
- Mức điểm mới áp dụng cho giao dịch mới; không tính lại lịch sử.
- Triển khai frontend với dữ liệu trình duyệt; chưa kết nối Firebase/ESP32.

Các mục bên dưới được giữ làm lịch sử brief; quyết định mới nhất ở trên có ưu tiên khi nội dung mâu thuẫn.

## Trạng thái
Brief được chốt và bổ sung ngày 13/10/2026. Hai vai trò hiện tại: user và admin. Admin quản lý nội dung, dashboard và điểm từng loại rác. Chưa có tên trường, tên sản phẩm, ảnh trường/logo; đã đồng ý dùng vùng giữ chỗ. Đã chọn hướng A, bản mới nhất A3 đang chờ chốt. Chưa viết code.

## Mục tiêu và đối tượng
Giúp học sinh phân loại rác và tích điểm thi đua cho lớp. User là học sinh bình thường; admin quản lý người dùng, nội dung và điểm. Không có vai trò nhóm trưởng riêng theo yêu cầu mới.

## Yêu cầu đã rõ cho frontend ở giai đoạn sau
- Nhận diện trường và sản phẩm dự thi bằng tên và ảnh do khách cung cấp.
- Đăng ký, đăng nhập.
- Chọn lớp 11T1, 11T2, 11T3. Cần xác nhận chuyển duyệt thành viên sang admin hay bỏ bước duyệt trong mô hình hai vai trò mới.
- Trang chủ hiển thị điểm cá nhân, điểm lớp, lịch sử bỏ rác và hai loại rác được chấp nhận: nhựa, kim loại.
- Bảng xếp hạng lớp có tên lớp, số điểm, số lần bỏ rác và bộ lọc tuần.
- Không có trang nhóm trưởng riêng trong phạm vi hai vai trò mới.
- Trang quản trị: người dùng, điểm tích lũy và cấu hình điểm cho từng loại rác; dashboard xem bảng điểm cá nhân và lớp.
- “Rác được nhận” hiển thị điểm ngay dưới tên từng loại trên desktop/mobile. User chỉ xem; admin chỉnh điểm từng loại ở trang quản trị. Điểm hiển thị và điểm dùng để cộng phải lấy từ cùng cấu hình.
- A3 dùng nhựa +10 điểm/lần, kim loại +20 điểm/lần để minh họa; chưa được xác nhận là mức chính thức.
- Admin quản lý thông tin website, bao gồm tên trường, tên sản phẩm, nội dung chữ/câu chữ và hình ảnh (kể cả logo). Nội dung học sinh nhìn thấy cần lấy từ cấu hình nội dung để có thể chỉnh sửa về sau.
- Giai đoạn frontend tĩnh có màn hình admin và tương tác chỉnh sửa thử; lưu nội dung thật, tải ảnh lên và áp dụng thay đổi cho mọi người dùng thuộc giai đoạn tích hợp sau.
- Luồng QR gắn tài khoản với phiên bỏ rác; trạng thái chờ duyệt, chờ nhận diện, chờ xác nhận đã bỏ rác, thành công và lỗi. Không cộng điểm chỉ vì camera nhận diện.
- Responsive trên điện thoại và máy tính; nội dung tiếng Việt.

## Quy trình nghiệp vụ đã cung cấp
Luồng được người dùng sửa và làm rõ ngày 13/10/2026:
1. Học sinh quét mã QR được dán trên thùng rác trước để mở website trong ngữ cảnh thùng đó.
2. Nếu chưa đăng nhập, website cho đăng nhập hoặc đăng ký; nếu đã đăng nhập, xác định tài khoản đang sử dụng. Người mới chọn lớp 11T1/11T2/11T3. Bước duyệt và quyền tích điểm khi chờ duyệt cần xác nhận theo mô hình user/admin mới.
3. Sau khi xác định tài khoản, gắn tài khoản với phiên bỏ rác và thùng đã quét. Cần giữ ngữ cảnh thùng xuyên suốt đăng nhập/đăng ký, tránh yêu cầu quét lại chỉ vì đăng nhập.
4. Website chuyển sang màn hình chờ kết quả bỏ rác từ cơ sở dữ liệu. Giao diện học sinh dùng câu chữ như “Đang chờ bạn bỏ rác”, không hiển thị thuật ngữ cơ sở dữ liệu.
5. Camera máy tính dùng mô hình Edge Impulse nhận diện nhựa hoặc kim loại. Mạch ESP32 điều khiển cảm biến, servo đóng/mở nắp thùng và đèn LED báo loại rác.
6. Khi cảm biến xác nhận rác đã được bỏ vào thùng thành công, ESP32 gửi loại rác, mã thùng, mã giao dịch và tài khoản qua Wi-Fi lên Firebase.
7. Hệ thống cộng điểm theo quy tắc từng loại rác, cập nhật điểm cá nhân và lớp đã tham gia cùng lịch sử. Mã giao dịch cần chống cộng trùng ở giai đoạn backend.

## Điều chỉnh giao diện theo luồng QR
- QR vật lý trên thùng là điểm bắt đầu luồng chính. Không mặc định học sinh phải đăng nhập trước rồi mới bấm nút quét QR trên trang chủ.
- Sau đăng nhập từ QR, ưu tiên màn hình phiên bỏ rác với thùng đang dùng, tài khoản/lớp và trạng thái chờ; có đường dẫn xem điểm/lịch sử.
- Không tự hiển thị “đã nhận diện” hoặc “đã xác nhận” chỉ dựa trên thời gian chờ. Các trạng thái này chỉ thể hiện khi hệ thống thực sự có dữ liệu tương ứng; nếu thiết bị chỉ gửi kết quả cuối thì giao diện chờ kết quả cuối.
- Các mockup A/B/C ban đầu chưa phản ánh đầy đủ luồng QR được sửa. Người dùng đã chọn hướng A và yêu cầu làm lại; đã tạo ảnh A2 theo luồng mới, đang chờ người dùng chốt bản sửa. Chưa triển khai code.

## Phần tích hợp sau frontend
- Firebase Realtime Database hoặc giải pháp tương thích để nhận dữ liệu từ ESP32 qua Wi-Fi và cập nhật gần như tức thì.
- Xác thực và phân quyền thật, nhận dữ liệu gần thời gian thực, cộng điểm tin cậy và chống cộng trùng mã giao dịch.
- Nhóm học sinh tự lo mạch, cảm biến, servo, LED và mô hình camera máy tính dùng Edge Impulse; sẽ cung cấp code/mã thiết bị để hỗ trợ kết nối.
- Người dùng cũng đề cập kết nối ESP32-CAM. Cần xác nhận vai trò ESP32-CAM so với camera máy tính khi bàn giao tích hợp, không tự thay camera nhận diện đã mô tả.
- Cần thống nhất cách truyền tài khoản/phiên từ website tới thiết bị, cách gắn kết quả với đúng phiên và các sự kiện trạng thái thiết bị có thể gửi trước khi triển khai backend.
- Hướng dẫn cấu hình Firebase, cấu trúc dữ liệu, kết nối thiết bị và kiểm thử đầu cuối khi triển khai tích hợp.

## Ràng buộc đã xác nhận
- Frontend ban đầu dùng dữ liệu tĩnh; Firebase, xác thực thật, nhận dữ liệu thiết bị, chống giao dịch trùng và hướng dẫn tích hợp thuộc giai đoạn sau.
- Không đưa thông tin kỹ thuật Firebase/ESP32 lên giao diện học sinh.
- Giữ nguyên ảnh/logo được cung cấp; không tự bịa tên, tạo ảnh trường giả hoặc giả định đã nhận tài sản thương hiệu.
- Số liệu minh họa chỉ phục vụ thiết kế, không trình bày như thành tích thật của trường.
- Font hỗ trợ tiếng Việt, phân cấp rõ, tương phản tốt, nút chạm đủ lớn và biểu tượng nhất quán. Không nhồi mọi phần vào các thẻ giống nhau.
- Trong mockup khi chưa có tài sản thương hiệu: để nhãn giữ chỗ cho tên trường/tên sản phẩm, vùng giữ chỗ cho ảnh trường/logo, không tạo nhận diện hoặc ảnh trường giả. Hướng A thể hiện khu vực dành cho ảnh trường để bổ sung sau.

## Giả định đề xuất, chưa được xác nhận
- Chỉ thành viên được duyệt mới được ghi điểm cho lớp.
- Hiển thị điểm cá nhân và điểm lớp riêng biệt để tránh hiểu nhầm.
- Điểm từng loại rác, quy tắc tuần, quyền đổi lớp cần chốt trước backend. Đề xuất sửa mức điểm chỉ áp dụng cho giao dịch mới, không tính lại điểm lịch sử; chưa xác nhận.

## Cần bổ sung cho thiết kế
- Với hai vai trò user/admin, admin duyệt thành viên mới hay bỏ bước duyệt? Nếu vẫn chờ duyệt, cần xác nhận quyền bỏ rác/tích điểm trong thời gian chờ.
- Tên trường, tên sản phẩm dự thi và ảnh trường/logo sẽ bổ sung sau; người dùng đã đồng ý dùng vùng giữ chỗ trong mockup.
- Điểm cho nhựa và kim loại chưa có giá trị chính thức; chỉ dùng số liệu minh họa nhất quán giữa ba phương án khi tạo mockup.
- Hướng A đã được chọn; cần chốt bản sửa A3 trước khi dựng frontend.

## Ba hướng mockup đã yêu cầu
Sau khi người dùng chốt brief, tạo ba ảnh riêng biệt, cùng nội dung và kích thước; mỗi ảnh thể hiện trang chủ học sinh trên desktop cùng một màn hình mobile tương ứng.
- A — Trường học xanh: ảnh trường làm điểm nhấn, xanh lá trên nền sáng, ưu tiên tổng quan hoạt động và thao tác quét QR.
- B — Thi đua lớp học: xanh dương/vàng, bảng xếp hạng và tiến độ lớp làm điểm nhấn, vui nhưng dễ đọc.
- C — Trạm phân loại thông minh: xanh teal, phiên bỏ rác và trạng thái xử lý làm điểm nhấn, gọn và hiện đại.

Các phương án phải khác rõ bố cục và cách ưu tiên nội dung, không chỉ đổi màu. Hiển thị ảnh A/B/C kèm giải thích ngắn để chọn hoặc mix. Khi được yêu cầu mix, tạo một ảnh kết hợp để người dùng chốt. Nếu không tạo được ảnh, báo rõ và chờ quyết định; không thay bằng mô tả hoặc code.

## Quy trình tiếp theo
Theo client-web-flow: chuẩn bị prompt → làm rõ brief và tạo ba mockup trong ChatGPT → nhận ảnh được chọn và thông tin thương hiệu → dựng frontend ở Codex → bàn giao kế hoạch backend theo yêu cầu.

Khi người dùng yêu cầu bàn giao thiết kế, xuất CLIENT_BRIEF.md, DESIGN_SELECTION.md và ảnh đã chốt để tải về. DESIGN_SELECTION.md ghi bản chọn, các chỉnh sửa, màu/font, màn hình và câu hỏi còn thiếu. Không ghi đã duyệt trước khi người dùng chọn.
