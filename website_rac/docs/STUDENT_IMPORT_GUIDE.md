# Nhập học sinh và đăng ký bằng mã

## Admin nhập danh sách
1. Vào **Quản trị → Học sinh**.
2. Chọn **Tải file mẫu**. File có sheet danh sách và hướng dẫn; sửa/xóa hai dòng ví dụ trước khi nhập danh sách thật.
3. Điền **Họ và tên**, **Lớp** (ví dụ 11T10, 12A1). Lớp mới sẽ được tự tạo khi xác nhận import. **Mã học sinh** tùy chọn, để trống để web tạo mã HS…; nếu dùng mã số sẵn có, đặt cột Excel là Text để giữ số 0 ở đầu.
4. Chọn file .xlsx/.xls rồi **Xem trước danh sách**. Chưa có dữ liệu nào được nhập ở bước này.
5. Kiểm tra mã, tên, lớp và số dòng thêm/bỏ qua rồi **Xác nhận nhập**.

File tối đa 10 MB, tổng danh sách tối đa 5.000 học sinh. File có dòng lỗi sẽ bị từ chối toàn bộ để bạn sửa rồi nhập lại. Sheet Hướng dẫn được bỏ qua; những sheet danh sách còn lại đều được đọc và cần cột Họ và tên/Lớp. Không dùng công thức trong ba cột học sinh.

## Xuất mã để gửi học sinh
Chọn bất kỳ lớp hiện có ở bộ lọc rồi **Xuất Excel**. File gồm mã, tên, lớp. Chọn tất cả lớp thì mỗi lớp nằm trong một sheet. Bộ lọc tìm kiếm chỉ ảnh hưởng bảng hiển thị; file xuất gồm toàn bộ học sinh của lớp được chọn, để tránh bỏ sót khi còn từ khóa tìm kiếm.

## Admin quản lý lớp
Vào **Cài đặt → Quản lý lớp** để thêm lớp, đổi tên hoặc xóa lớp trống. Đổi tên cập nhật đồng bộ lớp của học sinh, tài khoản, lịch sử và dữ liệu thi đua; mã học sinh/điểm được giữ. Không xóa lớp đã có học sinh, tài khoản hoặc dữ liệu điểm. Tên lớp tối đa 31 ký tự để xuất được thành tên sheet Excel.

Khi xem trước Excel, web báo các lớp mới sẽ tạo; chưa lưu ở bước xem trước. Khi xác nhận, học sinh và lớp mới được lưu cùng nhau. File có dòng lỗi không tạo lớp hoặc học sinh dở dang.

## Học sinh đăng ký
1. Mở website hoặc quét QR thùng rác, chọn Đăng ký.
2. Nhập mã và họ tên trong danh sách, chọn **Kiểm tra thông tin học sinh**. Không cần chọn lớp; lớp lấy từ danh sách nhà trường.
3. Nhập email, mật khẩu và xác nhận mật khẩu để tạo tài khoản. Tên được lưu theo tên chuẩn trong danh sách.
4. Mã chỉ dùng cho một tài khoản. Đã đăng ký thì dùng email/mật khẩu để đăng nhập.

Họ tên không phân biệt hoa/thường hoặc số khoảng trắng, nhưng cần đúng dấu tiếng Việt. Mã chưa có, sai tên hoặc mã đã dùng không được tạo tài khoản mới.

## Duyệt và trạng thái
Trong Cài đặt, admin chọn **Cần admin duyệt** hoặc **Tham gia lớp ngay khi đăng ký**. Khi cần duyệt, tài khoản được tạo nhưng chưa được ghi điểm đến khi duyệt. Admin có thể từ chối và **Duyệt lại** sau khi kiểm tra; không cần cấp mã mới. Học sinh không tự đổi lớp khác với danh sách.

Mã đã có cùng tên/lớp được bỏ qua khi nhập lại. Mã đã thuộc người/lớp khác báo lỗi. Nếu cùng tên trong cùng lớp mà không có mã, cần nhập mã riêng để phân biệt hai học sinh; không tự tạo bản trùng không kiểm soát.

## Dữ liệu cũ và giới hạn frontend
Tài khoản cũ có lớp hợp lệ được bổ sung mã và giữ lại email, điểm, mật khẩu đã tạo và lịch sử. Bản frontend vẫn dùng localStorage: admin nhập ở máy này chưa đồng bộ sang điện thoại/máy khác. Luồng đầu cuối hiện thử được trên cùng trình duyệt; Cloudflare Tunnel chỉ chia sẻ giao diện, không chia sẻ database.

Đăng ký cùng một mã từ hai tab được khóa trong trình duyệt có Web Locks và kiểm tra lại dữ liệu trước khi ghi. Tab có dữ liệu cũ khi chỉnh sửa sẽ báo cần reload, tránh ghi đè thay đổi của tab khác. Backend thật cần chống claim trùng nguyên tử và kiểm tra quyền phía server.

## Điểm nối backend bổ sung
Thêm bảng `students` chứa code, name, classId, userId/claimedAt, createdAt. Chỉ admin có quyền import/export; server xác minh mã/tên và claim mã trong một transaction cùng tạo hồ sơ tài khoản. Không cho học sinh tải toàn bộ danh sách qua client để tự kiểm tra. Sử dụng Firebase Auth hoặc hệ thống Auth tương thích cho mật khẩu, không chuyển passwordHash cục bộ làm Auth thật.

API/realtime thay cho `students()`, `previewStudents()`, `importStudents()`, `verifyStudent()` và `register()` trong repository. Xuất Excel phải kiểm tra quyền server và dùng dữ liệu chung. Mức duyệt lấy từ settings server, lớp lấy từ roster, không tin classId do người đăng ký gửi lên.
