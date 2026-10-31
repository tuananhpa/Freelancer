# Test phân quyền & truy cập tài nguyên (FULL / PREVIEW)

Tài liệu QA thực tế cho team Uranus LMS. Bám đúng hành vi hiện tại của `StudentResourceAccessService` (BE) và UI `ContentCard` / danh sách Exam · Flashcard · Vocab · Profile (FE).

---

## 1. Mục tiêu & phạm vi

**Mục tiêu:** Xác nhận học viên chỉ FULL tài nguyên công khai của giáo viên + môn đã đăng ký; ngoài phạm vi đó là PREVIEW (mở tối đa 2 tài nguyên mới nhất / khóa còn lại); giáo viên quản lý được lớp & nội dung của mình; học viên không gọi được API chỉ dành cho teacher.

**Phạm vi trong:**

| Khu vực | FE | BE / API |
|---|---|---|
| Auth / role | Login, menu theo role | JWT + `@PreAuthorize` |
| Lớp học | `/classes`, Join modal, tạo lớp | `POST/GET /api/classes`, `POST /api/classes/join` |
| Hồ sơ | `/profile` — khối **Lớp đã đăng ký** | `GET /api/classes` (student) |
| Đề thi | `/exams` tab Tất cả | `GET /api/exams…`, `POST /api/exams/{id}/start` |
| Flashcard | `/flashcards` tab Tất cả | `GET /api/flashcards/decks…`, `GET /api/flashcards/decks/{id}` |
| Từ vựng | `/vocabulary` tab Tất cả | Cùng deck API (`deckType` vocab) |

**Ngoài phạm vi (trừ khi smoke):** thanh toán, AI import, assignment chấm điểm sâu, multi-tenant admin panel.

**Mô hình FULL / PREVIEW (code):**

- `PREVIEW_LIMIT = 2` — mỗi cặp `(teacherId, subject)` mở **2** tài nguyên public mới nhất (`createdAt DESC`); exam phải `isPublished=true` + `isPublic=true`; deck phải `isPublic=true`.
- Entitlement FULL khi có `ClassMember` **hoặc** `StudentClassEnrollment` khớp teacher + subject (normalize: trim + lowercase).
- TEACHER / ADMIN: bypass → luôn FULL trên list/detail.
- Locked: overlay khóa trên `ContentCard`; start/study trả **403** (`ForbiddenException`) kèm `unlockHint`.

| Trạng thái | `accessLevel` | `locked` | Badge FE | Gợi ý unlock (`unlockHint`) |
|---|---|---|---|---|
| FULL | `FULL` | `false` | (không badge xem thử) | — |
| PREVIEW mở | `PREVIEW` | `false` | **Xem thử** | `Xem thử — đăng ký lớp của giáo viên để mở toàn bộ tài nguyên.` |
| PREVIEW khóa | `PREVIEW` | `true` | Overlay khóa | `Đăng ký học với giáo viên này để mở toàn bộ đề / từ vựng / flashcard.` |

UI khóa: blur + icon Lock + nút **Xem lớp / Đăng ký** / **Đăng ký để mở** → `/classes`.

---

## 2. Tài khoản test

Password chung: **`123456`**  
(Seeder non-prod: `DevTestUserSeeder` — tạo user nếu chưa có.)

| Email | Role | Họ tên | Ghi chú |
|---|---|---|---|
| `teacher1@uranus.com` | TEACHER | Bùi Đức Hoàng | Môn: Tiếng Anh + Toán |
| `teacher2@uranus.com` | TEACHER | Nguyễn Bi Anh | Môn: Vật Lý |
| `student1@uranus.com` | STUDENT | Học sinh 1 | All classes |
| `student2@uranus.com` | STUDENT | Học sinh 2 | Tiếng Anh + Toán (teacher1) |
| `student3@uranus.com` | STUDENT | Học sinh 3 | Chỉ Vật Lý (teacher2) |
| `admin@uranus.com` | ADMIN | Admin System | Có trên local/dev; production kiểm tra trước khi chạy |

---

## 3. Dữ liệu lớp / môn cần chuẩn bị (preconditions)

Trước khi chạy suite, đảm bảo:

