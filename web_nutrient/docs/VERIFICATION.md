# Verification
Trạng thái kiểm tra source hiện tại:
- npm test: 16 tests passed.
- npm run check: TypeScript passed.
- npm run build: Vite passed, không cảnh báo.
- node tests/api-integration.mjs: 35 checks passed trên gateway local.
- Cùng API suite qua tunnel HTTPS: 35 checks passed.
- node tests/browser.mjs: onboarding 5 bước, meal create/edit, water, ngày 30, tìm thí nghiệm/hoàn thành, pH/công cụ, world recipe/Việt hóa/thành tích, profile save, backup, chat unavailable, mobile navigation.
- Kích thước: 1440, 1024, 768, 390, 320; không horizontal overflow; sidebar mobile ẩn đúng; không pageerror.
- Screenshots: docs/screenshots (gitignored), đã kiểm tra trực quan desktop và mobile.
- Các lỗi review được xử lý: tunnel raw port, history >90 ngày, push ownership, profile client analysis, scheduler thiếu VAPID, chat ordering/latest window, silent preference.
- Thông tin đăng nhập, .dev.vars, .local, .wrangler/state, dependency và build output được gitignore.

## Chưa kiểm thử live
- Gemini chưa có API key, không giả kết quả.
- Web Push tới thiết bị thật, camera trước/sau trên điện thoại thật.
- Chưa deploy production Cloudflare; database_id trong config là local placeholder.
- Nội dung chưa có chuyên gia sức khỏe thẩm định; không tuyên bố đạt chuẩn y khoa.

## Runtime dùng thử
Local: http://127.0.0.1:8788
Tunnel tại lần bàn giao: https://adams-outside-participant-jenny.trycloudflare.com
Restart tunnel sẽ đổi link. D1/R2 nằm trên máy này; giữ máy/mạng/các tiến trình hoạt động để khách dùng.
