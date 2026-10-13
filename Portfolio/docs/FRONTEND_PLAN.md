# Portfolio A Implementation Plan

> For agentic workers: use executing-plans to implement this plan task-by-task in the current chat.

**Goal:** Build a usable static portfolio matching selected mockup A.
**Architecture:** Native ES modules and a zero-dependency Node build generate complete per-route HTML. Data fixtures are accessed through a repository; UI interactions enhance generated pages. This phase has no server auth, CMS or submission service.
**Tech Stack:** HTML, CSS, JavaScript modules, Node 24, Python Playwright for verification.
**Spec:** CLIENT_BRIEF.md and DESIGN_SELECTION.md.

## Constraints
Vietnamese; mark illustrative projects/content; no fictional testimonials or success claims. Public pages: home, projects, project details, services, team, contact, 404. CMS roles/approval/contact management are backend scope. Contact form validates and saves a browser draft; never claims a request was sent. No actual contact channels have been provided. No deployment.

## Review focus
- Filter + search compose; Vietnamese accents normalize; empty results provide reset.
- Draft/private data must not produce public project pages; concealed client fields never render.
- Missing contact identity and invalid email/phone must be rejected.
- Browser storage can fail without breaking pages; contact draft must be explicitly local.
- Mobile menu, keyboard focus, theme, error image and unknown route remain usable.

## Tasks
1. [x] Data and behavior: src/data.js fixtures, src/repository.js public filtering/project lookup/contact validation/safe local draft; tests/logic.test.mjs asserts accent search, combined filters, privacy, invalid contacts, storage failure. Run node --test before and after implementation.
2. [x] Rendering: src/icons.js, src/previews.js, src/render.js home/project/services/team/contact/404 layouts; static preview assets; scripts/build.mjs creates dist with route metadata, sitemap (when SITE_URL supplied) and robots. Use same renderer for all pages; source project routes only from public repository.
3. [x] Presentation/interactions: src/styles.css reproduces A, src/client.js theme/menu/search/FAQ/form draft enhancement; scripts/server.mjs serves dist paths and true 404. Verify page routes and mobile with Playwright; check browser errors, image loading, search reset, menu, local form draft, theme and not found.
4. [x] Handoff: README.md running/content/hosting guides, docs/VERIFICATION.md actual results, screenshots desktop/mobile. Open local preview in Codex.

No Git repository exists; work directly in the provided empty workspace. Plan review is folded into the selected visual direction per client-web-flow; no extra approval round is added.
