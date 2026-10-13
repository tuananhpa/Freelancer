# Prompt thiết kế để dán vào ChatGPT

Tôi cần thiết kế frontend website tích điểm phân loại rác cho học sinh. Chỉ làm rõ brief và tạo 3 mockup hình ảnh A/B/C, chưa viết code. Tôi sẽ mang thiết kế được chọn về Codex để dựng frontend.

Thông tin thương hiệu: tên trường và tên sản phẩm dự thi chưa cung cấp. Hỏi tôi thông tin này cùng ảnh trường/logo cần sử dụng; không tự bịa tên hoặc tạo ảnh trường giả. ChatGPT không đọc được file trên máy tôi; tôi sẽ đính kèm ảnh trực tiếp.

Yêu cầu đã xác định:
- Website tiếng Việt, dùng tốt trên điện thoại và máy tính.
- Có đăng ký, đăng nhập, chọn lớp 11T1/11T2/11T3, chờ nhóm trưởng duyệt.
- Trang chủ có điểm cá nhân, điểm lớp, lịch sử bỏ rác và loại rác được nhận: nhựa, kim loại.
- Thi đua giữa lớp: tên lớp, điểm, số lần bỏ rác, xem theo tuần.
- Nhóm trưởng duyệt thành viên. Quản trị viên quản lý người dùng, điểm và cấu hình điểm mỗi loại rác.
- Quét QR trên thùng gắn tài khoản với phiên bỏ rác. Camera máy tính với Edge Impulse nhận diện; cảm biến xác nhận đã bỏ rác; ESP32 gửi loại rác, mã thùng, mã giao dịch, tài khoản qua Wi-Fi lên Firebase để cộng điểm cho cá nhân/lớp.
- Cần thể hiện trạng thái chờ duyệt, chờ nhận diện, chờ xác nhận, thành công và lỗi. Không cộng điểm chỉ vì camera nhận diện.
- Giai đoạn hiện tại chỉ dựng frontend với dữ liệu tĩnh. Firebase, xác thực thật, nhận dữ liệu thiết bị, chống giao dịch trùng và hướng dẫn tích hợp là giai đoạn sau. Không đưa thông tin kỹ thuật Firebase/ESP32 lên giao diện học sinh.

Tận dụng brief này, chỉ hỏi một vấn đề trọng tâm mỗi lượt nếu còn thiếu thông tin thiết yếu. Tóm tắt CLIENT_BRIEF.md, phân biệt yêu cầu đã rõ, giả định và câu hỏi còn thiếu. Sau khi tôi chốt brief, tạo ba ảnh mockup riêng biệt với cùng nội dung và kích thước: trang chủ học sinh trên desktop kèm một màn hình mobile tương ứng trong mỗi ảnh.

Ba hướng cần khác nhau rõ rệt, không chỉ đổi màu:
A. Trường học xanh: ảnh trường làm điểm nhấn, xanh lá trên nền sáng, ưu tiên tổng quan hoạt động và thao tác quét QR.
B. Thi đua lớp học: xanh dương/vàng, bảng xếp hạng và tiến độ lớp làm điểm nhấn, vui nhưng dễ đọc.
C. Trạm phân loại thông minh: xanh teal, phiên bỏ rác và trạng thái xử lý làm điểm nhấn, gọn và hiện đại.

Giữ nguyên ảnh/logo tôi cung cấp; chọn font hỗ trợ tiếng Việt. Dùng phân cấp rõ, tương phản tốt, nút chạm đủ lớn, biểu tượng nhất quán. Không nhồi mọi phần vào các thẻ giống nhau. Số liệu minh họa phục vụ thiết kế, không trình bày như thành tích thật của trường.

Hiển thị ảnh A/B/C cùng giải thích ngắn để tôi chọn hoặc mix. Mockup phải là ảnh thật, không thay bằng mô tả chữ hoặc code. Nếu không tạo được ảnh, nói rõ và chờ quyết định. Khi tôi muốn mix, tạo một ảnh kết hợp để tôi chốt.

Khi tôi yêu cầu bàn giao, xuất CLIENT_BRIEF.md, DESIGN_SELECTION.md (bản chọn, các chỉnh sửa, màu/font, màn hình và câu hỏi còn thiếu) cùng ảnh đã chốt để tải về. Không tự ghi thiết kế đã duyệt trước khi tôi chọn.
