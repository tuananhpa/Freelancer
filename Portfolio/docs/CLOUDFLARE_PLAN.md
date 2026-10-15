# Cloudflare backend implementation

User requested backend + deployment on workers.dev. This replaces the earlier backend-deferred scope.

- [x] Worker + D1 schema: users/password hashes, hashed sessions, draft/published content revisions, uploaded small images, contact requests, rate limits, audit trail.
- [x] Security/API: one-time owner bootstrap secret, cookie session + same-origin/CSRF checks, owner/admin/editor roles, optimistic draft saves, review submission/publish, public allowlist, contact anti-spam and upload type/size checks.
- [x] Frontend: server-aware existing admin with login/users/contact tabs/save/submit/publish; authenticated server preview; dynamic public HTML and metadata; real contact submission. Keep original local development mode available.
- [x] Tests: meaningful auth/session/role/conflict/privacy/media/contact cases with actual local D1 via Wrangler, browser login/edit/publish/contact; code review and repair.
- [x] Create project-specific D1, apply production migrations/secrets, register account workers.dev namespace and deploy Worker. Version: 7da1fe4c-292d-4edc-9625-d80c2d5457e2.
- [x] Smoke-test HTTPS production URL: 16 checks passed, including public routes, static assets, unauthenticated admin rejection, protected preview redirect, sitemap, 404 and actual browser rendering/mobile setup. HTTPS became available after initial namespace provisioning. Owner initialization remains intentionally for the user through the private bootstrap link.

Initial public content preserves existing clearly marked sample portfolio until owner changes it. No real account passwords are committed. Uploaded images retain existing 1 MB limit and use individual D1 BLOB rows; video uses external links. Server JSON content capped below D1's 2 MB row limit. Admin saves drafts; editors submit, admin/owner publish. Static assets served by Worker binding; public HTML rendered from published D1 document. Default owner credentials are never baked into frontend.
