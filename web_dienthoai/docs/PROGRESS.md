# Tiến độ frontend

- Hoàn tất repository dùng chung và lưu trình duyệt.
- Hoàn tất storefront: trang chủ, danh mục/tìm kiếm/lọc, chi tiết/biến thể, giỏ hàng, tin/bài công nghệ và trang thông tin.
- Hoàn tất admin: toàn bộ collection, logo/favicon/cài đặt, widget logo/vị trí/bật tắt, thư viện ảnh và sao lưu.
- Đã chạy 10 kiểm tra repository và kiểm tra cú pháp.
- Browser kiểm tra desktop/mobile và luồng sửa admin → frontend, ảnh, tin bài, biến thể/giỏ và persistence.
- Reviewer độc lập phát hiện lỗi schema/import, escaping stock, cart khi sửa biến thể, stock theo biến thể và accessible name menu mobile. Đã sửa; kiểm tra regression đi kèm.
- Giai đoạn backend chưa bắt đầu theo yêu cầu frontend trước.
- Đã mở tunnel và xác nhận HTML/CSS HTTP 200; origin tunnel có dữ liệu trình duyệt riêng.
- Theo yêu cầu tiếp theo: danh mục có upload ảnh làm icon, chọn từ thư viện hoặc URL; menu và sidebar dùng ảnh đã chọn. Kiểm tra upload, cập nhật liên tab, reload và bỏ ảnh đều qua.
- Chỉnh palette theo ảnh khách: xám bê tông, đỏ, vàng, đen; áp dụng storefront/admin, thêm trường màu vàng/nền/header trong admin. Thêm lời giới thiệu đầu trang và cảm ơn cuối trang, sửa được trong admin. Kiểm tra desktop/mobile và hai trường nội dung đều qua.
- Tunnel cũ không còn hoạt động; khởi động lại server 5180 và tạo tunnel mới https://suzuki-duncan-connector-priorities.trycloudflare.com/.
