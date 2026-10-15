# Coffee SaaS frontend A — Implementation Plan
Date14/10/2026. User selected A and authorized build+public local tunnel in this chat. Scope: all initial UI modules, browser-local fixtures. No backend/provider/real print claim.
Goal: reviewable Vue frontend matching A with operational paths, Admin CRUD/dashboard and customer mobile.
Architecture: Vue Router role layouts + Pinia + typed LocalRepository; domain logic in packages/shared; reusable Vue primitives in packages/ui. No Hono/D1/real auth in this phase.
Spec: CLIENT_BRIEF.md, MASTER_PROMPT.md, root API/FLOWS/SECURITY docs and A-menu.png.

## Constraints
Work only cafesaas. Parent repo main includes unrelated dirty projects: use current authorized project folder, no parent branch/worktree mutation or commits. User's build instruction supplies authorization to proceed here; local project files are isolated from sibling projects. Keep progress in docs/IMPLEMENTATION_LOG.md instead of parent git scratch workspace.
No auth fake success, real bank settlement, invoice issue or print delivery; actionable browser confirmation copy. Fixture persistence keys scoped by local tenant/branch, versioned; API adapter boundary.
Public tunnel serves dist only via static HTTP, never source/attachments/env or other folders. Browser-level preview role selection is not authentication. No production financial data entered by default.
All16 interfaces included. Advanced financial and integrations have honest unavailable states until backend phase. Scope matrix documents exact functionality, not “all production features completed.”

## Tasks
- [x]1 Tooling/types/domain. Files root package.json, apps/web config, shared types/domain; tests/domain.test.ts. Test integer pricing, state transitions, safe QR URL exact remaining due, snapshot immutability, CSV sanitization, branch/date aggregation, quantity allocations.
- [x]2 Fixtures/repository/store. Files apps/web/src/data/{fixtures,repository}.ts, stores/coffee.ts; repository tests. Test retry key dedup, namespace/storage errors, CRUD archive, bank validation, frozen payment snapshots.
- [x]3 A POS + reusable primitives. Files packages/ui, Shell, PosView, ProductPhoto, modal+toast; keyboard/dialog focus, item choices/cart, takeaway/table/payment preview.
- [x]4 Operational screens. Tables transfer/merge/QR rotate, order/history/cancel, KDS states, mobile customer and waiter, bill allocation/split, receipt HTML print, QR only with configured bank.
- [x]5 Admin screens. Dashboard per day/branch, receipt list/detail, products/photos/categories/options/availability, banks, branch/staff permissions/printer/settings, reports export, invoice unavailable, subscription and SaaS overview.
- [x]6 PWA/local sharing. Manifest + static-only worker cache; node dist server; Cloudflare quick tunnel. No provider secrets. Hash/dedup guards disabled operations offline.
- [x]7 Verify. npm test, typecheck/build; Python Playwright role routes/action journeys, desktop/tablet/mobile/screenshots/console; smoke public tunnel. Record results and URL/process IDs.

## Interfaces
Product/Variant/Option types; calculateCart(lines,products): PricedLine[]; totalCart(lines):number.
LocalRepository state includes tenants/branches/products/tables/orders/payments/banks/staff/events/settings. saveState/getState scoped version; fixtures clone.
Pinia actions createOrder/transition/addPayment/refund/upsert/archive/move/merge; local operations return stored browser state. Customer cannot use private state mutations through its UI, no server security claim.
QR build uses bank/config and frozen remaining due; generation does not call confirm. Customer table QR is URL QR using qrcode local library.
Daily report by event timestamps local timezone with branch filter; sales/collections/refunds/debt separate.

## Review focus
Invalid fractional/negative money, frozen intent changing after bank edit, paid item edits, tenant/branch local state leaking on switch, offline fake success, repeated order create, table conflict, media oversized file persistence, exports formula injection, modal keyboard/focus, stale partial payments.
