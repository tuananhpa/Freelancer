# Backend "School Edu" (Điểm Sáng) trên Cloudflare — kế hoạch bàn giao

Người nhận: Codex hoặc dev backend. Đọc hết file này trước khi viết code. Cái gì **bắt buộc** ghi rõ là bắt buộc; còn lại là gợi ý.

---

## 1. Mục tiêu & phạm vi

- **Làm:** viết lại toàn bộ backend Java Spring Boot của Uranus (`../URANUS-BackEnd-main`, 25.700 dòng, 256 endpoint, 58 entity, 86 migration) thành **một Cloudflare Worker (TypeScript) + D1 + R2**. Giữ nguyên path API, kiểu dữ liệu trả về và toàn bộ nghiệp vụ, để frontend React hiện có chạy được mà không phải sửa thêm (trừ mục 13).
- **Thêm** các tính năng mới đã có ở frontend demo nhưng backend Java chưa có (mục 4.2): đăng nhập bằng tên đăng nhập, chỉ admin tạo tài khoản, đổi tên đăng nhập, cài đặt khóa AI riêng cho từng giáo viên, loại bài kiểm tra TX/GK/CK, điểm học kì.
- **Không làm:** sửa thư mục `URANUS-BackEnd-main` (chỉ đọc). Không đổi UI frontend.
- **Xong** = mọi endpoint ở `docs/ENDPOINTS.md` chạy, `npm test` xanh, frontend chạy chế độ live (mục 13) qua được kịch bản mục 11 trên link Cloudflare.

## 2. Kiến trúc

| Thành phần Java | Thay bằng Cloudflare | Ghi chú |
|---|---|---|
| Spring MVC controllers | **Hono** router trong 1 Worker | `src/routes/<module>.ts`, mỗi controller Java → 1 file |
| PostgreSQL + Flyway | **D1** (SQLite) + `wrangler d1 migrations` | Schema: mục 3 |
| JPA/Hibernate | SQL viết tay qua `env.DB.prepare()` | Gợi ý thêm lớp `src/db/*.ts` theo từng bảng; có thể dùng Drizzle nếu muốn |
| Spring Security + JWT (jjwt) | JWT HS256 bằng Web Crypto (`crypto.subtle`) | Mục 5 |
| Redis (blacklist token, rate limit, cache) | **KV** (`SESSIONS`) cho blacklist/rate limit, hoặc bảng D1 | TTL bằng `expirationTtl` của KV |
| RabbitMQ (hàng đợi email) | **Cloudflare Queues** hoặc `ctx.waitUntil()` | Email: mục 7 |
| WebSocket STOMP (`/ws`) | **Durable Object** `RealtimeHub` + WebSocket | Topic: mục 7.4 |
| `@Scheduled` nhắc hạn nộp (30 phút/lần) | **Cron Trigger** `*/30 * * * *` | `ClassDeadlineReminderScheduler.java` |
| Cloudinary + lưu file local `uploads/` | **R2** bucket `FILES` | Mục 8 |
| Gemini (gọi REST `generativelanguage.googleapis.com`) | `fetch` tới Gemini **hoặc** OpenAI theo cài đặt từng giáo viên | Mục 7.1 |

Thư mục:
```
school-edu-backend/
  wrangler.jsonc          D1 binding DB, R2 FILES, KV SESSIONS, Queue EMAILS, DO RealtimeHub, cron
  migrations/             0001_schema.sql, 0002_seed.sql ... (sinh từ tools/, mục 3)
  src/index.ts            Hono app, CORS, xử lý lỗi, gắn routes
  src/lib/                auth.ts (JWT, PBKDF2), response.ts (ApiResponse), crypto.ts (mã hóa khóa AI), ai.ts
  src/routes/             auth.ts, users.ts, admin-users.ts, classrooms.ts, exams.ts, ... (theo controller)
  src/realtime.ts         Durable Object
  tests/                  vitest + @cloudflare/vitest-pool-workers
  tools/                  script chuyển schema / liệt kê endpoint (đã có)
  docs/ENDPOINTS.md       256 endpoint của Java (sinh tự động, đã có)
```

