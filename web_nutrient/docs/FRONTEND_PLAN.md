# NuTri Teens Implementation Plan
> Execution: executing-plans, inline. Review once at the end.
**Goal:** Build selected C UI and the full public reference feature set with a Cloudflare backend and local public tunnel.
**Architecture:** React/TypeScript/Vite; Worker API; D1 persistent records; private R2 media; Gemini server-side; PWA/Web Push.
**Spec:** docs/CLIENT_BRIEF.md, docs/mockups/C-can-bang.png.
## Global constraints
Vietnamese, responsive, no artificial user metrics, auth isolation, write-only Gemini rotation, no keys in browser storage.
## Review focus
Cross-user access; unauthenticated admin routes; concurrent water/XP updates; invalid AI data; timezone date boundaries.
## Tasks
- [x] 1. Infrastructure, domain validation, cryptographic protection; unit tests RED/GREEN.
- [x] 2. D1 migrations, auth/session, logs, images, plans, XP, backup, reminders API; integration tests.
- [x] 3. Gemini adapter: chat, meal image/text analysis, profile analysis and plan generation; write-only admin key.
- [x] 4. Responsive C dashboard, onboarding, diary/statistics, meal capture/edit, profile and settings.
- [x] 5. 30-day plan, 33 experiments, recipes, cosmetics, simulations, world cuisine challenges.
- [x] 6. PWA, opt-in push, local launch/tunnel scripts, docs and coverage matrix.
- [x] 7. Build, unit/API/browser tests, desktop/mobile screenshots, security review and tunnel verification.
## Rulings
- Use existing project folder; parent git contains unrelated projects, so do not create branches or touch their files.
- Design C is approved with explicit build request; no further design/plan approval gate.
- One admin-managed Gemini key is default. Local admin is created by setup script with random password, never first-public-user promotion.
- Reference source is unavailable: author original educational content for observed categories; don't claim verbatim migration.
- AI and push require valid external credentials; unavailable state must be explicit.
