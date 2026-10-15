# Admin implementation ledger — docs/ADMIN_FRONTEND_PLAN.md

- User chose local frontend admin, backend later (2026-10-14).
- Existing project has no Git repository; implemented directly in supplied workspace. Current shell sandbox denies the workspace despite declared roots; scoped shell reads/build/tests used auto-reviewed escalation, while apply_patch writes worked. No unrelated process/files were changed.
- Model tests written first, observed missing-module failure, implemented model, then observed 6/6 passing. Added gallery validation and hero visibility coverage; hero test failed before replacing fixed mock visuals with selected public project media.
- Project and homepage editor completed, with origin-local save, working-memory state, import validation and backup. No artificial auth or publication status.
- Preview uses shared renderer and local document; new routes live within `/xem-thu/?path=...` so static hosting does not require a real page for every local draft.
- Ruling: internal preview rewriting applies only to supported portfolio routes; asset and product links preserve their original destination. Product links with target=_blank remain outside preview.
- Ruling: image-read completion belongs to its originating form/editor and latest upload generation. Stale reads are discarded after editor replacement or new selection.
- Keyboard focus retained across rerenders; text/gallery/sample-note edge cases corrected.
- Final build, 12 logic tests, 28 admin browser checks, 5 review regressions, 43 original-site checks and 2 original form regressions passed. Documentation updated; no deployment or backend added.
