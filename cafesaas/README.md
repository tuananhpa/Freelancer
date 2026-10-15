# Coffee POS & QR Ordering SaaS

Frontend Vue 3 theo thiết kế **A — Menu trực quan**. Người dùng đã chọn A và yêu cầu build, mở tunnel, rồi commit/push riêng dự án cafesaas vào repository D:/Freelancer.

## Xem ứng dụng

- POS: https://postings-analysis-requested-adequate.trycloudflare.com/pos
- Admin: https://postings-analysis-requested-adequate.trycloudflare.com/admin/dashboard
- Local: http://127.0.0.1:4177

Quick Tunnel chỉ hoạt động khi server local, cloudflared và máy này còn chạy. URL có thể đổi khi khởi động lại tunnel.

## Phạm vi hiện tại

Có đủ16 nhóm giao diện ban đầu, theo [ma trận chức năng](docs/FRONTEND_SCOPE.md). Các luồng frontend chính hoạt động bằng fixtures và localStorage: POS, size/topping/ghi chú, bàn/QR, khách mobile, waiter, KDS, Admin CRUD, VietQR, thanh toán lưu cục bộ, tách/gộp bill, hoàn tiền, dashboard ngày/cơ sở, báo cáo và CSV.

Dữ liệu lưu riêng theo trình duyệt; chưa có đồng bộ giữa thiết bị hoặc auth/backend thật. In USB/LAN, webhook ngân hàng, phát hành hóa đơn điện tử và quản lý thuê bao production có giao diện/cổng tích hợp nhưng chưa kết nối. Không dùng bản này cho giao dịch thật.

## Chạy local

Node.js24 được dùng để kiểm tra bản này.

```powershell
cd D:\Freelancer\cafesaas
npm ci
npm test
npm run build
npm run serve
```

Dev: npm run dev (localhost5177). Preview dist: npm run serve (localhost4177).
Cấu trúc apps/web và packages/* giữ module riêng, tooling đặt ở root để tránh lỗi symlink npm workspace trên Windows.

## Mở lại tunnel

Trong terminal thứ hai:

```powershell
cloudflared tunnel --url http://127.0.0.1:4177 --protocol http2 --no-autoupdate
```

Chỉ dist được phục vụ; source, .env, package.json và /api/* trả404. Không chạy tunnel tới thư mục D:/Freelancer hoặc dev file server của toàn repository.

## Kiểm tra trình duyệt

```powershell
python -m pip install --target .local/python-deps -r tests/requirements.txt
$env:PYTHONIOENCODING="utf-8"
npm run test:e2e
python tests/tunnel_smoke.py https://<quick-tunnel>.trycloudflare.com
```

Tests dùng Chrome tại đường dẫn Windows mặc định. Dùng cùng Python để cài dependency và chạy tests; khi đổi Python version, cài lại dependency native. Browser tests dùng context riêng, không thay dữ liệu trên trình duyệt người dùng.
[Bằng chứng kiểm tra](docs/FRONTEND_VERIFICATION.md), [kết quả browser](docs/screenshots/browser-results.json).

## Tài liệu và quyết định

- [Kiến trúc và roadmap backend](PLAN.md)
- [Database/ERD](DATABASE.md), [API](API.md), [Luồng](FLOWS.md)
- [Printing](PRINTING.md), [Security](SECURITY.md), [Deployment](DEPLOYMENT.md), [Test plan](TEST_PLAN.md)
- [Brief](docs/CLIENT_BRIEF.md), [MASTER PROMPT gốc](docs/MASTER_PROMPT.md)
- [Thiết kế A đã chọn](docs/DESIGN_SELECTION.md), [kế hoạch frontend](docs/FRONTEND_PLAN.md)
- [Nhật ký triển khai](docs/IMPLEMENTATION_LOG.md), [review](docs/REVIEW.md)

Bước tiếp theo theo client-web-flow khi được yêu cầu: dọn dữ liệu/logic thử và cập nhật PLAN.md từ frontend thực tế trước triển khai backend theo phase. Chưa tự mua dịch vụ hoặc deploy production.
