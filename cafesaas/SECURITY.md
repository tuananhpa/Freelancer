# Security — tenant isolation, RBAC & operational controls

Đề xuất 14/10/2026. Đây là thiết kế kiểm soát cần triển khai và kiểm thử; chưa chứng nhận hệ thống an toàn.

## Trust boundaries

Public QR visitor → customer capability → own order projection.
Authenticated staff → verified TenantContext → authorized branch repository.
Super Admin → dedicated platform routes, không ngầm truy cập business data.
Print Agent → paired branch/device credential → leased job only.
Provider webhook → verified config/signature → dedup event → ledger/invoice command.
R2 upload → bounded tenant namespace grant → validated media.

IDs/token randomness không thay authorization. Không tin giá, tenant_id, branch quyền, role, bank secrets, trạng thái Paid, agent_result từ actor không phù hợp.

## Tenant context bắt buộc

Middleware order: requestId → auth → verified tenant membership → allowed branches → permission → Zod → domain service → scoped repository.
TenantContext = actorId, tenantId, authorizedBranchIds, selectedBranchId, effectivePermissions, authMethod. Repository methods required context, không optional scope và không generic findById(id).

Backend verify parent ownership trên tất cả create/edit including product→option, order→item, bank→branch, job→device. Composite FK bảo vệ mismatch tenant/branch cả khi programmer thiếu check; không có RLS tự động giả định.

List, join, search, exports, aggregate dashboards, media signed URL, cursor, caches, outbox và webhook mapping đều kiểm tra scope. Resource ngoài scope trả404; auth thiếu401; role thiếu403. Query filters trước aggregation/pagination, không lấy tất cả rồi filter JS.

Super Admin support access explicit time-bound audited grant, reason và tenant-owner policy cần chốt; không tự bật impersonation. Bulk edit permission không vượt grantable authority của actor.

## Role matrix mặc định đề xuất

| Quyền | Owner | Manager | Cashier | Waiter | Barista | Customer |
| --- | --- | --- | --- | --- | --- | --- |
| Admin daily dashboard/receipt list | mọi branch quán | branch được cấp | own shift theo policy | không | không | không |
| Quản lý sản phẩm/ảnh/giá | có | branch override; tenant catalog khi được cấp | không | không | không | không |
| Bank settings | có + reauth | chỉ khi cấp explicit | không | không | không | không |
| Staff/roles | có trong tenant | branch staff hạn chế | không | không | không | không |
| Bàn mở/chuyển/gộp | có | có | mở/chuyển | mở theo policy | không | không |
| Tạo/xác nhận đơn | có | có | có | có | không | tạo own Pending |
| Pha chế/ready | có | có | đọc | đọc/served | station được cấp | đọc own status |
| Thu tiền/manual-confirm | có | có | branch được cấp | request only | không | request only |
| Refund/cancel preparing | có + lý do | có + lý do | cần grant cụ thể | không | không | không |
| Máy in/pairing | có | branch được cấp | in/reprint có lý do | in bar được cấp | in bar được cấp | không |
| Hóa đơn điện tử | explicit invoice.manage | khi cấp | khi cấp | không | không | payment/lookup capability only |
| SaaS subscription | có | không | không | không | không | không |

Super Admin quản tenant/subscription/platform; không nằm trong tenant Owner matrix. UI giấu thao tác giúp UX, backend vẫn bắt buộc enforce.

Admin cho quản lý các dữ liệu chỉnh sửa được qua allowlist; không “sửa/xóa bất cứ gì”. Paid bills, transaction snapshots, audit không edit trực tiếp. Bank change requires reauth, audit redacted, no impact on existing intent beneficiary snapshot. Owner không tự nâng thành Super Admin.

## Authentication và sessions

