# File nào hỗ trợ việc làm backend?

## Bổ sung: danh sách lớp động
`src/class-registry.js` chuẩn hóa tên và migration, `src/class-panel.js` quản lý lớp ở Cài đặt. Repository thêm `classes/addClass/renameClass/removeClass`, preview import có `newClasses`. Backend phải tạo lớp mới cùng import, giữ liên kết khi đổi tên, ngăn xóa lớp có dữ liệu và phân quyền server. Không còn whitelist ba lớp cố định trong nghiệp vụ.

## Bổ sung mới: học sinh nhập từ Excel
Đọc `STUDENT_IMPORT_GUIDE.md` và `STUDENT_IMPORT_PLAN.md`. `src/roster.js` chứa validation/mã tự sinh, `src/student-excel.js` đọc/ghi workbook, `src/student-views.js` có bảng roster và đăng ký hai bước. Repository có `students`, `previewStudents`, `importStudents`, `verifyStudent`; `register` hiện bắt buộc studentCode và claim một lần. Backend cần thực thi import/verify/claim dưới quyền server, dữ liệu roster dùng chung, classId từ roster; không giữ cách kiểm tra toàn danh sách ở client khi làm thật.

## Bắt đầu từ tài liệu
1. `CLIENT_BRIEF.md`: nghiệp vụ đã chốt, đặc biệt hai chế độ gia nhập lớp và QR trước đăng nhập.
2. `DESIGN_SELECTION.md`: bố cục A3 và các quyết định giao diện.
3. `INTEGRATION_CONTRACT.md`: phiên bỏ rác, payload thiết bị, dữ liệu dự kiến, nguyên tắc cộng điểm và checklist kiểm tra đầu cuối.
4. `CLOUDFLARE_TUNNEL.md`: cách chạy được chọn, máy host web và Tunnel cho đường link truy cập. `CLOUDFLARE_SETUP.md` là lựa chọn deploy Workers riêng.

Đây là tài liệu bàn giao phạm vi, không phải backend đang chạy. `FRONTEND_PLAN.md` là kế hoạch frontend đã thực hiện, không dùng thay kế hoạch backend.

## File mã nguồn cần thay/nối
| File hiện tại | Nhiệm vụ | Khi làm backend |
|---|---|---|
| `src/repository.js` | Giao diện truy cập tài khoản, người dùng, lớp, lịch sử, điểm, cài đặt; hiện localStorage | Thay bằng adapter gọi Auth/API/database. Chuyển cộng điểm và duyệt sang server có quyền, giữ snapshot điểm giao dịch. |
| `src/main.js` | Router, gửi form và render sau thay đổi | Thêm await/loading/error, listener realtime, hủy listener lúc logout/đổi phiên. Hiện nhiều hàm repository là đồng bộ; không thể đổi sang API async rồi giữ nguyên mọi call site. |
| `src/bin-context.js` | Đọc mã thùng QR và giữ qua đăng nhập | Chỉ là ngữ cảnh UI; backend xác minh thùng và tạo sessionId gắn tài khoản thật. |
| `src/config.js` | Nội dung, điểm, danh sách tuần mặc định | Lấy nội dung/điểm từ server. Các tuần cần sinh hoặc truy vấn theo dữ liệu thật. |
| `src/fixtures.js` | Tài khoản/giao dịch và snapshot lớp minh họa | Thay bằng dữ liệu thật, trạng thái rỗng; không import dữ liệu minh họa vào hệ thống thật. |
| `src/views.js` | Các màn hình | Giữ thiết kế, nối quyền thật và trạng thái kết nối/phiên, bỏ liên kết bypass admin khi làm thật. |
| `tests/repository.test.js` | Quy tắc điểm, lớp, giao dịch và lỗi lưu trữ | Dùng làm yêu cầu nghiệp vụ; bổ sung test server/rules/idempotency, không lấy test local làm bằng chứng server an toàn. |
| `tests/bin-context.test.js`, `tests/browser.cjs` | QR và hành trình UI | Chuyển sang môi trường test của backend và dữ liệu test riêng. |
| `wrangler.json` | Deploy static frontend từ dist | Chỉ thêm API/bindings nếu chọn Worker backend; hiện không có API hoặc database binding. |

## Thứ tự triển khai backend đề xuất
1. Xác nhận cấu hình Firebase, phần camera/ESP32 và giao thức phiên giữa website/thiết bị.
2. Firebase Auth hoặc giải pháp tương thích; xác thực server và phân quyền học sinh/admin thật.
3. Dữ liệu tài khoản/lớp và chế độ gia nhập, duyệt có kiểm tra quyền.
4. Phiên QR có ID duy nhất, hết hạn và ràng buộc userId/binId/classId.
5. Thiết bị gửi kết quả có xác thực; xử lý giao dịch chống trùng và cộng điểm nguyên tử phía server.
6. Listener realtime cập nhật phiên/điểm/lịch sử/bảng lớp; ảnh/nội dung admin chuyển sang storage/database thật.
7. Kiểm tra hai thiết bị/tài khoản, mất mạng/retry, mã trùng, sai phiên, ranh giới tuần và mức điểm mới.
8. Deploy frontend lên Cloudflare, cấu hình domain/Auth đúng và kiểm tra lại với thiết bị thật.

Chưa triển khai các bước backend này trong lần setup Cloudflare. Dự án chưa có Firebase SDK, Firebase Rules, Worker API hoặc dịch vụ cộng điểm phía server.
