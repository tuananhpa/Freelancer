# Kế hoạch backend — Vĩnh Thuận Phát

Ngày khảo sát mã: 15/10/2026. Thiết kế frontend B đã được người dùng chọn.

**Hiện trạng:** Frontend tại thư mục này đã dùng dữ liệu tĩnh. Chưa có API, database, xác thực hay dịch vụ gửi email. Tài liệu này là kế hoạch bàn giao, không phải backend đã triển khai.

Nhãn: **[FE]** xác định từ mã; **[YC]** yêu cầu đã chốt; **[ĐX]** đề xuất; **[?]** cần xác nhận.

## 1. Phạm vi và nghiệp vụ

- **[YC]** Giữ chức năng website nhang gốc và giao diện B: tra cứu sản phẩm, phân nhóm hương/dạng nhang, xem nhanh, xem ảnh, liên hệ sỉ/lẻ, giới thiệu, đại lý, tài khoản/quên mật khẩu.
- **[FE]** CTA mua sỉ gọi 0903 007 095, mua lẻ tới liên hệ đại lý. Chưa có giỏ hàng, đơn hàng hay thanh toán.
- **[FE]** 16 sản phẩm trong `src/data.js` là snapshot trang chủ gốc, KHÔNG phải toàn bộ tồn kho hoặc catalog. Danh mục chưa có fixtures vẫn hiển thị trạng thái đang cập nhật.
- **[FE]** Form liên hệ hiện soạn mailto do người dùng gửi trong ứng dụng thư. Form tài khoản chỉ thông báo chưa nối hệ thống; không lưu credentials hoặc tạo session giả.
- **[ĐX]** Vai trò: khách xem catalog; người tiếp nhận liên hệ; quản trị nội dung. Chỉ thêm tài khoản khách khi xác nhận mục đích đăng nhập.
- Ngoài phạm vi: thanh toán, quản lý kho, vận chuyển, tích điểm, nhiều tenant, chat realtime.

## 2. Căn cứ frontend và điểm nối

| Route / file có thật | Hành vi hiện tại | Backend cần có |
| --- | --- | --- |
| `/`, `src/main.js::home` | Nổi bật và sản phẩm mới, mỗi khối 4 hàng | Products với cờ featured/isNew, thứ tự hiển thị |
| `/san-pham/`, `src/main.js::catalog` | Tìm không dấu, lọc group/form, collection, sort, 12 hàng/trang | API tìm kiếm và phân trang |
| `/danh-muc-san-pham/:slug/`, `src/catalog.js::resolveRoute` | Danh mục nhóm và danh mục con | Danh mục giữ slug gốc, phân loại sản phẩm |
| `/san-pham/:slug/`, `src/main.js::productContent` | Ảnh, nhóm, liên hệ, ảnh lớn, chia sẻ | Chi tiết và media; related products |
| Xem nhanh, `src/main.js` | Native dialog dùng cùng dữ liệu sản phẩm | Dùng cache GET chi tiết, không endpoint riêng |
| `/nhang-thom-vinh-thuan-phat/`, `src/main.js::aboutPage` | Nội dung giới thiệu rút gọn | Site content đã duyệt |
| `/lam-dai-ly/`, `src/main.js::dealerPage` | Thông tin hợp tác và liên hệ | Nội dung/đầu mối liên hệ; không tự thêm chính sách đại lý |
| `/lien-he/`, `#contact-form` | Tên, điện thoại, email, topic, lời nhắn, prefill sản phẩm | POST inquiry + lưu DB, gửi mail nếu được cấu hình |
| `/my-account/`, `#account-form` | Giao diện login/hiện mật khẩu/ghi nhớ | Session thật nếu tính năng được xác nhận |
| `/my-account/lost-password/` | Giao diện yêu cầu khôi phục | Reset token một lần + email |
| `src/data.js::business` | Hotline, địa chỉ, email | Site settings, dữ liệu công khai được chủ web xác nhận |
| `src/main.js::footer` | Audio thủ công từ URL nguồn | Xác nhận quyền/nội dung audio; lưu media nếu cần |
| `scripts/serve.mjs` | Chỉ phục vụ dist; fallback route, chặn dotfile/traversal | Đây chỉ là server preview, không mở rộng thành backend production |

**[FE]** Không dùng localStorage, không có dữ liệu trình duyệt phải migrate. Chưa có trang quản trị, upload UI hoặc order domain.

## 3. Kiến trúc đề xuất

