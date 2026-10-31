# BM Global Spirits — Frontend (React + Vite + Cloudflare)

Bản production frontend cho **BM Global Spirits**, được chuyển đổi 100% nguyên bản từ mockup sang kiến trúc **React + Vite + GSAP + Cloudflare Worker** (sẵn sàng deploy lên Cloudflare).

---

## 1. Cấu trúc thư mục

```text
BM_Frontend/
├── index.html                  # Trang chủ (Home)
├── san-pham.html               # Danh mục 615 sản phẩm (Catalog)
├── chi-tiet-san-pham.html      # Chi tiết sản phẩm (Product Detail)
├── gioi-thieu.html             # Giới thiệu & Danh mục đại diện (About)
├── lien-he.html                # Liên hệ & Phiếu tiếp nhận yêu cầu (Contact)
├── public/
│   └── assets/
│       ├── fonts/              # Self-hosted Cormorant Garamond & Be Vietnam Pro (.woff2)
│       ├── img/
│       │   ├── brand/          # Logo, monogram, favicon, OG cover
│       │   └── products/       # 615 ảnh sản phẩm (300w / 600w / 1200w WebP) + meta.json
│       └── js/
│           └── data.js         # Bản dữ liệu gốc dự phòng
├── src/
│   ├── main.jsx                # Entry point React
│   ├── App.jsx                 # Điều phối trang & đồng bộ window.BM
│   ├── styles/
│   │   ├── fonts.css           # Khai báo @font-face local
│   │   └── main.css            # Hệ thống thiết kế CSS nguyên bản ("Vệt sáng" 57°)
│   ├── data/
│   │   ├── bmData.js           # Dữ liệu 615 sản phẩm, 171 thương hiệu, 26 quốc gia, 6 danh mục
│   │   └── siteConfig.js       # Thông tin liên hệ (Hotline, Zalo, Email, Địa chỉ) & danh sách tuyển chọn
│   ├── utils/
│   │   ├── helpers.js          # Bộ lọc, tìm kiếm bỏ dấu tiếng Việt, định dạng nồng độ, sao chép mã chai
│   │   └── useMotion.js        # Hiệu ứng cuộn GSAP + ScrollTrigger (tự động tắt khi prefers-reduced-motion)
│   ├── components/
│   │   ├── Header.jsx          # Header, Mega menu Danh mục, Drawer mobile, Hộp thoại Tìm kiếm nhanh
│   │   ├── Footer.jsx          # Footer, Nút nổi Zalo/Hotline (FAB), Thanh điều hướng di động, Toast
│   │   ├── AgeGate.jsx         # Cổng xác nhận độ tuổi 18+ (lưu localStorage `bm-age-ok`)
│   │   ├── Niche.jsx           # Hốc gỗ trưng bày chai (Niche) với vệt sáng chéo 57° & phản chiếu mặt bàn
│   │   ├── ProductCard.jsx     # Thẻ sản phẩm + nút sao chép nhanh thông tin chai
│   │   ├── InquiryForm.jsx     # Logic kiểm tra hợp lệ & gửi phiếu yêu cầu báo giá (`/api/inquiries`)
│   │   └── Icons.jsx           # SVG Sprite biểu tượng
│   └── pages/
│       ├── HomePage.jsx        # Trang chủ
│       ├── CatalogPage.jsx     # Trang danh mục (lọc theo danh mục, tiểu loại, quốc gia, thương hiệu, ABV, phân trang)
│       ├── ProductPage.jsx     # Trang chi tiết chai (thông số, ghi chú thưởng thức, chai cùng thương hiệu/danh mục)
│       ├── AboutPage.jsx       # Trang giới thiệu
│       └── ContactPage.jsx     # Trang liên hệ & kênh đối tác B2B
├── worker.mjs                  # Cloudflare Worker phục vụ tài sản tĩnh + API `/api/inquiries` & `/api/health`
├── wrangler.jsonc              # Cấu hình triển khai Cloudflare Workers / Assets
├── vite.config.js              # Cấu hình multi-page build với Vite
└── package.json
```

---

## 2. Chạy thử trên máy (Local Development)

```bash
cd "BM_Frontend"
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`.

---

## 3. Build bản Production

```bash
npm run build
npm run preview
```

Toàn bộ tài sản tối ưu sẽ được xuất ra thư mục `dist/`.

---

## 4. Triển khai lên Cloudflare (Cloudflare Workers / Pages)

### Cách 1: Deploy trực tiếp bằng Wrangler (Khuyến nghị)
Dự án đã cấu hình sẵn `wrangler.jsonc` và `worker.mjs` (hỗ trợ cả giao diện tĩnh lẫn endpoint `/api/inquiries`):

```bash
npx wrangler login
npm run deploy
```

### Cách 2: Kết nối Git trên Cloudflare Dashboard
- **Root directory**: `BM_Frontend`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

---

## 5. Cập nhật thông tin liên hệ thật trước khi vận hành

Mở file [`src/data/siteConfig.js`](./src/data/siteConfig.js) và cập nhật đối tượng `SITE`:
- `phoneDisplay`: Số hiển thị trên giao diện
- `phoneTel`: Số dùng cho liên kết `tel:`
- `zaloUrl`: Đường dẫn `https://zalo.me/...`
- `email`: Địa chỉ email nhận báo giá
- `address`: Địa chỉ văn phòng / showroom thực tế
