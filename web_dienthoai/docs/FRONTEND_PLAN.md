# Frontend cửa hàng và admin

> Thực hiện trực tiếp trong chat với executing-plans; không giao subagent.

**Goal:** Admin chỉnh dữ liệu được phản ánh ngay ở storefront cùng trình duyệt.
**Architecture:** ES modules, repository dùng localStorage có schema/version, subscription + storage event. UI tách storefront/admin; fixtures có thể thay bằng API adapter.
**Tech Stack:** HTML, CSS, JavaScript native; Node static server và node:test. Không phụ thuộc framework.
**Spec:** docs/CLIENT_BRIEF.md và docs/DESIGN_SELECTION.md.

## Constraints
- Frontend trước, không tạo backend/auth giả.
- Tiếng Việt, desktop/mobile, ảnh upload và chỉnh nội dung, CRUD tất cả entity hiển thị.
- Không ghi đã lưu nếu storage lỗi; kiểm tra input/URL và escape văn bản.

## Review focus
- Dữ liệu hỏng: fallback an toàn và thông báo.
- Storage đầy: giữ dữ liệu cũ và báo lỗi.
- Xóa danh mục đang dùng: chặn để không mất liên kết.
- Đường dẫn độc hại: không render javascript URL/HTML từ admin.
- Sửa/xóa sản phẩm trong giỏ: tính lại giá, bỏ sản phẩm đã xóa/ẩn.

## Task 1: Repository
Files src/store.js, src/seed.js, tests/store.test.js.
- [x] Test CRUD, persistence, lỗi quota, quan hệ, URL và giỏ hàng; chạy RED.
- [x] Implement createStore(storage, seed), upsert, remove, updateSettings, subscribe, cartTotal; chạy GREEN.

## Task 2: Cửa hàng
Files index.html, src/app.js, src/storefront.js, src/ui.js, styles.css.
- [x] Header/menu/hero/banner/thương hiệu/section/footer/widget từ dữ liệu.
- [x] Danh mục, lọc, tìm kiếm, chi tiết, giỏ hàng, bài viết, chính sách.

## Task 3: Admin
File src/admin.js.
- [x] Dashboard, CRUD form/table, uploads, quản lý cài đặt và sắp xếp.
- [x] Preview storefront, thông báo lỗi và empty states, export/import backup.

## Task 4: Kiểm chứng
Files scripts/server.mjs, scripts/browser_test.py, README.md.
- [x] node --test; kiểm tra syntax ES modules.
- [x] Browser desktop/mobile, CRUD → frontend, persistence, upload, widget, giỏ hàng, tin công nghệ.
- [x] Lưu bằng chứng và giới hạn trong README.