Biến môi trường (`wrangler secret put`, và `.dev.vars` khi chạy local — **không commit**):
`JWT_SECRET`, `AI_KEY_ENCRYPTION_KEY` (32 byte base64, mã hóa khóa AI của giáo viên), `GEMINI_API_KEY` (khóa mặc định của trường, tùy chọn), `OPENAI_API_KEY` (tùy chọn), `GOOGLE_CLIENT_ID`, `MAIL_FROM`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`.

> ⚠️ `application.yml` của Java có **giá trị mặc định thật** cho Gemini key, Cloudinary key/secret, JWT secret, Google client id. Coi như đã lộ: tạo khóa mới, không chép sang dự án này.

Lệnh: `npm run dev` (wrangler dev), `npm run db:migrate:local`, `npm test`, `npm run deploy`.
Đã cài sẵn: `hono`, `wrangler@4.155.0`, `@cloudflare/workers-types`, `typescript`, `vitest`, `@electric-sql/pglite`. `workerd` bị chặn postinstall: chạy `npm install-scripts approve workerd` rồi `npm rebuild workerd` trước khi `wrangler dev`.
Tài khoản Cloudflare: đã `wrangler login` trên máy chủ dự án, subdomain `edu-manage-ai.workers.dev`. Frontend demo đang ở Worker `school-edu` → `https://school-edu.edu-manage-ai.workers.dev`. Đề xuất đặt backend là Worker `school-edu-api` (hoặc gộp: một Worker vừa phục vụ `dist/` vừa `/api/*` — khỏi CORS, khuyên dùng).

## 3. Mô hình dữ liệu

**Nguồn sự thật:** schema Postgres thực tế = bảng Hibernate tự tạo từ 58 class `@Entity` (vì `V1.1__initial_setup.sql` chỉ có `SELECT 1`) **cộng** 86 migration `V1.2 … V1.88` (thêm cột, index, ràng buộc, dữ liệu).

Công cụ đã có trong `tools/`:
- `entities-to-pg.mjs` — đọc entity Java → DDL Postgres kiểu Hibernate (bảng, cột snake_case, `@Column(nullable/unique/length/columnDefinition)`, `@ManyToOne/@JoinColumn` → FK, `@OnDelete`, `@UniqueConstraint`, `@Index`, `@JdbcTypeCode(JSON)` → jsonb, enum → varchar). **Đã viết, CHƯA chạy thử.**
- `extract-schema.mjs` — chạy Postgres thật bằng PGlite (không cần Docker), áp migration, đọc `information_schema` rồi sinh `migrations/0001_schema.sql` (SQLite) + `0002_seed.sql` + `tools/schema.json`. **Hiện dừng ở V1.2** vì chưa có bảng gốc.

Việc cần làm (bước 1 của checklist):
1. Trong `extract-schema.mjs`, trước khi áp migration: `import { entitiesToPg } from './entities-to-pg.mjs'`, chạy DDL entity vào PGlite (tạo bảng trước, FK sau).
2. Áp từng migration **theo từng câu lệnh** trong `SAVEPOINT`, bỏ qua lỗi "đã tồn tại" (`42701` cột trùng, `42P07` bảng/index trùng, `42710` object trùng) — vì entity đã phản ánh trạng thái cuối, nhiều `ADD COLUMN` sẽ trùng. Ghi log các lỗi khác và xem tay. Cẩn thận khối `DO $$ … $$` khi tách câu lệnh.
3. So khớp: mỗi field của entity phải có cột tương ứng (Hibernate `validate` đảm bảo điều này ở prod). In ra cột chỉ có ở migration mà không có ở entity để kiểm tra.
4. Sinh lại `0001_schema.sql`, chạy `wrangler d1 migrations apply --local` phải sạch lỗi.