- **[?]** Trước tiên xác nhận có quyền và khả năng tái sử dụng WordPress/WooCommerce hiện tại không. Không dựng database sản phẩm thứ hai nếu nguồn gốc đã có API phù hợp.
- **[ĐX]** Nếu cần backend mới: Node.js 24 LTS, Fastify, PostgreSQL; mã tại `backend/`, migrations tại `backend/migrations/`, integration tests tại `backend/tests/`. Các dependency này CHƯA được cài.
- Frontend và `/api` cùng origin sau reverse proxy. Không đưa database URL, SMTP credentials, admin keys vào biến `VITE_*` hoặc bundle.
- Tạo `src/repository.js` để cung cấp async `listProducts(filters)`, `getProduct(slug)`, `getCategories()`, `getSiteContent()`; `src/main.js` chỉ gọi repository. Hôm nay `filterProducts`/`paginate` vẫn chạy local.
- Production cần SPA fallback cho route giao diện; API không fallback HTML. Trả 404 sản phẩm thật, không soft-success. Tunnel hiện tại là preview tạm.

## 4. Database [ĐX]

| Entity | Cột chính, ràng buộc |
| --- | --- |
| `categories` | id UUID PK, slug varchar(120) unique, name varchar(160), parent_id FK nullable, group_key varchar(32), sort_order int, status enum(active/hidden), timestamps |
| `products` | id UUID PK, slug varchar(220) unique, name varchar(300), category_id FK, group_key varchar(32), form_key varchar(24), description text nullable, featured bool, is_new bool, sort_order int, status enum(draft/published/archived), source_url text, timestamps |
| `media` | id UUID PK, storage_key unique, mime varchar(80), bytes bigint, width/height int nullable, alt varchar(300), source_url text nullable, timestamps |
| `product_media` | product_id FK, media_id FK, position int; unique(product_id,position) |
| `site_content` | key varchar(80) PK, value JSONB, updated_at, updated_by FK nullable; whitelist keys business/about/dealer/home/audio |
| `inquiries` | id UUID PK, name varchar(100), phone varchar(20), email varchar(254), topic enum(product/wholesale/retail), message varchar(2000), product_id FK nullable, status enum(new/in_progress/closed), email_status enum(pending/sent/failed), created_at/updated_at |
| `users` (nếu cần) | id UUID PK, normalized_email unique, username unique nullable, password_hash text, role enum(admin/customer), status enum(active/disabled), timestamps |
| `sessions` (nếu cần) | token_hash unique, user_id FK, expires_at, created_at; index expires_at |
| `password_resets` (nếu cần) | token_hash unique, user_id FK, expires_at, used_at nullable, created_at |

- Index product(status,sort_order), category_id, (group_key,form_key), inquiry(status,created_at), timestamps theo truy vấn.
- Tìm tiếng Việt: normalize NFD bỏ dấu và đ→d; PostgreSQL unaccent + trigram hoặc normalized search column, kiểm tra kết quả khớp tests `src/catalog.js`.
- Migration có rollback/recovery được kiểm trên staging. Import slugs, ảnh, descriptions từ export chủ web xác nhận. Seed test tách production; không import ảnh lifestyle AI làm ảnh hàng.
- Không tạo cột giá/stock từ giả định; website hiện liên hệ báo giá.

## 5. API / DTO [ĐX]

Prefix `/api/v1`. JSON lỗi thống nhất: `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "email": "..." } } }`.

| Method + path | Quyền | Request / response |
| --- | --- | --- |
| GET `/products` | public | `q` ≤150, group/form/category whitelist, collection=featured/new, sort=default/name, page≥1, pageSize 1–48; `{items,page,pageSize,total,totalPages}` |
| GET `/products/:slug` | public | Chỉ published; `{product,related}` hoặc 404 |
| GET `/categories` | public | `{items:[{slug,name,parentSlug,groupKey,sortOrder}]}` |
| GET `/site-content` | public | Chỉ public settings đã duyệt, không trả secrets |
| POST `/inquiries` | public + rate limit | `{name,phone,email,topic,message,productSlug?}`; 201 `{id,status:"received"}` chỉ sau DB commit |
| POST `/auth/login` | public + throttling | `{identifier,password,remember}`; Set-Cookie session; `{user:{id,name,role}}` |
| GET `/auth/me` | authenticated | `{user}` hoặc 401 |
| POST `/auth/logout` | authenticated + CSRF | Revoke session; 204 |
| POST `/auth/password-reset` | public + throttling | `{email}`; phản hồi chung không lộ tài khoản tồn tại |
| POST `/auth/password-reset/confirm` | public + token | `{token,password}`; revoke sessions cũ, đánh dấu used một transaction |
| POST `/admin/media` | admin + CSRF | multipart upload, trả metadata |
| DELETE `/admin/media/:id` | admin + CSRF | 409 nếu còn reference, 204 sau khi gỡ an toàn |

