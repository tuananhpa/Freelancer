# Test plan & acceptance criteria

Đề xuất 14/10/2026. Chưa có sản phẩm/tests; các case này chưa chạy và không được ghi PASS. Chỉ kiểm tra tài liệu/ảnh trong phiên chuẩn bị.

## Strategy và fixtures

Unit: integer money, deterministic allocation, states, validation, formatting, renderer.
Integration: Hono Worker + local D1 bindings, actual migrations, constraints/batches; test deployed staging limits/semantics trước launch.
E2E: Vue flows customer/waiter/cashier/barista/admin ở desktop1440/1024, tablet768 và mobile390/320CSSpx.
Hardware: Windows USB/LAN,58/80mm; khác mock adapter.
Security: two tenants A/B, two branches each, owner/manager/cashier/waiter/barista/customer, revoked memberships, media/job IDs swapped.
Fixtures luôn local/staging explicit; seed không lên production.

## Cases

| ID | Input/action | Assertion bắt buộc | Phase |
| --- | --- | --- | --- |
| ISO-01 | Actor tenantA gọi list/get/update/delete tenantB, known IDs | 404/403; no foreign read/write; row counts stable |1 |
| ISO-02 | Joins, dashboard all branches, exports, media URLs, outbox, agent đổi scope | backend allowed filters trước aggregation; no leaks |1/5/6 |
| FK-01 | Insert order/item/menu option/branch FK foreign tenant | DB constraint fail, entire batch rollback |1/2 |
| AUTH-01 | Expired/revoked session, logout then API, role change during session |401/403, UI refresh role, no stale authority |1 |
| AUTH-02 | Wrong Origin/CSRF, cookie cross-origin, login brute force | reject, rate limit, no enumeration |1 |
| RBAC-01 | Customer markPaid; barista bank edit; cashier role escalate; manager forbidden branch |403; logs safe; no write |1/4 |
| PRICE-01 |2×35000 +45000, qty/topping/variant modifiers |115000 exact integer; no float |2 |
| PRICE-02 | Client total1, option of other product, duplicate options, schedule/out-of-stock | reject unknown/invalid; server authoritative |2 |
| PRICE-03 | Menu changed between read and transaction |409 MENU_CHANGED; no stale-price insert |2 |
| QR-01 | Disabled/rotated token, no open session, expired capability | revoked token/cap cannot submit; no auto session |2 |
| QR-02 | Two guests same table; guest attempts own-ID swap | each own orders only; cart not shared |2 |
| IDEM-01 | Same key retry including timeout after commit | one order/payment/print/refund, stored response |2/4/5 |
| IDEM-02 | Same key altered payload; different actor/scope |409 on altered same scope, no key leak across scope |2 |
| CON-01 |20 customer submits concurrently and retry duplicates | exact20 distinct orders, no lost lines, one active table session |2 |
| CON-02 | Close/freeze vs new submit; concurrent table open/move/merge | transaction guards preserve state; conflicts409; no orphan |2/4 |
| ORDER-01 | Illegal transitions and stale expectedVersion |409; no events/outbox on rejected write |3 |
| ORDER-02 | Partial quantity ready/served/cancelled, paid cancel | segment totals conserved; no deleting paid snapshots |3 |
| KDS-01 | Barista station filter, overdue ticket, reconnect cursor | only station allowed; no missing/duplicate event; textual warnings |3 |
| KDS-02 | Background tab/offline/resync | backoff, no offline ready confirmation |3 |
| BILL-01 | Split115000 quantities and deterministic discounts; merge | allocated sums conserved; no double charge |4 |
| BILL-02 | Frozen bill intent + guest adds item | original115000 intent unchanged; new item in new open bill |4 |
| PAY-01 | QR generation/display, failed provider, exact due115000 | pending stays pending; QR account/amount/ref correct |4 |
| PAY-02 | Two concurrent manual confirms and same bank reference retry | exactly one ledger application; audit actor/source/manual |4 |
| PAY-03 | Cash200000 for115000; transfer100000/120000; mixed disabled | change85000, partial due15000, excess5000 tracked; rules explicit |4 |
| PAY-04 | Refund twice/concurrent exceeding collection; expired intent money arrives | guarded cumulative bound; exception reconciliation, no lost payment |4 |
| WEBHOOK-01 | Tampered signature/body/amount, stale timestamp, replay event | reject/dedup, no double application; future adapter only |4 future |
| PRINT-01 | Retry before send; offline agent/printer, revoked credential | bounded retry, truthful state, tenant/device scope |5 |
| PRINT-02 | Duplicate source events/claims and completed local ledger | dedup job, one dispatch attempt when outcome known |5 |
| PRINT-03 | Crash after bytes send before ACK, lease expiry | unknown, no blind resend; explicit audited resolve/reprint |5 |
| PRINT-04 | Attacker arbitrary IP/shell/oversized payload | allowlist reject, no arbitrary execution/network access |5 |
| PRINT-05 | USB/LAN58/80, accented notes, long item names, QR | physical legible paper and scanned exact115000/ref/beneficiary |5 hardware |
| ADMIN-01 | Owner adds/edits/archives product/image/bank; cashier tries | permitted changes persisted; unauthorized403; used items archived |2/4 |
| ADMIN-02 | Bank default changes after old intent created | new intent new bank, old intent beneficiary immutable |4 |
| REP-01 | Sales115000, collection100000 today, remaining15000 next day, refund later | sales/collections/debt/refund windows distinct, reconcile |6 |
| REP-02 | Daily per-branch filter, midnight UTC vs VN, reprinted bill | [start,end) local timezone; copies not counted as new sale |6 |
| REP-03 | Invoice issued vs receipt printed vs provider failed | separate invoice count, status and date; receipt not issued invoice |6/7 |
| CSV-01 | Names starting =,+,-,@ and leading-zero account IDs | formula injection safe, IDs remain text |6 |
| INV-01 | Repeated issue, timeout after provider accepted | reconcile lookup; no duplicate issue/reissue |7 |
| INV-02 | Adjustment/replacement/failed/provider unconfigured | linked original snapshots; issue unavailable without provider |7 |
| PWA-01 | Offline after menu cache, tenant switch/logout | no private cache leak; drafts scoped; no false sent/paid |2/8 |
| RESTORE-01 | Isolated restore/extract tenantA from sharedDB | tenantB unchanged, FK/row counts/ledger reconciled |8 |
| SUB-01 | Disabled tenant/expired entitlement/direct API | server entitlement enforcement with operational grace policy |8 |

