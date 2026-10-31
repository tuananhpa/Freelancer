# ESER Fashion — website + trang quản trị

## Demo Cloudflare

Demo dùng Cloudflare Workers + D1, cấu hình trong `cloudflare.config.ts`.
Website: https://eser-demo.luuta-uranus.workers.dev — quản trị: `/admin`.
Chạy `npm install` rồi `npm run deploy` để cập nhật. `npm test` kiểm tra luồng API.
Database đã có bảng từ `schema.sql`; mật khẩu admin ngẫu nhiên ban đầu nằm trong
file cục bộ `.demo-admin-password` (không commit). Có thể đổi trong `/admin` → Cài đặt.
Nội dung, đơn liên hệ, phiên đăng nhập và ảnh upload lưu trong D1. Bản demo giới hạn
ảnh upload 1MB và giữ một bản nội dung trước lần lưu gần nhất; khi mở rộng nên dùng R2
cho ảnh. Chạy Node.js cục bộ bên dưới vẫn dùng file, tách biệt với dữ liệu D1.

> ESER — dress for success — *Mặc đẹp để thành công*

Landing page phong cách tạp chí, có scroll motion, kèm trang admin để chủ shop tự sửa nội dung.
Chỉ dùng Node.js thuần, **không cần `npm install`** và không cần database.

## Chạy thử trên máy

```bash
cd eser-website
node server.js            # hoặc: npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin, mật khẩu mặc định **`eser2020`**. Hãy đổi ngay trong *Cài đặt*.

Biến môi trường:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `3000` | Cổng chạy server |
| `ADMIN_PASSWORD` | `eser2020` | Mật khẩu **lần chạy đầu tiên** (khi chưa có `data/auth.json`) |

Quên mật khẩu: xoá `data/auth.json` rồi khởi động lại với `ADMIN_PASSWORD=matkhaumoi node server.js`.

## Cấu trúc

```
server.js                 HTTP server + API (đăng nhập, nội dung, upload ảnh, đơn hàng)
lib/render.js             Render HTML trang chủ từ nội dung (SSR, tốt cho SEO)
lib/default-content.json  Nội dung mẫu ban đầu
data/                     (tự tạo) content.json, inquiries.json, auth.json, backups/
public/css/site.css       Toàn bộ giao diện. Màu và font khai báo ở :root
public/js/site.js         Motion: màn mở đầu, parallax, chữ hiện dần, lookbook trượt ngang, giỏ hàng…
public/admin/             Trang quản trị
public/images/            Ảnh gốc của brand (đã nén từ ảnh khách gửi)
public/uploads/           Ảnh tải lên từ admin
```

## Khách tự sửa được gì trong /admin

- **Banner đầu trang**: dòng chữ nghiêng, chữ ESER lớn, câu giới thiệu, nút, 3 ảnh vòm
- **Dải chữ chạy**, **Giới thiệu** (câu tuyên ngôn và 4 số liệu)
- **Sản phẩm**: thêm, sửa, nhân bản, xoá, ẩn/hiện, sắp xếp; giá, giá gốc, nhãn (Mới / Bán chạy), size, mô tả, nhiều ảnh
- **Danh mục**, **Chọn theo dịp**, **Mua sắm & chính sách**, **Lookbook**, **Kêu gọi hành động**
- **Liên hệ**: hotline, Zalo, email, địa chỉ, bản đồ Google, Facebook / Instagram / TikTok
- **SEO**: tiêu đề và mô tả trên Google, ảnh khi chia sẻ link
- **Thư viện ảnh**: upload (tự nén còn tối đa 1600px), kéo-thả, xoá ảnh không dùng
- **Đơn hàng & liên hệ**: đơn từ giỏ hàng và tin nhắn từ form liên hệ. Có trạng thái (Mới / Đã liên hệ / Hoàn tất), ghi chú, xuất CSV mở bằng Excel
- **Cài đặt**: đổi mật khẩu, tải bản sao lưu, khôi phục, về nội dung mẫu

Trong các ô tiêu đề, bọc chữ trong `*dấu sao*` để chữ đó in nghiêng màu nhấn.
Mỗi lần lưu, server tự giữ bản sao lưu (30 bản gần nhất) trong `data/backups/`.

## Đưa lên hosting (VPS)

```bash
# trên VPS đã có Node 18+
npm i -g pm2
ADMIN_PASSWORD='mat-khau-manh' PORT=3000 pm2 start server.js --name eser
pm2 save && pm2 startup
```

Nginx reverse proxy (bật HTTPS bằng certbot):

```nginx
server {
  server_name eserfashion.vn www.eserfashion.vn;
  client_max_body_size 16m;          # cho upload ảnh
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Cần **sao lưu thư mục `data/` và `public/uploads/`**, vì đó là toàn bộ nội dung khách đã nhập.
Không dùng được hosting kiểu serverless (Vercel, Netlify), vì server ghi file lên ổ đĩa.

## Việc cần làm trước khi bàn giao

- [ ] Thay **giá, tên, mô tả sản phẩm** (hiện là giá minh hoạ) và **số liệu** ở phần Giới thiệu (2020 / 200+ / 30K / 07 là số ví dụ)
- [ ] Kiểm tra **chính sách đổi size / giao hàng** (đang là nội dung mẫu)
- [ ] Ghi địa chỉ chi tiết (số nhà) và giờ mở cửa; thêm link Facebook / Instagram
- [ ] Đổi mật khẩu admin
- [ ] Nếu có, thay ảnh hero bằng ảnh gốc độ phân giải cao (ảnh hiện tại đã nén từ ảnh chụp màn hình)
