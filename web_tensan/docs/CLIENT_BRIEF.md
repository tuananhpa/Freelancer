# TENSAN — brief đã chốt
Cập nhật: 2026-10-17

## Mục tiêu
Làm lại website giới thiệu doanh nghiệp/sản phẩm Tensan theo ảnh người dùng đã chọn ở docs/mockups/selected-design.png, có 3D thật và animation. Ảnh chốt là phương án A ban đầu (hero bảng mạch tách lớp nền tối), thay thế các hướng đề xuất về sau.

## Phạm vi
- Trang chủ và Giới thiệu; biên tập nội dung cho hai trang.
- Ảnh sản phẩm, banner, icon và ảnh doanh nghiệp; thống nhất phong cách các trang còn lại.
- Website giới thiệu sản phẩm, giao diện Việt hóa, tìm/lọc mã hoặc nhóm sản phẩm, chi tiết và yêu cầu tư vấn.
- Giữ các trang Ứng dụng, Tin tức/kiến thức, Tuyển dụng và Liên hệ cùng thiết kế.
- Tối ưu responsive, HTML nội dung sẵn, font/ảnh nội bộ, lazy-load 3D và ảnh, hỗ trợ giảm chuyển động và hình dự phòng.
- Người dùng yêu cầu đưa lên Cloudflare khi xong. Triển khai Worker riêng, không thay DNS/domain cũ.

## Nội dung và nhận diện
- Nguồn doanh nghiệp: https://tensanvn.com/gioi-thieu/.
- Nguồn danh mục: https://tensanvn.com/wp-json/wc/store/v1/products?per_page=100, 29 sản phẩm công khai được giữ lại.
- Logo, ảnh sản phẩm và ảnh cơ sở từ website Tensan.
- Ảnh ứng dụng minh họa được tạo bằng image_gen; không coi là ảnh nhà máy Tensan.
- Màu xanh ngọc thương hiệu trên hero tối; nội dung phía dưới nền trắng/xám sáng.
- Chú ý: TS1001 là keo tản nhiệt, TS5505 là keo silicone tản nhiệt, TS8833 là keo AB hai thành phần. Không dùng tên/ảnh sai từ mockup ban đầu.

## Giới hạn thực tế
Frontend tĩnh, không có trang quản trị/database hoặc API gửi form. Form tạo bản nháp email để người dùng kiểm tra và tự gửi. Không giả báo gửi thành công.
Thông số/quy cách khác nhau cần xác nhận với đội ngũ Tensan trước áp dụng sản xuất.

