# Tiến độ chuyển Uranus — 2026-10-29

Kế hoạch gốc: `../PLAN.md`. Bước 1 đã hoàn thành; đang tiếp tục bước 2–14 theo yêu cầu triển khai đầy đủ lên Cloudflare ngày 2026-10-29.

## Phiên triển khai đầy đủ

- Target được xác nhận: Worker `school-edu`, https://school-edu.edu-manage-ai.workers.dev, cùng origin frontend/API; thay bản demo hiện tại sau khi hoàn tất các cổng kiểm thử.
- Cloudflare OAuth đã được người dùng đăng nhập lại thành công; account `026fe25b5d51b353d7c092e7521f69fb` có quyền truy cập đúng Worker.
- Phiên bản trước khi thay: `7e28c0f8-581b-4921-af27-18250b33e878` (bản demo). Rollback: `npx wrangler rollback 7e28c0f8-581b-4921-af27-18250b33e878`.

## Trạng thái 2026-10-29 (Claude Code hoàn thành phần Codex dừng)

- **Đã deploy bản thật**: version `7c1be6ea-1ad3-4c62-9497-f91efde2b953`. D1 remote `school-edu-db` (`73bf870c-…`, apac, đủ 4 migration), KV `SESSIONS` (blacklist đăng xuất, giới hạn hỗ trợ), Durable Object `RealtimeHub` (STOMP `/ws`), cron 30 phút nhắc hạn, secrets `JWT_SECRET`/`AI_KEY_ENCRYPTION_KEY` mới (ngẫu nhiên, không lưu ở đâu khác).
- Frontend build `npm run build:live` (`.env.live`: `VITE_WS_URL=wss://school-edu.edu-manage-ai.workers.dev/ws`), Worker backend phục vụ `dist` cùng origin.
- **Cảnh báo**: `npm run deploy:demo` trong thư mục frontend deploy cùng tên Worker `school-edu` → sẽ ghi đè bản thật. Không chạy nữa (hoặc đổi tên Worker demo).
- **Không dùng R2** (người dùng chốt 2026-10-29): tệp/ảnh tải lên Cloudinary (`resource_type: auto`, như Java), D1 chỉ lưu `secure_url`. Cần 3 secret: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (tài khoản Cloudinary mới, không dùng khóa trong application.yml cũ). Chưa có secret thì upload trả `STORAGE_NOT_CONFIGURED`. 2026-10-29: đã đặt đủ 3 secret; kiểm tra live 8/8 (tệp văn bản, ảnh media, ảnh chat hỗ trợ, lưu URL vào học liệu, chặn .exe). Bucket R2 `school-edu-files` đã tạo nhưng không dùng (trống). Version hiện tại `29988eb9-4cb0-452d-bcba-8507781bc615`.
- Đủ 256/256 endpoint (tests/coverage.test.ts so với docs/ENDPOINTS.md). 81/81 test hợp đồng pass trên wrangler dev; smoke test live 17/17.
- Khác Java (cố ý, đều là sửa lỗi/bảo mật): kiểm tra chủ khóa học khi sửa/xóa; chỉ GV quản lý lớp mới nhập Excel vào lớp; tự đăng ký bằng mã HS tắt (403); xóa hồ sơ HS chưa gắn tài khoản xóa luôn hồ sơ; typing hỗ trợ chỉ nhận từ người trong hội thoại; nhận đủ đáp án A khi A–D viết cùng dòng câu hỏi; xóa lớp dọn đủ dữ liệu con.
- Còn mở: email (chưa có tên miền gửi); màn Cài đặt AI ở frontend vẫn cho giáo viên bấm lưu (API trả 403 vì khóa chung chỉ ADMIN sửa); TermGradePanel còn lưu hệ số ở localStorage (API `settings/grade-weights` đã có).
- Admin email thực: `tuananhha1710@gmail.com`. Email gửi vẫn cần tên miền Cloudflare Email Service đã xác thực; không coi Gmail là tên miền gửi.
- Tiếp tục trực tiếp trong thư mục dự án được người dùng chỉ định. Repo Git phát hiện ở D:/Freelancer là repo cha không liên quan, phần dự án này đang untracked; không commit/thay branch repo cha hay chuyển sang worktree thiếu các nguồn Java/frontend.

### Bước 2: complete

