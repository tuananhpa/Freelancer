# Portfolio nhóm freelance

Frontend dữ liệu tĩnh theo mockup A đã chọn. Chạy với Node.js 22+; không cần cài package cho website.

## Chạy và build

```powershell
npm run dev
```

Mặc định mở http://127.0.0.1:5173. Nếu cổng đã được dùng:

```powershell
$env:PORT = '5188'
npm run dev
```

```powershell
npm test
npm run build
```

Build tạo `dist/` từ đầu, gồm 8 trang HTML và `404.html`. Có thể đưa `dist/` lên hosting static. Server local chỉ là preview, không phải backend ứng dụng.

## Cập nhật nội dung

- `src/data.js`: tên nhóm, kênh liên hệ, danh sách dự án, dịch vụ, quy trình, FAQ.
- `src/styles.css`: màu, typography, responsive; font Google Fonts có fallback hệ thống.
- `public/assets/`: ảnh và tài nguyên. Ảnh gốm được sinh bằng image_gen để minh họa, chuyển WebP lossless giữ nguyên pixel, không phải ảnh dự án thật.
- Mỗi project có `slug` duy nhất tạo `/du-an/<slug>/`. Chỉ `status: 'published'` được build; `featured` đưa lên trang chủ. `kind` phân biệt khách hàng/cá nhân/mẫu. Không dùng tên khách hàng bảo mật trong title, slug, description hoặc hình ảnh.
- Các trường `duration`, `tech`, `problem`, `solution`, `scope`, `roles`, `images`, `video`, `live`, `github` tạo nội dung chi tiết. `images` là mảng `{src, alt, caption}`; `video` là URL video trực tiếp, không phải URL YouTube.
- Các dự án và lời giới thiệu hiện là nội dung mẫu có đánh dấu. Chưa có tên, logo, hồ sơ thành viên, ảnh dự án hoặc kênh liên hệ thật. Không có đánh giá khách hàng giả. Hồ sơ thành viên hiện ở trạng thái rỗng; cần bổ sung giao diện/data khi có thông tin thực.
- Sau khi đổi dữ liệu chạy lại build; server preview đọc bản build mới. Không đặt bí mật, mật khẩu hoặc token ở bất kỳ frontend fixture nào. Build tạo bản fixture công khai đã loại nháp và client identity được đánh dấu bảo mật.

## Form và backend

Form kiểm tra tên, email/điện thoại, dịch vụ, mô tả; ngân sách/thời hạn tùy chọn. Có lưu/khôi phục bản nháp cục bộ và tải yêu cầu `.txt`. Nội dung chưa được gửi đến nhóm. Khi JavaScript không chạy, hành động lưu/tải bị vô hiệu hóa để tránh gửi dữ liệu qua URL. LocalStorage keys: `portfolio.contact-draft.v1`, `portfolio.theme.v1`.

Chưa triển khai API, database, auth, tài khoản quản trị, phân quyền, duyệt nội dung, xử lý yêu cầu liên hệ hoặc chống spam phía server. Các mục đó thuộc giai đoạn backend. Không có dashboard quản trị hay đăng nhập giả.

## Hosting và tên miền

1. Thay nội dung mẫu và kênh liên hệ bằng dữ liệu thật.
2. Đặt `SITE_URL` thành tên miền HTTPS thực rồi build:

```powershell
$env:SITE_URL = 'https://ten-mien-cua-ban.vn'
npm run build
```

3. Upload/deploy `dist/` lên static hosting; publish directory là `dist`, build command `npm run build`. Cần hỗ trợ thư mục `/du-an/slug/index.html`; cấu hình `404.html` là trang lỗi với HTTP 404 thật.
4. Kết nối domain theo hướng dẫn DNS của hosting, bật HTTPS và kiểm tra link trực tiếp của các dự án.
5. Với domain thật, build tạo canonical, `sitemap.xml` và khai báo sitemap trong robots. Preview local không bịa domain và không sinh sitemap production. Mỗi trang có metadata và ảnh share PNG chung; có thể thay ảnh share cho từng dự án ở renderer.

Website chưa được publish. Scripts server/create-share dùng riêng cho phát triển local.

## Kiểm tra trình duyệt

`tests/browser.mjs` và `tests/regressions.mjs` cần Playwright riêng, không phải dependency production. Trong môi trường Codex này dùng bundled Playwright và Microsoft Edge headless:

```powershell
$env:PLAYWRIGHT_MODULE = 'C:\Users\buiti\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
# Chạy preview ở cổng 5188 trước.
node tests/browser.mjs
node tests/regressions.mjs
```

Máy khác cài Playwright dev hoặc trỏ `PLAYWRIGHT_MODULE` vào module đã cài; dùng Microsoft Edge hoặc đổi channel theo browser có sẵn. Báo cáo: `docs/VERIFICATION.md`. Screenshot: `docs/screenshots/`.
