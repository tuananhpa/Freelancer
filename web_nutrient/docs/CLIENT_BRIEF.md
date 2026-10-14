# CLIENT BRIEF — NuTri Teens

Ngày khảo sát: 2026-10-14. Trạng thái: đã khảo sát bản public; chưa chốt thiết kế; chưa triển khai.
Ngôn ngữ: tiếng Việt. Đối tượng: tuổi teen. Responsive: điện thoại và desktop.

## Yêu cầu đã xác nhận
- Xây lại UI/UX frontend và toàn bộ backend trên Cloudflare.
- Bao phủ tính năng app tham chiếu; không chỉ dựng landing page.
- Có giao diện gửi Gemini API key mới để thay; không hiển thị hoặc trả về key đã lưu.
- Dùng client-web-flow. Yêu cầu backend thật của người dùng được ưu tiên hơn bước backend plan mặc định.

## Nguồn và giới hạn
- Public app: https://remix-remix-nutri-teens-910-4541.ai.studio/
- AI Studio: https://aistudio.google.com/apps/f3fa0ced-d845-467a-8407-c22e564c5f92
- AI Studio chuyển tới đăng nhập Google; chưa truy cập source.
- Khảo sát UI bằng hồ sơ giả KhaoSatUI, tuổi/chiều cao/cân nặng mặc định; không dùng dữ liệu sức khỏe người thật.
- Danh sách dưới đây phản ánh màn hình đã quan sát, không chứng minh backend gốc hoạt động.
- Thư mục dự án trống lúc khảo sát. Chưa có source để chuyển dữ liệu/nội dung nguyên vẹn.

## Phạm vi tính năng đã quan sát
1. Tài khoản: đăng nhập bằng biệt danh và mật khẩu; tạo hồ sơ 5 bước.
2. Hồ sơ: tên, avatar có sẵn hoặc tải ảnh, tuổi, giới tính, chiều cao, cân nặng.
3. Cá nhân hóa: bệnh nền/dị ứng, hạn chế vận động, thói quen ăn/ngủ/nước; mục tiêu thể chất hoặc tùy nhập.
4. Phân tích AI: thể trạng, mục tiêu năng lượng/nước, chiến lược dinh dưỡng và vận động.
5. Dashboard: năng lượng đã nạp/còn lại, carbs/protein/fat, nước uống, bữa ăn hôm nay, phím tắt.
6. Quét món: camera trước/sau, camera thiết bị, tải ảnh, nhập tên món; chọn giờ và một trong 4 bữa.
7. Nhật ký: ngày/giờ, 4 khung bữa ăn, ảnh, năng lượng và macros.
8. Thống kê: theo giờ trong ngày và 7 ngày; tổng năng lượng/nước/protein/số bữa.
9. Lộ trình: trang chủ ghi 14 ngày nhưng trang chi tiết có 30 ngày; chọn ngày, 4 bữa, công thức, bài tập, đánh dấu hoàn thành, cập nhật bằng AI.
10. Theo dõi nước và cân nặng; thêm món, gợi ý món, đổi mục tiêu.
11. Chat AI: cá nhân hóa theo hồ sơ; nhóm chủ đề, câu hỏi gợi ý, sao chép, làm mới cuộc trò chuyện.
12. Khoa học: 33 thí nghiệm có tìm kiếm, tuổi phù hợp, xem phản ứng và hướng dẫn chi tiết.
13. Món lành mạnh: 8 mục đã quan sát; lọc tất cả/ăn nhẹ/đồ uống, xem công thức.
14. Mỹ phẩm tự chế: 4 mục đã quan sát; xem quy trình.
15. Công cụ ảo: pH bắp cải tím (6 chất); hòa tan theo nhiệt độ/khuấy/cỡ hạt; cấu trúc/tiêu hóa/vai trò của 5 nhóm chất.
16. Ẩm thực thế giới: Việt Nam/Nhật Bản/Italia; chọn món; công thức Việt hóa/bản địa; hướng dẫn; tải ảnh thành tích/nộp nhanh.
17. XP, chuỗi ngày, huy hiệu, album thành tích.
18. Nhắc ăn sáng/trưa/phụ/tối, nhắc nước, hỏi thăm AI, nhắc chuỗi ngày; âm thanh/rung; cài app ra màn hình.
19. Cài đặt: avatar, thông tin, mục tiêu, tái phân tích AI, nền trái cây/tùy chỉnh, sao lưu ngay/hằng ngày, đổi tài khoản, đăng xuất.

## Chất lượng cần sửa
- Thống nhất thời lượng lộ trình (đề xuất 30 ngày vì trang chi tiết có đủ lựa chọn).
- Chuẩn hóa nước theo ml trong dữ liệu, đổi sang lít duy nhất tại lớp hiển thị; app gốc hiển thị 2000 L và 2000000 ml.
- Mục tiêu calo/macros giữa dashboard/lộ trình/thống kê hiện không đồng nhất.
- Không bật nội dung hạn chế vận động hoặc bệnh lý khi hồ sơ không có điều kiện tương ứng.
- Không sao chép các cam kết an toàn 100%, chứng nhận hay danh xưng y khoa chưa kiểm chứng.
- Phân biệt số liệu đo/nhập và ước lượng AI; cho sửa trước khi lưu.
- Nội dung sức khỏe cho trẻ vị thành niên cần kiểm duyệt trước khi đưa production.

## Kiến trúc đề xuất, chưa triển khai
- React + TypeScript + Vite frontend.
- Cloudflare Workers phục vụ static assets và /api cùng origin.
- D1: users, sessions, profiles, meals, water/weight logs, plans, content, progress, badges, reminder subscriptions.
- R2 private: ảnh món, avatar, bài nộp và bản sao lưu; kiểm quyền truy cập qua Worker.
- Gemini gọi từ Worker; browser không gọi trực tiếp.
- PWA + service worker + Web Push; lịch phía server theo Asia/Saigon.
- Auth phiên cookie HttpOnly/Secure/SameSite; mật khẩu hash; rate limiting và phân quyền trên server.

## Luồng Gemini key đề xuất
Giả định đang chờ xác nhận: một khóa dùng chung do quản trị viên thay.
- Trang quản trị riêng có xác thực và kiểm quyền server; ẩn đường dẫn/nút không đủ bảo mật.
- Ô password nhập khóa MỚI, không có chức năng xem khóa hiện tại.
- PUT /api/admin/integrations/gemini: gửi khóa trong body HTTPS một lần.
- Server kiểm định với Gemini, lưu ciphertext mã hóa AES-GCM vào D1; khóa mã hóa gốc đặt trong Worker secret.
- API chỉ trả configured, updatedAt, trạng thái; không trả key, phần key hoặc ciphertext.
- Xóa nội dung ô nhập sau gửi; không localStorage/sessionStorage/URL, không log body.
- Chỉ Worker giải mã để gửi tới Google Gemini.
- Kiểm thử quyền admin, CSRF/origin, lỗi upstream và bảo đảm response/log không rò khóa.
- Khóa mới do người nhập vẫn hiện diện tạm thời trong bộ nhớ và request của chính trình duyệt đó; không hứa giấu được khỏi DevTools của người nhập.

## Quyết định còn thiếu
- Chọn hướng UI sau mockup hoặc cho phép bỏ bước mockup.
- Khóa Gemini dùng chung cho admin hay khóa riêng từng người? Mặc định đề xuất admin dùng chung.
- Cần source export AI Studio để đối chiếu đủ nội dung/công thức và quy tắc nghiệp vụ ẩn.
- Chưa có tài khoản Cloudflare/domain để deploy hoặc Gemini key thật để kiểm thử live.
