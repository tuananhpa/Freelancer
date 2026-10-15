# Frontend Nhang Thơm Vĩnh Thuận Phát

Ngày khảo sát: 2026-10-15. Nguồn: https://nhangthomcaocap.vn/

## Yêu cầu

- Làm lại frontend, nhận diện và giữ các tính năng của website gốc.
- Theo client-web-flow, thực hiện brief và tạo ảnh ngay trong Codex.
- Người dùng đã chọn B (thay lựa chọn A trước đó), yêu cầu triển khai, PLAN.md backend, push Git và tunnel.
- Khi khảo sát thư mục trống. Hiện có frontend Vanilla JS + Vite; chưa có backend.

## Tính năng và bằng chứng

| Phần | Quan sát | Phạm vi giữ |
| --- | --- | --- |
| Trang chủ | Sản phẩm nổi bật, sản phẩm mới, ảnh và tên dẫn tới chi tiết; có liên kết Quick View trong nội dung đọc được | Hai bộ sản phẩm, thẻ sản phẩm, xem nhanh; cần kiểm tra tương tác xem nhanh khi triển khai |
| Tìm kiếm | Ô tìm sản phẩm trong menu | Tìm sản phẩm, kết quả và trạng thái rỗng |
| Danh mục | Thảo Dược, Trầm Hương, Đàn Hương; mỗi nhóm có nhang cây, khoanh, viên | Giữ cấu trúc và điều hướng danh mục |
| Sản phẩm khác | Nhang Quế, sản phẩm thờ cúng, Dầu Cát Tường, đèn xông hương | Giữ danh mục và sản phẩm |
| Chi tiết | Đã mở /san-pham/nhang-cay-dan-huong-20cm/: ảnh phóng lớn, tên, danh mục, sản phẩm liên quan, chia sẻ | Giữ ảnh, thông tin, liên quan, chia sẻ phù hợp |
| Mua hàng | Chi tiết có Mua sỉ: 0903 007 095; Mua lẻ: liên hệ đại lý | Giữ hướng liên hệ; chưa có bằng chứng về giỏ hàng/thanh toán |
| Giới thiệu | Có liên kết /nhang-thom-vinh-thuan-phat/ | Giữ trang, cần đọc nội dung đầy đủ |
| Đại lý | Đã mở /lam-dai-ly/: hướng dẫn liên hệ nhà phân phối Phúc Nguyên | Giữ trang và liên hệ làm đại lý; chưa thấy biểu mẫu đăng ký |
| Liên hệ | /lien-he/: thông tin doanh nghiệp; bản đọc web có shortcode Contact Form 7 lộ ra | Giữ thông tin, cần xác minh form trên trang sống; không giả gửi thành công |
| Tài khoản | Menu Login, giao diện username/email, password, ghi nhớ, quên mật khẩu | Giữ giao diện và điểm nối; chưa xác minh sau đăng nhập |
| Media | Trang chủ có trình phát audio | Giữ điều khiển phát/dừng thủ công; chưa xác minh file và nội dung |
| Điều hướng | Menu thu gọn quan sát ở khung trình duyệt hẹp | Responsive desktop/mobile, thao tác bàn phím và focus rõ |

## Thương hiệu và nội dung

- Tên: Nhang Thơm Cao Cấp Vĩnh Thuận Phát.
- Website có logo hoa sen hồng, lá xanh trong vòng tròn; không yêu cầu làm logo mới.
- Bao bì thực tế: ống đỏ/tím/vàng, chữ vàng; tham chiếu qua ảnh website và screenshot.
- Sản phẩm đại diện: Nhang cây Đàn Hương 20cm; Nhang cây Thảo Dược 20cm; Nhang cây Trầm Hương cao cấp 20cm; nhang khoanh; nhang viên; nến và vật phẩm thờ cúng.
- Không tự thêm giá, đánh giá, chứng nhận, cam kết sức khỏe, doanh số hoặc lịch sử thương hiệu.
- Hotline hiện thấy: (028) 6271 4746 / 0903 745 746 / 0903 007 095.
- Địa chỉ công bố: 1/100 Lữ Gia, Phường 15, Quận 11, TP.HCM. Giữ theo nguồn, chưa xác minh địa chỉ hành chính hiện tại.
- Email trên trang đại lý: phucnguyen.quangvan@gmail.com.

## Giả định cho mockup

- Khách hàng tìm nhang dùng gia đình/thờ cúng và đối tác mua sỉ, đại lý.
- Tiếng Việt, dùng tốt trên điện thoại và desktop.
- So sánh ba ảnh trang chủ cùng nội dung và kích thước; ảnh sản phẩm AI chỉ minh họa bố cục, không thay ảnh hàng thật khi build.
- A: Đỏ son #9C252D, vàng #B38A36, trắng #FFFFFF, hồng sen #DC397F, chữ #30231E; Noto Serif / Be Vietnam Pro; bố cục thương hiệu và danh mục truyền thống.
- B: Xanh trầm #244B40, ngà #F5F5EF, gỗ #73513B, sen #CB3678, chữ #20382E; Noto Serif / Be Vietnam Pro; hero tĩnh với nhang và khói, bố cục thoáng.
- C: Trắng #FFFFFF, xám #F3F4F6, đỏ #B6222B, vàng #B18A35, chữ #222222; Be Vietnam Pro; tìm kiếm rõ, danh mục trực tiếp, lưới hàng dày hơn.
- Tra cứu UI/UX cho kết quả hệ thống chung không khớp ngành sau hai lượt; không lưu kết quả đó làm hệ thiết kế đã duyệt. Các hướng trên dựa vào thương hiệu và cấu trúc thực tế.

## Trạng thái triển khai

Đã build bản B với 16 sản phẩm thật từ trang chủ gốc và các luồng catalog/liên hệ. Chi tiết triển khai tại FRONTEND_PLAN.md, kiểm tra tại QA.md. Người dùng yêu cầu trực tiếp tài liệu backend: PLAN.md tại root mô tả server/API/database cần làm tiếp, chưa triển khai backend.
