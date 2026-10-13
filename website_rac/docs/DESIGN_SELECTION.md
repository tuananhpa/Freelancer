# Lựa chọn thiết kế

## Đã chốt để triển khai — 13/10/2026
Người dùng gửi ảnh A3 và yêu cầu bắt đầu tạo web. Dùng `docs/mockups/A3-approved.png` làm tham chiếu; các ghi chú chờ chốt A2/A3 bên dưới là lịch sử.

Hệ thị giác: text #102620, primary #178037, primary-dark #11672b, mint #edf9f0, border #e1ece5, amber #a96600. Font hệ thống hỗ trợ tiếng Việt, nhịp 4/8px, góc bo 12–24px, SVG nhất quán. Giữ bố cục phiên bỏ rác + ảnh trường, dải điểm, rác được nhận/lịch sử/thi đua; mobile dùng thanh điều hướng dưới.

Tên trường, sản phẩm, logo và ảnh chưa có: giữ vùng bổ sung, admin chỉnh nội dung/ảnh trong bản frontend. Không tự tạo ảnh trường hoặc tên giả. Trang admin có chế độ duyệt hoặc tham gia ngay theo yêu cầu mới nhất.

## Cập nhật hiện hành — A3
Người dùng đã chọn hướng A. Bản mới nhất [A3 desktop và mobile](mockups/A3-truong-hoc-xanh-diem-rac.png), 1536 × 1024 px, đang chờ chốt; chưa viết code. Những ghi chú A2/nhóm trưởng bên dưới là lịch sử trước bổ sung mới.

- Chỉ có hai vai trò user và admin, không có trang/role nhóm trưởng riêng. Cần xác nhận admin duyệt thành viên hay bỏ bước duyệt.
- “Rác được nhận” có +10 điểm/lần dưới Nhựa và +20 điểm/lần dưới Kim loại trên cả desktop/mobile; đây là mức minh họa chưa xác nhận chính thức.
- Admin chỉnh mức điểm từng loại ở trang quản trị; user chỉ xem. Điểm hiển thị và điểm cộng lấy từ cùng cấu hình.
- Giữ luồng sau quét QR/đăng nhập: chờ kết quả, chỉ cộng điểm khi xác nhận rác đã vào thùng. Giữ ảnh/logo giữ chỗ và phong cách xanh sáng của A.
- Ảnh A3 được tạo bằng image_gen built-in, chỉnh từ A2. Prompt tại [A3-PROMPTS.md](mockups/A3-PROMPTS.md).

Trạng thái: brief đã chốt ngày 13/10/2026; đã tạo ba mockup A/B/C. Người dùng đã chọn hướng A và yêu cầu sửa theo luồng QR mới. Đã tạo A2 để xem và chốt; A2 chưa được duyệt, chưa viết code.

Ba hướng đề xuất để tạo ảnh so sánh:
- A: trường học xanh, ảnh trường làm điểm nhấn, bố cục gọn và dễ sử dụng.
- B: thi đua lớp học, bảng xếp hạng làm điểm nhấn, màu xanh dương và vàng.
- C: trạm phân loại thông minh, phiên bỏ rác và trạng thái thiết bị làm điểm nhấn, màu xanh teal.

Chưa chốt màu, font, bố cục hoặc ảnh tham chiếu. Không coi các đề xuất này là quyết định của người dùng.

## Ảnh để so sánh
- A: [Trường học xanh](mockups/A-truong-hoc-xanh.png). Thanh điều hướng ngang, vùng ảnh trường lớn, thao tác QR và tổng quan hoạt động nổi bật. Màu dự kiến: #166534, #65A30D, #F0FDF4.
- B: [Thi đua lớp học](mockups/B-thi-dua-lop-hoc.png). Điều hướng bên trái, bảng xếp hạng dạng thanh so sánh, điểm lớp và CTA vàng. Màu dự kiến: #1D4ED8, #FACC15, #EFF6FF.
- C: [Trạm phân loại thông minh](mockups/C-tram-phan-loai.png). Khu vực phiên bỏ rác với tiến trình và trạng thái chờ xác nhận; điểm và bảng xếp hạng hỗ trợ. Màu dự kiến: #0F766E, #14B8A6, #F0FDFA.

