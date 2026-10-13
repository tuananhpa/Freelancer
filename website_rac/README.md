# Trường học xanh

Frontend tiếng Việt theo thiết kế A3. Có trang chủ, tài khoản, chọn lớp, lịch sử, bảng thi đua và quản trị. Admin chỉnh điểm, nội dung, ảnh, duyệt thành viên và chọn chế độ gia nhập lớp.

## Chạy dự án
Yêu cầu Node.js 20.19+ hoặc 22.12+.

```sh
npm install
npm run dev
```

Mở địa chỉ được hiển thị. Đường dẫn ngữ cảnh QR cho thùng R01: `http://127.0.0.1:5173/?bin=R01#/home`. QR vật lý cần dùng domain website sau khi triển khai, không dùng localhost cho điện thoại khác.

```sh
npm run build
npm run preview
npm test
```

Kiểm tra trình duyệt: bật server ở cổng 5173 rồi chạy `npm run test:ui`. Script dùng Google Chrome đã cài trên máy. Ảnh kiểm tra ở `docs/mockups/frontend-desktop.png` và `docs/mockups/frontend-mobile.png`.

## Các màn hình
- `#/home`: phiên bỏ rác, điểm cá nhân/lớp, rác được nhận, lịch sử gần nhất, thi đua tuần.
- `#/register`, `#/login`: tạo/đăng nhập tài khoản cục bộ, giữ ngữ cảnh thùng từ QR.
- `#/classes`: chọn 11T1/11T2/11T3, gửi yêu cầu hoặc tham gia ngay theo cài đặt.
- `#/rankings`, `#/history`, `#/account`.
- `#/admin`: tổng quan; `/members`, `/points`, `/content`, `/settings` là các trang quản trị.

Ban đầu hiển thị tài khoản học sinh đã được duyệt để xem thiết kế. Tài khoản minh họa không có mật khẩu đăng nhập; nút “Xem giao diện học sinh” từ trang tài khoản khách đưa về tài khoản này. Có thể đăng ký tài khoản mới rồi đăng nhập bằng mật khẩu đã tạo. Từ trang tài khoản có “Xem giao diện admin”. Các liên kết admin chỉ phục vụ xem frontend, **chưa có phân quyền bảo mật thật**.

## Phạm vi và dữ liệu
- Dữ liệu ở localStorage với key trong `src/config.js`. Thay đổi chỉ có trên trình duyệt đang dùng. Không có server, Firebase Auth, database realtime hoặc giao tiếp phần cứng.
- Repository tách riêng ở `src/repository.js`. Mật khẩu cục bộ dùng PBKDF2 có salt; đây vẫn không thay thế xác thực phía server.
- Dữ liệu minh họa ở `src/fixtures.js`. Điểm cá nhân, lịch sử và bảng tổng hợp lớp là dữ liệu mẫu để tái hiện ảnh, không phải dữ liệu của một trường thật. Snapshot lớp là số tổng hợp, lịch sử chỉ là một phần minh họa; không dùng fixtures để suy ra báo cáo thật.
- Tuần dữ liệu minh họa là 12–18/10/2026 và 05–11/10/2026. Backend sẽ trả danh sách tuần thực tế thay thế `weeks`.
- Không tự chuyển phiên chờ thành thành công theo thời gian. Không có nút tạo giao dịch giả trên UI học sinh.
- Chế độ gia nhập áp dụng yêu cầu mới; yêu cầu đang chờ vẫn do admin xử lý. Mặc định cần duyệt.
- Sửa điểm nhựa/kim loại chỉ ảnh hưởng giao dịch sau, không sửa điểm lịch sử.
- Ảnh admin tải lên được lưu dạng data URL trong trình duyệt, giới hạn 2 MB/ảnh. Sau tích hợp cần kho ảnh thật.

Hợp đồng dữ liệu và việc cần nối thiết bị: [docs/INTEGRATION_CONTRACT.md](docs/INTEGRATION_CONTRACT.md). Không có Firebase/ESP32 thật nào được xác nhận hoạt động trong giai đoạn frontend này.

## Cloudflare và bàn giao backend
- [Hướng dẫn tự setup/chạy/deploy Cloudflare](docs/CLOUDFLARE_SETUP.md).
- [Bản đồ file hỗ trợ backend và thứ tự nối](docs/BACKEND_HANDOFF.md).
- Cấu hình Cloudflare: `wrangler.json`, dùng Workers Static Assets phục vụ thư mục `dist`.
- `npm run cf:dev`: build rồi chạy Cloudflare cục bộ ở cổng 8787.
- `npm run cf:check`: build và kiểm tra dry-run, không xuất bản.
- `npm run cf:login`: đăng nhập tài khoản của bạn.
- `npm run cf:deploy`: build và xuất bản thật lên Cloudflare sau khi đăng nhập.

Chưa deploy lên tài khoản Cloudflare; backend/Firebase/ESP32 vẫn thuộc giai đoạn tích hợp.

## File mã nguồn
- `src/config.js`: thông tin trường, chính sách và loại rác.
- `src/fixtures.js`: dữ liệu mẫu.
- `src/repository.js`: validation, membership, tổng hợp điểm và giao dịch.
- `src/views.js`: các màn hình; `src/main.js`: router và sự kiện.
- `src/styles.css`, `src/icons.js`: giao diện.
- `tests/`: unit tests và kiểm tra browser.
- `docs/`: brief, thiết kế, kế hoạch và ảnh đối chiếu.