- Thêm migration 0003 (username, assessment type, grade weights, school_settings AI chung/branding), 0004 (seed đúng một Admin, PBKDF2, email thực, không ghi mật khẩu thô).
- Thêm Web Crypto PBKDF2-SHA256 100000 vòng, salt ngẫu nhiên; xác minh BCrypt cũ bằng bcryptjs. Generator yêu cầu password trong process environment; test không cần environment bổ sung.
- Controller xác minh độc lập: `npm run typecheck` exit0; `npm test -- tests/migrations.test.ts tests/password.test.ts`: 2 files passed, 11 tests passed.
- D1 local: 0003/0004 apply thành công; SELECT trả Admin/ADMIN/must_change_password=1; foreign_key_check rỗng.
- Bare npm test hiện 18 tests passed; 12 contract tests không chạy vì setup chưa kết nối API runtime. Không xóa/skip test.
- Báo cáo: task-2-report.md; rà soát độc lập: task-2-review.md.

## Quyết định đã được người giao việc xác nhận

- Không chuyển dữ liệu PostgreSQL cũ; không tạo tài khoản demo Java.
- Bỏ Google login. Chỉ ADMIN tạo tài khoản, không giới hạn số tài khoản.
- Dùng dịch vụ Cloudflare. Chưa có tên miền gửi email/tên miền chính thức; cấu hình ở bước tích hợp, không tự điền.
- AI dùng khóa chung toàn trường, thay thế phương án khóa riêng mỗi giáo viên trong kế hoạch gốc. Khóa phải là secret; tuyệt đối không đưa về client.
- Bổ sung cài đặt thương hiệu cho ADMIN chỉnh logo, tên và thông tin liên hệ; chưa triển khai API hoặc UI này.
- Bỏ vai trò `UNASSIGNED`; giữ CHECK theo migration V1.73, API mới phải từ chối role này.
- Được phép bỏ lựa chọn `UNASSIGNED` tại màn hình quản lý tài khoản frontend. Chỉ sửa lựa chọn đó; các phần frontend khác tiếp tục theo giới hạn §13 và chỉ dẫn của người giao việc.
- Đã được phép tạo tài nguyên remote, migrate remote và deploy theo yêu cầu mới nhất: “Rồi chạy và full đưa lên cloudflare cho t test hết backend đồ hết luôn nhé”. Chỉ publish bản đã kiểm thử, không báo hoàn thành 256 endpoint khi chưa thực hiện đủ.

## Bước 1 — hoàn thành

Nguồn chỉ đọc: 58 entity Java và 86 migration Flyway V1.1–V1.88.

- `tools/entities-to-pg.mjs`: xử lý quan hệ chỉ đọc dùng chung cột khóa chính (`UserGamification.user_id`); không sinh cột vật lý cho `@Formula` (`User.studentCode` được truy vấn từ `student_profiles`). Giữ danh sách field→cột để đối chiếu.
- `tools/extract-schema.mjs`: dựng bảng entity trước; tách từng câu SQL ngoài comment, chuỗi và thân dollar-quote; mỗi câu dùng SAVEPOINT. Chỉ tự bỏ qua mã trùng 42701/42P07/42710. Lỗi khác được ghi rõ file, thứ tự câu và mã PostgreSQL; không xuất schema khi còn lỗi hoặc thiếu cột entity.
- Sinh `migrations/0001_schema.sql`, `0002_seed.sql`, `tools/schema.json`, `tools/migration-report.json`.
- Thêm cấu hình D1 local tối thiểu tại `wrangler.jsonc`; database_id là ID giữ chỗ, không phải tài nguyên thật. Bindings R2/KV/Queue/DO/cron vẫn thuộc bước 3.
- Thêm cấu hình TypeScript, kiểu Node và test schema. Cấu hình Vitest giữ BASE_URL của contract test, tránh Vite thay bằng `/`.

### Lỗi nguồn đã kiểm tra và xử lý trong công cụ

Không sửa bất kỳ file Java hay migration gốc nào.

