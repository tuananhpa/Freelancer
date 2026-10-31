# HARMONY.STUDIO — Mockup Website Thời Trang (Bản gửi khách duyệt)

Bản mockup giao diện tĩnh (HTML/CSS/JS thuần, không cần bước build) cho thương hiệu thời trang **HARMONY.STUDIO**, tập trung vào hai hướng kinh doanh trong brief: **Thiết kế cho xưởng (B2B)** và **Đặt may sản phẩm riêng theo số đo**, đồng thời làm nổi bật **4 bộ sưu tập** và **4 ngách thời trang** (Đầm công sở, Đầm dự tiệc, Set & chân váy, Áo dài).

---

## 1. Cách mở xem thử

Chạy bất kỳ server tĩnh nào tại thư mục `harmay-mockup/`:

```bash
# Cách 1 (Python)
python -m http.server 8080

# Cách 2 (Node)
npx serve . -l 8080
```

Sau đó mở trình duyệt tại `http://localhost:8080`.
- Để xem lại màn mở đầu (intro kiểu D&G Alta Moda) bất cứ lúc nào: mở `http://localhost:8080/?intro=1`.
- Khi khách duyệt xong và muốn đưa lên **Cloudflare Pages** (bản demo): chỉ cần trỏ thư mục gốc `harmay-mockup/` lên Cloudflare Pages, **Build command** để trống, **Build output directory** để `/`.

---

## 2. Cấu trúc thư mục

```text
harmay-mockup/
├── index.html                  # Trang chủ: Intro → Video Hero → Tuyên ngôn → 4 Chương BST → Runway → 4 Ngách → Dịch vụ → Quy trình → Liên hệ
├── bo-suu-tap.html             # Danh sách 4 bộ sưu tập (lọc trực tiếp theo 4 ngách thời trang)
├── chi-tiet-bo-suu-tap.html    # Lookbook kiểu runway (?id=rouge | creme | noir | flora) + modal xem nhanh
├── dich-vu.html                # Thiết kế cho xưởng (B2B) + May đo riêng (Bespoke) + 2 form riêng
├── gioi-thieu.html             # Câu chuyện thương hiệu + gallery ngang 10 mẫu tiêu biểu
├── lien-he.html                # Form chọn nhu cầu (Đặt may / Thuê thiết kế / Hỏi về BST)
├── assets/
│   ├── css/
│   │   ├── main.css            # Design tokens ở đầu file (màu, font, khoảng cách, motion) + toàn bộ giao diện
│   │   ├── fonts.css           # Khai báo @font-face Prata & Inter Tight (subset vietnamese + latin)
│   │   └── lenis.css
│   ├── fonts/                  # File font .woff2 tự host (không lo lỗi mạng hay rớt dấu tiếng Việt)
│   ├── js/
│   │   ├── data.js             # Dữ liệu 4 ngách, 4 bộ sưu tập, 18 look (sinh từ tools/build_data.py)
│   │   ├── main.js             # Đối tượng SITE (1 chỗ sửa liên hệ & video), intro, motion, modal, form
│   │   └── vendor/             # GSAP 3.15.0 + ScrollTrigger + CustomEase + Lenis 1.3.27 (ghim phiên bản)
│   ├── img/
│   │   ├── cut/                # 18 mẫu người mẫu đã tách nền (look-00..17, cỡ 600/1100/1800px WebP)
│   │   └── photo/              # Ảnh có bối cảnh đã cắt khung an toàn không còn chữ ESER (400/800/1365px WebP)
│   └── video/
│       ├── hero-desktop.mp4        # Video mở đầu ngang 1920×1080 (H.264 +faststart, 4.99 MB)
│       ├── hero-mobile.mp4         # Video mở đầu dọc 720×1280 (2.29 MB)
│       ├── hero-alt-desktop.mp4    # Video dự phòng dựng từ ảnh thật của khách (1920×1080)
│       ├── hero-alt-mobile.mp4     # Video dự phòng bản dọc (720×1280)
│       ├── hero-poster.webp        # Ảnh bìa khung đầu (desktop)
│       └── hero-poster-mobile.webp # Ảnh bìa khung đầu (mobile)
├── docs/
│   ├── research.md             # Phân tích mẫu tham khảo (D&G Alta Moda, 2 pin Pinterest) & lý do bản cũ chưa đạt
│   ├── design-direction.md     # Ý tưởng thiết kế, bảng màu, thang chữ, kịch bản motion
│   └── screenshots/            # Ảnh chụp desktop (1440px), mobile (375px) & 2 video quay cuộn trang
└── content-map.md              # Nguồn nội dung, bảng xử lý logo ESER trên từng ảnh & danh sách [[CẦN XÁC NHẬN]]
```

---

## 3. Cách thay video, ảnh và thông tin liên hệ sau này

1. **Thay SĐT, link Zalo, Messenger, địa chỉ, email:**
   Mở `assets/js/main.js`, sửa đối tượng `SITE` ở ngay đầu file (dòng 5–26). Toàn bộ header, menu, nút nổi, thanh đáy mobile, trang liên hệ và footer sẽ tự cập nhật.
2. **Thay video mở đầu:**
   Chép file MP4 mới vào `assets/video/` và sửa đường dẫn trong `SITE.heroVideo = { desktop, mobile, poster }` ở đầu `assets/js/main.js`.
3. **Thay ảnh sản phẩm mới:**
   Bỏ ảnh mới vào thư mục nguồn rồi chạy `python tools/process_images.py` và `python tools/build_data.py`, hoặc thay trực tiếp các file `assets/img/cut/look-XX-*.webp`.

---

## 4. Nguồn và giấy phép video

- **Video mặc định (`hero-desktop.mp4`, `hero-mobile.mp4`):** biên tập từ Mixkit Stock Video `#809` (*Mixkit Stock Video Free License* — miễn phí cho mục đích thương mại và phi thương mại).
- **Video dự phòng (`hero-alt-desktop.mp4`, `hero-alt-mobile.mp4`):** dựng bằng FFmpeg từ chính bộ ảnh sản phẩm khách hàng cung cấp.
