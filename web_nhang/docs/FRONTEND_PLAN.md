# Vĩnh Thuận Phát B — Implementation Plan

> Execution: executing-plans, trực tiếp trong chat. Người dùng đã chọn B và yêu cầu chạy ngay; không thêm vòng duyệt kế hoạch.

**Goal:** Frontend dữ liệu tĩnh theo mockup B, giữ các luồng gốc, bàn giao backend plan, push Git và tunnel.
**Architecture:** Vanilla JavaScript modules + Vite, dữ liệu sản phẩm riêng, repository tìm/lọc và resolve route độc lập UI. Chạy bản build qua static server chỉ phục vụ dist để tunnel không lộ source/docs.
**Tech Stack:** Node.js, Vite, CSS, node:test; không UI framework.
**Spec:** docs/CLIENT_BRIEF.md, docs/DESIGN_SELECTION.md, docs/mockups/B-xanh-tram.png.

## Constraints

- Logo/ảnh hàng thật từ nguồn gốc; ảnh lifestyle AI chỉ dùng trang trí, không làm ảnh mô tả hàng.
- Không bịa giá, đơn hàng, xác thực hoặc gửi form thành công.
- Tài khoản/chức năng gửi cần server hiển thị chưa kết nối và có cách liên hệ thật.
- Không đổi các dự án anh em trong repository D:/Freelancer.

## Review focus

- Tìm kiếm tiếng Việt có/không dấu và input HTML phải an toàn.
- Deep link/back/forward/danh mục con phải đúng, URL không tồn tại có trạng thái rõ.
- Modal và menu hoạt động bằng bàn phím, Escape đóng, không mất focus.
- Mobile không tràn ngang, tên hàng dài không đẩy nút ra ngoài.
- Tunnel chỉ phục vụ bản build; không mở directory listing hoặc truy cập ../.

## Tasks

- [x] 1. Thu thập logo/ảnh thật; tạo hero lifestyle theo B; lưu nguồn tài sản.
- [x] 2. Viết test repository: search không dấu, group + dạng nhang, empty/unknown route, phân trang, escape; chạy RED rồi triển khai src/catalog.js và fixtures.
- [x] 3. Tạo index.html, src/main.js, src/styles.css: homepage B, catalog/search, detail/quick-view/gallery, giới thiệu, đại lý, liên hệ, login/reset chưa nối backend, audio thủ công. Dùng route URL gốc và CSS tokens.
- [x] 4. Viết PLAN.md từ file thực tế, README, server static dist với chặn traversal và SPA fallback; test server.
- [x] 5. npm test + npm run build; browser kiểm desktop/mobile, search/filter/detail/modal/menu/form/404. Sửa lỗi quan sát được.
- [ ] 6. Review phạm vi staged, commit riêng web_nhang, push branch codex/nhang-frontend-b lên origin. Chạy dist server và cloudflared tunnel; xác minh URL công khai.