Ví dụ product giữ shape frontend hiện tại:

```json
{
  "slug": "nhang-cay-dan-huong-20cm",
  "name": "Nhang cây Đàn Hương 20cm",
  "image": "/media/dan-huong-20.jpg",
  "group": "dan-huong",
  "form": "cay",
  "category": "nhang-cay-dan-huong",
  "featured": true,
  "isNew": false
}
```

Lỗi: 400 request sai, 401 chưa đăng nhập, 403 thiếu quyền/CSRF, 404 không tồn tại, 409 conflict, 413 upload quá lớn, 429 rate limit, 500/503 lỗi server. Không trả stack trace.

## 6. Media [ĐX]

- Public product photos đọc qua `/media/:key`; staging local storage hoặc S3-compatible theo hosting thật. Private upload staging không public trước kiểm tra.
- Giới hạn đề xuất ảnh 5MB, JPG/PNG/WebP; kiểm tra magic bytes và kích thước decode, random storage key, alt bắt buộc, không nhận SVG/HTML từ upload khách.
- Xóa kiểm tra `product_media`/site content references. Không xóa ảnh còn dùng; cần thao tác thay thế có kiểm chứng.
- Audio chỉ bổ sung sau khi xác nhận file, quyền sử dụng và giới hạn dung lượng. Frontend không autoplay.

## 7. Auth và quyền [ĐX]

- Chỉ server quyết định quyền. Hash mật khẩu Argon2id, reset token random chỉ lưu hash, hết hạn 30 phút và dùng một lần.
- Session cookie HttpOnly, Secure khi HTTPS, SameSite=Lax; rotate khi login; TTL đề xuất 1 ngày hoặc 30 ngày với remember, cần xác nhận.
- CSRF token cho thao tác ghi bằng session; Origin checks; giới hạn login/reset/inquiries theo IP và định danh, không ghi password/token vào log.
- Không lưu session token trong localStorage. Không coi trang login, route guard hoặc UI ẩn là bảo mật.
- Chưa có admin UI: chỉ thiết kế endpoint quản trị khi xác nhận cần admin riêng hay dùng CMS gốc.

## 8. Luồng ghi và validation [ĐX]

- Inquiry: trim tên không rỗng ≤100; phone chuẩn hóa và kiểm tra số thực; email ≤254; topic whitelist; message không rỗng ≤2000; productSlug phải published nếu có.
- Chặn submit lặp bằng nút pending phía FE và idempotency key ngắn hạn phía server; log request ID, không log toàn bộ PII.
- Lưu inquiry và email job trong một transaction; SMTP lỗi không làm mất inquiry. UI chỉ nói đã tiếp nhận sau commit; không nói gửi email thành công nếu chưa gửi.
- Dùng schema validation tại API, parameterized queries, escape khi render; mô tả rich text cần sanitize ở cả biên nhập và xuất.

## 9. Hiệu năng và vận hành [ĐX]

- Pagination ở database; query chỉ projection thẻ hàng. Cache danh mục/public settings, invalidation khi nội dung thay đổi.
- Thumbnail và responsive images từ ảnh thật; cache static theo hash. Không tải toàn bộ catalog về để lọc khi chuyển API.
- Mục tiêu ban đầu p95 GET catalog <500ms trên staging có dataset thật; đây là mục tiêu chưa đo.
- Theo dõi error rate, SMTP failures, disk/storage; backup DB và thử restore trước chạy thật. Retention inquiries cần chủ web xác nhận.

## 10. Nối frontend