### 3.1 Lớp học (đúng tên hiển thị profile)

Tạo lớp (teacher) với **subject** khớp môn; tên lớp có thể tự do — trên `/profile` FE format:

`{subject} thầy {teacherName}`  
VD: **Tiếng Anh thầy Bùi Đức Hoàng**, **Toán thầy Bùi Đức Hoàng**, **Vật Lý thầy Nguyễn Bi Anh**.

| Lớp (label mong đợi trên profile) | Teacher | Subject (field) | Thành viên |
|---|---|---|---|
| Tiếng Anh thầy Bùi Đức Hoàng | teacher1 | Tiếng Anh | student1, student2 |
| Toán thầy Bùi Đức Hoàng | teacher1 | Toán | student1, student2 |
| Vật Lý thầy Nguyễn Bi Anh | teacher2 | Vật Lý | student1, student3 |

**Không** tạo / không dùng lớp môn **Lập trình** cho suite này.

Ghi lại **invite code** (6 ký tự, uppercase) của mỗi lớp từ trang lớp (teacher xem mã mời).

### 3.2 Tài nguyên public (để đo PREVIEW)

Với **mỗi** cặp teacher + subject cần test PREVIEW, chuẩn bị **≥ 3** tài nguyên **công khai**:

| Loại | Điều kiện | Số lượng tối thiểu / (teacher, subject) |
|---|---|---|
| Exam | Published + Public + đúng `subject` | ≥ 3 |
| Flashcard deck | Public + đúng subject | ≥ 3 |
| Vocab deck | Public + đúng subject | ≥ 3 |

Ghi nhận thứ tự mới nhất (2 ID mới nhất = preview mở; còn lại = locked).

### 3.3 Ma trận entitlement mong đợi

| Student | Tiếng Anh (t1) | Toán (t1) | Vật Lý (t2) |
|---|---|---|---|
| student1 | FULL | FULL | FULL |
| student2 | FULL | FULL | PREVIEW |
| student3 | PREVIEW | PREVIEW | FULL |

---

## 4. Checklist smoke (chạy trước khi test sâu)

- [ ] FE + BE lên được (local hoặc staging)
- [ ] Login từng role: teacher1, teacher2, student1–3 (admin nếu có)
- [ ] Password `123456` đúng; không 500
- [ ] 3 lớp đúng môn/thành viên như mục 3; **không** còn lớp Lập trình ảnh hưởng entitlement
- [ ] Mỗi (teacher, subject) có ≥ 3 exam + ≥ 3 flashcard + ≥ 3 vocab public
- [ ] Tab **Tất cả** của Exams / Flashcards / Vocabulary load được
- [ ] `/profile` mở được với STUDENT
- [ ] DevTools Network sẵn sàng (xem `accessLevel`, `locked`, status 403)

---

## 5. Test cases

**Priority:** P0 = blocker release · P1 = quan trọng · P2 = nên có

### 5.1 Auth / Role

| ID | Tiêu đề | Role | Bước | Kết quả mong đợi | Priority |
|---|---|---|---|---|---|
| AUTH-01 | Login student thành công | student1 | Mở app → đăng nhập `student1@uranus.com` / `123456` | Vào dashboard; role STUDENT; không thấy CTA **Tạo lớp học** / tạo đề (teacher-only) | P0 |
| AUTH-02 | Login teacher thành công | teacher1 | Login `teacher1@uranus.com` | Thấy **Tạo lớp học**, tạo/sửa đề & deck của mình | P0 |
| AUTH-03 | Login admin (nếu có) | admin | Login `admin@uranus.com` | Vào được hệ thống; list resource không bị PREVIEW lock | P1 |
| AUTH-04 | Sai mật khẩu | — | Login đúng email, sai password | Báo lỗi; không vào app | P0 |
| AUTH-05 | Session sau logout | student1 | Login → logout → mở `/exams` hoặc API có auth | Redirect login / 401; không giữ quyền cũ | P1 |

### 5.2 Lớp học & hồ sơ

