# Chia sẻ bản local

Mở PowerShell tại `front_end_codex/front_end`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/share-local.ps1
```

Script build frontend, chạy production preview tại `http://127.0.0.1:4173`, rồi chạy Cloudflare Quick Tunnel. Copy link HTTPS in ra để gửi người xem. Chỉ bản `dist` được phục vụ; `.runtime/`, tài liệu nguồn và source code không nằm trong thư mục public.

Link/PID/log nằm trong `.runtime/`. Chạy lại khi tunnel còn sống trả cùng link. Sau khi sửa code, chạy `npm run build` để cập nhật bản đang chia sẻ. Vite preview cho phép hostname `*.trycloudflare.com`, fallback về index.html cho trang sản phẩm/admin/QR.

Tắt chia sẻ:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/stop-sharing.ps1
```

Script chỉ dừng các tiến trình đã ghi PID và có command line thuộc dự án này. Không tắt dev server 5173. Máy phải bật, có mạng và preview/tunnel còn chạy để link truy cập được. Quick Tunnel tạo URL tạm, có thể đổi khi khởi động lại; không dùng URL tạm để in tem QR lâu dài. Xem [Cloudflare Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/).

Đây là frontend mock: người xem không cần đăng nhập; `/admin/login` có phiên demo. Dữ liệu localStorage/IndexedDB và file upload thuộc từng trình duyệt, không đồng bộ giữa người xem. Để mọi người thấy cùng thay đổi CMS cần nối backend theo `docs/API_CONTRACT.md`.
