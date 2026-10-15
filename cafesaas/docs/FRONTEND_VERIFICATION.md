# Frontend verification —15/10/2026

Scope: A frontend browser-local preview. Không dùng các check này để tuyên bố backend/auth/bank/provider/printer production đã triển khai.

## Kết quả thực thi

- npm test:43/43 pass,5 test files (Vitest5.0.4).
- npm run typecheck:pass, được chạy trong npm run build.
- npm run build:exit0, Vue/Vite assets và Workbox sw.js/manifest generated.
- npm audit:0 vulnerabilities sau cập nhật Vitest5.0.4.
- Python Playwright local browser suite:16 nhóm checks pass;19staff/Admin/SaaS routes; desktop1440 và responsive320/390/768/1024;0page JavaScript errors.
- Tunnel browser smoke:4routes /pos,/admin/dashboard,/admin/products,/tables200; health200;0page errors.
- PWA qua tunnel:service worker ready, online reload controlled, offline reload vẫn có POS/menu và offline banner.
- Source exposure:/src/main.ts,/package.json,/.env,/api/v1/me404; /index.html chỉ là public build shell cần cho precache.

## Luồng browser đã kiểm tra

POS giỏ115000; sizeL+topping tạo175000 rồi remove; Admin thêm/sửa/archive và reload; bank giữ số0 đầu; QR115000 không tự Paid; transfer50000 +cash200000 cho due65000 trả135000; receipt58mm; dashboard theo cơ sở và CSV; table QR trên browser mới; customer submit Pending và theo dõi sau reload; mobile drawer/navigation; owner-only bank controls; offline label.

## Review và regression

6Important+3Minor đã xử lý; RED8 review cases trước sửa, GREEN toàn suite.
PWA RED:registration không active do /index.html precache bị allowlist404. Native register probe chỉ xác nhận register request, chưa chứng minh activation; sau xác định root cause, thêm static-path regression RED1/42pass rồi GREEN43. Remote offline smoke sau server restart pass.
Final review record:[REVIEW.md](REVIEW.md).

## Evidence

- [Browser results](screenshots/browser-results.json)
- [Tunnel/PWA results](screenshots/tunnel-results.json)
- [POS desktop](screenshots/pos-desktop.png),[mobile](screenshots/pos-390.png)
- [Admin desktop](screenshots/admin-desktop.png),[mobile](screenshots/admin-dashboard-390.png)
- [Customer mobile](screenshots/customer-390.png),[waiter mobile](screenshots/waiter-390.png)
- [Receipt58mm](screenshots/receipt-58mm.png)

Browser test data là synthetic trong context riêng; không được server lưu hoặc tự đưa lên app của người xem khác.

## Giới hạn thực tế

Dữ liệu riêng mỗi browser, stale tabs reject/reload, chưa real multi-client sync/tenant isolation. Chưa bank-app scan/settlement test, auth server, provider invoice issue, Print Agent hoặc USB/LAN hardware test. Chưa chốt offline order/payment sync; actions offline vẫn không lưu/gửi. Các integrations này ở roadmap backend.
Quick Tunnel phụ thuộc máy local/server/cloudflared; URL đổi khi restart và không uptime guarantee.