| ID | Tiêu đề | Role | Bước | Kết quả mong đợi | Priority |
|---|---|---|---|---|---|
| CLS-01 | Profile hiện Lớp đã đăng ký (student) | student1 | Vào `/profile` | Có section **Lớp đã đăng ký**; 3 dòng kiểu `Tiếng Anh thầy Bùi Đức Hoàng`, `Toán thầy…`, `Vật Lý thầy…` | P0 |
| CLS-02 | Profile student2 đúng 2 lớp | student2 | `/profile` | Chỉ Tiếng Anh + Toán (teacher1); **không** Vật Lý | P0 |
| CLS-03 | Profile student3 chỉ Vật Lý | student3 | `/profile` | Chỉ `Vật Lý thầy Nguyễn Bi Anh` | P0 |
| CLS-04 | Teacher không thấy block Lớp đã đăng ký | teacher1 | `/profile` | Không render section **Lớp đã đăng ký** (chỉ STUDENT) | P1 |
| CLS-05 | Teacher tạo lớp | teacher1 | `/classes` → **Tạo lớp học** → subject Toán/Tiếng Anh → lưu | `POST /api/classes` **201**; lớp hiện trong danh sách; có `inviteCode` 6 ký tự | P0 |
| CLS-06 | Student không tạo lớp | student1 | Thử UI tạo lớp (nếu ẩn: gọi `POST /api/classes` bằng token student) | UI không có nút **hoặc** API **403** (`Bạn không có quyền…`) | P0 |
| CLS-07 | Join bằng invite code | student2 (hoặc user chưa enroll Vật Lý) | `/classes` → **Tham gia lớp học** → nhập mã lớp Vật Lý (uppercase) | `POST /api/classes/join` `{ "inviteCode": "XXXXXX" }` **200**; lớp xuất hiện; entitlement Vật Lý → FULL sau khi refresh list resource | P0 |
| CLS-08 | Invite code sai | student1 | Join mã không tồn tại | Lỗi rõ; không thêm lớp | P1 |
| CLS-09 | Teacher xem mã mời | teacher1 | Mở chi tiết lớp mình | Thấy invite code; copy được | P2 |
| CLS-10 | Student không vào lớp chưa join | student3 | Mở URL `/classes/{id}` lớp Tiếng Anh của teacher1 | Không xem được nội dung lớp (lỗi quyền / message không có quyền) | P1 |

### 5.3 FULL access

| ID | Tiêu đề | Role | Bước | Kết quả mong đợi | Priority |
|---|---|---|---|---|---|
| FULL-01 | student1 FULL mọi môn | student1 | Tab Tất cả: Exams / Flashcards / Vocabulary của t1 (Anh, Toán) và t2 (Vật Lý) | Mọi card public của 3 môn: `accessLevel=FULL`, `locked=false`; nút **Bắt đầu làm bài** / **Xem chi tiết** / **Bắt đầu học**; không overlay khóa | P0 |
| FULL-02 | student2 FULL teacher1 | student2 | Resource public Tiếng Anh + Toán của teacher1 | FULL, làm bài / học được | P0 |
| FULL-03 | student3 FULL Vật Lý | student3 | Resource public Vật Lý teacher2 | FULL | P0 |
| FULL-04 | Start exam FULL | student1 | Chọn đề FULL → Bắt đầu; hoặc `POST /api/exams/{id}/start` | **200**; vào làm bài; có câu hỏi | P0 |
| FULL-05 | Mở deck FULL | student1 | Flashcard/Vocab FULL → chi tiết / study | **200**; có cards; học được | P0 |
| FULL-06 | Teacher FULL resource mình | teacher1 | Tab của tôi / Tất cả resource mình publish | FULL; sửa/xóa/publish được trên resource mình | P1 |
| FULL-07 | Join xong upgrade PREVIEW → FULL | student2 | Trước: Vật Lý PREVIEW; join lớp Vật Lý; reload `/exams` | Resource Vật Lý teacher2 chuyển FULL; hết overlay khóa (kể cả resource cũ hơn top-2) | P0 |

### 5.4 PREVIEW / locked

