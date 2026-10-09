# HYTale – Hợp đồng API (Frontend ⇄ Backend)

Frontend gọi API qua `src/services/http/client.js`. Gốc API = `VITE_API_BASE_URL` (mặc định `/api/v1`).

- Request/response: JSON. Backend có thể trả thẳng object hoặc bọc `{ "data": ... }` — client tự bóc.
- Lỗi: HTTP status ≠ 2xx, body `{ "message": "..." }` (message hiển thị cho người dùng, tiếng Việt).
- Xác thực admin: header `Authorization: Bearer <token>`. API trả `401` khi token hết hạn → frontend tự đăng xuất.
- Endpoint public KHÔNG yêu cầu đăng nhập (khách quét QR vào thẳng).
- Bản mock của mọi endpoint nằm ở `src/services/mock/routes.*.js` — xem để biết chính xác shape dữ liệu.

## 1. Public (khách hàng, không cần đăng nhập)

| Method | Path | Body / Query | Trả về |
|---|---|---|---|
| GET | `/products` | – | `ProductSummary[]` (chỉ sản phẩm `published`) |
| GET | `/products/:slug` | – | `Product` (404 nếu không có / chưa công bố) |
| POST | `/products/:slug/views` | `{ source: "direct" }` | `{ ok: true }` – ghi lượt xem |
| GET | `/qr/:code` | – | `{ slug }` – giải mã QR động + ghi lượt quét (lấy IP → vị trí, user-agent → thiết bị) |
| GET | `/products/:slug/reviews` | – | `Review[]` đã duyệt |
| POST | `/products/:slug/reviews` | `{ name, rating 1-5, comment, photos: dataURL[] ≤3 }` | `Review` (status `pending`) |
| POST | `/orders` | `{ productSlug, batchCode, name, phone, address, quantity, isGift, recipientName, recipientPhone, note }` | `{ id, code }` |
| POST | `/leads` | `{ name, organization, phone, message, source }` | `{ id }` |
| POST | `/chat/sessions` | `{ productSlug? }` | `{ sessionId, messages: Message[], quickReplies: string[] }` |
| GET | `/chat/sessions/:id/messages` | – | `Message[]` (frontend polling 8s; có thể nâng cấp WebSocket) |
| POST | `/chat/sessions/:id/messages` | `{ text }` | `Message[]` (gồm cả câu trả lời bot FAQ nếu khớp) |

> Gợi ý: ở production nên để backend trả ảnh review dưới dạng URL (upload lên storage) thay vì lưu dataURL.

## 2. Auth (admin)

| Method | Path | Body | Trả về |
|---|---|---|---|
| POST | `/auth/login` | `{ email, password }` | `{ token, user: { id, email, name, role } }` |
| GET | `/auth/me` | – | `user` |
| POST | `/auth/logout` | – | `{ ok: true }` |

## 3. Admin (cần Bearer token)

| Method | Path | Body / Query | Ghi chú |
|---|---|---|---|
| GET | `/admin/products` | – | `ProductSummary[]` (mọi trạng thái) |
| GET | `/admin/products/:id` | – | `Product` |
| POST | `/admin/products` | `Product` (không id) | Tự sinh `id`, `slug` (từ tên nếu trống) và `qrCode` duy nhất |
| PUT | `/admin/products/:id` | `Product` | **Không được đổi `qrCode`** – để tem đã in vẫn hoạt động |
| DELETE | `/admin/products/:id` | – | 204 |
| PUT | `/admin/products/:id/qr` | `{ color, withLogo, targetSlug? }` | `targetSlug` = đổi trang đích của mã QR (Dynamic Link) |
| GET | `/admin/analytics/summary` | `?days=30&productId=` | xem shape `Analytics` bên dưới |
| GET | `/admin/orders` · PATCH `/admin/orders/:id` | `{ status: new\|contacted\|done\|cancelled }` | |
| GET | `/admin/reviews` · PATCH `/admin/reviews/:id` | `{ status: pending\|approved\|hidden }` | |
| GET | `/admin/leads` | – | Đăng ký tư vấn HTX |
| GET | `/admin/chat/threads` | – | `Thread[]` kèm `lastMessage`, `unread` |
| GET | `/admin/chat/threads/:id` | – | `Thread` đầy đủ, đánh dấu đã đọc |
| POST | `/admin/chat/threads/:id/messages` | `{ text }` | `Thread` |
| POST | `/admin/uploads` | multipart `file` | `{ url }` – ảnh/video lên CDN |

## 4. Kiểu dữ liệu chính

```ts
type Product = {
  id: string; slug: string; qrCode: string; status: 'draft' | 'published';
  name: string; tagline: string; category: string;
  batchCode: string; harvestDate: string /* YYYY-MM-DD */; expiryDate: string;
  origin: string; cooperative: string;
  certifications: ('ocop4'|'ocop5'|'vietgap'|'globalgap'|'gi'|'organic')[];
  coverUrl: string;
  hero: { loopUrl: string; videoUrl: string; posterUrl: string; duration: string };
  story: { title: string; paragraphs: string[]; facts: {value: string; label: string}[]; gallery: {url: string; alt: string}[] };
  timeline: { id: string; when: string; title: string; description: string }[];
  shortVideos: { id: string; title: string; videoUrl: string; posterUrl: string; duration?: string }[];
  cta: { zaloUrl: string; hotline: string; orderEnabled: boolean };
  faqs: { id: string; question: string; answer: string }[];
  qr: { color: string; withLogo: boolean; targetSlug?: string };
  updatedAt: string; // ISO
};

type ProductSummary = Pick<Product, 'id'|'slug'|'qrCode'|'name'|'tagline'|'category'|'coverUrl'|'certifications'|'status'|'batchCode'|'updatedAt'>
  & { duration?: string; heroLoopUrl?: string; posterUrl?: string };

type Message = { id: string; from: 'bot' | 'customer' | 'admin'; text: string; at: string };

type Analytics = {
  totalScans: number; qrScans: number; orders: number; pendingReviews: number; unreadMessages: number;
  byDay: { date: string; count: number }[];
  byProduct: { productId: string; name: string; count: number }[];
  byLocation: { location: string; count: number }[];
  byHour: number[]; // 24 phần tử
  recent: { id: string; productName: string; source: 'qr'|'direct'; at: string; location: string; device: string }[];
};
```

## 5. Luồng QR động

```
Tem in:  https://hytales.vn/q/NL26L01      (không bao giờ đổi)
  └─ GET /api/v1/qr/NL26L01  → backend ghi lượt quét, trả { slug }
       └─ frontend chuyển tới /p/<slug>?src=qr
```
Admin đổi `targetSlug` hoặc sửa nội dung sản phẩm → khách quét tem cũ thấy nội dung mới ngay.
