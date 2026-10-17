# TENSAN 3D Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task in this session. The user has selected the attached original A mockup and explicitly requested implementation with 3D and animation. Client Web Flow does not add another design/plan approval round.

**Goal:** Build the selected Tensan product-introduction website with a real interactive exploded 3D board and coordinated animation.

**Latest user correction (2026-10-17):** Keep the exploded PCB/heatsink design; make thermal grease explicit in the 3D itself. The packaging replacement was rejected. Current implementation is assembly-markup.js, assembly-hero.css, thermal-assembly.js and hero-scene.js: board/chip/irregular grease spread/heatsink, TS1001 projected callout and real photo card, drag/30° buttons/reset, assembly and focus-paste controls. Static geometry is batched. Grease stays between chip and sink through the assembly animation; thickness is explicitly exaggerated. Nine current tests pass, including contacts, rotational bounds and mesh batching. Desktop/mobile browser checks cover visible canvas, assembly/focus, drag and readable labels. Latest deployment verification belongs in VALIDATION.md.

**Architecture:** Vite vanilla JavaScript static frontend. Shared shell and route renderers; static product repository; Three.js loaded only on the homepage; GSAP timeline and ScrollTrigger with teardown. Assets are local and attributed. No backend or fabricated form delivery.

**Tech Stack:** Vite, Three.js, GSAP; Node built-in tests; browser QA.

**Spec:** CLIENT_BRIEF.md, DESIGN_SELECTION.md and user attachment codex-clipboard-c561558a-6200-40be-af42-8b460d3849c9.png.

## Global Constraints
- Selected design is the original dark exploded-board hero and white product/application sections in the user's latest attachment, overriding earlier rejected directions.
- Vietnamese interface; correct real product categories and images; no fake company numbers, certifications or reviews.
- User additionally requested Cloudflare deployment. Publish a separate Worker; existing website/DNS and neighboring project changes remain untouched.
- Reduced-motion mode, keyboard access and useful WebGL fallback.
- Keep source and supporting assets within web_tensan. Do not commit the parent repository's other projects.

## Review Focus
- Empty/accented product queries and category combinations: correct results or useful empty state.
- Direct links, invalid product IDs and browser back/forward: correct route/404 and metadata.
- No WebGL, reduced motion, background tab and offscreen scene: useful fallback, stopped rendering and resource cleanup.
- Mobile navigation and search: accessible open/close, Escape, focus restoration, no horizontal overflow.
- Contact: valid mail draft link and real phone/email; no fake submission success.

## Task 1: Content, shell and routes
Files: src/data.js, src/catalog.js, src/icons.js, src/pages.js, src/main.js, src/style.css; tests/catalog.test.mjs.
- [x] Write and run failing tests for accent-insensitive filtering and product lookup, including empty/unknown results.
- [x] Implement product repository, shared header/footer, homepage and six coherent route views: Giới thiệu, Sản phẩm, product detail, Ứng dụng, Tin tức/article, Liên hệ/404.
- [x] Fetch real local product/logo/company images and create local illustrative application photography as needed; document origin.
- [x] Match attached desktop layout and responsive mobile styles; verify catalog test command.

## Task 2: Interactive 3D and motion
Files: src/hero-scene.js, src/motion.js.
- [x] Build procedural PCB, components/traces, silicone, thermal layer and finned aluminum heatsink using Three.js.
- [x] Intro assembly/explosion, pointer/drag rotation, assembly button, layer focus controls, pause; GSAP scroll response.
- [x] Respect reduced motion; stop offscreen/background rendering, handle lost context/fallback and dispose on route exit.
- [x] Confirm actual canvas rendering and controls in browser.

## Task 3: Verification and delivery
Files: tests/browser-check.mjs (if supported), docs/VALIDATION.md, README.md.
- [x] Run Node tests and production build.
- [x] Verify desktop/mobile home and all navigation, catalog/filter/empty state, product detail, contact draft, 404 and motion/pause. Reduced-motion/context-loss branches reviewed at source; not browser-emulated (see VALIDATION.md).
- [x] Capture screenshots, review code independently, fix material findings, rerun affected checks.
- [x] Open local preview for user and report actual verification limits and backend scope.

## Ledger
- Execution: native/in this chat, selected flow already approved by user.
- Parent repository contains unrelated changes; reuse the explicitly named project folder, no parent Git mutation or worktree moving.
- No extra backend/contact service or dependency framework beyond the three libraries needed.

- Task 1 complete: shared pages, 29 products and local assets; tests green.
- Task 2 complete: WebGL assembly, motion and lifecycle; reviewer fixes verified.
- Task 3 complete: 6 tests, build39, desktop/mobile QA and Cloudflare HTTP/browser verification. See VALIDATION.md for actual limits.

