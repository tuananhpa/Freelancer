# Local admin frontend implementation

User chose local frontend admin on 2026-10-14. No backend, authentication or shared publishing is included.

- [x] Add validated content document/repository, typed homepage blocks, unique project slugs, local save/import/export, safe URL handling; test behavior before implementation.
- [x] Build /admin/ with project CRUD/order/featured/status, homepage block add/edit/hide/order/delete, site fields, JSON backup/import. Warn on unsaved navigation and storage failure.
- [x] Add /xem-thu/ to render the local document, maintain local preview across internal links, show project details/media/external links and ordered homepage blocks. Keep ordinary published pages unchanged.
- [x] Test browser CRUD, draft exclusion, preview navigation, sections, JSON roundtrip, unsafe import, storage failure, mobile; review code and document actual limits.

Storage key: portfolio.content.v1. Document: version/site/projects/sections. Project and block content must be validated and escaped. Admin only edits local content; no fake login or publish button. File images supported for small PNG/JPEG/WebP; large media should use image URL until backend upload exists. Existing home A remains the default.
