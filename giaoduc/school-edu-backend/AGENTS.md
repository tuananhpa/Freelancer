# Hướng dẫn cho agent (Codex / Claude Code)

Đọc `PLAN.md` trước. Danh sách endpoint phải làm: `docs/ENDPOINTS.md` (256 dòng, sinh từ Java).

## Lệnh
- Cài: `npm install` (lần đầu thêm `npm install-scripts approve workerd && npm rebuild workerd`)
- Schema: `npm run schema:extract` → `migrations/0001_schema.sql`
- DB local: `npm run db:migrate:local`
- Chạy: `npm run dev` (http://localhost:8787)
- Test: `npm test` (đặt `BASE_URL=http://localhost:8787` nếu test gọi server đang chạy)
- Kiểu: `npm run typecheck`
- Deploy: `npm run deploy` (chỉ khi người giao việc yêu cầu)

## Quy tắc
- **Không sửa** `../URANUS-BackEnd-main/` (mã gốc, chỉ đọc) và không sửa frontend ngoài những chỗ PLAN.md §13 ghi.
- Port logic từ đúng method Java ở cột "Handler Java"; đừng tự đơn giản hóa luật chấm điểm. Mỗi luật ở PLAN.md §6 có test.
- Tên field JSON giữ như DTO Java (camelCase). Lỗi trả `{ status, errorCode, message }`, thông báo tiếng Việt, ngắn.
- SQL luôn dùng tham số `?`. Không trả `password`, `api_key_enc`.
- Không commit secret: dùng `.dev.vars` (đã có `.dev.vars.example`) và `wrangler secret put`.
- Làm theo checklist PLAN.md §12, xong bước nào chạy test bước đó. Khi Java và frontend mâu thuẫn: theo Java, ghi lại và hỏi người giao việc.
