# Mì Studio – Phóng Sự Cưới · website demo

Website một trang, HTML/CSS/JS thuần, không cần build.

```
python -m http.server 5520     # rồi mở http://localhost:5520
```

## Cấu trúc
- `index.html`: toàn bộ nội dung trang.
- `assets/css/main.css`: màu lấy từ logo (`--sage: #5b867c`), font Cormorant Garamond / Be Vietnam Pro / Great Vibes.
- `assets/js/main.js`: album, trình xem ảnh, phim, form, toàn bộ hiệu ứng cuộn (GSAP + ScrollTrigger + Lenis qua CDN; thiếu thư viện hay bật "giảm chuyển động" thì trang vẫn hiển thị đủ, chỉ không có hiệu ứng).
- `assets/js/data.js`: danh sách album, **sinh bởi** `python tools/build_data.py` (sửa tên/ngày/ảnh bìa album trong file đó).
- `assets/img/albums/aN/NN.webp` (1600px) + `NN-sm.webp` (640px): 16 ảnh tuyển chọn × 7 album, lấy từ Drive của studio.
- `assets/img/layouts/`: 20 mẫu layout khách gửi. `assets/img/brand/`: logo (cắt từ thư cảm ơn) + favicon.
- `_raw/`: ảnh gốc tải về và `img_meta.json` (không cần khi deploy).

## Trang quản trị (`/admin.html`) + backend
Chỉnh được: album (thêm/xoá/sắp xếp, bật/tắt hiện trên trang, tải ảnh, chọn ảnh bìa), mọi chữ trên trang (đọc tự động từ các thẻ `data-edit` trong index.html), mọi ảnh cố định (`data-edit-img`), trang layout photobook, phim, bảng giá, cảm nhận, liên hệ, SEO; xuất/nhập file JSON, đặt lại. Lưu tự động.

Backend là `worker.js` (Cloudflare Worker, cùng Worker phục vụ trang):
- Nội dung: 1 khoá `content` trong KV `mistudio-content` (binding `CONTENT`). Ảnh tải lên: khoá `m/<uuid>.webp` cùng KV, phục vụ tại `/media/...`.
- Đăng nhập: `POST /api/login` so với secret `ADMIN_USER` / `ADMIN_PASS`, trả token ký HMAC (`TOKEN_SECRET`), hết hạn sau 12 giờ. Mọi lệnh ghi đều cần token. Mật khẩu không nằm trong mã nguồn.
- Đổi mật khẩu: `npx wrangler secret put ADMIN_PASS`.
- Giới hạn: nội dung ≤ 2MB, ảnh ≤ 6MB, KV gói free 1.000 lượt ghi/ngày. Ảnh bị xoá khỏi album chưa được dọn khỏi KV. Nhiều ảnh hơn nên chuyển sang R2.
- Chạy bằng `python -m http.server` (không có Worker) thì admin tự chuyển sang lưu trong trình duyệt, chỉ dùng để phát triển.

Chạy cục bộ có backend: tạo `.dev.vars` (ADMIN_USER, ADMIN_PASS, TOKEN_SECRET; đã có trong .gitignore), dựng `dist/` như mục Deploy, rồi `npx wrangler dev --local --port 8787`.
Kiểm tra: `python tools/test_admin.py <url>` (đăng nhập sai/đúng, API chặn khi chưa đăng nhập, trình duyệt khác thấy thay đổi, tải ảnh, đặt lại).

## Hiệu ứng
1. Màn mở đầu logo → khung vòm ảnh cô dâu tự mở rộng thành toàn màn hình (không cần cuộn), chữ "Kể lại ngày cưới" bay vào chỗ.
2. Lời mở sáng dần theo từng chữ, ảnh trôi parallax.
3. "Một ngày cưới": dải phim cuộn ngang, mỗi chương rộng 1 màn hình và tự hít vào giữa, 5 chương (Chuẩn bị → Gia tiên → Rước dâu → Lễ đường → Tiệc cưới).
4. Album mở như rèm; bấm vào xem 16 ảnh (phím ←/→, Esc).
5. Photobook: từng trang layout rơi xuống chồng lên nhau.

## Nguồn dữ liệu
- SĐT 0983 861 096, Biên Hòa, Instagram, YouTube, 5,4K người theo dõi: trang Facebook Mistudiophongsucuoiii (xem 23/11/2026).
- 2 máy (phóng sự + truyền thống), số ảnh bàn giao mỗi album: tên và số file trong 7 thư mục Drive.
- Lưu trữ 3 tháng, hướng dẫn tải ảnh, thư cảm ơn, tiêu chí Tận tâm / Chuyên nghiệp / Tin tưởng / Đồng hành: các file "Thư cám ơn", "Lưu ý", "Tải ảnh" trong Drive.
- Bảng giá in ảnh: file "Bảng giá in ảnh.jpg" trong Drive.

## Cần khách xác nhận
- [ ] Xin phép các cặp đôi trước khi đăng tên + ảnh (đang dùng tên trong tên file clip). Album 4 và 6 chưa rõ tên cặp đôi.
- [ ] Slogan đề xuất: "Kể lại ngày cưới, đúng như nó đã diễn ra".
- [ ] Giá gói quay chụp phóng sự (tên gói, giá, thời lượng, sản phẩm bàn giao).
- [ ] 3 nhận xét thật của khách.
- [ ] Địa chỉ studio, khu vực nhận quay chụp.
- [ ] File logo gốc (vector/PNG nền trong); logo hiện tại cắt từ thư cảm ơn.
- [ ] Tên miền riêng (gợi ý: mistudio.vn, mistudiophongsucuoi.vn — chưa kiểm tra còn trống).

## Đang là bản demo
- Form "Đặt lịch tư vấn" của khách không lưu dữ liệu: nó chép nội dung và mở Zalo của studio.
- Phim nhúng từ Google Drive (file phải để "ai có link đều xem được"). Khi chạy thật nên đưa lên YouTube và nhúng từ đó.
- Font và GSAP tải từ CDN; khi bàn giao bản chính có thể tự host.

## Deploy (Cloudflare Worker, static assets)
```
rm -rf dist && mkdir dist && cp -r index.html admin.html assets dist/
npx wrangler deploy
```
Link hiện tại: https://mi-studio-phongsucuoi.edu-manage-ai.workers.dev
