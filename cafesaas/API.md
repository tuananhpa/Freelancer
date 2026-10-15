# API contract — v1 proposal

Ngày 14/10/2026. Contract dạng thiết kế, chưa phải OpenAPI chạy được. Khi thực thi dùng Zod sinh OpenAPI và test schemas.

## Context và conventions

Same origin /api/v1. Staff cookie HttpOnly Secure SameSite=Lax; mutation có CSRF token + Origin validation. Customer cookie scoped capability; agent bearer scoped branch/device. Webhook provider signature khác staff auth.

Staff prefix /t/{tenantSlug}/b/{branchId}; server verify membership trước tạo TenantContext. Slug/branch route chỉ là yêu cầu chọn phạm vi. Tenant owner không mặc nhiên Super Admin. Tenant-level routes /t/{tenantSlug}/... không cần b nhưng vẫn context + role.

Money JSON integer VND; datetime ISO8601 UTC. Pagination keyset opaque cursor, limit default25 max100, filter allowlist. Version field trên mutable entities; mutation command body expectedVersion. Không PUT cả aggregate từ client.

Success: {data,meta:{requestId,nextCursor?,version?}}.
Error: {error:{code,message,fieldErrors?},requestId}.
400 malformed;401 missing/expired credential;403 insufficient permission;404 hidden foreign resource;409 state/version/idempotency conflict;422 business validation;429 Retry-After;503 dependency/down quota (không fake success).

Các mutation tạo order/payment/print/refund/invoice dùng Idempotency-Key. Key scoped actor+tenant+branch+route, canonical request hash. Cùng payload trả response đã lưu, đổi payload409 IDEMPOTENCY_CONFLICT. Financial keys giữ mapping theo policy tài chính, không prune rồi cho execute lại; public order replay window đề xuất24h và resource lookup tồn tại để recover.

## Admin quán — yêu cầu bổ sung của chủ dự án

Một route shell /admin, landing /admin/dashboard, menu quản trị theo permission. Cho thêm/sửa/archive sản phẩm, ảnh, giá, danh mục, size/topping, ngân hàng và các cấu hình hợp lệ. Không endpoint “sửa mọi field”; secret/system/financial fields không expose. Hard-delete chỉ dữ liệu chưa tham chiếu và media unreferenced theo policy.

Dashboard lọc ngày và cơ sở, bill đã xuất, tiền thu hàng ngày, tiền mặt/chuyển khoản/refund/debt; invoice issued riêng. Nhiều cơ sở chỉ nếu actor được quyền; all-branches phải aggregate từ allowlist backend.

## Endpoint inventory

Paths staff branch dưới prefix nêu trên; tenant-level ghi (tenant). Mỗi endpoint list/get/mutation đều scope.