Quy ước chuyển kiểu (script đã làm): `uuid`/`varchar`/`text`/`timestamp`/`date`/`json(b)` → `TEXT`; `boolean` → `INTEGER` 0/1; số thực → `REAL`; `bytea` → `BLOB`. Thời gian lưu **ISO 8601 UTC** (`2026-10-29T08:15:00.000Z`). Java dùng `LocalDateTime` theo giờ `Asia/Ho_Chi_Minh` và Jackson trả chuỗi không múi giờ (`2026-10-29T15:15:00`) — **giữ đúng định dạng trả về đó** cho frontend (frontend tự parse như giờ địa phương). ID: `crypto.randomUUID()` sinh ở ứng dụng.

Bảng mới cần thêm (migration `0003_new_features.sql`):
```sql
ALTER TABLE users ADD COLUMN username TEXT;                 -- đăng nhập bằng tên
CREATE UNIQUE INDEX ux_users_username ON users (lower(username)) WHERE username IS NOT NULL;
ALTER TABLE exams ADD COLUMN assessment_type TEXT CHECK (assessment_type IN ('TX','GK','CK'));  -- NULL = luyện tập
CREATE TABLE user_ai_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'GEMINI' CHECK (provider IN ('GEMINI','OPENAI')),
  model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  api_key_enc TEXT,            -- AES-GCM(base64 iv||ciphertext) bằng AI_KEY_ENCRYPTION_KEY, KHÔNG trả về client
  key_last4 TEXT,
  strictness TEXT NOT NULL DEFAULT 'STANDARD' CHECK (strictness IN ('LENIENT','STANDARD','STRICT')),
  auto_grade_on_submit INTEGER NOT NULL DEFAULT 1,
  require_teacher_review INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE classroom_grade_weights (            -- hệ số điểm học kì theo lớp (frontend đang lưu localStorage)
  classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id) ON DELETE CASCADE,
  w_tx REAL NOT NULL DEFAULT 1, w_gk REAL NOT NULL DEFAULT 2, w_ck REAL NOT NULL DEFAULT 3
);
```
Không port `config/DatabaseSeeder.java` / `DevTestUserSeeder.java` (tạo tài khoản mẫu `admin@uranus.com`, `teacher1@uranus.com`… mật khẩu mặc định) — chỉ seed admin dưới đây.
Seed (`0004_seed_admin.sql`, mật khẩu băm sẵn bằng script, **không** để plain text): tài khoản `username='Admin'`, mật khẩu ban đầu `admin123@` do khách chỉ định, role `ADMIN`, thêm cột/đánh dấu `must_change_password=1` để buộc đổi lần đầu (gợi ý).

## 4. Hợp đồng API

### 4.1 Giữ nguyên từ Java — `docs/ENDPOINTS.md`
256 endpoint, cột "Handler Java" trỏ đúng method cần port. Quy tắc chung:
- Tiền tố `/api`. Body/response JSON camelCase như DTO Java (Jackson). Đọc DTO trong `modules/<x>/dto/` để lấy đúng tên field.
- Bọc kết quả như Java: phần lớn controller trả `ApiResponse { status, message, errorCode?, data, timestamp }`; một số trả thẳng DTO (vd. `GamificationController`). **Làm đúng từng endpoint như Java**. Frontend (`src/services/api.ts`) tự bỏ lớp `{status:200, data}` nên cả hai cách đều chạy, nhưng lỗi **phải** có dạng `{ status, errorCode, message }` vì frontend đọc `errorCode` (vd. `ACCESS_CODE_REQUIRED`, `INVALID_ACCESS_CODE`, `BAD_CREDENTIALS`).
- Phân trang kiểu Spring: query `page` (từ 0), `size`, `sort=field,asc|desc`; trả `{ content, totalElements, totalPages, number, size, last, pageable:{pageNumber,pageSize} }`.
- 401 khi thiếu/sai token (frontend tự chuyển `/login?expired=true`), 403 khi sai quyền, 404 không thấy, 400 validate (thông báo tiếng Việt).
- **Hợp đồng tham khảo dạng response:** `../URANUS-FrontEnd-main/URANUS-FrontEnd-main/src/demo/mockServer.ts` — bản giả lập t viết khớp đúng những gì frontend đọc (khoảng 120 route). Khi Java và mock khác nhau, **theo Java** và báo lại.

