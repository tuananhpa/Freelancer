# Cloudflare deployment, cost & reliability

Ngày đối chiếu nguồn chính thức: 14/10/2026. Chưa tạo resource, trả tiền hay deploy. Mọi chi phí dưới đây là tham khảo USD trước thuế; account plan/usage thực tế phải kiểm tra lại trước production.

## Topology đề xuất

Workers Static Assets phục vụ Vue SPA cùng origin /api/v1 Hono: đơn giản cookie/CORS/routing. Pages + API Worker là lựa chọn nếu CI/team ưu tiên, nhưng cần same-origin routing hoặc CORS/cookie phân tích. Không dùng VPS/Firebase/Supabase.

D1 binding DB, R2 binding MEDIA, secrets cho session/provider encryption nếu cần. Local Wrangler riêng data directory; staging và production có DB/bucket/keys riêng. Compatibility date pin tại implementation, versions lockfile và rollback assets versioned. Production secret không xuất qua VITE_*.

MVP polling không bắt buộc Queues/DO. Outbox lưu trong D1, agent claim/recovery drain; cron recovery phải bounded/idempotent. Khi cần fan-out dùng SSE hoặc DO/WebSocket sau sizing, không tự mua/enable resource.

## Giới hạn đã kiểm tra

| Thành phần | Free | Paid / lưu ý |
| --- | --- | --- |
| Workers requests | 100.000/ngày, CPU10ms/request | base tối thiểu5USD/tháng; gồm10triệu request/tháng,30triệu CPUms |
| D1 database count/size | 10 DB/account;500MB/DB | 50.000 DB/account;10GB/DB |
| D1 usage | 5triệu rows read/ngày;100.000 rows written/ngày | gồm25tỷ read +50triệu write/tháng |
| D1 storage | tối đa5GB/account | gồm5GB; overage0,75USD/GB-month |
| D1 PITR | 7ngày | 30ngày |
| R2 Standard | 10GB-month,1triệu Class A,10triệu Class B/tháng included | storage0,015USD/GB-month, Class A4,50USD/triệu, Class B0,36USD/triệu; egress free |
| Queues (optional) | 10.000 operations/ngày, retention24h | 1triệu operations/tháng included;0,40USD/triệu; retries làm tăng operations |
| Durable Objects (optional) | SQLite-backed có trên Free theo limits | tính request/duration/storage riêng; không ước tính bằng Workers request alone |

Nguồn: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [R2 pricing](https://developers.cloudflare.com/r2/pricing/), [Queues pricing](https://developers.cloudflare.com/queues/platform/pricing/), [Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).
Các bảng source có giới hạn khác nhau theo plan; không lấy10GB/DB áp cho Free. Free quota hết có thể ngừng phục vụ, không production guarantee.

## Sizing minh họa — chưa phải dự báo khách hàng

Giả định10 chi nhánh, mỗi chi nhánh2 KDS+2 cashier foreground10h/ngày polling5s:
10×4×10×3600/5 =288.000 request/ngày, chưa kể khách/Admin/agent. Vượt100.000 Workers Free request/day. Customer polling và agent claim cần gộp/long poll/backoff đo thực tế.

Công thức:
requests = Σ activeDevices × activeSeconds / pollInterval + mutations + public reads.
D1 cost theo rows scanned/written, không count returned rows. Query/index/cursor và tenant menu public cache quan trọng hơn chỉ chọn plan.
Workers Paid overage = max(requests-10m,0)/1m×0,30 + max(CPUms-30m,0)/1m×0,02 + base5.
D1 overage = max(readRows-25b,0)/1m×0,001 + max(writeRows-50m,0)/1m×1,00 + max(GB-5,0)×0,75.
R2 và optional DO/Queues, logs/export/provider/domain/hardware/internet tính riêng. Không hứa tổng bill5USD chỉ vì base5USD.

Đề xuất local/dev trước, load measured staging rồi xin chủ dự án chốt budget/plan. Alerts70/85/95% quota là operational thresholds đề xuất, không hard billing cap. CPU/request max, public rate limit, payload size và circuit breaker giúp giảm abuse.

## VietQR integration gate

[API generate chính thức của VietQR](https://www.vietqr.io/danh-sach-api/link-tao-ma-nhanh/api-tao-ma-qr/) mô tả POST /v2/generate và amount/beneficiary/addInfo. Adapter server-side, beneficiary và amount snapshot; API credentials secret, timeouts. QR only không đối soát tự động.
Trước production phải chủ dự án xác nhận account/gói/quota/terms/support và dữ liệu gửi provider. Tài liệu API đã đọc không được coi là hợp đồng hoặc cho phép dùng miễn phí. Chưa có provider được chọn nên chưa tích hợp live.
E-invoice provider/contracts/tax policy riêng; chưa đưa ra kết luận tính pháp lý của bill.

## Deployment checklist sau authorization

- [ ] Chốt account/env/domain/budget, provider contracts; credential local secret setup.
- [ ] Create isolated staging resources; apply migrations, data constraints and tenant isolation integration tests.
- [ ] Build/typecheck/unit/API/E2E; dry-run Worker bundle và asset routing.
- [ ] Production additive migration backup/checkpoint, deploy assets/API compatible versions.
- [ ] Smoke own tenant/branch, QR Pending→KDS→manual paid→print; no live financial/invoice operation without authorized test.
- [ ] Monitor errors/latency/quotas/failed-outbox/agent; rollback code nếu lỗi.
- [ ] Destructive migration chỉ sau rollback window và explicit scoped review.

Chưa chạy checklist; không có production URL hoặc deployment thành công.

## Offline, backup và recovery

PWA shell/static + tenant menu public cache by tenant/branch/menu revision. Private auth/staff/payment/Admin responses no-store, service worker denylist; logout/tenant switch clear scoped state. Cart draft có tenant/branch/table session/version, không automatically submit khi reconnect. Không payment/order write offline.

D1 [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) hỗ trợ point-in-time recovery, không thay independent backup. Đề xuất daily export encrypted + monthly isolated restore; RPO<=24h từ export và RTO<=4h mục tiêu ban đầu cần drill chứng minh. PITR có thể cho recovery tốt hơn nhưng chưa cam kết RPO không đo.
Shared DB restore vào isolated instance, extract tenant closure và reconcile; không overwrite các quán còn lại. R2 image/version backup policy phải chốt; financial retention chủ dự án/provider/legal review trước launch.
