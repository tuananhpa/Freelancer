# PROMPT TẠO MOCKUP WEBSITE CPES

> Dán nguyên phần dưới đường kẻ vào phiên AI mới (Claude Code, mở thư mục `D:\Freelancer\CEPS`).
> Mọi ảnh/tài liệu tham chiếu đã lưu sẵn trong `_brief/` — xem bảng ở cuối file.

---

Dùng skill **website-mockup-pro**. Dựng mockup website tiếng Việt cho **Công ty TNHH Giải pháp CPE (CPES)** trong thư mục `D:\Freelancer\CEPS\site\`. HTML/CSS/JS thuần, không build step, chạy được trên mobile 390px.

## 1. Khách hàng & mục tiêu
- CPES phân phối giải pháp công nghiệp: giám sát chất lượng nước, giám sát khí độc/cháy nổ, van, bơm, biến tần, CCTV, PCCC tự động. Ngành: Nước & nước thải; Dầu khí & hoá dầu; Nhiệt điện; Khai khoáng.
- Website vừa **giới thiệu công ty**, vừa **trưng bày/bán sản phẩm** (yêu cầu báo giá), có **chatbot AI** nổi ở góc phải dưới trên mọi trang.
- Phong cách: **tối giản, sạch, công nghiệp** — tham khảo độ tối giản của website CEC JSC và bố cục trang s::can của Badger Meter (https://www.badgermeter.com/products/water-quality-monitoring/scan/). Chỉ mượn cấu trúc, **không chép** chữ/logo/màu của Badger Meter.
- Đã có domain + HTTPS; lượng truy cập thấp → host tĩnh là đủ.

## 2. Nhận diện (từ `_brief/logo-cpes-bien-the-va-mau.png`)
- Màu: xanh đậm `#1d5321` (chữ đậm, footer), xanh chính `#157f1f` (nút, link, tiêu đề), xanh sáng `#53ba36` (điểm nhấn, hover). Nền trắng + xám rất nhạt; không dùng màu ngoài bộ này trừ xám trung tính.
- Font: **Montserrat** (khớp chữ CPES trong logo) cho tiêu đề; Be Vietnam Pro hoặc Inter cho thân bài. Line-height tiêu đề ≥ 1.2 để không đè dấu tiếng Việt.
- Ý tưởng thị giác chủ đạo: **khối lục giác isometric 3 sắc xanh** của logo — dùng làm hoạ tiết nền cắt góc (như trang bìa & trang 4 PDF), khung ảnh, divider; không lạm dụng.
- Logo: header dùng bản ngang `_brief/logo-cpes-ngang.webp`, favicon/footer dùng bản đứng `_brief/logo-cpes-doc.webp` (cần tách nền trắng → PNG/SVG trong suốt).

## 3. Sitemap & menu (chốt cuối của khách, ưu tiên hơn phác thảo tay)
```
[Logo CPES] ------------------ Giới thiệu   Sản phẩm ▾   Giải pháp
                                            ├ ATi
                                            └ s::can
```
- Logo → trang chủ. Header sticky, trắng, thu nhỏ khi cuộn; mobile có drawer.
- Footer chung mọi trang: thông tin liên hệ + menu + logo.
- Trang: `index.html` (Giới thiệu/landing), `san-pham.html` (2 category, có anchor `#ati`, `#scan`), `giai-phap.html`, `admin.html` (mock).

## 4. Trang Giới thiệu (`index.html`) — theo phác thảo `_brief/phac-thao-1-trang-chu.webp`
Thứ tự section:
1. **Hero**: tiêu đề ngắn về giải pháp công nghiệp + 2 CTA ("Xem sản phẩm", "Liên hệ tư vấn"); nền hoạ tiết lục giác.
2. **Về chúng tôi** — dùng nguyên văn:
   > Công ty TNHH Giải Pháp CPE được thành lập với mục tiêu trở thành đối tác tin cậy chuyên cung cấp các giải pháp trong công nghiệp, áp dụng công nghệ tiên tiến đặc biệt các giải pháp về giám sát chất lượng nước; giải pháp an toàn trong sản xuất, hệ thống van đóng/mở, van điều khiển; hệ thống camera và CCTV thông minh, giám sát khí độc và cháy nổ; và các giải pháp tự động khác phần mềm quản lý thiết bị, bơm công nghiệp, biến tần, hệ thống bôi trơn tự động, hệ thống PCCC tự động.
   > Giải pháp tập trung vào các ngành: Nước và nước thải; Dầu khí và hóa dầu; Nhiệt điện và Khai khoáng.

   Kèm 4 ô ngành (Nước & nước thải / Dầu khí & hoá dầu / Nhiệt điện / Khai khoáng).