| Module | Method + path | Permission / input → output |
| --- | --- | --- |
| Health | GET /healthz | public, minimal version, no credentials |
| Identity | POST /auth/login; POST /auth/logout; GET /me | credentials→session cookie; revoke current session; memberships allowed |
| Identity | POST /auth/change-password; DELETE /auth/sessions/{id} | owner user, reauth, revoke sessions |
| Tenants | GET/PATCH /t/{slug}/settings (tenant) | tenant.settings.read/write; allowlist fields+version |
| Branches | GET/POST /t/{slug}/branches; PATCH /branches/{id} (tenant) | branches.read/manage; no foreign tenant |
| Staff | GET/POST /staff; PATCH /staff/{membershipId}; POST /staff/{id}/disable (tenant) | staff.manage, membership/role/branches; no privilege escalation |
| Roles | GET/POST /roles; PATCH /roles/{id} (tenant) | roles.manage; grant <= actor effective grantable permissions |
| Images | POST /media/uploads; POST /media/{id}/finalize; DELETE /media/{id} (tenant) | menu.manage; bounded upload grant, sanitized file metadata, ref check |
| Menu | GET/POST /categories; PATCH/DELETE /categories/{id} (tenant) | menu.read/manage; delete=archive when referenced |
| Products | GET/POST /products; GET/PATCH/DELETE /products/{id} (tenant) | menu.read/manage; names/prices/media/schedule/version |
| Options | POST/PATCH/DELETE /products/{id}/variants/{variantId?}; /option-groups/{groupId?}; /options/{optionId?} (tenant) | menu.manage; create route bỏ optional id, validate product ownership |
| Availability | GET/PATCH /menu/overrides/{productId} | menu.manage at branch; available/price/schedule |
| Areas | GET/POST /areas; PATCH/DELETE /areas/{id} | tables.manage |
| Tables | GET/POST /tables; PATCH/DELETE /tables/{id} | tables.read/manage; archive only if inactive |
| QR | POST /tables/{id}/qr/rotate; POST /tables/{id}/qr/disable | tables.manage; random token printed only on rotate |
| Sessions | POST /tables/{id}/sessions; GET /sessions/{id} | tables.operate; open/current version |
| Movement | POST /sessions/{id}/move; POST /sessions/{id}/merge; POST /sessions/{id}/close | tables.operate/manage; source/target versions, reason |
| Orders | GET/POST /orders; GET /orders/{id} | orders.read/create; server pricing |
| Commands | POST /orders/{id}/accept; /transition; /cancel; /items/{itemId}/cancel | accept/prepare/serve/cancel permissions; command+version+reason |
| Events | GET /orders/{id}/events; GET /orders/delta | scoped role projection, opaque cursor |
| KDS | GET /kitchen/tickets; GET /kitchen/delta; POST /kitchen/tickets/{id}/transition | kitchen.read/prepare; station authorized |
| Bills | POST /bills; GET /bills/{id}; POST /bills/{id}/split; /merge; /freeze | payments.collect, item qty allocation+versions |
| Payments | POST /bills/{id}/payment-intents | payments.collect; method and optional requested_vnd for partial feature→intent |
| QR | GET /payments/{id}/qr; POST /payments/{id}/cancel | payments.collect / own authorized customer projection; server amount |
| Confirmation | POST /payments/{id}/confirm-manual | payments.collect; receipt amount/reference/version/reauth as policy |
| Refund | POST /transactions/{id}/refunds | payments.refund; amount/reason/key, cannot over-refund |
| Bank admin | GET/POST /bank-accounts; PATCH/DELETE /bank-accounts/{id} (tenant) | bank.manage, reauth, tenant default/branch override, archive |
| Receipts | POST /bills/{id}/receipts; GET /receipts; GET /receipts/{id} | payments.collect/reports.read; immutable issued snapshot |
| Devices | GET/POST /print-devices; PATCH/DELETE /print-devices/{id}; POST /print-devices/{id}/test | printers.manage; allowlisted profile |
| Agent pairing | POST /print-agents/pairing; POST /print-agents/{id}/revoke | printers.manage; short-lived single-use code |
| Print jobs | GET/POST /print-jobs; POST /print-jobs/{id}/retry; /reprint; /resolve | printers.operate; reason/version; unknown cannot auto retry |
| Agent API | POST /agent/pair; POST /agent/jobs/claim; POST /agent/jobs/{id}/started; /result; POST /agent/heartbeat | bearer credential scoped; job lease token + attempt |
| Dashboard | GET /admin/daily-summary | reports.read; localDate, branchIds→sales/collections/refunds/debt/receipt/invoice counts |
| Reports | GET /reports/sales; /reports/payments; /reports/items; /reports/refunds; /reports/invoices; /reports/reconciliation | reports.read + authorized branches/date range |
| Export | POST /exports; GET /exports/{id} | reports.export; CSV/XLSX, short-lived scoped download |
| Shifts | GET/POST /shifts; POST /shifts/{id}/close | shifts.operate; counted cash vs expected |
| Audit | GET /audit-logs (tenant) | audit.read; redacted role projection |
| Invoices | POST /bills/{id}/invoices; POST /invoices/{id}/issue; GET /invoices; GET /invoices/{id}; POST /invoices/{id}/adjust; /replace | invoices.manage; production issue disabled before provider approval |
| Invoice config | GET/PATCH /invoice-settings (tenant) | invoices.manage; masked credential handles only |
| Subscription | GET /subscription (tenant) | subscription.read |
| Platform | GET/POST /platform/tenants; PATCH /platform/tenants/{id}; GET/POST /platform/subscriptions | dedicated Super Admin auth/permissions, support access audited |
| Providers future | POST /webhooks/{provider}/payments; /invoices | raw body signature, timestamp/replay/dedup, tenant resolved from verified config |

## Customer endpoints — QR does not grant staff powers

GET /public/tables/{tableToken}: store/table and menu revision, no bank secrets/staff/private bills.
POST /public/tables/{tableToken}/join: cookie capability + current open session; token disabled410, not-open409.
GET /customer/menu: branch menu for capability.
POST /customer/orders: draft+key→own order pending.
GET /customer/orders: own submitted order list only.
GET /customer/orders/{id}: own order projected status.
GET /customer/requests/{key}: idempotency recovery for own route/key.
POST /customer/service-calls: call waiter or request bill, allowed feature gate+rate limit.
GET /customer/bills/{id}/payment-view: explicit server-granted payment display capability; no automatic access to other guests' notes/transaction history.

