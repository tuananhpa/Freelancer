# Admin frontend verification — 2026-10-14

## Delivered
`/admin/`: browser-local project CRUD, order, featured/status, cover upload/URL, galleries, video/product/GitHub links, case-study content; homepage block library, add/edit/hide/reorder, specific project selection/order; site fields; JSON export/import and reset confirmation.

`/xem-thu/`: uses saved local configuration, supports new project details through `?path=`, maintains portfolio navigation, leaves resource/product links usable, excludes drafts from project lists/details and hero. Has a local-only banner and noindex. Original static pages remain separate.

## Fresh verification
- `npm run build`: 8 public pages + admin + preview + 404 built successfully.
- `npm test`: 12 tests pass. Includes unique safe slugs, valid import structures, URL safety, reorder, quota failures, JSON roundtrip, invalid gallery rejection and hero draft exclusion.
- Source JavaScript syntax checked with `node --check`.
- `tests/admin-browser.mjs`: 28 checks pass in Edge headless, no JavaScript errors. CRUD, small image upload, public/draft preview, selected project order, homepage blocks, branding/contact preview, JSON roundtrip/unsafe rejection, reload persistence, deletion, blocked/corrupt storage and original-page isolation. Admin tabs checked at desktop, 390px and 768px; screenshots inspected.
- `tests/admin-review-regressions.mjs`: 5 checks pass. Known assets remain usable, external product links stay external even on same host, checkbox focus survives rerender, delayed file reads cannot affect another editor and produce no page errors. Four failing checks reproduced before fixes.
- Previous public-site browser suite rerun: 43 checks pass at 1440px desktop and 320/390/768/1024px; contact no-JS and dark contrast regressions both pass.
- Fresh reviewer found async image ownership, preview-link rewriting and focus issues; all corrected and covered by regressions. Missing gallery array and duplicate text rendering were also corrected during review.

## Limits
- No backend, login, permissions, shared publishing or approval workflow. Public/draft status only affects local preview.
- Local content belongs to a browser origin, not a team account. Storage may be cleared/limited; export JSON for backup. Save failure is visible and keeps in-memory edits for export.
- Image uploads are local data URLs limited to 1 MB each; galleries/video use URLs. No server upload or imported website extraction.
- No domain deployment performed. Exported JSON is a content handoff, not automatic deployment.
- Build/source still use fixture data until backend or a deliberate content-build import is added.

Preview server: http://127.0.0.1:5188/admin/. Screenshots/results in `docs/screenshots/`.