3. **Giá trị cốt lõi** — 4 thẻ chữ cái lớn C-P-E-S:
   - C = Luôn học hỏi và Phát triển.
   - P = Tiến bộ không ngừng và Sáng tạo.
   - E = Đề cao Đạo đức nghề nghiệp trong mọi hoạt động.
   - S = Đề cao Trách nhiệm xã hội.
4. **Triết lý bán hàng** — cùng kiểu C-P-E-S nhưng khác bố cục (ví dụ hàng ngang trên nền xanh đậm):
   - C = Khách hàng là trung tâm.
   - P = Giá trị hơn giá cả.
   - E = Tạo niềm tin nơi Khách hàng.
   - S = Đồng cảm với vấn đề của Khách hàng để tìm giải pháp thích hợp.
5. **Khách hàng** — hàng logo tròn chạy marquee (phác thảo vẽ 4+ logo tròn). Logo khách hàng **chưa có** → ô tròn ghi `[[CẦN XÁC NHẬN: logo khách hàng]]`. Có thể thêm một dải riêng "Thương hiệu phân phối" dùng các logo ở trang bìa PDF (`_brief/cpe-solutions/trang-1.png`): s::can, ATi, JSG, Control Techniques, LDI, KITZ Group, Tecnovideo, Prime Technologies, ABC Solutions — chỉ khi khách đồng ý.
6. **Liên hệ** (lấy từ PDF, trang 4):
   - Địa chỉ: 490 Phạm Thái Bường, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh, Việt Nam
   - Điện thoại: (+84) 942 537 025
   - Email: Sales@cpes.vn
   - Website: cpes.vn
   - Bản đồ Google Maps nhúng theo địa chỉ trên + form "Yêu cầu tư vấn" (mock, không gửi thật).

**Không** dùng phần giới thiệu sản phẩm ở trang 2–3 của PDF CPE Solutions (khách dặn chỉ lấy mấy trang cuối).

## 5. Trang Sản phẩm (`san-pham.html`) — theo `_brief/phac-thao-2-trang-san-pham.webp`
Đầu trang có tab/anchor 2 category: **ATi** | **s::can**.

### 5a. s::can — lưới sản phẩm lướt ngang
- Bố cục: **lưới 3 cột**; khi nhiều hơn 3 sản phẩm thì **lướt sang phải** (scroll-snap ngang + nút ‹ › + phân trang 1 2 3 …). Mobile: 1 thẻ + hé thẻ sau.
- Thẻ sản phẩm: ảnh tách nền trên nền xám nhạt, nhãn loại (Đầu dò phổ / Cảm biến vật lý), tên, chip thông số đo, nút "Yêu cầu báo giá". Có lọc nhanh theo loại.
- Phía trên lưới: 2–3 khối giới thiệu ngắn kiểu trang s::can (Công nghệ cảm biến số thông minh; Đầu dò phổ UV-Vis; Giám sát chất lượng nước online) — viết lại bằng tiếng Việt, không dịch nguyên văn.
- Dữ liệu sản phẩm (từ trang s::can, giữ tên gốc tiếng Anh):

| # | Tên | Loại | Thông số đo |
|---|---|---|---|
| 1 | spectro::lyser V3 | Đầu dò phổ | BOD, Chl-a, Chloramine, COD, Color, DOC, O3 hoà tan, NO3, TOC, TSS, Turbidity, UV254, nhiệt độ, áp suất |
| 2 | ammo::lyser Eco | Cảm biến vật lý | Amoni, NO3, pH, nhiệt độ |
| 3 | spectro::lyser UV | Đầu dò phổ | COD, O3 hoà tan, H2S, NO2, NO3, TOC, TSS, UVT, UV254, nhiệt độ |
| 4 | spectro::lyser V3 ATEX | Đầu dò phổ (chống cháy nổ) | BOD, COD, DOC, NO3, TOC, TSS, Turbidity, UVT, UV254… |
| 5 | spectro::lyser V3 Titanium | Đầu dò phổ (môi trường ăn mòn) | BOD, COD, DOC, NO3, TOC, TSS, Turbidity, UVT, UV254… |
| 6 | carbo::lyser V3 | Đầu dò phổ | BOD, COD, DOC, TOC, TSS, Turbidity, UV254, nhiệt độ |
| 7 | chlodi::lyser | Cảm biến vật lý | Chlorine dioxide, nhiệt độ |
| 8 | chlori::lyser | Cảm biến vật lý | Clo tự do / Clo tổng, nhiệt độ |
| 9 | condu::lyser | Cảm biến vật lý | Độ dẫn điện, độ mặn, TDS, nhiệt độ |