### 4.2 Endpoint mới (Java chưa có, frontend đã gọi)
```
POST /api/auth/login
  Body: { email?: string, studentCode?: string, username?: string, password: string }
  Tìm user theo email HOẶC username HOẶC studentCode (không phân biệt hoa thường). Frontend gửi email nếu có "@", ngược lại gửi cả studentCode và username.
  200: { accessToken, refreshToken?, user: UserDto (có username) }   400 BAD_CREDENTIALS "Sai tên đăng nhập hoặc mật khẩu."   403 ACCOUNT_LOCKED

POST /api/auth/register            -> 403 REGISTRATION_DISABLED "Chỉ quản trị viên được tạo tài khoản." (khách yêu cầu tắt tự đăng ký)
POST /api/v1/students/register     -> cũng tắt tương tự (đang permitAll trong SecurityConfig Java)

PUT  /api/users/me/username        Auth: ADMIN (giao diện chỉ hiện cho admin; backend chặn role khác)
  Body: { username: /^[A-Za-z0-9._-]{3,32}$/, currentPassword }
  200: { username }  400 WRONG_PASSWORD | VALIDATION  409 USERNAME_EXISTS

PUT  /api/users/me/password        (đã có ở Java) Body { currentPassword, newPassword>=6 } 400 WRONG_PASSWORD

POST /api/admin/users, PUT /api/admin/users/{id}   (đã có) thêm field "username" (tùy chọn, unique, cùng regex); PUT nhận "password" để đặt lại mật khẩu.
  Chặn: email trùng 409 EMAIL_EXISTS; admin tự hạ quyền / tự khóa / tự xóa 400 SELF_LOCK|SELF_DELETE.
PUT  /api/admin/users/bulk-status  (đã có) bỏ qua chính admin đang thao tác.

GET  /api/users/me/ai-settings     Auth: TEACHER|TEACHING_ASSISTANT|ADMIN
  200: { provider:'GEMINI'|'OPENAI', model, hasKey:boolean, keyLast4:string|null, strictness, autoGradeOnSubmit, requireTeacherReview }
PUT  /api/users/me/ai-settings     Body: như trên + apiKey?: string (chỉ khi đổi khóa). Không bao giờ trả apiKey.
POST /api/users/me/ai-settings/test  Body { provider, model, apiKey? } -> gọi thật 1 request nhỏ tới nhà cung cấp; 200 { ok:true, message } | 400 INVALID_KEY
POST /api/ai/grade-preview         Body { question, expected, answer, points } -> 200 { score, feedback } (chấm thử, không lưu)

Exams (tạo/sửa/đọc): thêm field "assessmentType": 'TX'|'GK'|'CK'|null.
GET /api/v1/classrooms/{id}/gradebook: mỗi classwork thêm "assessmentType" (lấy từ exam; assignment mặc định 'TX'). Giữ nguyên phần còn lại.
GET|PUT /api/classes/{id}/settings/grade-weights   { tx, gk, ck } (gợi ý; frontend hiện lưu localStorage key "ds-term-weights")
```

