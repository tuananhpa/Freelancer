# Website công ty xây dựng – mockup (Xây dựng ABC = tên tạm)

Mockup theo file *Đề xuất xây dựng website công ty xây dựng*: 6 trang công khai + chi tiết công trình / tin tuyển dụng, chatbot theo kịch bản, trang quản trị sửa được mọi ảnh, chữ, logo.
Ý tưởng giao diện: **"Từ bản vẽ đến công trình"** – lưới bản vẽ kỹ thuật, cam an toàn + graphite, mỗi trang một hiệu ứng 3D theo cuộn.

## Chạy thử

```bash
python -m http.server 8080
```

Mở http://localhost:8080 (website) và http://localhost:8080/admin.html (quản trị – demo: `admin` / `demo2026`).
Phải mở qua `http://`, không mở trực tiếp file (trình duyệt chặn ES module).

| Trang | Hiệu ứng 3D theo cuộn |
|---|---|
| `index.html` Trang chủ | Tòa nhà Three.js tự dựng 5 giai đoạn: bản vẽ → móng → khung → hoàn thiện → bàn giao (trời chuyển hoàng hôn) |
| `gioi-thieu.html` | Dòng thời gian bay theo chiều sâu (đường hầm 3D) |
| `dich-vu.html` | Thẻ dịch vụ dính, xếp chồng, thẻ trước lùi vào chiều sâu |
| `cong-trinh.html` | Vòng quay 3D công trình tiêu biểu + lọc theo nhóm/trạng thái |
| `cong-trinh-chi-tiet.html?ct=<slug>` | Ảnh bìa "mở ra" khi cuộn, album + phóng to, video |
| `tuyen-dung.html`, `tuyen-dung-chi-tiet.html?vt=<slug>` | Khối 3D xếp chồng ở banner; form ứng tuyển kèm CV |
| `lien-he.html` | Bản đồ lật mở theo cuộn; form tư vấn |

Mọi trang: banner lùi vào chiều sâu khi cuộn, nút Gọi/Zalo/Facebook nổi (desktop) + thanh đáy (mobile), chatbot góc phải. Tôn trọng `prefers-reduced-motion` (tắt hết chuyển động, hiển thị tĩnh).

## Quản trị (bản demo)
- Nháp → **Xem trước** → **Xuất bản**: website công khai chỉ đổi khi bấm Xuất bản.
- Trang chủ: banner slider, bật/tắt + đổi thứ tự 8 khối, nội dung giới thiệu, quy trình, số liệu, thế mạnh.
- Thông tin doanh nghiệp: logo (nền sáng/tối), hotline, Zalo, Facebook, TikTok, địa chỉ, link Google Maps, MST.
- Dịch vụ, Công trình (album nhiều ảnh, video, tiêu biểu), Tuyển dụng (mở/đóng), Đội ngũ, Mốc phát triển, Chứng chỉ, Đối tác.
- Hộp thư: Yêu cầu tư vấn, Hồ sơ ứng tuyển (tải CV), đánh dấu trạng thái xử lý.
- Chatbot: lời chào, kịch bản hỏi–đáp, từ khoá, nút link, bật/tắt.
- Menu, SEO từng trang, nhóm công trình, thư viện ảnh (ảnh tải lên tự nén ≤ 1600px, WebP).
- Sao lưu / khôi phục JSON, đặt lại dữ liệu mẫu.

**Là mock:** dữ liệu nằm trong IndexedDB của trình duyệt đang dùng (máy khác không thấy), đăng nhập giả, form chỉ lưu cục bộ, CV lưu dạng data URL.

## Ảnh
- 26 ảnh minh hoạ tạo bằng AI (Codex image_gen) – bản gốc PNG + prompt ở `_ai_raw/` (`PROMPTS.md`, `SOURCES.txt`), bản web ở `assets/img/photos/`. **Dùng lại, không tạo lại.**
- Ảnh AI chỉ để duyệt bố cục; thay bằng ảnh công trình thật qua trang quản trị trước khi chạy thật.
- Logo `assets/img/brand/*.svg` là logo tạm.

## Cần doanh nghiệp cung cấp / xác nhận
Tên pháp lý & logo · MST · địa chỉ trụ sở + link Google Maps · hotline, Zalo, Fanpage, TikTok, email · số liệu (năm kinh nghiệm, số công trình, nhân sự, % đúng tiến độ) · mốc phát triển · danh sách dịch vụ thực tế · công trình thật (tên, địa điểm, quy mô, hạng mục, ảnh, video) · chứng chỉ năng lực, đối tác · tin tuyển dụng ban đầu · màu nhận diện. Mọi nội dung hiện tại là **mẫu**.

## Kiểm tra
```bash
node tests/logic.test.mjs
python tests/e2e_admin.py http://localhost:8080 assets/img/photos/sv-nha-o.webp
```
`e2e_admin.py` (Playwright) chạy 20 bước: đăng nhập, lưu nháp, xem trước, xuất bản, thêm công trình có ảnh, tìm không dấu, đổi thứ tự, gửi form tư vấn/ứng tuyển, chatbot, bật/tắt khối trang chủ.

## Chuyển sang backend thật
Đặt `CONFIG.mode = 'live'` trong `assets/js/config.js`; giao diện gọi đúng các endpoint dưới (xem `LiveAdapter` trong `assets/js/api.js`):

| Endpoint | Việc |
|---|---|
| `GET /api/public/site[?draft=1]` | `{docs, collections}` đã lọc `published`, sắp `order` (draft cần đăng nhập) |
| `POST /api/public/{leads,applications}` | khách gửi form (kiểm tra đầu vào, chống spam, file CV multipart) |
| `POST /api/auth/login` · `/logout` · `GET /auth/me` | đăng nhập thật (băm mật khẩu, giới hạn thử) |
| `GET/POST /api/admin/:col` · `GET/PUT/DELETE /api/admin/:col/:id` · `POST /api/admin/:col/reorder` | CRUD bản nháp |
| `GET/PUT /api/admin/docs/:key` | tài liệu đơn: `site`, `home`, `pages`, `chatbot` |
| `GET /api/admin/status` · `POST /api/admin/publish` · `/discard` | nháp/xuất bản |
| `GET /api/admin/export` · `POST /api/admin/import` | sao lưu |

Ảnh tải lên: đổi data URL sang lưu trữ đối tượng (R2/S3) trả URL. SEO thật cần render phía máy chủ (hiện tiêu đề/mô tả được đặt bằng JS). Font nên tự host woff2 khi bàn giao.