Same-origin cookie HttpOnly Secure SameSite=Lax, random256-bit opaque session, DB hash, expiry/revoke, rotate sau login/change privilege. Logout/revoke gỡ cache và local tenant state. Membership check mỗi request hoặc cache TTL cực ngắn với invalidation; không giữ stale role mãi.
Login error chung tránh enumerate email; rate limit IP+account key, backoff, staff reauth cho bank/password/role/payment override.
Password provider/library chuẩn, không tự crypto; benchmark Workers CPU trước chốt params. Nếu CPU/compatibility không đạt, trình phương án auth phù hợp Cloudflare để chủ dự án chốt, không giảm security tùy tiện. Không fake email verification/reset email khi chưa có email provider.

CSRF mutation validate Origin + CSRF token; không cho CORS wildcard credential. Customer cookie cũng áp dụng CSRF khi mutation. PWA service worker không cache auth/staff/private API.

## Public QR và chống spam

Table token random>=128-bit, lưu hash, rotation/revoke audit. Token không chứa bank/account secrets hay sequential table/session ID.
Customer join capability short-lived, table session bound, revocation khi close/QR rotate theo policy. XSS tránh lưu token dài hạn trong localStorage. Referrer-Policy no-referrer, cache-control no-store cho token response.
Submit/public calls rate limits dự kiến: join10/min/IP+table; submit6/min/customer +20/min/table; calls2/min/customer. Đây là ngưỡng đề xuất phải thử thực tế tránh chặn nhóm đông/ shared IP; giới hạn table không thay allowed guest count. Distributed limit dùng khả năng Cloudflare được cấu hình hoặc store atomic quota, không JS memory làm nguồn duy nhất.
Pending requires staff accept; qty/lines bounded; no bank Paid command/customer cancel financial records.

## Input, uploads và exports

Zod strict schema, bound SQL prepared statements. Sort/filter enum allowlist, parameter binding không thay quote SQL identifier.
Không render raw user HTML; Vue escape default, v-html prohibited cho note/product description chưa sanitized.
Uploads MIME signature + decode validation + pixel dimensions cap, max5MB đề xuất, filename generated, R2 prefix tenantId/randomID. SVG/HTML không nhận ở MVP. Strip EXIF metadata khi transform. Media deletion check ownership/refcount/grace retention.
CSV/Excel prefix neutralization cells starting =,+,-,@ và control chars theo format, giữ text IDs/account_no để không mất số0. Export downloads require auth hoặc scoped expiring grant, no public buckets for bank/invoice/financial exports.

## Payment/provider

VietQR server adapter lấy frozen bill due và beneficiary snapshot; không cho image URL client đổi amount/account. Secrets Workers Secret bindings, rotation; per-tenant API credentials cần encrypted-at-rest handle với root secret hoặc provider-supported delegated config, chưa đưa key vào dashboard.
Manual confirmation audit actor/time/amount/reference/source manual; bank credential changes do not confirm money. Unique intent reference + dedup keys; no exactly-once external provider claim.
Future webhook verify raw body HMAC/provider scheme, timestamp tolerance, signature constant-time compare as supported, event ID unique, reject replay/tampered amount/unknown tenant; provider fetch reconciliation if uncertain. Không chọn signature algorithm khi provider chưa được chọn.

## Agent và audit

Outbound HTTPS scoped credential, protected local secrets, revoke, job leases. Printer address allowlist, no arbitrary network target/raw commands from untrusted payload. Host/path sanitize, bounded bytes, per-device serial dispatch.
Audit append-only privileged operations; redact password/session token/API keys/bank full sensitive payload/customer notes unnecessary. Request ID correlation, access/retention policy, export permission separate.
No raw webhook signature/token in logs. Alerts failed auth spikes, cross-scope denied, price mismatch, overloaded, aged jobs, unknown print, duplicate payment attempts.

## Backup / privacy / launch gates

D1 PITR + independent export, encryption and access control, restore isolated then verify row/ledger. Propose daily export and monthly restore drill; retention30days operational exports pending owner approval. Financial/audit/invoice retention must be owner/provider/legal-approved before launch, no invented legal duration.
Launch requires ISO/RBAC/payment race/replay/print access tests and dependency audit. Authorized production config/budget/provider contracts required separately. Review is implementation work, không marketing security claims.