Ảnh: đã có trong `_brief/scan-products/` (chép sang `site/assets/img/scan/`, chuyển webp). Trang gốc còn nhiều trang sản phẩm nữa (phân trang tới 16) → để admin thêm sau.

### 5b. ATi — brochure dạng sách lật
- Nhúng file `ATi brochure Vietnamese.pdf` (11 trang) thành **flipbook lật trang 3D**: đã render sẵn từng trang ở `_brief/ati-brochure/trang-01..11.png` → chuyển sang webp ~1400px cho web.
- Desktop: 2 trang mở đôi (trang bìa đứng riêng), kéo góc/bấm mũi tên để lật, có số trang + nút phóng to toàn màn hình + nút "Tải brochure PDF". Mobile: 1 trang, vuốt để lật.
- Dùng thư viện StPageFlip (`page-flip`, bản cố định phiên bản qua CDN) hoặc tự viết bằng CSS 3D; tôn trọng `prefers-reduced-motion` (chuyển sang trượt thường).
- Lưu ý: trang 2–10 PDF là ảnh xoay ngang (landscape xoay 90°) → kiểm tra hướng khi render, xoay lại cho đúng chiều đọc.

## 6. Trang Giải pháp (`giai-phap.html`) — theo `_brief/phac-thao-3-trang-giai-phap.webp`
- **Giải pháp nước thải** → một khối "Totem" lớn (banner ngang: ảnh + tiêu đề + mô tả ngắn + sản phẩm liên quan + CTA).
- **Giải pháp nước cấp** → khối "Totem" tương tự, đảo chiều ảnh/chữ.
- "… sẽ update sau" → khung trống dạng thẻ mờ "Đang cập nhật" để admin thêm giải pháp.
- Nội dung chi tiết từng totem: `[[CẦN XÁC NHẬN: nội dung + ảnh giải pháp nước thải / nước cấp]]`.

## 7. Chatbot AI (mọi trang)
- Bong bóng chat góc phải dưới, màu `#157f1f`, mở thành khung chat 360×520 (mobile: toàn màn hình).
- Mockup: lời chào + 4 câu hỏi gợi ý (Sản phẩm s::can đo được gì? / Brochure ATi / Báo giá / Liên hệ) + trả lời kịch bản sẵn từ dữ liệu site; ghi rõ "Bản demo — chưa kết nối AI".
- Ghi vào `PLAN.md`: bản thật gọi Claude API qua backend (Cloudflare Worker), không để API key ở front-end; tri thức lấy từ dữ liệu sản phẩm + giới thiệu.

## 8. Admin (mock)
Khách muốn tự thêm sản phẩm/giải pháp sau này → `admin.html` theo skill: đăng nhập demo, CRUD sản phẩm (thuộc ATi hoặc s::can), CRUD giải pháp (totem), thay file brochure, xuất/nhập JSON, ghi rõ "dữ liệu chỉ lưu trong trình duyệt này".

## 9. Quy tắc
- Toàn bộ giao diện tiếng Việt; tên sản phẩm giữ nguyên tiếng Anh.
- Không bịa số liệu, chứng nhận, khách hàng; thiếu thì `[[CẦN XÁC NHẬN: …]]`.
- Ảnh sản phẩm ghi kèm "s::can / ATi — A Badger Meter® Brand" ở mức nhỏ; không dùng logo Badger Meter làm nhận diện trang.
- Không dùng ảnh AI cho nội dung thật.
- Kiểm tra ở 390 / 768 / 1440, chạy `qa_check.py` của skill, rồi bàn giao danh sách `[[CẦN XÁC NHẬN]]`.