## 5. Xác thực & phân quyền
- Vai trò (`modules/user/Role.java`): `UNASSIGNED, ADMIN, TEACHER, STUDENT, OFFICE, TEACHING_ASSISTANT`. Spring dùng `ROLE_` + tên.
- JWT HS256, claim `sub` = `userDetails.getUsername()` của Spring (kiểm tra trong `security/` xem là email hay id), hết hạn 24h (`JWT_EXPIRATION_MS`), refresh 7 ngày; xem `security/JwtUtils.java`, `JwtAuthFilter.java`. Logout: đưa token vào blacklist (Java dùng Redis TTL) → KV.
- Mật khẩu Java băm **BCrypt**. Workers không có bcrypt native: dùng PBKDF2-SHA256 (≥100k vòng) cho mật khẩu mới, và **kiểm tra BCrypt** cho hash cũ khi import dữ liệu (thư viện `bcryptjs` chạy được trên Workers) rồi băm lại khi đăng nhập thành công.
- Quy tắc truy cập công khai/role theo `config/SecurityConfig.java` dòng 50–110 (vd. `GET /api/exams/public/**`, `GET /api/resources` công khai; `/api/admin/**` chỉ ADMIN; tạo/sửa đề chỉ TEACHER/TA/ADMIN; support cho khách vãng lai qua `X-Guest-Token`) **cộng** `@PreAuthorize` từng method (cột "Quyền" trong ENDPOINTS.md). Viết một middleware `requireRole(...roles)`.
- Kiểm tra quyền sở hữu trong service Java (giáo viên chỉ sửa lớp/đề của mình…) — port nguyên, không chỉ dựa vào role.
- Rate limit: `security/RateLimitFilter.java` (Redis) → KV đếm theo IP/phút. Support: tối đa `SUPPORT_MAX_NEW_CONVERSATIONS_PER_HOUR=10`.
- Google login (`POST /api/auth/google`): verify ID token bằng JWKS Google. Khách hiện chỉ muốn admin cấp tài khoản → hỏi lại có giữ Google login không (mục 14).
- `TEACHER_SECRET_CODE` (chọn vai trò giáo viên khi đăng ký) — vô nghĩa khi tắt đăng ký; giữ endpoint `PUT /api/users/me/role` nhưng chỉ cho UNASSIGNED.

