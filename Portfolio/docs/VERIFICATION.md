# Verification — 2026-10-13

## Executed checks
- `npm run build`: success, 8 HTML routes + `404.html` generated.
- `npm test`: 4 tests pass, covering public/draft filtering and private client fields, combined accent-insensitive search/category filter, contact validation, local storage success/failure.
- `node tests/browser.mjs` using bundled Playwright and Edge headless: 43 checks pass, no JavaScript page errors. Desktop homepage at 1440px; all 8 routes checked for horizontal overflow at 320, 390, 768 and 1024px. Homepage links return 200, direct project page/title works, filtering/search/empty reset works, form validates/persists/restores/exports draft without claiming send, theme persists, FAQ expands, unknown route returns HTTP 404, mobile menu opens/closes with Escape, image error renders fallback.
- `node tests/regressions.mjs`: both regression checks pass. Save stays disabled with JavaScript off, pressing Enter does not serialize data into URL. Dark validation text contrast is 9.30:1.
- `node --check`: source modules and build/server scripts parse successfully.
- Configured-origin build tested with reserved `.invalid` domain: 8 sitemap entries, project canonical URL and PNG social image metadata correct. Returned to local build without a made-up production origin.
- Screenshot review of desktop and mobile homepage: checked visual match to A, readability, gallery scale and mobile composition. Images saved in `docs/screenshots/`; `browser-results.json` contains check details.
- Independent code review identified two issues (no-JS form behavior, dark error contrast), reproduced and fixed before handoff.

## Practical limits
- This verifies frontend behavior, not production backend or full WCAG/Lighthouse compliance.
- All projects and presentation content are illustrative and marked. Real brand/content/contact channels are still needed.
- Form remains browser-local and unsent. No actual email, database, accounts, CMS approval, admin roles or server anti-spam is implemented in this phase.
- Public URL, DNS, hosting configuration, indexing and real social-platform preview have not been tested because no deployment/domain was supplied.
- Preview is running at `http://127.0.0.1:5188` because port 5173 was already occupied. No existing process was stopped.
