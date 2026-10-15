# Local tunnel —15/10/2026

URL: https://postings-analysis-requested-adequate.trycloudflare.com
POS: /pos
Admin: /admin/dashboard
Source local: http://127.0.0.1:4177
Server: scripts/serve.mjs, phục vụ apps/web/dist.
Quick Tunnel: cloudflared tunnel --url http://127.0.0.1:4177 --protocol http2 --no-autoupdate

Phiên công cụ hiện tại: server exec session79800, tunnel exec session7991. Đây là tham chiếu phiên, không phải PID hệ điều hành và không dùng Stop-Process với các số này.
URL còn hoạt động khi server+tunnel và máy local còn chạy. Không có SLA; URL có thể đổi khi restart.
Chỉ phục vụ dist qua allowlist, không source/env/package.json/api. HTTP health/pos đã kiểm tra200; browser remote/PWA results ở docs/screenshots/tunnel-results.json sau khi check kết thúc.

Dữ liệu riêng từng browser; không tạo auth server hoặc database dùng chung chỉ vì có link công khai. Không dùng dữ liệu/ngân hàng thật trong bản xem này.
