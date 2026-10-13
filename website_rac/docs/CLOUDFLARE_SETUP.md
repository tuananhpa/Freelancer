# Tự chạy và đưa website lên Cloudflare

Cấu hình trong dự án sử dụng **Cloudflare Workers Static Assets** để phục vụ frontend đã build từ Vite. Hiện chưa có Worker API hay Firebase thật. Deploy chỉ đưa giao diện lên Internet; tài khoản/điểm vẫn riêng trên từng trình duyệt đến khi nối backend.

## 1. Những gì đã được chuẩn bị
- `wrangler.json`: tên ứng dụng `truong-hoc-xanh`, thư mục xuất bản `dist`, fallback trang SPA và bật địa chỉ workers.dev.
- `package.json`: các lệnh chạy, kiểm tra và deploy Cloudflare.
- `package-lock.json`: khóa phiên bản công cụ để cài lại bằng `npm ci`.
- `.gitignore`: không đưa cache, file build, trạng thái Cloudflare và biến bí mật vào Git.

Cấu hình không chứa tài khoản Cloudflare, API token hoặc tên miền cá nhân. Sau này bạn đăng nhập tài khoản của chính mình trước khi deploy.

## 2. Chuẩn bị máy và mở đúng thư mục
Cài Node.js 22 LTS phiên bản từ 22.12 trở lên hoặc Node.js 24. Bạn cần một tài khoản Cloudflare; chưa cần mua tên miền để dùng workers.dev.

Mở PowerShell tại thư mục dự án:
```powershell
Set-Location 'D:\Freelancer\website_rac'
npm ci
```

Nếu mang dự án sang máy khác thì đổi đường dẫn thành thư mục trên máy đó. Nếu cài đặt gặp lỗi quyền npm cache:
```powershell
npm ci --cache .npm-cache
```

## 3. Chạy trên máy khi đang sửa giao diện
```powershell
npm run dev
```

Mở địa chỉ terminal hiển thị, thường là `http://127.0.0.1:5173`. Đường dẫn thùng R01 là `http://127.0.0.1:5173/?bin=R01#/home`. Dừng server bằng Ctrl+C.

Để kiểm tra bản build trên môi trường Cloudflare chạy cục bộ:
```powershell
npm run cf:dev
```

Lệnh build lại rồi khởi động server ở `http://127.0.0.1:8787`. Dùng `http://127.0.0.1:8787/?bin=R01#/home` để kiểm tra ngữ cảnh QR. Chế độ này chạy cục bộ, không xuất bản website.

## 4. Kiểm tra trước khi đưa lên Internet
```powershell
npm test
npm run cf:check
```

`cf:check` build và chạy `wrangler deploy --dry-run`: kiểm tra cấu hình và đóng gói mà không deploy. Đây không phải kiểm tra đăng nhập, quyền tài khoản Cloudflare hoặc khả năng deploy thật. Kiểm tra UI tự động bằng `npm run test:ui` khi server Vite cổng 5173 đang chạy và máy có Chrome.

## 5. Đăng nhập Cloudflare — làm một lần trên máy của bạn
```powershell
npm run cf:login
npx wrangler whoami
```

Lệnh login mở trình duyệt để bạn đăng nhập và cho phép Wrangler truy cập tài khoản. `whoami` cho biết tài khoản hiện dùng; kiểm tra đúng tài khoản trước khi deploy. Nếu có nhiều tài khoản, điền `account_id` của tài khoản muốn dùng vào `wrangler.json`; không cần đưa token vào file.

## 6. Deploy thật
Kiểm tra trường `name` trong `wrangler.json`. Đây là tên ứng dụng Cloudflare; giữ nguyên tên để các lần deploy sau cập nhật cùng ứng dụng. Nếu đã có ứng dụng trùng tên trong tài khoản, chọn tên riêng để tránh cập nhật nhầm.

```powershell
npm run cf:deploy
```

Lệnh này build rồi **xuất bản thật** lên tài khoản đã đăng nhập. Khi thành công, terminal in URL thực tế, dạng `https://truong-hoc-xanh.<subdomain-tai-khoan>.workers.dev`. Nếu tài khoản chưa có subdomain workers.dev, làm theo hướng dẫn của Cloudflare để chọn subdomain.

Mở URL terminal trả về; thử trang chủ, đăng ký, chọn lớp, bảng thi đua và admin. Tài khoản admin hiện là giao diện xem trước: chưa dùng bản frontend này như hệ thống quản lý điểm thật cho học sinh.

QR dán lên thùng dùng **URL đã deploy**, ví dụ cấu trúc `https://<dia-chi-web-thuc-te>/?bin=R01`. R02 dùng `?bin=R02`. Không dán localhost/127.0.0.1 vì mỗi điện thoại sẽ trỏ về chính điện thoại đó. Sau khi đổi domain, cập nhật mã QR để vẫn mở đúng website.

