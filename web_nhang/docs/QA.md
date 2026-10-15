# Kiểm chứng frontend B — 2026-10-15

## Automated

- `npm test`: 7 tests pass. Search tiếng Việt có/không dấu, group/form/category, empty, original route, pagination malformed/overflow, escaping HTML, phone pattern theo regex v, preview server.
- `npm run build`: Vite pass; CSS ~33.6kB, JS ~31.6kB trước gzip, ảnh local tách riêng.
- `node --check src/main.js`, `node --check scripts/serve.mjs`: pass.
- Server tests: deep link trả app; source/docs không public; traversal/dotfiles bị chặn; missing media 404; POST 405; HEAD 200.

## Browser: desktop 1280 × 720, mobile 390 × 844

- Homepage: hero, logo, product images tải được, không tràn ngang. Ảnh chụp trong `screenshots/`.
- Quick view mở đúng hàng; phóng ảnh; quay lại thông tin; Escape đóng và focus về đúng nút gốc.
- Search `dan huong` có 4 hàng; filter `vien` còn Nhang viên Đàn Hương; mở chi tiết đúng route, có hàng liên quan.
- Tìm `xyzkhongco`: trạng thái empty và cách xem lại tất cả sản phẩm.
- Catalog trang 1 có 12 hàng, trang 2 có 4 hàng, URL giữ page.
- Mobile menu mở/đóng, Escape trả focus nút menu; catalog/tài khoản/reset/liên hệ/đại lý không tràn ngang ở lượt kiểm.
- Contact form rỗng: 4 field invalid và focus tên, chưa có thông báo đã gửi. Phone `abc` invalid, `0903 007 095` valid sau sửa pattern.
- Login: hiện/ẩn mật khẩu hoạt động; submit báo chưa nối hệ thống, không tạo session; reset có giao diện rõ giới hạn.
- Deep link danh mục nhang viên Thảo Dược: empty cập nhật; giới thiệu mở; URL không có hiện trang 404; browser Back về giới thiệu.
- Console error log ở cuối hành trình: rỗng.
- Tunnel Cloudflare: homepage tải được, đủ 11 img DOM (hero, logo 2 lần, 8 hàng); hero naturalWidth >0; không tràn ngang.

## Review độc lập

Một P2: pattern điện thoại bị mất escape trong JS template và trình duyệt bỏ qua validation. Đã kiểm chứng bằng test failing, sửa pattern chỉ nhận 8–15 chữ số (có dấu + đầu và khoảng trắng), test GREEN; full suite 7/7, build pass, browser xác nhận invalid/valid. Không có finding P1/P2 khác được báo.

Không có ruling/deferred minor từ review. Không triển khai backend, không gửi email thật, không đăng nhập web gốc hoặc thực hiện giao dịch. Chưa kiểm thiết bị iOS/Android thật, playback audio từ origin hoặc toàn bộ catalog ngoài snapshot16 hàng.