## 6. Quy tắc nghiệp vụ (port nguyên logic Java, mỗi luật có test)
| Luật | Nguồn Java | Ví dụ vào → ra |
|---|---|---|
| Chấm trắc nghiệm 1 đáp án | `ExamService.submitExam` (~dòng 792) | đúng → đủ điểm câu, sai → 0 |
| Đúng/Sai nhiều ý | `ExamService.computeTrueFalseRatio` (dòng 1172), cấu hình `scoringConfig` | 4 ý: đúng 1/2/3/4 → 10%/25%/50%/100% điểm câu (mặc định đề thi THPT) |
| Trả lời ngắn | `regradeShortAnswers` (1727) | so khớp chuẩn hóa (bỏ dấu cách thừa, không phân biệt hoa thường) — đọc code để lấy đúng luật |
| Tự luận | `getPendingEssayReviews`, `reviewEssayAnswer`, `regradeEssayWithAI` (1846–2046), `approveAndPublishResult` (2091) | AI chấm nháp → `essayStatus` chờ duyệt → giáo viên duyệt → công bố. Kết quả có tự luận chưa duyệt: `pendingTeacherReview=true` |
| Số lần làm bài, mã truy cập, thời gian mở/đóng | `startExam` (646–738) | lỗi `ACCESS_CODE_REQUIRED` / `INVALID_ACCESS_CODE` / 403 |
| Lưu nháp & tiếp tục | `saveDraft` (738), bảng `draft_answers` | bắt đầu lại trả `answers` đã lưu + thời gian còn lại |
| Giám sát thi | `cheatWarningCount`, `cheatDetails` (JSON) khi nộp | lưu nguyên |
| Tự chấm lại khi sửa đề | `autoRegradeExamResults` (501) | |
| Thống kê đề | `getExamAnalytics` (1482) | phổ điểm, tỉ lệ đúng từng câu/kĩ năng |
| Xuất Excel kết quả | `GET /api/exams/{id}/export-excel` | trả file `.xlsx` (dùng thư viện `xlsx`/SheetJS chạy được trên Workers), `Content-Disposition: attachment` |
| Sổ lỗi sai (lặp lại ngắt quãng) | `MistakeVaultService.syncFromExamResult` (36), `review` | câu sai sau khi nộp tự vào sổ; đúng → tăng `repetitions`, giãn `intervalDays` |
| Thẻ ghi nhớ (SRS) | `FlashcardService` (609 dòng) | `PUT /flashcards/progress/{cardId}` |
| Gamification | `GamificationService.recordActivity/updateStreak/updateBadges/computeMood/computeTitle` | chuỗi ngày, XP, huy hiệu, cấp |
| Nhắc hạn nộp | `ClassDeadlineReminderScheduler` | cron 30 phút |
| Nhập học sinh Excel | `StudentProfileService` (867 dòng), `ExamImportService` (PDF/Word → câu hỏi qua Gemini) | |
| **Điểm học kì (mới)** | frontend `src/utils/termGrade.ts` | `TB = (ΣTX·k_tx + GK·k_gk + CK·k_ck) / (n_tx·k_tx + k_gk + k_ck)`, mặc định k = 1/2/3, làm tròn 1 chữ số. `[8,9,7], GK 7.5, CK 8 → 7.9`. Thiếu GK/CK → "tạm tính" trên cột đã có. Điểm mỗi bài quy về thang 10: `score/maxScore*10`. |
| **Ghi điểm tự động (mới)** | — | Khi học sinh nộp đề có `assessment_type`, điểm hệ 10 hiện ngay trong sổ điểm mọi lớp được giao đề đó (gradebook đọc từ `student_exam_results` + `class_exams`). |
Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh` (hạn nộp, "hôm nay", chuỗi ngày học).

## 7. Tích hợp bên thứ ba
### 7.1 AI chấm bài (Gemini hoặc ChatGPT)
- Prompt + schema JSON đầu ra: **lấy nguyên** từ `AiWritingGradingService.java` (806 dòng, chấm bài viết theo tiêu chí, trả `WritingGradingResult`: overall, criteria, errors, strengths, improvements, teacherSummary, studentFeedback) và `ExamAIService.java` (chấm câu tự luận theo đáp án mẫu giáo viên soạn).
- Chọn khóa theo thứ tự: khóa của giáo viên tạo đề/bài (`user_ai_settings`) → `GEMINI_API_KEY` của trường → không có thì trả 400 `AI_NOT_CONFIGURED` (không chấm bừa).
- Gemini: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` với `responseMimeType: application/json`. OpenAI: `POST https://api.openai.com/v1/chat/completions` với `response_format: {type:'json_object'}`. Viết một hàm `gradeWithAI(settings, prompt, schema)` dùng chung.
- `strictness` thêm một câu hướng dẫn vào prompt. Điểm AI luôn là **gợi ý**: lưu `ai_suggested_score`, `points_earned` chỉ chốt khi giáo viên duyệt nếu `require_teacher_review=1`.
- Chấm hàng loạt (`/ai-grading/batch`): chạy nền bằng Queue/`waitUntil`, trạng thái lưu D1, frontend poll `batch-status`.
- Timeout 30 s, thử lại 1 lần, lỗi → status `FAILED` + `errorMessage` tiếng Việt.
- Khóa AI chỉ giải mã trong Worker; không log, không trả về client.
### 7.2 Email (xác minh, quên mật khẩu, nhắc hạn)
Java gửi SMTP qua RabbitMQ (`EmailService`, `EmailRabbitListener`). Dùng Cloudflare Email Sending hoặc Resend/Mailchannels qua Queue. Mẫu email lấy từ Java.
### 7.3 Từ điển
Frontend gọi thẳng `dictionaryapi.dev` — không cần backend.
### 7.4 Realtime (WebSocket)
Java STOMP tại `/ws`, topic: `/topic/notifications/{userId}`, `/topic/support.agents`, `.messages`, `.read`, `.typing`, và `convertAndSendToUser` cho tin hỗ trợ. Frontend dùng `@stomp/stompjs` (`src/services/socket.ts`, URL `VITE_WS_URL`). Làm Durable Object nói **giao thức STOMP tối thiểu** (CONNECT/SUBSCRIBE/SEND/MESSAGE/DISCONNECT, auth bằng header `Authorization` hoặc `X-Guest-Token` lúc CONNECT) — hoặc đổi frontend sang WebSocket thuần (phải báo trước). Không có realtime thì frontend vẫn chạy nhờ tải lại khi đổi trang.

