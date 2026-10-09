# HYTales Implementation Plan

**Goal:** Frontend chạy được, trình diễn đúng thông điệp và tách lớp backend.
**Architecture:** React + TypeScript + Vite; routes public/admin riêng, data DTO và service mock/API thống nhất.
**Spec:** DESIGN.md

## Global constraints

Mọi file tạo mới nằm trong front_end_codex/front_end. Không sửa HYTales. Không ép người xem đăng nhập. Chỉ làm frontend. Media gốc dùng làm nguồn dữ liệu.

## Review focus

URL không tồn tại; dữ liệu trình duyệt lỗi; slug ổn định khi sửa; form thiếu thông tin; API lỗi và phiên hết hạn.

- [x] Tạo type, dữ liệu ba sản phẩm, service; test persistence, slug, API lỗi, cấu hình.
- [x] Tối ưu ảnh/video vào public/media; ghi nguồn và giới hạn bản preview.
- [x] Xây homepage, product story, gallery, timeline, chat, review và form kết nối.
- [x] Xây luồng admin demo, CMS, QR tùy biến/xuất file, inbox và thiết lập.
- [x] Build và kiểm tra trình duyệt desktop/mobile, xử lý mọi lỗi phát hiện.
- [x] Viết hướng dẫn chạy và API contract cho backend.
