# Hà Thành Electric — Website demo xe điện

Demo giao diện showroom xe máy điện, tham khảo cấu trúc website VinFast Hà Thành Trung và thiết kế lại theo skill ui-ux-pro-max.

## Xem ngay

Mở `index.html` bằng Chrome/Edge. Không cần cài thư viện, database, tài khoản hay domain; toàn bộ CSS, JavaScript và hình ảnh đều lưu local.

Hoặc chạy trong thư mục này:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Sau đó mở http://127.0.0.1:5173. Dừng server bằng Ctrl+C.

## Có gì trong demo

- Trang chủ responsive, danh mục 4 dòng xe với bộ lọc theo nhu cầu.
- Popup chi tiết từng xe và đăng ký lái thử theo mẫu đã chọn.
- Trang bài viết, mục lục, câu hỏi mở rộng, liên kết bài liên quan.
- 3 bài viết gốc: ưu đãi tại Dĩ An, chọn xe theo nhu cầu, làm quen pin và sạc.
- Form kiểm tra tên/số điện thoại và mô phỏng hoàn thành. Không gửi hoặc lưu dữ liệu cá nhân.
- Menu mobile, điều hướng bàn phím, dialog hỗ trợ Escape, reduced motion.

## Chỉnh sửa

- Giao diện: `styles.css`.
- Tên thương hiệu, bố cục trang chủ: `index.html`; footer: `app.js`.
- Danh mục, giá và thông số: mảng `products` trong `app.js`.
- Bài viết: `articleData` trong `articles.js`.
- Quy tắc giao diện: `design-system/MASTER.md`.

## Dữ liệu và ảnh

Giá, thông số, chương trình và thông tin showroom là dữ liệu minh họa, không phải báo giá hoặc cam kết của VinFast. Thương hiệu Hà Thành Electric là tên dùng cho demo. Chưa triển khai hosting, domain, database hoặc gửi lịch hẹn thật.

Hình xe và showroom tham khảo từ https://vinfasthathanhtrung.com, tải về local để xem demo. Nguồn URL chi tiết trong `assets/SOURCES.md`. Cần thay bằng tài nguyên được phép sử dụng và cập nhật thông tin thực tế trước khi xuất bản chính thức.