## 7. Khi sửa web và cập nhật lại
```powershell
npm test
npm run cf:check
npm run cf:deploy
```

Giữ nguyên `name` và tài khoản để cập nhật ứng dụng hiện có. Mã nguồn là nguồn chỉnh sửa; không sửa trực tiếp các file trong `dist` vì build sau sẽ tạo lại chúng. Deploy không đồng bộ dữ liệu localStorage giữa các thiết bị, và đổi domain cũng không mang theo dữ liệu trình duyệt từ domain cũ.

## 8. Gắn tên miền riêng, nếu bạn có
Trong Cloudflare Dashboard, vào **Workers & Pages → ứng dụng truong-hoc-xanh → Settings → Domains & Routes → Add → Custom Domain**. Chọn domain/subdomain đã nằm trong tài khoản Cloudflare và hoàn tất hướng dẫn. Domain phải là zone hoạt động trên Cloudflare. Tên mục dashboard có thể thay đổi; xem liên kết tài liệu chính thức bên dưới nếu khác.

Sau đó kiểm tra HTTPS, các trang và `?bin=R01`. Nếu sau này dùng Firebase Auth, bổ sung domain vừa dùng vào danh sách domain được phép trong Firebase và kiểm tra đăng nhập trên domain đó.

## 9. Backend sau này nối ở đâu?
Đọc `docs/BACKEND_HANDOFF.md` trước, rồi `docs/INTEGRATION_CONTRACT.md`.

Hướng phù hợp brief hiện tại: Cloudflare phục vụ frontend; Firebase Auth xử lý tài khoản, Realtime Database cung cấp dữ liệu realtime; dịch vụ backend tin cậy xác nhận phiên và cộng điểm. Chưa chốt nơi chạy dịch vụ cộng điểm: có thể triển khai dịch vụ phù hợp sau khi nhận cấu hình Firebase/firmware; không coi hosting frontend là backend đã hoạt động.

Nếu bổ sung API bằng Cloudflare Worker, sẽ cần entrypoint và cấu hình `main`/routing riêng. Không để fallback SPA trả HTML cho request API. Cấu hình hiện tại chỉ dành cho static assets, không có API.

## 10. Các lỗi thường gặp
- **Chưa có node/npm:** cài Node.js rồi mở lại PowerShell, chạy `node --version`.
- **Cổng đang dùng:** dừng server cũ bằng Ctrl+C; Vite có thể chọn cổng khác, hãy mở đúng địa chỉ terminal. Sau `npm run build`, server Cloudflare có thể đổi cổng bằng `npx wrangler dev --local --ip 127.0.0.1 --port 8788`.
- **Deploy báo chưa đăng nhập/không có quyền:** chạy `cf:login`, `wrangler whoami`, kiểm tra đúng tài khoản và quyền Worker.
- **Thiếu thư mục dist:** dùng các lệnh cf đã chuẩn bị, chúng build trước; không chạy Wrangler trực tiếp khi chưa build.
- **Ảnh/điểm thay đổi trên máy mình nhưng máy khác không thấy:** hiện đang dùng dữ liệu trình duyệt; cần backend thật để chia sẻ.
- **Trình duyệt chặn lưu trữ:** giao diện báo không lưu được thay đổi. Cho phép lưu trữ hoặc dùng trình duyệt khác; mã thùng từ URL vẫn đọc được.
- **Lỗi cài Wrangler/workerd trên Windows:** kiểm tra Node, kết nối mạng và quyền chạy chương trình. Đừng bỏ qua lỗi runtime rồi coi deploy đã thành công.

## Tài liệu chính thức đã đối chiếu
- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Wrangler commands: login, dev, deploy](https://developers.cloudflare.com/workers/wrangler/commands/)
- [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

Trạng thái: đã chuẩn bị cấu hình và hướng dẫn trong mã nguồn. Chưa đăng nhập hoặc deploy vào tài khoản Cloudflare của người dùng.

## Kết quả kiểm tra tại dự án — 13/10/2026
- Wrangler 4.149.0 đã được cài trong devDependencies và khóa trong package-lock.json.
- `npm run cf:check` đạt: build 10 modules, đọc 5 assets, kết thúc dry-run mà không deploy.
- `npm run cf:dev` chạy ở cổng 8787. Browser nhận HTTP 200, tải JS/CSS, hiển thị đúng R01/R02 và fallback SPA; không có pageerror.
- `npm test`: 12/12 đạt.
- Trong môi trường giới hạn quyền của agent, kiểm tra dùng XDG_CONFIG_HOME và WRANGLER_LOG_PATH trỏ vào `.wrangler` trong dự án. Đây chỉ là biến của lệnh kiểm tra, không thay cấu hình máy của bạn. Lệnh login/deploy bình thường dùng cấu hình người dùng của Wrangler.
- Chưa kiểm tra đăng nhập/quyền tài khoản Cloudflare hoặc deploy thật; cần bạn thực hiện bước 5–6.