| ID | Tiêu đề | Role | Bước | Kết quả mong đợi | Priority |
|---|---|---|---|---|---|
| PREV-01 | student2 PREVIEW Vật Lý — đúng 2 mở | student2 | Exams tab Tất cả, filter/subject Vật Lý teacher2 (≥3 đề public) | Đúng **2** đề mới nhất: badge **Xem thử**, `locked=false`; các đề cũ hơn: overlay khóa + hint `Đăng ký học với giáo viên này…` | P0 |
| PREV-02 | student3 PREVIEW Tiếng Anh/Toán | student3 | List exam/deck của teacher1 | Top 2/subject mở (**Xem thử**); còn lại locked | P0 |
| PREV-03 | Start exam locked → 403 | student2 | Click đề locked **hoặc** `POST /api/exams/{id}/start` với id locked | **403**; message ≈ unlockHint locked; không tạo session làm bài | P0 |
| PREV-04 | Mở deck locked → 403 | student3 | Mở URL `/flashcards/{id}` hoặc `/vocabulary/{id}/study` của deck locked; Network `GET …/decks/{id}` | **403**; cards rỗng / không vào study | P0 |
| PREV-05 | Preview unlocked vẫn làm được | student2 | Đề Vật Lý trong top-2 (Xem thử) → Bắt đầu | Start **200**; làm được (PREVIEW mở ≠ locked) | P0 |
| PREV-06 | Unlock hint trên card khóa | student2 | Hover/xem overlay card locked | Text: `Đăng ký học với giáo viên này để mở toàn bộ đề / từ vựng / flashcard.` (hoặc fallback FE); nút dẫn `/classes` | P1 |
| PREV-07 | Flashcard PREVIEW giống exam | student2 | `/flashcards` Tất cả — deck Vật Lý t2 | Top 2 mở (badge **Xem thử**); còn lại **Đăng ký để mở** | P0 |
| PREV-08 | Vocab PREVIEW giống exam | student2 | `/vocabulary` Tất cả — vocab Vật Lý t2 | Cùng quy tắc top-2 / locked | P0 |
| PREV-09 | Private resource không lộ PREVIEW | student3 | Teacher1 tạo deck/exam **riêng tư**; student3 list Tất cả | Không hiện trong list public; direct URL deck private → 403 | P1 |
| PREV-10 | Subject normalize | student2 | Đảm bảo subject lớp và resource cùng môn (khác hoa/thường) | Vẫn FULL nếu enroll đúng môn (BE `normalizeSubject`) | P2 |

### 5.5 Teacher vs Student boundaries

| ID | Tiêu đề | Role | Bước | Kết quả mong đợi | Priority |
|---|---|---|---|---|---|
| BND-01 | Teacher tạo & publish exam | teacher1 | Tạo đề môn Tiếng Anh → publish + public | Hiện trên list public; student enroll FULL thấy FULL | P0 |
| BND-02 | Teacher tạo flashcard/vocab | teacher1 | Tạo deck public đúng subject | Student enroll học được; unenrolled PREVIEW | P0 |
| BND-03 | Student không POST tạo exam | student1 | `POST /api/exams` (hoặc UI tạo đề nếu lộ) | **403** / không có UI tạo | P0 |
| BND-04 | Student không xóa member lớp | student1 | `DELETE /api/classes/{classId}/members/{studentId}` | **403** (`@PreAuthorize TEACHER`) | P1 |
| BND-05 | Teacher chỉ quản lý lớp mình | teacher2 | Thử sửa settings / remove member lớp của teacher1 | Bị từ chối (không có quyền) | P1 |
| BND-06 | Teacher không sửa đề người khác | teacher2 | `PUT` / edit exam của teacher1 | Lỗi quyền | P1 |
| BND-07 | Student không link course vào lớp | student1 | `POST /api/classes/{id}/courses/{courseId}` | **403** | P2 |
| BND-08 | Nút teacher-only trên ExamList | student1 vs teacher1 | So sánh tab **Của tôi** / actions Sửa·Xóa·Publish | Student chỉ **Bắt đầu** / **Đăng ký để mở**; teacher thấy Sửa/Xóa/Publish trên đề mình | P1 |

### 5.6 Negative / edge

