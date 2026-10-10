# HYTale – Front-end (Landing Page QR Storytelling)

> Chạm mã QR – Mở câu chuyện quê. Front-end React + Vite cho hệ thống QR Storytelling & quản lý nông sản Hưng Yên.

## Chạy thử

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build production vào dist/
```

Mặc định chạy ở **chế độ mock** (`VITE_USE_MOCK=true` trong `.env`): toàn bộ API được giả lập bằng localStorage, không cần backend.
Tài khoản admin demo nằm trong `.env` (`VITE_MOCK_ADMIN_EMAIL`, `VITE_MOCK_ADMIN_PASSWORD`).
Xóa dữ liệu demo: DevTools → Application → Local Storage → xóa khóa `hytale.mock.db.v1`.

## Phân luồng người dùng

| Luồng | Đường dẫn | Đăng nhập |
|---|---|---|
| Trang chủ giới thiệu | `/` | Không |
| Landing page sản phẩm / lô hàng | `/p/:slug` | Không |
| Link in trên tem QR (QR động) | `/q/:code` → chuyển tới `/p/:slug` | Không |
| Đăng nhập quản trị | `/admin/login` | – |
| Dashboard, Sản phẩm, QR, Thống kê, Hộp thư, Đơn, Đánh giá, HTX | `/admin/*` | **Bắt buộc** (`RequireAdmin`) |

Khách quét QR **không bao giờ** bị yêu cầu đăng ký/đăng nhập: đặt mua, đánh giá, chat đều ẩn danh (chỉ nhập tên + SĐT khi cần).

## Thử nhanh

- `/q/NL26L01` — Nhãn lồng Hưng Yên (giả lập quét QR)
- `/q/VT26L01` — Vải trứng Hưng Yên
- `/q/CD26L01` — Cam Đường Canh

## Cây thư mục

```
front_end/
├── public/media/            # ảnh, poster, video đã nén cho web (H.264, hero loop ~1MB)
├── docs/API_CONTRACT.md     # đặc tả endpoint cho backend
└── src/
    ├── config/              # env.js (biến môi trường), constants.js, content.js
    ├── services/
    │   ├── http/            # client.js: fetch thật HOẶC mock, tự gắn Bearer token
    │   ├── api/             # products / engagement / chat / auth / admin / upload service
    │   └── mock/            # seed dữ liệu + route giả lập backend (xóa được khi có API thật)
    ├── context/AuthContext.jsx
    ├── router/              # AppRouter (public vs admin), RequireAdmin
    ├── hooks/ · utils/      # useAsync, format, qr (PNG/SVG/PDF + logo)
    ├── components/
    │   ├── common/          # Icon, CertBadge, Sheet, StateView
    │   ├── layout/          # SiteHeader, SiteFooter, AdminLayout, Brand
    │   ├── home/            # các section của trang chủ
    │   ├── product/         # 5 khối landing: Hero, Story, Timeline, Video carousel, CTA + Review, Chat
    │   └── admin/           # QrDesigner, BarChart, StatusPill, editor/ (5 tab soạn nội dung)
    ├── pages/public/        # HomePage, ProductPage, QrRedirectPage, NotFoundPage
    ├── pages/admin/         # Login, Dashboard, ProductList, ProductEditor, QrStudio, Analytics, Inbox, Orders, Reviews, Leads
    └── styles/              # tokens.css (màu Sơn mài Phố Hiến), base, public, product, admin
```

## Kết nối backend

1. Làm backend theo `docs/API_CONTRACT.md` (shape dữ liệu giống hệt `src/services/mock/seed.js`).
2. Sửa `.env`:
   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=/api/v1
   VITE_DEV_PROXY_TARGET=http://localhost:8000   # dev: Vite proxy /api -> backend
   VITE_PUBLIC_SITE_URL=https://hytales.vn       # domain mã hóa vào QR
   ```
3. Không cần sửa component: mọi lời gọi đi qua `src/services/api/*`.
4. Khi deploy SPA, cấu hình server trả `index.html` cho mọi route (`/p/*`, `/q/*`, `/admin/*`).
   Nên để `/q/:code` do backend xử lý trực tiếp (redirect 302) để đếm lượt quét chính xác và nhanh hơn.

## Thiết kế

Bảng màu **“Sơn mài Phố Hiến”** — lấy cảm hứng từ tranh sơn mài, phù sa sông Hồng và “Thức quà tiến Vua”:
đen sơn mài `#17110D`, đỏ son `#B23A22` (CTA), vàng thếp `#D4A64A`, giấy dó `#F5EEE2`, xanh VietGAP `#2F5D45`.
Font: Playfair Display (tiêu đề) + Be Vietnam Pro (nội dung) — đều hỗ trợ tiếng Việt đầy đủ.
Mobile-first, trang sản phẩm tối đa 560px, nút bấm ≥ 44px, video hero ~1MB tự phát tắt tiếng.
