# Bản đồ nội dung & tài nguyên — HARMONY.STUDIO (`content-map.md`)

Tài liệu này liệt kê nguồn gốc từng nội dung, trạng thái xử lý watermark `ESER` trên bộ ảnh gốc và toàn bộ các mục gắn nhãn `[[CẦN XÁC NHẬN]]` cần khách hàng duyệt/bổ sung trước khi đưa lên bản chính thức.

---

## 1. Danh mục các mục `[[CẦN XÁC NHẬN]]` (chờ khách cung cấp)

| # | Hạng mục | Giá trị giữ chỗ hiện tại trên mockup | Khai báo tại |
|---|---|---|---|
| 1 | Logo & bộ nhận diện | Wordmark chữ `HARMONY.STUDIO` đặt bằng font `Prata` | `SITE.brand` trong `assets/js/main.js` |
| 2 | Tên 4 bộ sưu tập | `ROUGE — Đỏ son`, `CREME — Kem nắng`, `NOIR — Mực & tuyết`, `FLORA — Vườn hoa` | `COLLECTIONS` trong `assets/js/data.js` |
| 3 | Tên 18 mẫu thiết kế (`LOOK 00` → `LOOK 17`) | Đặt theo đúng hình dáng & màu sắc nhìn thấy trên ảnh | `LOOKS` trong `tools/build_data.py` → `assets/js/data.js` |
| 4 | Số điện thoại / Hotline | `0900 000 000` (`tel:0900000000`) | `SITE.phone`, `SITE.phoneHref` trong `assets/js/main.js` |
| 5 | Link Zalo, Messenger, Facebook, Instagram, TikTok | `#zalo-can-xac-nhan`, `#messenger-can-xac-nhan`… | `SITE.zalo`, `SITE.messenger`… trong `assets/js/main.js` |
| 6 | Email & địa chỉ phòng mẫu | `contact@harmony.studio` · `Studio tại Việt Nam` | `SITE.email`, `SITE.address` trong `assets/js/main.js` |
| 7 | Câu chuyện thương hiệu, năm thành lập, điều khoản bàn giao rập B2B | Đã gắn nhãn `[[CẦN XÁC NHẬN]]` tại trang chủ, dịch vụ và giới thiệu | `index.html`, `dich-vu.html`, `gioi-thieu.html` |
| 8 | Video mở đầu chính thức của thương hiệu | Đang dùng video sàn diễn miễn phí bản quyền (Mixkit #809) + video lookbook dựng từ ảnh khách | `SITE.heroVideo` trong `assets/js/main.js` |

> **Cách cập nhật nhanh:** mở `assets/js/main.js`, sửa đối tượng `SITE` ở đầu file là tự động đổi ở header, menu, nút nổi, thanh mobile, trang liên hệ và footer trên mọi trang.

---

## 2. Nguồn gốc 18 ảnh sản phẩm & cách xử lý logo `ESER` cũ

Toàn bộ 18 ảnh khách gửi trong thư mục `Harmony Studio/Pasted 2026-10-16 at *.png` (không dùng ảnh từ `eser-website.zip`).

- **Nguyên tắc xử lý:** tuyệt đối **không** dùng AI vẽ đè hay xóa logo trên ảnh, **không** chỉnh sửa trang phục.
- **Hai phiên bản cho từng ảnh (sinh tự động bằng `tools/process_images.py`):**
  1. **Ảnh tách nền (`assets/img/cut/look-XX-{600,1100,1800}.webp`):** tách người mẫu bằng `rembg` (`birefnet-general-lite`). Vì chữ `ESER` nằm trên nền tường/cửa phía sau nên tự động bị loại bỏ hoàn toàn ở cả 18/18 mẫu.
  2. **Ảnh giữ bối cảnh (`assets/img/photo/look-XX-{400,800,1365}.webp`):** chỉ xuất cho **7 ảnh** mà khung cắt loại bỏ được 100% chữ `ESER` mà không phạm vào đầu người mẫu. **11 ảnh còn lại** có chữ `ESER` ngang tầm tóc của mẫu nên **không xuất bản `photo/`**, chỉ dùng bản tách nền `cut/`.

| Mã | File gốc (`Harmony Studio/`) | Ngách | Bộ sưu tập | Trạng thái logo `ESER` trên ảnh gốc | Bản dùng trên web |
|---|---|---|---|---|---|
| `LOOK 00` | `Pasted ... 3.22.00 PM.png` (1365×2048) | Đầm công sở | `NOIR` | Có ở góc trên trái (dưới `14.8%` chiều cao) | `cut/` + `photo/` (đã cắt `14.8%` đỉnh) |
| `LOOK 01` | `Pasted ... 3.22.15 PM.png` (1365×2048) | Đầm công sở | `NOIR` | Ngang tầm đỉnh đầu người mẫu | Chỉ dùng `cut/` (không còn logo) |
| `LOOK 02` | `Pasted ... 3.22.21 PM.png` (1365×2048) | Đầm dự tiệc | `CREME` | Ngang tầm đỉnh đầu người mẫu | Chỉ dùng `cut/` |
| `LOOK 03` | `Pasted ... 3.22.27 PM.png` (1365×2048) | Đầm công sở | `CREME` | Đè sát tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 04` | `Pasted ... 3.22.33 PM.png` (1365×2048) | Đầm dự tiệc | `ROUGE` | Ở góc trên trái (dưới `15.2%` chiều cao) | `cut/` + `photo/` (đã cắt `15.2%` đỉnh) |
| `LOOK 05` | `Pasted ... 3.22.40 PM.png` (1365×2048) | Đầm dự tiệc | `CREME` | Ở góc trên trái (dưới `15.2%` chiều cao) | `cut/` + `photo/` (đã cắt `15.2%` đỉnh) |
| `LOOK 06` | `Pasted ... 3.22.45 PM.png` (1365×2048) | Set & chân váy | `FLORA` | Ngang tầm tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 07` | `Pasted ... 3.22.51 PM.png` (1365×2048) | Đầm dự tiệc | `FLORA` | Ngang tầm tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 08` | `Pasted ... 3.23.00 PM.png` (1365×2048) | Set & chân váy | `CREME` | Ngang tầm tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 09` | `Pasted ... 3.23.05 PM.png` (1365×2048) | Đầm công sở | `NOIR` | Ngang tầm trán người mẫu | Chỉ dùng `cut/` |
| `LOOK 10` | `Pasted ... 3.23.12 PM.png` (1365×2048) | Set & chân váy | `ROUGE` | Ngang tầm tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 11` | `Pasted ... 3.23.22 PM.png` (1365×2048) | Đầm dự tiệc | `CREME` | Ở góc trên phải, ngang mặt mẫu | Chỉ dùng `cut/` |
| `LOOK 12` | `Pasted ... 3.24.01 PM.png` (1365×2048) | Đầm dự tiệc | `ROUGE` | Ngang tầm tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 13` | `Pasted ... 3.24.07 PM.png` (1365×2048) | Set & chân váy | `FLORA` | Ngang tầm tóc người mẫu | Chỉ dùng `cut/` |
| `LOOK 14` | `Pasted ... 3.24.13 PM.png` (1365×2048) | Set & chân váy | `CREME` | Ở góc trên trái (dưới `15.8%` chiều cao) | `cut/` + `photo/` (đã cắt `15.8%` đỉnh) |
| `LOOK 15` | `Pasted ... 3.24.43 PM.png` (1329×2048) | Áo dài | `FLORA` | **Không có logo ESER** | `cut/` + `photo/` nguyên khung |
| `LOOK 16` | `Pasted ... 3.24.52 PM.png` (1328×1887) | Áo dài | `FLORA` | **Không có logo ESER** | `cut/` + `photo/` nguyên khung |
| `LOOK 17` | `Pasted ... 3.25.20 PM.png` (1266×2048) | Set & chân váy | `NOIR` | **Không có logo ESER** | `cut/` + `photo/` nguyên khung |

---

## 3. Nguồn gốc & giấy phép video mở đầu

1. **Video mặc định (`assets/video/hero-desktop.mp4` — 4.99 MB, `hero-mobile.mp4` — 2.29 MB):**
   - Nguồn: Mixkit Stock Video ID **809** (`https://assets.mixkit.co/videos/809/809-1080.mp4`), cảnh người mẫu trong trang phục trắng viền đen bước qua hàng gương trong hậu trường trình diễn.
   - Giấy phép: **Mixkit Stock Video Free License** — cho phép sử dụng miễn phí trong dự án thương mại và phi thương mại, không bắt buộc ghi công (đã ghi rõ tại chân trang và `README.md`).
2. **Video dự phòng dựng từ ảnh thật của khách (`assets/video/hero-alt-desktop.mp4` — 0.60 MB, `hero-alt-mobile.mp4` — 0.58 MB):**
   - Dựng bằng `tools/make_alt_video.py` (FFmpeg `zoompan` + `xfade` lặp liền mạch) từ 4 mẫu tách nền `LOOK 04`, `LOOK 00`, `LOOK 03`, `LOOK 07`.
   - Có thể bấm nút **"Lookbook chuyển động"** ngay góc dưới bên phải của Hero để chuyển đổi trực tiếp giữa 2 video.
