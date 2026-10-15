# Cloudflare backend

## Architecture
- Cloudflare Worker `freelance-portfolio` serves dynamic HTML, the existing static assets and JSON APIs.
- D1 `freelance-portfolio-db` stores users, hashed sessions, draft/published content, 1 MB image BLOBs, contact requests, anti-spam counters/tokens and audit actions.
- Worker/D1 are in the signed-in account configured in `wrangler.jsonc`; the database is dedicated to this project.
- Production URL: https://freelance-portfolio.tuananhha1710.workers.dev. Deployed version: `7da1fe4c-292d-4edc-9625-d80c2d5457e2`. Database migration is applied; no test users/contact data were inserted into production.

## Admin workflow
1. Use the private bootstrap link to create the owner account and choose your own password (12+ characters). Bootstrap works only when no account exists.
2. Owner may create `admin` or `editor` accounts, disable/re-enable accounts and reset their passwords. Each user can change their own password; old sessions are revoked.
3. Save changes to the shared draft. Preview is authenticated and shows the server draft. Editors submit for review; owner/admin publish. Only publishing changes public pages.
4. If another user changed the draft, stale saves/publish are rejected. Export JSON to preserve work, then reload the new server version.
5. Public/draft project settings and homepage selections control what goes into the published snapshot. Draft records, disabled blocks, private client identity and unknown fields are excluded from public JSON/HTML.
6. Images selected from the computer upload into individual D1 media records on save. Draft-only images require a session; published media become public. Videos remain externally hosted URLs.
7. Contact form stores real requests in D1. Owner/admin see the latest 200 and change their status; editors cannot see contacts. No email delivery service is configured.

## Security and operations
- PBKDF2 SHA-256 password hashing; random salted hashes, random session cookies stored only as hashes. Cookie is HttpOnly, SameSite=Strict and Secure on HTTPS, expires after 12 hours.
- Mutations require the same Origin and session CSRF token. Server validates content, roles, URL schemes, upload magic/type/size, streamed request-body size and optimistic revision.
- Contact protection: honeypot, short-lived single-use token, minimum form age, IP-hashed rate limits. This is basic spam protection, not a guarantee that no bot can submit.
- Dynamic HTML has nonce-based CSP, no-store, no sniffing and appropriate referrer policy. Admin/preview are noindex. Public pages have current metadata and a dynamic sitemap.
- Scheduled cleanup removes expired sessions/contact tokens/rate counters. Uploaded images and contacts are not automatically deleted.
- `.dev.vars` and `.cloudflare-setup.txt` contain secrets/private setup access and are ignored by Git. Never copy them into `public/` or `dist/`.
- Source docs: [Workers assets binding](https://developers.cloudflare.com/workers/static-assets/binding/), [D1 data binding](https://developers.cloudflare.com/d1/worker-api/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

## Commands
```powershell
npm install
npm run db:local
npm run cf:dev
```
Worker local: http://127.0.0.1:8787. Local D1 is separate from production. On Windows stop Wrangler before rebuilding assets, because its file watchers can hold file handles.

```powershell
npm test
npm run build
npx wrangler deploy --dry-run
npm run db:remote
npx wrangler deploy --secrets-file .dev.vars
```
Apply migrations only to the intended database. Deployment uses Workers, not Pages. The first owner sets their password through the UI; there is no preset production password.

The legacy `npm run dev` still runs the standalone static/local-admin mode. It does not use D1. On the deployed Worker, admin, preview and contact use the server automatically.

## Verification
- 19 Node tests pass, including auth/bootstrap/CSRF, roles, CAS conflicts, public allowlist, contact token replay/storage and bounded JSON body.
- Wrangler bundle dry run succeeds; actual local D1 migration succeeded.
- 14 end-to-end checks on actual workerd/D1 local passed: owner setup/login, draft privacy, preview, publish, BLOB upload/private/public access, editor submission/role restriction, stale owner save rejection with input preservation, owner approval, contact storage/status, mobile layout, exclusive import lock, anonymous access rejection and sitemap. No browser JavaScript errors.
- Fresh code review caught async reset/import outside the save lock. A shared exclusive operation lock now disables editor/navigation controls throughout replacement, including file reading; verified by delayed network import in the browser.
- Standalone admin regression after backend integration: all 28 browser checks pass.
- Deployment succeeded, secrets are bound, cron is registered and Cloudflare API confirms workers.dev is enabled. HTTP returns the intended 308 HTTPS redirect. HTTPS became available after initial namespace provisioning.
- Production HTTPS smoke test: 16 checks passed at `2026-10-14T05:01:51.924Z`. Public pages/assets and sitemap return 200, unknown page 404, private admin API 401, unauthenticated preview redirects to login. Edge renders the homepage and 390px admin setup without JavaScript errors. Evidence: `docs/screenshots/production-results.json`, `production-home-desktop.png`, `production-admin-mobile.png`. No owner or test records were created in production by the smoke test.
- Private first-owner link is saved in workspace file `.cloudflare-setup.txt`. Open that link, create a username/password, then use `/admin/`. Setup remains uninitialized until the user completes it; the bootstrap token is never published in these docs.