## 8. Tệp & ảnh
- `POST /api/v1/files/upload`, `POST /api/media/...`, đính kèm hỗ trợ, ảnh đại diện, PDF/audio đề thi → **R2** bucket `FILES`, key `yyyy/mm/<uuid>-<tên>`; trả URL dạng `/api/files/<key>` (Worker stream từ R2, kiểm tra quyền nếu riêng tư) hoặc custom domain công khai cho R2.
- Giới hạn: Java cho 1 GB — Workers nhận body tối đa 100 MB (gói Free/Pro). Đặt 50 MB/tệp, file lớn hơn dùng presigned URL R2. Chỉ nhận đuôi/MIME: pdf, docx, xlsx, pptx, png, jpg, webp, mp3, m4a, mp4.
- Dữ liệu cũ trên Cloudinary/`uploads/`: script di chuyển sang R2 (nếu khách cần dữ liệu cũ — mục 14).

## 9. Bảo mật & riêng tư
Validate mọi input (gợi ý `zod`); câu SQL luôn dùng tham số `?`; HTML do giáo viên nhập (đề, bài đăng) frontend đã DOMPurify, backend vẫn giới hạn độ dài; CORS chỉ `CORS_ALLOWED_ORIGINS`; không trả `password`/`api_key_enc`; ghi `audit_logs` cho thao tác admin (tạo/sửa/xóa/khóa tài khoản, nhập Excel) như `modules/audit`. Dữ liệu học sinh là **trẻ vị thành niên**: không đưa dữ liệu thật vào log, không gửi tên/email học sinh cho AI (chỉ gửi bài làm + đáp án).

## 10. Hiệu năng & vận hành
Index theo `0001_schema.sql` (41 index từ migration + index entity). Truy vấn danh sách luôn phân trang. D1: tránh N+1 — gom bằng `JOIN`/`IN (...)`, dùng `env.DB.batch()` cho nhiều câu ghi. Sao lưu: D1 Time Travel (7 ngày gói Free, 30 ngày gói trả phí) + `wrangler d1 export` định kỳ. Log: `wrangler tail`, Workers Logs.

## 11. Kiểm thử chấp nhận (`npm test`, file `tests/contract.test.ts` — đã có khung, đang FAIL)
1. Đăng nhập `Admin/admin123@` đúng → 200; sai mật khẩu → 400 `BAD_CREDENTIALS`; tự đăng ký → 403.
2. Admin tạo giáo viên có username → đăng nhập bằng username được; giáo viên gọi `POST /api/admin/users` → 403.
3. Admin đổi username/mật khẩu của mình (sai mật khẩu hiện tại → 400); admin tự khóa mình → 400.
4. Giáo viên tạo đề 15 phút (`assessmentType:'TX'`) 2 câu trắc nghiệm + 1 câu Đ/S 4 ý, giao cho lớp; học sinh bắt đầu → nộp → điểm đúng theo luật mục 6; sổ điểm lớp có điểm hệ 10 của học sinh ở cột TX.
5. Đề có tự luận: nộp → `pendingTeacherReview=true`; `GET /exams/{id}/pending-essay-reviews` có bài; giáo viên duyệt → điểm cập nhật.
6. `GET /exams/{id}/export-excel` trả `.xlsx` mở được, đủ dòng học sinh.
7. CRUD lớp, bài đăng, bình luận, điểm danh, thư mục, thẻ ghi nhớ, học liệu: tạo → đọc → sửa → xóa.
8. Phân trang đúng `totalElements`; không token → 401; sai role → 403.
9. Cài đặt AI: lưu khóa → GET chỉ trả `hasKey`/`keyLast4`, không trả khóa.

