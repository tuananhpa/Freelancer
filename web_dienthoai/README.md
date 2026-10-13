# Cửa hàng điện thoại & admin frontend

Giao diện tham khảo Đức Huy Mobile, theo quyết định của người dùng. Frontend và admin dùng chung dữ liệu lưu trong trình duyệt.

## Chạy

Cần Node.js; không cần cài npm dependencies.

```powershell
$env:PORT='5180'
npm run dev
```

- Cửa hàng: http://localhost:5180/
- Admin: http://localhost:5180/#admin (hoặc /admin)
- `npm test`: kiểm tra repository, persistence, validation, giỏ hàng và quan hệ.
- `npm run check`: kiểm tra cú pháp toàn bộ JavaScript.

## Quản lý

Admin có sản phẩm và phiên bản (tên | giá | tồn kho), danh mục, thương hiệu, banner, cụm trang chủ, menu, bài viết, trang thông tin, widget và thư viện ảnh. Mỗi mục có thêm/sửa/xóa, bật/tắt và thứ tự. Cài đặt có logo, favicon, màu chính, liên hệ, nội dung trang chủ/footer và SEO. Logo riêng cho từng widget có thể tải trực tiếp hoặc chọn từ thư viện.

Danh mục hỗ trợ ảnh biểu tượng: Admin → Danh mục → Thêm/Sửa → Ảnh biểu tượng danh mục → Tải ảnh hoặc chọn thư viện → Lưu. Ảnh được dùng làm icon ở menu và sidebar của cửa hàng. Bỏ ảnh để trở về biểu tượng mặc định. Kiểm tra riêng: `node scripts/category_test.mjs`.

Ảnh PNG/JPG/WebP/GIF được xử lý thành ảnh WebP tối đa 1600px trước khi lưu; tối đa 12 MB cho file đầu vào. Đây là ảnh tĩnh, GIF không giữ animation. Nếu bộ nhớ đầy, UI báo lỗi và giữ dữ liệu trước đó. Trong thư viện ảnh, tải ảnh lên và bấm Lưu; các trường ảnh khác có thể chọn ảnh này. URL ảnh có thể dùng /assets/... hoặc https://...

Sản phẩm có phiên bản lấy giá và tồn kho theo phiên bản. Khi ẩn/xóa sản phẩm hoặc xóa phiên bản, dòng tương ứng được loại khỏi giỏ; khi giảm tồn kho, số lượng trong giỏ được giới hạn theo tồn kho mới. Danh mục/thương hiệu đang có sản phẩm không được xóa trước khi chuyển sản phẩm sang mục khác.

Lưu thay đổi cập nhật cửa hàng trong cùng tab, tab khác và iframe xem trước trên cùng origin. Dữ liệu riêng theo trình duyệt và địa chỉ truy cập: localhost và tunnel không dùng chung localStorage. Dùng Sao lưu dữ liệu → Xuất/Nhập để chuyển nội dung. Đổi tunnel URL cũng tạo origin mới, cần nhập lại bản sao lưu.

## Giới hạn giai đoạn hiện tại

Chưa có database, tài khoản/đăng nhập, kiểm soát quyền ở server, xử lý đơn hàng, thanh toán online, giao vận hay đồng bộ nhiều người dùng. Admin hiện là frontend có thể truy cập trực tiếp; thao tác chỉ ảnh hưởng dữ liệu trên trình duyệt truy cập. Nút đặt hàng mở gọi hotline, không giả tạo đơn hàng hay thông báo thanh toán thành công.

Nội dung, tên cửa hàng, sản phẩm và ảnh khởi tạo dựa trên website tham khảo để kiểm tra bố cục; cần thay bằng tài sản và dữ liệu cửa hàng của bạn trước khi vận hành thực tế. Ảnh tham khảo được lưu cục bộ trong assets để giao diện xem trước không phụ thuộc hotlink; thông tin nguồn nằm ở assets/map.json.

## Kiểm tra

Đã kiểm tra bằng Edge headless qua Playwright: desktop 1440px và mobile 390px, ảnh tải thành công, CRUD sản phẩm/biến thể, cập nhật liên tab, lưu qua reload, giỏ hàng, bảo vệ danh mục đang dùng, upload logo cửa hàng/widget, vị trí và bật/tắt widget, xuất bản và đọc bài viết; không có pageerror và không tràn ngang trên mobile. Ảnh chụp trong docs/screenshots.

Chạy kiểm tra trình duyệt (máy hiện tại có Playwright bundled): `node scripts/browser_test.mjs`. Nếu máy khác, cài Playwright riêng và đặt PLAYWRIGHT_PATH tới package tương ứng; script dùng Edge channel. Đây là dependency kiểm tra, không phải dependency sản phẩm.

## Tunnel hiện tại

https://commonwealth-inns-encourages-suites.trycloudflare.com/

Admin thêm `/#admin`. Tunnel được tạo bằng cloudflared; link tạm thời và hoạt động khi máy, server và tiến trình cloudflared còn chạy. Không cài service tự khởi động.