## Daily Admin dashboard example

BranchA selected day:3 original bills total345000;2 bank collections115000 each + cash115000 with cashier receiving200000/change85000. Expected sales345000, cash applied115000, transfer230000, net collected345000, original bill count3. Two reprints keep count3; invoice count0 until provider issued.
If one bill only collected100000, collected330000 and due15000, sales still345000. Next-day refund35000 decreases that day's net collections, không tự rewrite yesterday's cash total. Owner accounting policy may choose restated sales/report separate but must label clearly.

## Performance proposals cần chốt bằng sizing

Initial load target10 branches,2000 orders/day/branch,20 concurrent guests/table burst,40staff displays toàn hệ thống, menu100products/branch. These are test assumptions, not actual customer measurements.
Staging target API p95<500ms reads and<1000ms transactional writes, error<1% at agreed load; order visible on KDS within configured poll interval+API latency (~6s target). External provider/hardware timings measured separately. No overloaded/duplicate ledger; load30minutes including retries; monitor rows_read/write, CPU, storage and quota. Targets pending confirmation.

## Release gates mỗi phase

1. Target unit/API cases pass plus previous phase regression.
2. Fresh/upgrade migrations pass and foreign_key_check empty.
3. E2E key journeys on appropriate roles/screens; keyboard focus/errors retained; touch controls recommended48CSSpx for POS.
4. No secrets in web bundle/log/export; no production fixtures.
5. Report command outputs, environment/date, screenshots/hardware evidence and limitations.
6. Update docs when architecture changes. No phase marked complete based only on mockup or unit mock.

CI commands planned in PLAN.md. Các lệnh build/test chưa tồn tại vì chưa scaffold; không chạy hoặc tuyên bố pass ở bước này.


## Overpayment reporting bổ sung

Transfer120.000 cho bill115.000: transferCollectedVnd120000, appliedCollectedVnd115000, unappliedCreditVnd5000, outstanding0. Net collections chỉ giảm khi refund đã ghi ledger. Không gọi khoản thừa là doanh thu bán hàng.