## 12. Checklist theo bước (mỗi bước có kết quả kiểm tra được)
1. Hoàn thiện `tools/extract-schema.mjs` + `entities-to-pg.mjs` (mục 3) → `0001_schema.sql` áp vào D1 local không lỗi; số bảng = 58 (+ bảng chỉ có ở migration).
2. Thêm `0003_new_features.sql`, `0004_seed_admin.sql` → `SELECT username FROM users` có `Admin`.
3. `wrangler.jsonc` (D1, R2, KV, Queue, DO, cron) + `src/index.ts` Hono, CORS, error handler, `ApiResponse` → `GET /api/health` 200.
4. Auth (login/logout/refresh/verify/forgot/reset), JWT, PBKDF2 + đọc BCrypt, middleware role → test 1–3 xanh.
5. Users/profile/admin users/audit log.
6. Classrooms (38 endpoint) + attendance + class posts/comments/likes + folders/resources + gradebook.
7. Exams (34 + 4 import) + class-exams + results + drafts + analytics + export Excel + mistake vault → test 4–6.
8. Assignments + AI writing grading + cài đặt AI + grade-preview → test 5, 9.
9. Flashcards, vocabulary AI, resources (thư viện), folders, share.
10. Courses/sections/lessons/enrollments/certificates/discussions/lesson comments/learning path.
11. Notifications, calendar, gamification, analytics, search, activities (tin tức), support.
12. R2 upload/download; Durable Object realtime; cron nhắc hạn; email.
13. Chạy frontend live (mục 13) qua toàn bộ kịch bản mục 11 trên `wrangler dev`.
14. Tạo D1/R2/KV thật (`wrangler d1 create school-edu-db`…), `db:migrate:remote`, secrets, `deploy`; chạy lại kịch bản trên link thật.

## 13. Chuyển frontend sang dùng backend thật
Thư mục `../URANUS-FrontEnd-main/URANUS-FrontEnd-main`:
- Build **không** có `--mode demo` (để `VITE_DEMO` rỗng → không cài `src/demo/mockServer.ts`). Thêm script `build:live`: `vite build`.
- Nếu backend là Worker riêng: đặt `VITE_API_URL=https://school-edu-api.edu-manage-ai.workers.dev/api`, `VITE_WS_URL=wss://.../ws`. Nếu gộp chung Worker (khuyên dùng): để mặc định `/api`.
- `src/context/AuthContext.tsx` và vài màn (`StudentImport.tsx`) gọi `fetch('/api/...')` trực tiếp — chạy được khi cùng origin; nếu khác origin phải đổi sang `api`.
- Frontend lưu hệ số điểm học kì ở localStorage (`TermGradePanel.tsx`) — chuyển sang endpoint grade-weights nếu làm.
- Giữ `npm run deploy:demo` cho bản demo; bản thật deploy riêng.

## 14. Còn mở / cần khách xác nhận
- Có cần **chuyển dữ liệu cũ** từ Postgres Uranus đang chạy (người dùng, đề, điểm) sang D1 không? Nếu có: cần `pg_dump --data-only` và script import (đổi bool, thời gian, BCrypt giữ nguyên).
- Giữ **đăng nhập Google** không (khách muốn chỉ admin cấp tài khoản)?
- Nhà cung cấp email; tên miền thật (thay `*.workers.dev`).
- Tên thương hiệu chính thức ("Điểm Sáng" đang là tên tạm), email/hotline/địa chỉ ở chân trang.
- Khóa AI: mỗi giáo viên tự gắn, hay trường dùng một khóa chung (chi phí)?