Ba ảnh PNG cùng kích thước thực tế 1536 × 1024 px, mỗi ảnh có desktop và mobile tương ứng. Font dự kiến khi dựng frontend: Be Vietnam Pro; ảnh sinh chỉ thể hiện phong cách chữ, chưa xác minh font thật. Dữ liệu đều minh họa. Tên trường, tên sản phẩm, logo và ảnh trường là vùng giữ chỗ đã được người dùng đồng ý.

## Kiểm tra và giới hạn
- Cả ba ảnh có điểm cá nhân 120, điểm lớp 11T1 1.250; bảng xếp hạng 11T2/11T1/11T3 cùng điểm và lượt bỏ rác; nhựa và kim loại; lịch sử thành công và phiên hiện tại chờ xác nhận.
- Phiên đang chờ chưa được cộng điểm chỉ từ nhận diện. Không có thông tin Firebase/ESP32 trong UI học sinh.
- Chữ, biểu tượng, bố cục mobile và màu cụ thể cần chuẩn hóa khi triển khai. Ảnh là định hướng thị giác, chưa phải giao diện tương tác đã kiểm thử.
- Các màn hình đăng nhập, đăng ký, chờ duyệt, nhóm trưởng và admin thuộc brief; ba ảnh hiện tại chỉ minh họa trang chủ học sinh theo yêu cầu. Admin chỉnh nội dung/hình ảnh/logo và dashboard vẫn trong phạm vi frontend sau này.
- Prompts và công cụ tạo ảnh được lưu tại [PROMPTS.md](mockups/PROMPTS.md).

## Quyết định đang chờ
Người dùng đã chọn hướng A qua ảnh đính kèm. Đang chờ chốt bản A2 hoặc yêu cầu sửa tiếp; không cần chọn lại A/B/C.

## Sửa luồng sau khi tạo ảnh — 13/10/2026
Người dùng làm rõ thứ tự: quét QR trên thùng → đăng nhập/đăng ký hoặc nhận tài khoản đã đăng nhập → gắn phiên và thùng → màn hình chờ kết quả → cảm biến xác nhận → nhận giao dịch hợp lệ và cộng điểm.

Các ảnh A/B/C hiện tại là bản trước điều chỉnh này, chưa được duyệt. Khi chỉnh thiết kế cần ưu tiên màn hình phiên sau đăng nhập từ QR và giữ ngữ cảnh thùng, thay vì coi nút quét QR trên trang chủ sau đăng nhập là điểm bắt đầu bắt buộc. Chỉ hiển thị tiến trình nhận diện/xác nhận khi có dữ liệu tương ứng từ hệ thống. Câu hỏi đang chờ: người dùng mới còn chờ duyệt có được bỏ rác/tích điểm không?

## A2 — hướng A sửa theo luồng QR mới
- Ảnh: [A2 desktop và mobile](mockups/A2-truong-hoc-xanh-luong-qr.png), 1536 × 1024 px.
- Giữ phong cách xanh sáng của A, ảnh trường/logo/tên giữ chỗ, điểm và lịch sử, bảng thi đua.
- Phiên bỏ rác đưa lên đầu; hiển thị thùng R01 minh họa, tài khoản học sinh/lớp 11T1, “Đã quét QR”, “Đã đăng nhập”, “Đang chờ kết quả bỏ rác”.
- Bỏ CTA quét QR ở màn hình đã vào phiên. Chỉ giữ hướng dẫn quét mã trên thùng cho lần sau.
- Không giả trạng thái nhận diện/xác nhận thành công; ghi rõ chỉ cộng điểm khi xác nhận rác đã vào thùng.
- Mobile ưu tiên phiên chờ trước ảnh trường và điểm. Các giao dịch thành công là lịch sử trước đó, không phải phiên đang chờ.
- Tài khoản minh họa đã được duyệt; không suy diễn quy tắc cho thành viên chờ duyệt. Quy tắc đó vẫn cần xác nhận.
- Công cụ: image_gen built-in, dùng ảnh A do người dùng đính kèm làm ảnh tham chiếu. Đã sửa vùng ảnh trường về vùng giữ chỗ trống; bản trung gian có ảnh trường tự sinh bị loại, không dùng làm thiết kế bàn giao.
- Trạng thái: đã chọn hướng A; chưa chốt bản sửa A2.
