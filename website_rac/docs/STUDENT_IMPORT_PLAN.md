# Danh sách học sinh và đăng ký bằng mã

## Cập nhật lớp động
Yêu cầu mới thay thế giới hạn ba lớp ở phần quyết định cũ bên dưới. Runtime dùng state.classIds, khởi tạo/migrate các lớp có trong dữ liệu. Import báo newClasses khi xem trước và tạo lớp nguyên tử khi xác nhận. Cài đặt có thêm/đổi tên/xóa lớp chưa dùng, cập nhật toàn bộ liên kết khi đổi tên. File 100 học sinh / 10 lớp đã kiểm tra import thành công.

Kiểm chứng lớp động: 29 unit tests đạt, build đạt; browser nhập file thật đủ 100 học sinh/10 lớp, export 11T10 đủ 10 học sinh, rename gắn lại lớp và đăng ký vào lớp mới, giao diện mobile đạt. Review phát hiện tên lớp tương tự Hướng dẫn có thể bị bỏ qua khi đọc lại Excel; đã sửa để nhận diện sheet hướng dẫn theo cả tên và việc không có header học sinh, thêm regression roundtrip đạt.

Người dùng yêu cầu admin import Excel, tạo mã nếu thiếu, xuất mã/tên theo lớp, chỉ cho học sinh có mã trong danh sách đăng ký. Ảnh chỉ minh họa chức năng; giữ thiết kế xanh hiện tại, thêm nền cây/lá và viền phân tách.

## Quyết định triển khai
- Excel: Mã học sinh (tùy chọn), Họ và tên, Lớp; nhận alias cột phổ biến. Hỗ trợ .xlsx/.xls, tối đa 10 MB và 5.000 học sinh.
- Xem trước trước khi xác nhận. Import nguyên tử; dòng lỗi không tạo danh sách dở dang. Mã trùng cùng người/lớp được bỏ qua; mã trùng khác người/lớp báo lỗi.
- Thiếu mã sinh HS + chuỗi ngẫu nhiên. Tên trùng trong cùng lớp cần mã riêng để tránh nhập lặp không phân biệt được hai người.
- Xuất lớp đã lọc hoặc toàn bộ, mỗi lớp một sheet. Có file mẫu và hướng dẫn.
- Đăng ký hai bước: kiểm tra mã + tên, rồi email + mật khẩu/xác nhận. Mã dùng một lần, họ tên lấy đúng tên trong danh sách, lớp tự gắn. Duyệt/instant tiếp tục áp dụng theo cài đặt.
- Giữ tài khoản/dữ liệu trình duyệt cũ; bổ sung mã cho tài khoản đã có. Học sinh có mã không được tự đổi lớp khác với danh sách.
- Không thêm ngày sinh/SĐT từ ảnh vì yêu cầu hiện tại không có các cột đó.
- LocalStorage vẫn là phạm vi frontend. Khi nối backend, enforce mã dùng một lần, phân quyền import/export và chia sẻ danh sách phía server.

## File và kiểm chứng
- src/roster.js: chuẩn hóa và validation import, mã tự sinh.
- src/student-excel.js: đọc/ghi workbook.
- src/student-views.js: trang danh sách và đăng ký.
- src/repository.js: roster, migration, verifyStudent và claim khi register.
- src/main.js: nhập/xem trước/xác nhận/export/đăng ký hai bước.
- src/styles.css + public/nature.svg: nền và phân tách.
- tests/roster.test.js + tests/student-browser.cjs: Excel roundtrip, chống trùng, đăng ký trái phép, claim đồng thời, filter/export và responsive.

## Kết quả thực hiện
- Đã triển khai import/xem trước/xác nhận, mã tự sinh, export theo lớp, template Excel và đăng ký hai bước.
- Dữ liệu trình duyệt cũ được migrate sang roster, giữ tài khoản và điểm.
- Review độc lập phát hiện claim hai tab và tài khoản từ chối không duyệt lại được; đã sửa bằng khóa browser + kiểm tra snapshot và thêm Duyệt lại. Reviewer kiểm tra lại không còn finding quan trọng.
- `npm test`: 24/24 đạt. `npm run build`: đạt, module Excel tách chunk tải khi cần.
- Browser: template/import lỗi/import thành công/reload/export đọc lại, mã sai/tên sai/mã dùng lại, hai tab cùng mã, hai chế độ duyệt, từ chối→duyệt lại, QR/context, login/điểm và 36 layout check đạt.
- QR browser regression (tạo/copy/download/giải mã/mobile) đạt sau thay đổi.
- Đã xem ảnh docs/mockups/student-admin.png và student-registration.png để đối chiếu phong cách hiện tại.
