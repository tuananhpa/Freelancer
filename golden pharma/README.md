# Golden Pharma — Website Thương Mại Điện Tử Thuốc Thú Y & Chế Phẩm Sinh Học

Website bán hàng thương mại điện tử cho **Công Ty Cổ Phần Quốc Tế Thú Y Vàng (Golden Pharma)**, được thiết kế với trải nghiệm cuộn mượt 60fps trên cả máy tính và điện thoại, hiệu ứng sản phẩm nổi 3D và bộ ảnh sản phẩm chuẩn hoá theo mẫu `sample-product.png` (chỉ giữ bao bì chính, tách nền sạch, bóng đổ mềm dưới đáy và khung bo góc tròn).

---

## 1. Thông tin thương hiệu

- **Đơn vị chủ quản**: Công Ty Cổ Phần Quốc Tế Thú Y Vàng
- **Thương hiệu**: Golden Pharma
- **Địa chỉ**: Tầng 4, lô 30-31 Liền kề 2, khu đô thị Đại Thanh, Xã Đại Thanh, TP Hà Nội
- **Hotline / Zalo**: `0968.486.985` (`https://zalo.me/0968486985`)
- **Email**: `goldenvet10@gmail.com`
- **TikTok Shop chính thức**: [@thuyvanghanoi — Dược Phẩm Vàng](https://www.tiktok.com/@thuyvanghanoi)

---

## 2. Chạy thử trên máy (Local Development)

Dự án được đóng gói dưới dạng static e-commerce chuẩn (không phụ thuộc CDN ngoài, tự host font tiếng Việt và GSAP/Lenis vendor), có thể chạy ngay bằng một trong các cách sau:

```bash
# Cách 1: Dùng npm script
npm run dev

# Cách 2: Dùng Python http.server
python -m http.server 4173
```

Sau đó mở trình duyệt tại `http://localhost:4173`.

---

## 3. Cấu trúc thư mục

```text
golden pharma/
├── index.html                  # Trang chủ (Hero 3D, Danh mục, Spotlight 3D, Lưới sản phẩm, Chứng nhận, CTA Đại lý)
├── san-pham.html               # Danh mục toàn bộ 30 sản phẩm (lọc danh mục, vật nuôi, tìm kiếm, sắp xếp)
├── chi-tiet-san-pham.html      # Chi tiết sản phẩm (Gallery bo góc theo sample-product.png, xoay 3D, chọn quy cách)
├── thanh-toan.html             # Trang đặt hàng & thanh toán (COD / Chuyển khoản / Xuất đơn Zalo)
├── xac-nhan-don.html           # Trang xác nhận đơn hàng thành công
├── gioi-thieu.html             # Giới thiệu nhà máy & tiêu chuẩn GMP-WHO Golden Pharma
├── lien-he.html                # Liên hệ, đăng ký đại lý & bản đồ Google Maps Đại Thanh, Hà Nội
├── assets/
│   ├── brand/                  # Bộ 10 biến thể logo Golden Pharma & favicon đã tách nền
│   ├── css/
│   │   ├── fonts.css           # Tự host font Prata & Inter Tight hỗ trợ đầy đủ dấu tiếng Việt
│   │   ├── lenis.css           # CSS cho smooth scroll Lenis
│   │   └── main.css            # Hệ thống Design Token, Layout, Card bo góc, 3D Stage & Responsive
│   ├── fonts/                  # File font .woff2 nội bộ
│   ├── img/
│   │   ├── cut/                # 30 sản phẩm tách nền trong suốt (.webp 600w & 1000w) cho hiệu ứng 3D nổi
│   │   └── studio/             # 30 sản phẩm × 3 góc nhìn trên nền trắng ấm + bóng đổ mềm (.webp 400w/800w/1000w)
│   └── js/
│       ├── vendor/             # GSAP 3.12.5, ScrollTrigger, CustomEase, Lenis 1.1.13
│       ├── data.js             # Dữ liệu 30 sản phẩm trích xuất chuẩn từ products.xlsx & ảnh TikTok 01–30
│       └── main.js             # Logic giỏ hàng, Quick View, lọc/tìm kiếm, 3D tilt, xoay 3D & GSAP animations
├── docs/
│   ├── product-mapping.md      # Bảng đối chiếu 01.png–30.png ↔ product_id trong products.xlsx
│   └── screenshots/            # Ảnh chụp giao diện Desktop (1440px) & Mobile (375px)
└── scripts/
    └── product-selection.json  # Dữ liệu JSON gốc của 30 sản phẩm
```

---

## 4. Triển khai lên Cloudflare Pages

1. Đẩy thư mục dự án lên GitHub/GitLab hoặc dùng trực tiếp Wrangler CLI:
   ```bash
   npx wrangler pages deploy . --project-name golden-pharma
   ```
2. Nếu cấu hình trên giao diện Cloudflare Pages Dashboard:
   - **Framework preset**: `None`
   - **Build command**: *(để trống)*
   - **Build output directory**: `/` (thư mục gốc)
