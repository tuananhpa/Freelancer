# Frontend Trường học xanh Implementation Plan

> Thực thi trực tiếp bằng executing-plans. Người dùng gửi A3 và yêu cầu dựng web; không thêm vòng duyệt thiết kế.

**Goal:** Frontend tiếng Việt theo A3 với tài khoản, lớp, phiên bỏ rác, lịch sử, thi đua và admin.

**Architecture:** Vite + JavaScript modules + CSS responsive. Repository chứa dữ liệu và nghiệp vụ, tách UI hash routing. LocalStorage chỉ phục vụ frontend; không phải backend hay xác thực thật.

**Spec:** CLIENT_BRIEF.md, DESIGN_SELECTION.md và docs/mockups/A3-approved.png.

## Files và interfaces
- src/config.js: nội dung mặc định, điểm và storage key.
- src/fixtures.js: tài khoản, lớp, giao dịch minh họa.
- src/repository.js: createRepository(storage), register/login, requestClass, approveMember, recordDeposit, rankings, adjustPoints, updateSettings.
- src/icons.js: SVG dùng chung.
- src/main.js, src/views.js: router, sự kiện, các màn hình.
- src/styles.css: tokens và bố cục responsive.
- tests/repository.test.js: nghiệp vụ; tests/browser.cjs: hành trình trình duyệt, screenshot.

## Constraints và review focus
- Ba lớp 11T1/11T2/11T3, hai loại rác nhựa/kim loại. Vai trò học sinh/admin theo brief mới.
- Không cộng điểm khi chỉ nhận diện; cần cảm biến xác nhận và mã giao dịch duy nhất.
- Email trùng, lớp sai, người chờ duyệt và giao dịch trùng phải bị từ chối.
- Lọc tuần theo Asia/Ho_Chi_Minh. Cấu hình điểm chỉ áp dụng giao dịch mới.
- Escape dữ liệu nhập, không lưu mật khẩu rõ; lỗi storage có thông báo.
- Vai trò xem thử được ghi rõ, không giả là phân quyền thật. Ngữ cảnh thùng được giữ qua đăng nhập/đăng ký.

## Tasks
- [x] 1. Viết test validation, duyệt lớp, xác nhận giao dịch, chống trùng và ranh giới tuần; chạy fail, dựng repository, chạy pass.
- [x] 2. Dựng trang chủ đúng A3 và navigation desktop/mobile; chạy build.
- [x] 3. Làm tài khoản/lớp, lịch sử, thi đua, admin duyệt thành viên/điểm/nội dung và hướng dẫn.
- [x] 4. Kiểm tra browser 375/768/1440px, đăng ký→chờ duyệt→duyệt, reload, logout/login, QR, cấu hình và lọc; screenshot, console.
- [x] 5. Bàn giao README và contract tích hợp, nêu rõ chưa kết nối Firebase/ESP32 thật.

## Quyết định thực thi
- Dựa trên brief mới nhất, bỏ trang nhóm trưởng riêng và đưa duyệt vào admin. Người dùng xác nhận hai chế độ gia nhập do admin chọn trong cài đặt; mặc định cần duyệt.
- Giữ placeholder tên/ảnh trường, không tự tạo nhận diện.
- Rà lỗi storage: thêm kiểm tra schema khi khôi phục và rollback nếu ghi thất bại; 12 unit tests đạt.
- Rà browser: nhãn select học sinh cần label/for riêng để không đọc cả danh sách option; đã sửa và chạy lại hành trình đạt.

## Bằng chứng kiểm tra
- `npm run build`: đạt, 10 modules, bundle JS/CSS được tạo.
- `npm test`: 12/12 đạt gồm hai chế độ, đăng ký/đăng nhập, duyệt, giao dịch, ranh giới tuần, chỉnh điểm, mức điểm mới, storage lỗi.
- `npm run test:ui`: 36 kiểm tra layout (12 trang × 3 kích thước) và hành trình người dùng/admin đạt, không có pageerror.
- Ảnh trang chủ desktop/mobile đã xem đối chiếu với A3, ở docs/mockups/frontend-desktop.png và frontend-mobile.png.

- Review độc lập: hai lỗi khi trình duyệt chặn local/session storage đã được sửa và thêm regression tests. Browser kiểm tra thùng R02 vẫn hiện và save báo lỗi rõ khi storage bị chặn.
