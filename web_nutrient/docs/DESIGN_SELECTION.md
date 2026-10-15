# DESIGN SELECTION

C — Cân bằng ĐÃ CHỐT ngày 2026-10-14 qua yêu cầu trực tiếp của người dùng.
Tham chiếu: docs/mockups/C-can-bang.png.
Teal #087F8C, navy #143640, white #FFFFFF, canvas #F2F7F8, sky #CAE8F1.
Be Vietnam Pro body, Manrope headings. Sidebar desktop, bottom nav mobile; summary strip, weekly chart, meal journal and right contextual panels.
Yêu cầu mới: full backend Cloudflare, chạy local với tunnel công khai cho người khác thử.

## Chỉnh sửa ngày 2026-10-15
Theo yêu cầu làm lại giao diện và góp ý trong ảnh: giữ nền tảng C, ưu tiên nhật ký dinh dưỡng, giảm mật độ trang chủ, làm mobile sạch hơn.
- Trang chủ: nhật ký 4 bữa và nút Ghi bữa ăn là phần chính.
- Tổng năng lượng thu gọn; macros nằm trong mục mở rộng.
- Giữ theo dõi nước, chuyển biểu đồ/lộ trình/khám phá về các mục riêng.
- Bỏ hàng điều hướng phụ và điểm XP trên header mobile của trang chủ; điểm vẫn có trong Hồ sơ.
- Tái sử dụng luồng ghi/sửa/xóa bữa ăn, nước và API hiện có.
