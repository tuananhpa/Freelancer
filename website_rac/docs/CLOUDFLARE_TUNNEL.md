# Chạy web bằng Cloudflare Tunnel

Đây là cách người dùng muốn sử dụng: máy bạn chạy web, Cloudflare Tunnel cấp đường link để điện thoại/máy khác truy cập. Không cần deploy frontend lên Workers. Máy và hai tiến trình phải đang chạy; tắt máy hoặc dừng tunnel thì đường link ngừng hoạt động.

## Đã setup trong dự án
- Máy hiện có `cloudflared`. Kiểm tra bằng `cloudflared --version`.
- `vite.config.js`: preview cổng 4173, chỉ nghe localhost, chấp nhận hostname Quick Tunnel `.trycloudflare.com`.
- `npm run tunnel:serve`: build và chạy bản web đã build ở cổng 4173.
- `npm run tunnel:open`: mở Quick Tunnel đến đúng cổng 4173.
- Không cần `wrangler.json`, `cf:login` hoặc `cf:deploy` khi sử dụng Tunnel. Các file/lệnh Workers cũ được giữ như lựa chọn hosting riêng.

## Chạy trên máy hiện tại
Mở **hai cửa sổ PowerShell**.

**Cửa sổ 1 — chạy web:**
```powershell
cd D:\Freelancer\website_rac
npm ci
npm run tunnel:serve
```

Đợi terminal báo web đã chạy tại `http://127.0.0.1:4173`. Mở URL này để kiểm tra. Giữ cửa sổ đang chạy.

**Cửa sổ 2 — mở đường link:**
```powershell
cd D:\Freelancer\website_rac
npm run tunnel:open
```

Cloudflared sẽ in URL thực tế dạng `https://<ten-ngau-nhien>.trycloudflare.com`. Copy URL từ terminal, không dùng tên ví dụ này.

Thùng R01 dùng `https://<URL-thuc-te>/?bin=R01#/home`. R02 đổi thành `?bin=R02`. Mở đường link bằng điện thoại để thử hoặc tạo QR từ URL này. Quick Tunnel không cần tài khoản Cloudflare hay domain; URL thay đổi khi tạo tunnel mới. Đây phù hợp cho thử nghiệm và trình diễn, không dùng QR cố định lâu dài.

**Dừng:** Ctrl+C ở cả hai cửa sổ. Không cần deploy hay gỡ ứng dụng Cloudflare.

## Sửa code rồi xem bản mới
Trong cửa sổ 1, Ctrl+C rồi chạy lại `npm run tunnel:serve` để build code mới. Cửa sổ tunnel có thể giữ nguyên; chờ server chạy lại rồi reload trình duyệt. Nếu đóng/mở lại Quick Tunnel thì copy URL mới.

Nếu chỉ đang sửa giao diện trên máy, dùng `npm run dev` ở cổng 5173 như trước. Các lệnh Tunnel đã chuẩn bị trỏ đến **4173**, không phải 5173 hoặc 8787.

## Chạy trên máy khác
1. Cài Node.js 22.12+ hoặc 24.
2. Cài cloudflared theo [hướng dẫn chính thức](https://developers.cloudflare.com/tunnel/get-started/).
3. Mở lại PowerShell, kiểm tra `node --version` và `cloudflared --version`.
4. Copy mã nguồn và package-lock.json, mở đúng thư mục, chạy `npm ci`, rồi làm hai bước trên.

## Nếu muốn link cố định theo tên miền
Dùng named tunnel và domain trong tài khoản Cloudflare. Không tự tạo tunnel/domain khi chưa có thông tin tài khoản.

Cách cấu hình local theo tài liệu Cloudflare:
1. `cloudflared tunnel login` rồi đăng nhập trong trình duyệt.
2. `cloudflared tunnel create truong-hoc-xanh` để tạo tunnel và lấy UUID/credentials file.
3. Tạo config riêng ngoài Git, dùng UUID và credentials path thật:
```yaml
tunnel: <UUID-that>
credentials-file: 'C:\Users\<ten-user>\.cloudflared\<UUID-that>.json'
ingress:
  - hostname: rac.tenmien-cua-ban.vn
    service: http://127.0.0.1:4173
  - service: http_status:404
```
4. Thêm hostname thật vào `preview.allowedHosts` trong `vite.config.js`, ví dụ `'rac.tenmien-cua-ban.vn'` bên cạnh `'.trycloudflare.com'`.
5. `cloudflared tunnel route dns truong-hoc-xanh rac.tenmien-cua-ban.vn`.
6. Chạy web bằng `npm run tunnel:serve`, và tunnel bằng `cloudflared tunnel --config '<duong-dan-config-that>' run truong-hoc-xanh`.

Các giá trị trong dấu `<...>` phải thay trước khi chạy. Giữ credentials/token ngoài Git. Link cố định vẫn cần máy/server đang bật. Không tự cài Windows service trong lần setup này.

## Lỗi thường gặp
- **502 / connection refused:** kiểm tra cửa sổ 1 còn chạy và mở được localhost:4173.
- **Blocked request / hostname not allowed:** Quick Tunnel đã được cấu hình; nếu dùng domain riêng hãy thêm đúng hostname vào allowedHosts, không bật chấp nhận tất cả hostname.
- **Port 4173 is already in use:** dừng server cũ. Cổng được cố định để tunnel không trỏ nhầm khi Vite tự chọn cổng khác.
- **Không có lệnh cloudflared:** cài công cụ rồi mở lại PowerShell.
- **Quick Tunnel bị ảnh hưởng config cũ:** kiểm tra config trong thư mục người dùng `.cloudflared`; không xóa config của tunnel khác. Có thể dùng cấu hình riêng theo tài liệu cloudflared.
- **Đã lưu trên điện thoại nhưng máy tính không thấy:** dữ liệu hiện vẫn localStorage riêng từng trình duyệt; Tunnel không tạo database dùng chung. Cần backend/Firebase thật.

Nguồn: [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/) và [named tunnel](https://developers.cloudflare.com/tunnel/features/locally-managed-tunnels/create-local-tunnel/).

Trạng thái: chuẩn bị lệnh và cấu hình trong repo; chưa mở một tunnel công khai trong lần setup này.

Kiểm tra ngày 13/10/2026: cloudflared 2026.10.0 có sẵn; `tunnel:serve` build đạt và chạy ở 4173. Request với hostname Quick Tunnel nhận HTTP 200, hostname ngoài danh sách nhận 403. Chưa kiểm tra đường truyền công khai vì chưa chạy `tunnel:open`.