1. V1.51 thiếu dollar-quote quanh thân `DO`: chỉ thêm dấu bao trong bộ nhớ. Có SHA-256 nguồn và lý do trong migration-report.
2. V1.53 DROP khóa ngoại rồi mới tra tên cột của khóa đó: chuyển việc tra metadata lên trước DROP, giữ mục đích ON DELETE CASCADE. Có SHA-256 nguồn và lý do trong migration-report.
3. V1.74 chèn ba học liệu mẫu phụ thuộc tài khoản Admin/Teacher cũ: loại câu INSERT mẫu, giữ DDL/index. Phù hợp cài mới chỉ seed Admin ở bước 2; ghi riêng trong `exclusions`.
4. Bỏ qua 39 câu lệnh trùng đúng ba mã đã cho phép. Xem từng câu trong migration-report.

### Số lượng đã xác minh

| Chỉ số | Kết quả |
| --- | --- |
| Bảng entity ban đầu | 58 |
| Cột vật lý từ entity | 508 |
| Migration đã xử lý | 86 |
| Bảng cuối trong D1 | 59 |
| Cột cuối trong D1 | 518 |
| Khóa ngoại PostgreSQL xuất sang D1 | 105 |
| Index PostgreSQL, gồm index của ràng buộc | 127 |
| Cột entity bị thiếu | 0 |
| Dòng seed bước 1 | 0 |

Bảng thêm từ migration: `messages_archived` (8 cột, V1.67). Hai cột migration khác: `exams.access_password`, `exams.is_public`. Tổng 10 cột chỉ có trong migration, in đầy đủ bởi extractor và lưu trong migration-report.

### Kiểm chứng thực tế

- `npm run schema:extract`: PASS, exit 0; 59 bảng / 518 cột / 0 lỗi migration chưa xử lý.
- `npm run typecheck`: PASS, exit 0.
- `npm test -- tests/schema.test.ts`: PASS, 7/7. Test dùng PGlite thật, 86 migration nguồn thật và SQLite thật; kiểm tra schema đủ cột, unique, CHECK, cascade, shared PK, @Formula, thứ tự version, DO, comment/chuỗi có dấu chấm phẩy, phục hồi sau duplicate, hai sửa migration và loại seed demo.
- `npm run db:migrate:local`: PASS trên D1 local dựng mới sau lần sửa cuối; `0001_schema.sql` (101 commands) và `0002_seed.sql` (2 commands) đều thành công.
- Đếm trực tiếp trong D1: `table_count=59`, `column_count=518`; loại các bảng nội bộ D1/SQLite.
- `PRAGMA foreign_key_check` trong D1: PASS, `results=[]`.
- `npm test`: FAIL tại setup `tests/contract.test.ts`, `ECONNREFUSED localhost:8787`; schema 7 PASS, 12 contract test chưa chạy vì setup không kết nối được server. Backend runtime/auth chưa triển khai. Không sửa, xóa hoặc bỏ qua contract test để làm xanh. Output đầy đủ: `tools/step1-test-output.log`.
- Một truy vấn thử `PRAGMA integrity_check` trên D1 bị D1 chặn `SQLITE_AUTH`; dùng các truy vấn đếm và `foreign_key_check` được D1 hỗ trợ để kiểm chứng, không coi lệnh bị chặn là PASS.
- Frontend `npm run build` (TypeScript + Vite, không `--mode demo`): PASS, exit 0 sau khi xóa lựa chọn UNASSIGNED ở `src/features/admin/UserManagement.tsx`. Vite báo một số bundle lớn hơn 500 kB; chưa tối ưu bundle trong thay đổi này. Output đầy đủ: `tools/step1-frontend-build-output.log`. Chưa kiểm tra UI bằng trình duyệt hoặc kịch bản live vì chưa có Worker API.
- `npm audit` sau bổ sung `@types/node`: 3 cảnh báo dependency phát triển có sẵn (1 moderate, 2 critical), liên quan Vitest/@vitest/mocker/tinypool. Chưa nâng major Vitest trong bước schema; cần xử lý trước khi kết thúc kiểm thử toàn backend.

## Bước tiếp theo

Bước 2: thêm migration tính năng mới và seed đúng một Admin với mật khẩu PBKDF2; kiểm tra dữ liệu D1 và chạy typecheck/test của bước này trước khi sang bước 3. Điều chỉnh thiết kế AI thành khóa chung toàn trường và thêm cài đặt thương hiệu theo quyết định ở trên. Không mở lại các lựa chọn đã được xác nhận.

Các bước 3–14 tiếp tục theo thứ tự §12; bước 14 đã được người giao việc cho phép.
