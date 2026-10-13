# Thiết kế đã chọn

Người dùng: “Dùng luôn mẫu đức huy, xây trước frontend, và chỉnh sửa trên trang admin sẽ sửa trên trang frontend luôn”.

Giữ mô hình cửa hàng điện thoại: header đỏ, tìm kiếm, menu danh mục, banner lớn và banner phụ, hàng thương hiệu, flash sale, lưới sản phẩm theo nhóm, tin công nghệ và footer. Nội dung có mật độ vừa phải, container 1240px. Admin có sidebar, bảng danh sách, form chỉnh sửa và xem cửa hàng.

Tokens: đỏ #c8102e, đỏ đậm #a40d25, nền #f5f5f7, chữ #202124, viền #e5e7eb, trắng #ffffff. Font Arial/system sans hỗ trợ tiếng Việt; giá đỏ, nhãn khuyến mãi nhỏ, ảnh sản phẩm trên nền trắng. Mobile dùng lưới 2 cột và menu cuộn ngang.

Tra cứu ui-ux-pro-max xác nhận typography/UX thương mại điện tử; bảng màu xanh và bố cục landing được loại vì không phù hợp mẫu đã chọn. Truy vấn stack html-tailwind không có kết quả sau lần thử lại; dùng CSS native với responsive và form HTML semantic.

## Điều chỉnh màu theo khách hàng — 13/10/2026

Ảnh hội thoại khách hàng yêu cầu xoay quanh xám, đỏ, vàng, đen; xám có hiệu ứng bê tông. Áp dụng nền xám #d6d6d3 với texture SVG nhẹ, header/menu/footer và sidebar admin đen #171717, giá và CTA đỏ #c8102e, điểm nhấn vàng #f3d51c. Card nền xám rất sáng để giữ độ đọc và ảnh sản phẩm. Màu thật của ảnh sản phẩm/banner giữ nguyên. Admin có thêm điều chỉnh vàng, nền xám và header/footer; dữ liệu đã lưu được bổ sung các cài đặt mới từ mặc định.
