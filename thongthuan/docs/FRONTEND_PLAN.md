# CEC JSC frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Build the approved multipage public website and interactive admin frontend, then expose the built site through Cloudflare Tunnel.
**Architecture:** React routes consume one browser-local repository seeded with source-backed fixtures. Repository, validation and map/widget adapters remain separate from UI so a future API can replace storage. Publish only dist through a dedicated localhost static server.
**Tech Stack:** React, Vite, React Router, Lucide, CSS tokens, Node test runner.
**Spec:** docs/CLIENT_BRIEF.md; approved docs/mockups/01–13 on 10/10/2026.

## Global Constraints
- VI/EN, sticky navigation, responsive desktop/tablet/mobile.
- Separate Home, About, Products, Facilities, facility detail, News, Contact, Request page and article detail.
- Admin content VI/EN draft/preview/publish; product/article/widget CRUD; local request inspection/status/notes; facilities/maps editing.
- No online payment, invented CEC contact details, fabricated certifications or dated announcements.
- Static frontend stage: browser persistence only, no auth/API/server/database service and no fake remote submission.
- Cloudflare explicitly requested. Serve dist only; do not expose project/docs/credentials. Tunnel requires running machine/processes.

## Review Focus
1. Invalid, zero, fractional/infinite/excessive quantity; missing or invalid contact fields.
2. Deleted/hidden products in selected request and previously submitted order snapshots.
3. Storage corruption/quota failure must preserve last accepted state and show a recoverable error.
4. Unsafe URL, arbitrary iframe source and unsupported social handles.
5. Narrow layouts, keyboard modal focus, route refresh and draft publication isolation.

### Task 1: Repository and validation
Files: package.json, src/data/seed.js, src/lib/domain.js, src/lib/repository.js, tests/domain.test.js.
Interfaces: validateRequest(customer, selection, products) → field error map; buildRequest(customer, selection, products) → immutable snapshot; loadState(storage, seed), saveState(storage, next), safeUrl(value, kind), mapLinks(facility).
- [ ] Write/run failing tests for request validation, snapshot retention, safe links, corruption and quota handling.
- [ ] Implement repository/domain and seeded source products, facilities, empty orders/widgets; tests pass.

### Task 2: Public frontend
Files: src/main.jsx, src/App.jsx, src/components/Common.jsx, src/pages/Public.jsx, src/styles/tokens.css, src/styles/site.css, public/assets/.
Interfaces: App context exposes state, commit(next), lang, selected items; content selector uses published page locale. Routes use repository.
- [ ] Implement approved layouts with source assets and exact client logo.
- [ ] Products search/filter/detail selection; request field errors and honest browser-only save.
- [ ] Facilities each own map/address/links; contact selects location.
- [ ] Article detail, language switch, navigation, empty states, social widgets.
- [ ] Browser route/phone/tablet checks and asset load inspection.

### Task 3: Admin frontend
Files: src/pages/Admin.jsx, src/components/Editors.jsx, src/styles/admin.css.
- [ ] Content page/locale editor with image URL/upload, alt text, title/body/button, section toggles, save draft and publish isolated.
- [ ] Product/article/widget CRUD with confirmation; visibility controls and widget reorder.
- [ ] View request snapshots, contact, status and notes; CSV export.
- [ ] Facilities address/map/contact/gallery editing; browser-local scope shown in admin.
- [ ] Browser test save/reload, publication, delete confirmation, safe URL rejection and order review.

### Task 4: Verify and tunnel
Files: scripts/serve.mjs, scripts/start-preview.ps1, docs/RUNNING.md, docs/FRONTEND_PROGRESS.md.
- [ ] npm test and npm run build; CUA actual public/admin journeys at 1440, 768, 390.
- [ ] Fresh reviewer of code and scope, address important findings with regression tests.
- [ ] Start localhost dist server 4180 hidden, Cloudflare quick tunnel hidden, verify public HTTPS URL and direct route refresh.
- [ ] Deliver public/admin links, screenshot and persistence/backend limits. Do not auto-start backend or PLAN.md stage.

