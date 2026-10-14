# Feature matrix
| Nhóm | Hiện thực | Kiểm chứng |
|---|---|---|
| Tài khoản/onboarding | Auth server, PBKDF2, 5 bước, phiên riêng | Chrome UI và API đăng ký/đăng xuất |
| Hồ sơ | Avatar, upload, mục tiêu, dị ứng, giới hạn vận động, thói quen, targets, theme | UI save, API validation và server-owned analysis |
| Phân tích hồ sơ | Gemini trả schema kiểm định, lưu phía server | Unit validation; chưa Gemini live |
| Dashboard | Tổng năng lượng/macros/nước từ D1, không số liệu giả | Chrome + API |
| Camera/tải ảnh/nhập món | Camera đổi phía, file thiết bị, manual; sửa trước lưu | Manual UI; upload R2/API/private ownership; camera thật chưa có thiết bị |
| Nhật ký | Thêm/sửa/xóa, 4 bữa, ngày/giờ và lịch sử cũ | Browser create/edit, API cross-user và historical |
| Thống kê | 7 ngày, theo bữa, nước, cân nặng | UI và dữ liệu D1 |
| Lộ trình | 30 ngày đủ 4 bữa, công thức/vận động, đánh dấu, AI tạo lại | Ngày 30/XP UI; AI chưa live |
| Chat | Chủ đề, gợi ý, lịch sử theo thứ tự, copy/reset | UI chưa cấu hình; API trả 503 trung thực |
| Khoa học | 33 thí nghiệm gốc, search, chi tiết, hoàn thành | Browser search/details/completion |
| Thư viện | 8 món/đồ uống, nguyên liệu/bước/dị nguyên | UI recipe detail |
| Chăm sóc | 4 nội dung đã điều chỉnh, hướng dẫn và lưu ý | UI có màn hình chi tiết |
| Mô phỏng | pH 6 mẫu, hòa tan tương tác, 5 nhóm chất | Browser chọn pH/sliders/UI |
| Thế giới | Việt/Nhật/Italia, mỗi nhóm 3 món, Việt hóa/công thức, nộp ảnh/tự ghi | Browser Italia/recipe/challenge |
| XP/huy hiệu/chuỗi | Cộng theo sự kiện không lặp; chuỗi ngày hoạt động | API idempotence, unit streak, UI profile |
| Thông báo | Opt-in push, thời gian VN, silent preference, scheduler local/cron | Unit scheduler/sound; chưa xác minh thiết bị nhận push |
| Sao lưu | Private R2 snapshot, download JSON, lịch daily | API ownership/credentials exclusion và Chrome download link |
| Gemini key | Admin-only, validate key+model, AES-GCM, write-only response | Unit crypto + API role checks; key thật chưa cung cấp |
| Local/tunnel | Worker/D1/R2 local, gateway chặn dev tools, 4 background services | API full suite qua HTTPS tunnel |
| Git | Stage/commit/push chỉ web_nutrient trong repo D:/Freelancer | Thực hiện sau kiểm chứng cuối |
