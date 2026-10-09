# BẢN YÊU CẦU THIẾT KẾ & LẬP TRÌNH WEBSITE (MASTER BRIEF)

**Tên dự án:** Hệ thống QR Storytelling & Quản lý Nông sản Hưng Yên

**Tên miền dự kiến:** HYTales.vn (Hưng Yên Tales)

---

## I. TỔNG QUAN & MỤC TIÊU DỰ ÁN

### 1. Hình thức vận hành

- Khách hàng quét **mã QR** in trên bao bì/nhãn mác sản phẩm bằng điện thoại (Zalo, Camera) để truy cập trực tiếp vào Landing Page của sản phẩm/lô hàng tương ứng.

### 2. Mục tiêu cốt lõi

- **Không phải web e-commerce bán hàng thông thường:** Web tập trung vào **Kể chuyện thương hiệu (Storytelling)**, **Minh bạch nguồn gốc (Traceability)** và **Truyền thông di sản/văn hóa** nông sản Hưng Yên.
- **Trải nghiệm di động (Mobile-First):** 99% người dùng truy cập từ điện thoại, giao diện phải tối ưu mượt mà cho màn hình dọc, tốc độ tải trang dưới 2 giây trên mạng 4G.

---

## II. QUY CÁCH NỘI DUNG & BỐ CỤC FRONTEND (DÀNH CHO KHÁCH HÀNG)

Hệ thống phải cho phép tạo các **Khối nội dung độc lập (Dynamic Component)** cho từng sản phẩm/lô hàng.

Cấu trúc một trang Landing Page sản phẩm gồm 5 khối:

### 1. Khối Header & Video Hero (Gây ấn tượng 3 giây đầu)

- **Thanh Header:** Hiển thị tên miền chính chủ, biểu tượng khóa SSL an toàn.
- **Frame Video Hero:** Khung video ngắn (dạng dọc 9:16 hoặc 16:9) tự động phát (mute sound mặc định).
- **Thẻ định danh sản phẩm (Product Card):**
  - Tên sản phẩm (VD: Long Nhãn Sấy Hương Chi - Phố Hiến).
  - Mã định danh lô hàng (VD: `#HY-LN-2026-08`).
  - Ngày sản xuất, Hạn sử dụng, Vùng trồng.
  - Huy hiệu chứng nhận (Badge): OCOP 4 sao, VietGAP, Chỉ dẫn địa lý Hưng Yên.

### 2. Khối Câu Chuyện Sản Phẩm (Storytelling Block)

- **Văn bản bài viết:** Đoạn văn (100–150 từ) kể về nguồn cảm hứng, lịch sử làng nghề, tâm huyết người trồng.
- **Bộ sưu tập ảnh (Gallery Grid):** 3–4 hình ảnh chất lượng cao (ảnh xưởng sấy, ảnh vùng nguyên liệu, ảnh nghệ nhân).

### 3. Khối Hành Trình Sản Phẩm (Interactive Timeline)

- Hiển thị dạng **Trục thời gian dọc/ngang tương tác** ghi lại quy trình sản xuất theo từng lô:
  - **Mốc 1:** Chăm sóc & Bao trái hữu cơ VietGAP.
  - **Mốc 2:** Thu hái thủ công sáng sớm.
  - **Mốc 3:** Sấy than củi 36h / Chế tác thủ công.
  - **Mốc 4:** Kiểm định chất lượng & Dán tem QR.

### 4. Khối Thư Viện Video Ngắn (Short Video Carousel)

- Dạng thẻ lướt ngang (như TikTok/Reels): Chứa các video ngắn hướng dẫn trải nghiệm (cách pha trà cúc long nhãn, cách phân biệt hàng chuẩn, mẹo bảo quản).

### 5. Khối Kêu Gọi Hành Động (CTA Footer)

- **Nút bấm tương tác lớn:** `[ 🎁 Mua tặng bạn bè / Đặt mua thêm ]` → Dẫn đến Form đăng ký mua nhanh.
- **Mở chat nhanh:** `[ 💬 Nhắn Zalo trực tiếp nhà vườn ]`.
- **Mục đánh giá:** Cho phép người dùng để lại bình luận, chấm sao và gửi ảnh cảm nhận.

---

## III. YÊU CẦU TÍNH NĂNG BACKEND & TRANG QUẢN TRỊ (ADMIN DASHBOARD)

### 1. Cơ chế Quản lý Sản phẩm theo Khối (Dynamic CMS)

- Mỗi sản phẩm/lô hàng khi tạo mới sẽ tự động sinh ra một **URL riêng biệt** (VD: `gocnhanhungyen.vn/p/long-nhan-huong-chi-l01`).
- Admin có thể linh hoạt nhập/sửa nội dung, tải video, ảnh, tạo Timeline riêng cho từng mã sản phẩm mà không bị trùng lặp với sản phẩm khác.

### 2. Trình Tạo & Quản Lý Mã QR Động (In-web Dynamic QR Generator)

- **Tự động sinh mã QR:** Khi Admin bấm "Lưu sản phẩm", hệ thống tự động mã hóa URL sản phẩm thành mã QR Code.
- **Tùy biến QR:** Cho phép chèn Logo thương hiệu vào giữa mã QR, chọn màu sắc mã QR.
- **Xuất file in ấn:** Hỗ trợ tải mã QR dưới định dạng chất lượng cao (`PNG`, `SVG`, `PDF`) để gửi nhà in bao bì.
- **Link Động (Dynamic Link):** Sửa nội dung web hoặc đổi link đích mà **không làm thay đổi mã QR đã in trên bao bì vật lý**.
- **Báo cáo (QR Analytics):** Thống kê số lượt quét QR, thời gian quét và vị trí địa lý của người dùng.

### 3. Tích Hợp Khung Chatbot & Live Chat Hỗ Trợ Trực Tiếp

- **Widget Chat nổi:** Hiển thị nút chat ở góc dưới màn hình di động của khách hàng.
- **Chatbot kịch bản tự động:** Cài đặt sẵn bộ câu hỏi - trả lời nhanh (FAQs) cho từng sản phẩm (giá bán, bảo quản, gửi hàng, liên hệ Zalo OA/Messenger).
- **Quản lý Hộp thư Admin:** Admin nhận thông báo và có thể phản hồi trực tiếp cho khách hàng ngay trong trang quản trị.

---