| ID | Tiêu đề | Role | Bước | Kết quả mong đợi | Priority |
|---|---|---|---|---|---|
| NEG-01 | Không lớp Lập trình ảnh hưởng | student* | Tìm list/class Lập trình | Không dùng trong entitlement suite; nếu còn data cũ, không lấy làm baseline | P1 |
| NEG-02 | Unenroll / remove member | teacher1 + student2 | Teacher remove student2 khỏi lớp Toán; student2 reload exams Toán | Toán teacher1 chuyển PREVIEW (top-2 mở); start đề ngoài top-2 → 403 | P0 |
| NEG-03 | Guest / chưa login | — | Mở list public (nếu permit) hoặc deep-link start | Không start được; yêu cầu đăng nhập | P1 |
| NEG-04 | Exam chưa publish | student1 (FULL enroll) | Teacher để draft; student list Tất cả | Không thấy draft trên list public | P1 |
| NEG-05 | Đúng teacher, sai môn | student3 | Resource **Toán** của teacher2 (nếu có) vs enroll chỉ Vật Lý | PREVIEW theo (teacher, subject) — không FULL chéo môn | P1 |
| NEG-06 | Double join cùng mã | student1 | Join lại lớp đã thuộc | Không lỗi nghiêm trọng / không duplicate membership bất thường | P2 |
| NEG-07 | Dark mode smoke (optional) | student2 | Bật dark mode → xem card locked + badge Xem thử + overlay | Chữ/hint đọc được (`dark:` trên ContentCard); không mất contrast nghiêm trọng | P2 |

---

## 6. Gợi ý kiểm tra nhanh bằng Network

1. Login student2 → `GET` list exams (tab all) → response item Vật Lý:  
   - top mới: `"accessLevel":"PREVIEW","locked":false,"previewRank":1|2`  
   - cũ: `"locked":true` + `unlockHint`
2. `POST /api/exams/{lockedId}/start` → status **403**
3. Join lớp Vật Lý → `POST /api/classes/join` body `{"inviteCode":"ABC123"}` → reload list → cùng id: `"accessLevel":"FULL","locked":false`
4. `GET /api/flashcards/decks/{lockedId}` → **403**

---

## 7. Ghi chú môi trường

| | Local | Production |
|---|---|---|
| FE | `http://localhost:5173` (hoặc port Vite hiện tại) | `https://uranuscenter.xyz` (hoặc domain deploy) |
| BE API | `http://localhost:8080/api` (prefix theo `vite` proxy) | API production cùng origin / subdomain |
| User seed | `DevTestUserSeeder` (`!prod`) tạo teacher/student/admin + password `123456` | **Không** giả định seeder; xác nhận account với team trước khi test |
| Data lớp | Tự tạo theo mục 3 mỗi lần DB sạch | Dùng data staging đã chuẩn hóa; cẩn thận không enroll nhầm production thật |
| Lưu ý | DB seed demo cũ có thể còn lớp **Lập trình** — **không** dùng cho ma trận này | Chỉ test account được phép; tránh join/xóa lớp học viên thật |

**Khi fail:** ghi ID case, email role, subject/teacher, `examId`/`deckId`, status HTTP, `accessLevel`/`locked` từ response, screenshot overlay FE.

---

## 8. Tham chiếu code (cho dev khi triage)

| Thành phần | Path |
|---|---|
| FULL/PREVIEW logic | `URANUS-BackEnd/.../access/StudentResourceAccessService.java` (`PREVIEW_LIMIT=2`) |
| Unlock hint | `.../access/ResourceAccessDecision.java` |
| Preview query | `.../access/AccessPreviewRepositoryImpl.java` |
| Start exam 403 | `ExamService.startExam` → `ForbiddenException` |
| Deck detail 403 | `FlashcardService.getDeckByIdForUser` |
| Classes API | `ClassroomController` — `POST /`, `POST /join`, `GET /` |
| Overlay UI | `URANUS-FrontEnd/src/components/common/ContentCard.tsx` |
| Lists | `ExamList.tsx`, `FlashcardList.tsx`, `VocabList.tsx` |
| Profile classes | `ProfileEdit.tsx` — **Lớp đã đăng ký** + `formatEnrolledClassLabel` |

---

*Cập nhật khi đổi `PREVIEW_LIMIT`, copy unlockHint, hoặc rule entitlement.*
