# Ledger — plan: docs/FRONTEND_PLAN.md
14/10/2026 — user chose A and asked local tunnel, all original UI modules.
Ruling: frontend fixtures first per requested client-web-flow. All original UI groups retained; provider-backed features explicitly unavailable until backend. Cost: different visitors cannot share live orders in this phase.
Ruling: use authorized cafesaas folder in parent dirty main without branch/worktree/commit changes. No parent repo manipulation. Cost: local uncommitted project; final review scoped to cafesaas.
Preflight: shared types → domain → repository → Pinia → Vue components; banking QR intent immutable, original receipt/financial ledger date ranges specified.

Ruling: npm workspace symlink fails EISDIR on Windows; retain monorepo folders with root tooling and relative imports, disable npm linking. No external project touched.
Task1/2 complete: RED23 failures -> GREEN29/29 tests. Shared domain and browser repository implemented. Task3 POS A in progress.
User authorized scoped git add/commit/push to parent D:/Freelancer after verification. Other projects remain unstaged.

15/10/2026 — Tasks3–6 implemented: all16 UI groups, A styling, local QR, browser receipts/PWA/dist-only HTTP.
Final review:6 Important +3 Minor; all fixed in one pass;8 new regression tests RED8/34pass -> GREEN42/42.
Browser final:16 check groups,19 staff/Admin/SaaS routes,320/390/768/1024 responsive, no page JS errors.
Dependency audit: Vitest updated5.0.4 after critical dev-dependency findings; audit0 vulnerabilities.
Ruling: localStorage stale snapshot rejects with reload guidance, not a replacement for server atomic transactions. Cost: simultaneous cross-device operations remain outside scope.
Ruling: reviewer skipped production auth/tenant isolation/cross-device sync/bank acceptance/provider invoices/real printers/scale; keep explicit unavailable states and backend roadmap rather than claim production support. Cost: these integrations are not usable yet.
Final review minors: no deferred findings; bank UI permissions, customer reload and offline status corrected.
Final PWA fix: Auto-registration did not activate; native register request succeeded in probe, but activation was still not proven. Root cause investigated below. Replaced client helper with native registration and explicit error logging. RED offline registration test -> rerun pending.
PWA root cause confirmed: static allowlist rejected /index.html, which Workbox precache requires; service worker install failed after registration. Added failing path contract, allowlisted only the public app shell. Native registration retained for explicit error reporting. No source paths exposed.

Final verification:43/43 unit;16 browser groups;4remote routes +PWA offline reload +health200; audit0. All frontend tasks complete. Backend integrations remain explicitly out of scope.
