# SDD ledger — plan: docs/FRONTEND_PLAN.md
Approved: User said "Oke bắt đầu thực hiện bước kế tiếp theo skill để hoàn thành website đi" on 10/10/2026.
Execution: inline using executing-plans. No extra plan approval per client-web-flow routing and explicit user execution.
Pre-flight: Tasks 2/3 consume state, commit, content selectors and pure domain functions from Task 1. Task 4 publishes dist only.
Ruling: Workspace initially has docs only and no Git repository; implement in explicitly named project folder, no worktree needed. Cost: no existing branch history to protect.
Ruling: Use browser-local persistence for this frontend stage, never claim other visitors' requests synchronize. Cost: backend still required for shared data.

Task 1: complete — domain/repository tests 10/10 RED→GREEN; source fixtures and safe map/widget adapters implemented. Order data is immutable product snapshot.

Task 2 complete: separate public React routes, VI/EN, sticky navigation, Maps, selection/request flow. Task 3 complete: browser-local admin content/product/news/widget/facility editors and order state/CSV. Task 4 complete: 11 tests pass, build pass, 45 responsive route checks no overflow; independent reviewer findings fixed with regression. Cloudflare public verified. See docs/RUNNING.md for link, PIDs and limitations. Backend/shared auth/data remain outside this frontend phase.

Follow-up: clarified Lưu & áp dụng vs Lưu nháp; verified admin publication in same Cloudflare origin. Floating widgets now social icons lower-right, mobile46px/desktop50px. Build + 11 tests pass. Old quick tunnel dead; user explicitly chose a new temporary link; RUNNING.md updated.