Table token resolution/menu may be public read; customer capability does not allow opening sessions, accept/cancel paid items, mark Paid or whole-session read.

## Exact QR order example

POST /customer/orders; Idempotency-Key: random-client-generated-key.
Body:
```json
{
  "menuRevision": 12,
  "items": [
    {"productId":"product-coffee","variantId":"size-m","optionIds":[],"quantity":2,"note":""},
    {"productId":"product-peach","variantId":"size-m","optionIds":[],"quantity":1,"note":"Ít đá"}
  ]
}
```
No tenant_id, branch_id, unit_price, total, status or permission accepted. Server resolves branch from capability, computes115000 and persists snapshot. Response201 contains id, status pending, totalVnd115000, version1. Retry same key exact response; menu changed409 requires confirmation + new draft/key after customer review. Client cannot fix conflict by inventing price.

## Payment intent and manual confirm

POST /bills/{id}/payment-intents body {method:"bank_transfer",expectedVersion:3}.
Response intent includes requestedVnd115000, transferReference unique "CF <random>", beneficiary display, expiresAt, state pending. amount is remaining due for full-payment default. Partial/mixed mode must be explicitly enabled; no arbitrary customer amount.

GET /payments/{id}/qr returns QR artifact from server-computed amount, beneficiary snapshot and transfer reference. Failed provider503 QR_UNAVAILABLE; no payment state change. Frontend shows amount/reference/account alongside QR and download option.

POST /payments/{id}/confirm-manual body {receivedVnd:115000,externalReference:"cashier-entered-reference",expectedVersion:1}. Server validates frozen bill and dedup, records ledger+audit, state paid only when sufficient applied amount. actor, confirmedAt and source manual always stored. A QR image is not a webhook/payment proof.

## Daily dashboard contract

GET /admin/daily-summary?localDate=2026-10-14&branchIds=<allowed ids>.
Response branch rows contain branchId, timezone, utcStart, utcEnd, billsIssuedCount, eInvoicesIssuedCount, grossSalesVnd, discountVnd, surchargeVnd, refundsVnd, netSalesVnd, cashCollectedVnd, transferCollectedVnd, netCollectedVnd, outstandingVnd.

No all-time debt accidentally labelled today's: outstandingVnd defined as remaining debt of bills issued in selected local day at query time; overallOutstandingVnd is separate optional metric. Refund/collection timing by transaction happened_at for selected day, sales by frozen/issued business event. Listing bills uses receipt original kind dedup bill ID, reprints do not increment sold bill count. Invoice list by provider issued_at, optional submitting/failed tabs distinct.

Pagination list /receipts?localDate=...&branchIds=...&kind=original; /reports/payments for ledger details. Totals must come from backend same filters; never sum a paginated frontend subset. Exports use same authorized scope.

## Validation and error handling

Proposal limits: max50 item lines/request, qty1–99, note max500 chars, file max5MB, PNG/JPEG/WebP only, list100 max, report range31 days synchronous (longer queued export later). Bound SQL query parameters100: multiple statements/chunks but one guarded aggregate transaction. Validate integer safe bounds maxbill1000000000VND proposed until policy approved. Duplicate option IDs reject; ownership/min/max groups required. Reject unknown fields in mutation schemas.

Version conflicts show current state and preserve draft. D1 overloaded/quota503 with safe retry guidance. Never return DB exceptions/provider API keys raw. requestId propagated through audit/outbox/agent.


## Định nghĩa tiền thực thu và các mốc ngày

cashCollectedVnd là tiền mặt nhận trừ tiền trả lại, transferCollectedVnd là toàn bộ chuyển khoản đã xác nhận thực nhận (bao gồm khoản thừa chưa phân bổ). netCollectedVnd = cashCollectedVnd + transferCollectedVnd - cashRefundsVnd - transferRefundsVnd. Bổ sung appliedCollectedVnd và unappliedCreditVnd để phân biệt tiền đã áp dụng vào bill với tiền thừa khách gửi. Công nợ tính theo applied amount, không dùng toàn bộ received amount.

grossSalesVnd/discountVnd/surchargeVnd theo bill frozen_at trong ngày; receipt count theo lần xuất original issued_at trong ngày; electronic invoice count theo provider issued_at. Đây là các chỉ tiêu có mốc khác nhau và cần nhãn rõ. Không gộp tổng tiền trên tất cả bản in vì reprint/adjustment không là giao dịch bán mới.
