# Hợp đồng kết nối sau giai đoạn frontend

Tài liệu này mô tả điểm nối đã chuẩn bị; chưa triển khai Firebase hoặc ESP32. Không thay PLAN.md bàn giao backend khi người dùng yêu cầu hết demo.

## Ngữ cảnh QR và phiên
QR vật lý mở `https://<domain>/?bin=R01`. Frontend giữ mã thùng qua đăng nhập/đăng ký. Backend phải xác minh thùng và tạo sessionId duy nhất, gắn userId/classId lấy từ tài khoản đã xác thực; không tin mã người dùng do thiết bị tự khai báo.

Đề xuất phiên có `id`, `binId`, `userId`, `classId`, `status`, `createdAt`, `expiresAt`. Các trạng thái: waiting, recognized (nếu thiết bị có sự kiện), confirmed, failed, expired. Chỉ hiển thị recognized/confirmed nếu có dữ liệu thật; timeout thành expired phải do chính sách/backend rõ ràng.

## Dữ liệu đề xuất
```json
{
  "users": {"uid": {"name": "…", "classId": "11T1", "membership": "approved", "role": "user", "points": 0}},
  "classes": {"11T1": {"name": "11T1"}, "11T2": {"name": "11T2"}, "11T3": {"name": "11T3"}},
  "settings": {"approvalMode": "required", "points": {"plastic": 10, "metal": 20}},
  "bins": {"R01": {"enabled": true}},
  "sessions": {"sessionId": {"userId": "uid", "binId": "R01", "status": "waiting"}},
  "transactions": {"transactionId": {"sessionId": "sessionId", "binId": "R01", "type": "plastic", "sensorConfirmed": true, "createdAt": 0}},
  "weeklyClassStats": {"2026-10-12": {"11T1": {"points": 0, "count": 0}}}
}
```

## Phần ghi và cộng điểm
Thiết bị gửi `transactionId`, `sessionId`, `binId`, `type`, `sensorConfirmed`, thời gian và định danh thiết bị qua cơ chế xác thực riêng. Server kiểm tra session còn hạn, thùng đúng, thành viên đã tham gia, cảm biến xác nhận, loại rác hợp lệ. Chống xử lý trùng transactionId bằng ghi nguyên tử; lấy điểm từ cấu hình server và ghi snapshot điểm vào giao dịch. Cộng điểm cá nhân/lớp/tuần theo Asia/Ho_Chi_Minh trong cùng nghiệp vụ tin cậy. Thiết bị và tài khoản học sinh không được tự ghi điểm/tổng lớp.

Repository frontend có `recordDeposit({id,userId,binId,type,confirmed,at})` làm ranh giới nghiệp vụ cục bộ và có test xác nhận/chống trùng. Khi nối thật, thay bằng đọc kết quả giao dịch do server xác nhận; không dùng hàm cục bộ làm nguồn điểm tin cậy.

## Firebase cần chuẩn bị ở giai đoạn sau
1. Khách cung cấp project/config phù hợp; dùng biến môi trường cho cấu hình client. Không đưa private key/service account vào frontend.
2. Kết nối Firebase Auth; bỏ tài khoản seed và liên kết xem admin, phân quyền bằng claim/rules/server.
3. Tạo Realtime Database, rules giới hạn tài khoản/thiết bị và dịch vụ cộng điểm phía server.
4. Đăng ký listener cho phiên, điểm, lịch sử và bảng tuần; hủy listener khi đổi phiên/đăng xuất. Hiển thị kết nối lại và lỗi nếu mất mạng.
5. Đưa logo/ảnh vào storage; dữ liệu nội dung admin được bảo vệ và chia sẻ cho toàn trường.
6. Dùng mã thiết bị thực tế từ khách để map schema; xác nhận camera máy tính Edge Impulse hay ESP32-CAM đảm nhiệm phần nào.

## Kiểm tra đầu cuối khi đã kết nối
- QR → đăng nhập/đăng ký → chọn lớp: đúng thùng, đúng người, đúng phiên.
- Hai chế độ gia nhập lớp; yêu cầu chờ không được cộng điểm trước duyệt.
- Nhận diện đúng nhưng chưa cảm biến: chưa cộng điểm.
- Xác nhận nhựa/kim loại: ghi đúng một giao dịch, cập nhật cá nhân/lớp/tuần.
- Gửi lặp, mất Wi-Fi rồi retry: không cộng hai lần.
- Sai thùng/phiên, expired, loại rác ngoài danh sách: từ chối và có trạng thái phù hợp.
- Mức điểm mới chỉ ảnh hưởng giao dịch mới. Ranh giới thứ Hai 00:00 theo Việt Nam được kiểm tra.

## Chưa chốt cho backend
Điểm chính thức, chính sách đổi lớp, timeout phiên, quyền điều chỉnh điểm, gắn session với thiết bị và kiểu sự kiện firmware. Cần mã firmware/cấu hình dự án và thử nghiệm thiết bị thật trước khi tuyên bố tích hợp hoạt động.