---

## Phụ lục A — Ảnh & tài liệu đã lưu trong `_brief/`

| File | Nội dung |
|---|---|
| `logo-cpes-doc.webp` | Logo CPES bản đứng |
| `logo-cpes-ngang.webp` | Logo CPES bản ngang |
| `logo-cpes-bien-the-va-mau.png` | Quy định biến thể logo + 3 mã màu |
| `phac-thao-1-trang-chu.webp` | Phác thảo tay trang Giới thiệu (landing) |
| `phac-thao-2-trang-san-pham.webp` | Phác thảo tay trang Sản phẩm (s::can lưới + ATi sách lật) |
| `phac-thao-3-trang-giai-phap.webp` | Phác thảo tay trang Giải pháp (2 totem) |
| `cpe-solutions/trang-1..4.png` | PDF CPE Solutions render ra ảnh (chỉ dùng trang 1 logo đối tác, trang 4 nội dung) |
| `scan-products/` | 9 ảnh sản phẩm s::can + 2 ảnh section |
| `ati-brochure/trang-01..11.png` | Brochure ATi render ra ảnh (dùng cho flipbook) |
| `../ATi brochure Vietnamese.pdf` | File gốc cho nút tải |

## Phụ lục B — Ảnh sản phẩm s::can (Badger Meter, 600×600 PNG nền trong)
**Đã tải sẵn về `_brief/scan-products/`**: `01-spectro-lyser-v3.png` … `09-condu-lyser.png` (đánh số theo bảng mục 5a) + `section-river-monitoring.jpg`, `section-concube-station.jpg` (1200×800).
Lưu ý: 01, 03, 06 là **cùng một ảnh** (trang gốc dùng chung ảnh cho spectro::lyser V3 / UV / carbo::lyser) → `[[CẦN XÁC NHẬN: ảnh riêng carbo::lyser]]`.

URL gốc (để tải lại nếu cần):
1. spectro::lyser V3 — https://badgermeter.widen.net/content/aiu24monno/png/spectrolyser-UV-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr  *(trang gốc dùng chung ảnh với #3)*
2. ammo::lyser Eco — https://badgermeter.widen.net/content/z88e2qd4ns/png/ammolyser-eco-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
3. spectro::lyser UV — https://badgermeter.widen.net/content/aiu24monno/png/spectrolyser-UV-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
4. spectro::lyser V3 ATEX — https://badgermeter.widen.net/content/bkpvpnhcxm/png/spectrolyser-industrial-ATEX-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
5. spectro::lyser V3 Titanium — https://badgermeter.widen.net/content/ilntezhpsk/png/spectrolyser-titanium-pro-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
6. carbo::lyser V3 — https://badgermeter.widen.net/content/d6zhysezxj/png/carbolyser-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
7. chlodi::lyser — https://badgermeter.widen.net/content/snhsqcslly/png/chlodilyser-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
8. chlori::lyser — https://badgermeter.widen.net/content/wvrdk7ziob/png/chlorilyser-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr
9. condu::lyser — https://badgermeter.widen.net/content/vbkczpinfo/png/condulyser-%28low-res%29.png?w=600&h=600&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr

Ảnh section (tham khảo bố cục): sông/trạm quan trắc https://badgermeter.widen.net/content/45gn3ynidj/jpeg/UK-RiverMonitoring-at-UK-HQ-%28low-res%29-1200x800.jpeg?w=600&h=400&keep=c&crop=yes&color=ffffff00&quality=80&u=39eotr · trạm con::cube V3 https://badgermeter.widen.net/content/rmfkvsccqa/jpeg/Terminals%20and%20Monitors%20concube%20V3%20station%20%28low-res%29%201200x800.jpeg?w=600&h=400&position=c&color=ffffff00&quality=80&u=iszoby

## Phụ lục C — `[[CẦN XÁC NHẬN]]` cần hỏi khách
- Logo các khách hàng (section Khách hàng) — hay dùng logo thương hiệu phân phối thay?
- Nội dung + ảnh 2 totem Giải pháp nước thải / nước cấp.
- Danh sách sản phẩm ATi riêng (ngoài brochure) có cần thẻ sản phẩm không?
- Kênh nhận yêu cầu báo giá (email Sales@cpes.vn? Zalo?).
- MST / tên pháp lý đầy đủ cho footer.