1. Tạo repository async; thay imports `products/business` trong `src/main.js` bằng dữ liệu từ API, giữ `src/data.js` chỉ làm fixtures test/import tạm.
2. `catalog`: dùng server filters + pagination, URL giữ nguyên; loading skeleton, empty, error có nút thử lại. Không fallback fixtures âm thầm khi API hỏng.
3. `productPage`/quick-view: load theo slug, cache cùng product DTO, xử lý 404 và retry. `resolveRoute` phải cho phép product slug chưa có trong fixtures và để API xác nhận tồn tại.
4. Categories từ API thay mảng hardcode `categorySlugs/groups/forms`; giữ redirect cho slug gốc nếu đổi.
5. Contact submit đổi mailto sang POST inquiry, pending + lỗi theo field, giữ nội dung khi lỗi, reset sau khi server xác nhận received.
6. Account form gọi auth, hiện session thật, logout và xử lý 401/expiry. Chưa tự thiết kế customer dashboard nếu chưa có yêu cầu.
7. Site content/phone/ảnh từ public settings. Không lấy secrets từ endpoint public.
8. Không có storage local cũ cần dọn. Gỡ thông báo chưa kết nối chỉ khi endpoint hoạt động thật.

## 11. Cấu hình và chạy

Frontend hiện có: `npm ci`, `npm test`, `npm run build`, `npm run preview`. Development: `npm run dev`.

**Backend dự kiến, CHƯA chạy/CHƯA có file:** `backend/.env.example` gồm DATABASE_URL, SESSION_SECRET, APP_ORIGIN, SMTP_HOST/PORT/USER/PASSWORD/FROM, MEDIA_ROOT hoặc S3_BUCKET/ENDPOINT. Ví dụ chỉ placeholder, tuyệt đối không commit secrets.

**Lệnh dự kiến sau khi tạo backend:** `npm --prefix backend ci`, `npm --prefix backend run migrate`, `npm --prefix backend run import:verified`, `npm --prefix backend test`, `npm --prefix backend run dev`. Phải định nghĩa scripts thật trước khi coi là lệnh chạy được.

## 12. Checklist triển khai backend (chưa làm)

- [ ] Xác nhận nguồn dữ liệu/CMS, quyền export, ý nghĩa tài khoản và phạm vi quản trị.
- [ ] Chốt API contract cùng frontend; integration test q không dấu, category/form, paging/404 và DTO như trên.
- [ ] Tạo migrations/import ảnh dữ liệu thật; kiểm uniqueness slug và không có giá/số liệu giả.
- [ ] GET catalog/category/detail/site content; test projection, permissions, invalid params, empty và pagination.
- [ ] Media pipeline; test định dạng giả, quá dung lượng, traversal, xóa media đang dùng.
- [ ] Inquiry DB commit + rate limit + SMTP nếu được duyệt; test lỗi DB/mail, duplicate và field errors.
- [ ] Auth/reset nếu cần; test cookie, CSRF, disabled user, expiry, token replay, không lộ user.
- [ ] Nối toàn bộ caller frontend; bỏ fixture fallback và thông báo chưa nối đúng lúc.
- [ ] Kiểm desktop/mobile, keyboard, loading/empty/error/401, deep links và reload.
- [ ] Staging HTTPS + backup/restore + cấu hình domain; chỉ production khi được yêu cầu.

## 13. Câu hỏi cần xác nhận

- Có tái sử dụng CMS/backend của web gốc được không? Ai sở hữu tài khoản hosting và dữ liệu?
- Đăng nhập gốc dùng cho khách hay admin; có cần dashboard riêng không?
- Quy cách, mô tả, bảng giá sỉ, danh sách đại lý và địa chỉ hành chính hiện tại lấy từ nguồn nào đã được duyệt?
- Form gửi vào email nào, ai xử lý, cần lưu trong bao lâu? Chưa tự chốt retention/ngân sách dịch vụ.
- Cần giữ bản nhạc nào, có quyền dùng/host lại không?
- Domain, hosting, storage, SMTP và quy trình quản trị do ai cung cấp? Local/test có thể dùng DB riêng và SMTP sandbox, không gửi thật.

## 14. Kiểm chứng frontend hiện tại

`npm test`: 7/7 pass (search/filter/routes/escaping/paging, pattern điện thoại HTML và server chỉ phục vụ dist). `npm run build`: pass. Đã kiểm tra trình duyệt desktop 1280px và mobile 390px: homepage không tràn, ảnh local tải được, quick-view/zoom/Escape/focus, search không dấu, lọc nhang viên, empty và phân trang. Review độc lập tìm một lỗi pattern điện thoại, đã có regression test RED→GREEN và xác nhận trên trình duyệt.

Những phần chưa có backend vẫn giữ giới hạn nêu trên. Kế hoạch này không xác nhận website sẵn sàng production.
