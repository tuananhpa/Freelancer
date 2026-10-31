# HARMAY.STUDIO – MOCKUP WEBSITE THỜI TRANG (gửi khách duyệt)

Mục tiêu DUY NHẤT: tạo bản mockup website thời trang ĐẸP NHẤT có thể để gửi khách duyệt. Nhìn vào phải thấy đây là website của một nhà mốt cao cấp do designer chuyên nghiệp thiết kế: fashion, hiện đại, sinh động, nhiều hiệu ứng cuộn và chuyển động có chủ đích. KHÔNG có cảm giác template hay AI làm.
Đây là bản làm lại: khách đã KHÔNG ưng bản cũ (ESER), nên bản mới phải khác hẳn về cảm giác, bố cục và chuyển động.
Chỉ làm mockup giao diện (HTML/CSS/JS tĩnh). KHÔNG làm backend, admin, database, giỏ hàng, thanh toán, SEO, test tự động. Không cần tiết kiệm token hay thời gian: làm kỹ nhất, tự đánh giá nhiều vòng nhất cần thiết. Làm tự động từ đầu đến cuối, KHÔNG dừng chờ tôi xác nhận.

## 1. Đầu vào (thư mục hiện tại)
- File Excel brief của khách (`*.xlsx`): đọc toàn bộ bằng script trước khi làm.
- `eser-website.zip`: source bản cũ khách không ưng. Giải nén vào `_old/`, KHÔNG sửa và KHÔNG tái sử dụng giao diện.
  - Chỉ đọc `_old/README.md`, `_old/lib/default-content.json` và `_old/public/css/site.css` để biết bản cũ đã làm gì, rồi làm KHÁC đi.
  - Bản cũ dùng nền ngà, đồng thau, đen, đỏ rượu; Playfair, Cormorant và Be Vietnam Pro; hero chữ ESER lớn với 3 ảnh vòm; marquee; lookbook trượt ngang.
- Ảnh sản phẩm (file hoặc thư mục ảnh trong folder): ảnh cũ của khách, người mẫu mặc đầm công sở, dự tiệc, áo dài, chụp đường phố, khung dọc 2:3.
  - Nếu thiếu thì dùng thêm `_old/public/images/look-*.jpg` (1100×1650).
  - Nhiều ảnh có logo chữ "ESER" in ở góc trên trái (xem mục 4, bước 3).
- Nếu trong folder có `ESER-so-do-website.pdf` (sơ đồ website khách gửi) thì làm theo sơ đồ đó. Sơ đồ này ưu tiên hơn danh sách trang ở mục 7.
- Web tham khảo khách cung cấp (lấy tinh thần, KHÔNG sao chép nội dung, hình ảnh hay nhận diện):
  - Video mở đầu: https://altamoda.dolcegabbana.com/en
    - Mở đầu bằng màn đen với wordmark chữ giãn rộng, rồi mở ra video toàn màn hình tự chạy, có dòng "Scroll to Discover".
    - Sau đó là các "chương" toàn màn hình, mỗi chương có video hoặc ảnh riêng, tiêu đề, ngày, địa điểm và nút "Discover More".
    - Khi chụp, nếu hiện banner cookie thì bấm "Continue without Accepting".
  - Show bộ sưu tập 1: https://www.pinterest.com/pin/1140888518105658302/ ("Fashion E-commerce Web Animation")
    - Người mẫu đã tách nền đứng chồng lên tiêu đề chữ rất lớn; các lớp trượt với tốc độ khác nhau.
    - Nền pastel, vài nét vẽ trang trí mảnh.
  - Show bộ sưu tập 2: https://www.pinterest.com/pin/630996597772148892/ ("Runway Experience – Marc Jacobs")
    - Các người mẫu xếp hàng theo chiều sâu: người phía trước sắc nét, người phía sau mờ và nhỏ dần.
    - Cuộn để đổi look ("LOOK 15"). Cột bên phải liệt kê các món đồ của look đang xem.
  - Pinterest có thể chặn bot. Khi đó dựa vào mô tả trên, hoặc đọc `og:image` của trang để xem ảnh.
- Các dự án tôi đã làm trên `~/Desktop/` (Unify Pharma, Skymax, True Path Travel, BM Global Spirits…): tham khảo chuẩn chất lượng và cách tổ chức mã, KHÔNG sao chép nhận diện hay nội dung. Đọc README.md và content-map.md nếu có.

## 2. Thông tin khách hàng (từ brief)
- Thương hiệu: HARMAY.STUDIO, thương hiệu thời trang.
  - Chưa có logo hay bộ nhận diện: dựng wordmark bằng chữ (typographic), KHÔNG vẽ logo phức tạp. Ghi `[[CẦN XÁC NHẬN]]`.
  - KHÔNG dùng tên hay logo ESER ở bất kỳ đâu.
- Đối tượng:
  1. Khách muốn tìm hiểu về Harmay Studio.
  2. Xưởng may có nhu cầu thuê thiết kế (B2B).
  3. Khách muốn đặt may sản phẩm riêng.
- Mục tiêu: người xem phải thấy ngay (a) các bộ sưu tập hot nhất và (b) các ngách thời trang Harmay kinh doanh (theo ảnh: đầm công sở, đầm dự tiệc, set và chân váy, áo dài).
- Mood: Fashion, cao cấp, chuyên nghiệp, sinh động. Khách RẤT thích hiệu ứng cuộn và motion.
- Không bán online: KHÔNG giỏ hàng, KHÔNG giá. Nút hành động gồm "Đặt may mẫu này", "Thuê thiết kế", "Nhắn Zalo", "Nhắn Messenger", "Gọi Hotline".
- Chưa có SĐT, link Zalo/Facebook/Instagram/TikTok, địa chỉ, email: dùng giá trị giữ chỗ, gom trong một object `SITE` để sửa ở một chỗ.
- Khách sắp đầu tư video và ảnh mới: mọi ảnh và video phải thay được dễ dàng.

## 3. Skill sử dụng
| Skill | Dùng để |
|---|---|
| /design-taste-frontend | SKILL CHÍNH: làm đúng toàn bộ quy trình (chọn hướng từ thư viện, house style chống AI slop, inspector, vòng nhìn – sửa). Riêng typography theo mục 6A (6A ưu tiên hơn skill) |
| /scroll-motion-landing | Dựng trang editorial có scrollytelling, kinetic type, parallax hero, scroll-scrub reveal; tham khảo cách dựng từ web D&G Alta Moda |
| /playwright-cli | Chụp web tham khảo, các dự án trên Desktop, chụp mockup và GHI VIDEO khi cuộn trang để tự đánh giá motion |
| /extract-design | Lấy nhịp khoảng cách và tinh thần từ web D&G (KHÔNG lấy font, logo) |
| /gsap-core, /gsap-timeline, /gsap-scrolltrigger, /gsap-plugins, /gsap-utils | Intro, video hero co lại khi cuộn, section ghim, gallery cuộn ngang, chữ tách dòng (SplitText), Flip, parallax nhiều lớp |
| /gsap-performance | Giữ 60fps: chỉ animate transform/opacity/clip-path, gom tween, lazy video |
| /transitions-dev | Menu toàn màn hình, hover thẻ look, modal xem nhanh look, chuyển trang, form liên hệ |
| /transitions-polish, /transitions-agent | Cuối dự án: rà toàn site, đồng bộ duration, easing, stagger, chiều mở/đóng |
| /impeccable | Cuối mỗi vòng: `critique` → `typeset` → `animate` → `bolder` (nếu còn nhạt) → `polish` |

## 4. Quy trình
1. **Đọc đầu vào:**
   - Đọc brief Excel bằng script.
   - Giải nén zip cũ vào `_old/`.
   - Thống kê ảnh: số lượng, kích thước, nhóm theo ngách (công sở, dự tiệc, set, áo dài) và theo màu chủ đạo.
2. **Nghiên cứu:**
   - Chụp web D&G Alta Moda (mở đầu, hero video, 2–3 chương), 2 pin Pinterest, trang chủ bản cũ (`_old`) và các dự án trên Desktop.
   - Viết `docs/research.md`: điều cần học từ từng mẫu, và vì sao bản cũ chưa đạt.
3. **Xử lý ảnh (bằng script, toàn bộ ảnh):**
   - Chuyển sang WebP các cỡ 2400/1600/800/400, giữ tỉ lệ gốc.
   - Logo "ESER" in trên ảnh: ưu tiên cắt khung hoặc dùng `object-position` sao cho logo nằm ngoài vùng hiển thị.
     - KHÔNG dùng AI vẽ đè hay xoá, KHÔNG chỉnh trang phục.
     - Ảnh nào không tránh được logo thì chỉ dùng ở vị trí nhỏ, ghi lại trong content-map.
   - Tách nền 4–6 ảnh đẹp nhất bằng script (vd. `rembg`) để làm hiệu ứng người mẫu chồng lên chữ lớn như pin Pinterest 1. Kiểm tra viền tóc và tay; ảnh nào tách xấu thì KHÔNG dùng, thay bằng khung ảnh có mask.
   - Tạo contact sheet để tự kiểm tra.
4. **Video hero:** làm theo mục 5.
5. **Dữ liệu:** sinh `assets/js/data.js`.
   - 3–4 bộ sưu tập: nhóm ảnh theo màu và ngách, tên tạm có chất kèm `[[CẦN XÁC NHẬN]]`.
   - Các look (mỗi ảnh là một look, đánh số LOOK 01…) và các ngách thời trang.
   - Không bịa chất liệu, giá, số liệu. Mô tả chỉ tả những gì nhìn thấy trên ảnh (màu, dáng). Thiếu thông tin thì ẩn.
6. **Hướng thiết kế:** viết `docs/design-direction.md` gồm ý tưởng xuyên suốt, moodboard bằng lời, bảng màu, font, nhịp bố cục và kịch bản motion cho từng section. Cân nhắc 2–3 hướng, chọn hướng mạnh nhất, nêu lý do và nêu rõ khác bản cũ ở đâu.
7. **Dựng trang chủ trước.** Mỗi vòng:
   - chụp ảnh ở 375px và 1440px;
   - GHI VIDEO cuộn từ đầu đến cuối trang ở cả hai cỡ;
   - xem lại, tự chấm theo mục 6, sửa.
   Lặp ít nhất 3 vòng, đến khi trang chủ thật sự xuất sắc cả về tĩnh lẫn chuyển động.
8. **Dựng các trang còn lại** cùng ngôn ngữ thiết kế, rồi đánh giá toàn site thêm ít nhất 2 vòng.
9. **Hoàn thiện motion:** chạy /transitions-agent, /transitions-polish, /gsap-performance, rồi /impeccable theo thứ tự ở mục 3. Lưu bộ ảnh chụp cuối và 2 video cuộn trang (mobile và desktop) vào `docs/screenshots/`.

## 5. HERO = VIDEO TOÀN MÀN HÌNH TỰ CHẠY (BẮT BUỘC, thay cho hero bản cũ)
- Mở đầu kiểu D&G Alta Moda:
  - Màn nền thương hiệu với wordmark HARMAY.STUDIO chữ giãn rộng hiện dần khoảng 1,2–1,8 giây, rồi mở ra video (curtain, clip-path hoặc fade).
  - Chỉ chạy lần đầu mỗi phiên (sessionStorage). Bấm, cuộn hoặc nhấn phím là bỏ qua.
- Video:
  - `<video autoplay muted loop playsinline preload="auto" poster="…">`, phủ kín `100svh` (fallback `100vh`), `object-fit: cover`, không viền, không khung.
  - Trên video chỉ để chữ tiết chế: wordmark hoặc tagline ngắn, nhãn mùa hay bộ sưu tập, chỉ dẫn "Cuộn để khám phá".
  - Thêm gradient mờ ở đáy để chữ đọc được.
  - Có nút nhỏ Tạm dừng/Phát. Thêm nút Bật/Tắt tiếng nếu video có âm thanh.
  - KHÔNG làm kiểu template "tiêu đề + 2 nút" căn giữa.
- Khi cuộn: video co dần vào một khung (scale và clip-path inset, bo nhẹ), hoặc section sau trượt lên che video, liền mạch sang section tiếp theo.
- Nguồn video (khách CHƯA có video):
  1. Tìm video thời trang miễn phí bản quyền trên Pexels, Mixkit hoặc Coverr, hợp mood: catwalk, editorial, vải chuyển động, studio may đo. Ghi nguồn và giấy phép trong README và content-map.
  2. Đồng thời dựng một video dự phòng từ ảnh của khách bằng ffmpeg (zoom chậm, chuyển cảnh nhịp thời trang, 10–20 giây, lặp liền mạch).
  3. Chọn bản đẹp hơn làm mặc định và giữ bản còn lại.
- Xuất video:
  - MP4 H.264 có `-movflags +faststart`, không âm thanh nếu không cần.
  - Bản ngang 1920×1080 tối đa khoảng 8MB.
  - Bản dọc 1080×1920 hoặc 720×1280 cho điện thoại, chọn qua `<source media>` hoặc JS.
  - Poster WebP lấy từ khung đầu.
- Đổi video sau này chỉ cần sửa một chỗ: `SITE.heroVideo = { desktop, mobile, poster }`.
- Dự phòng:
  - `prefers-reduced-motion` hoặc Save-Data: hiện poster tĩnh, không tự chạy.
  - Trình duyệt chặn autoplay (iOS chế độ nguồn điện thấp): hiện poster kèm nút phát.

## 6. Tiêu chuẩn thiết kế (BẮT BUỘC)
Cảm giác cần đạt: website nhà mốt đạt chuẩn Awwwards. Fashion, táo bạo nhưng tinh xảo, sinh động nhờ chuyển động và nhịp bố cục, KHÔNG nhờ màu mè. Ảnh và video là nhân vật chính.

### 6A. Typography
- Font: Google Fonts, BẮT BUỘC có subset `vietnamese`. Tối đa 2 họ font. Không dùng lại bộ font của bản cũ.
  - Display: serif tương phản cao kiểu thời trang. Ưu tiên `Bodoni Moda` nếu có subset vietnamese và dấu đẹp. Nếu không thì dùng `Playfair Display` hoặc `Cormorant`, chỉ dùng cho tiêu đề và chữ nhấn nghiêng.
  - Nội dung, menu, nút, nhãn: sans hiện đại, ví dụ `Inter Tight`, `Manrope` hoặc `Be Vietnam Pro` (400, 500, 600).
  - Không dùng weight 800–900.
- Chữ rất lớn (kinetic type, chữ chồng sau người mẫu, wordmark ở footer):
  - Được phép lớn tới 12–18vw, NHƯNG chỉ dùng cho từ ngắn không dấu (HARMAY, STUDIO, tên bộ sưu tập, LOOK 01).
  - KHÔNG dùng cỡ này cho câu tiếng Việt.
- Thang chữ (dùng `clamp()`):
  - Body 16px, line-height 1.6. Chữ phụ 14px.
  - H1 tiếng Việt: 34px → tối đa 64px, line-height 1.1.
  - H2: 28px → 44px. H3: 20–24px.
  - Nhãn nhỏ: 11–13px, viết hoa, letter-spacing 0.14em.
  - Tên look hay sản phẩm: 15–16px, weight 500.
- Đoạn văn tối đa khoảng 60 ký tự mỗi dòng. line-height tiêu đề không dưới 1.1 để dấu không chạm dòng trên.
- Kiểm tra: chụp cận cảnh câu "Bộ sưu tập Thu Đông – Đường may thủ công, dáng đứng chuẩn". Dấu phải chuẩn, không rơi về font dự phòng.

### 6B. Bố cục, màu và hình ảnh
- Một ý tưởng xuyên suốt (ví dụ: sàn diễn – runway, xưởng may – đường chỉ và rập, phim thời trang). Mọi section kể tiếp câu chuyện đó.
- Bảng màu KHÁC bản cũ:
  - Nền trung tính (trắng phấn, xám đá lạnh, hoặc đen sân khấu cho các đoạn điện ảnh).
  - Thêm 1 màu nhấn sinh động rút từ ảnh khách (vd. đỏ son của bộ đầm đỏ, xanh ngọc).
  - Dùng màu nhấn tiết kiệm.
- Nhịp bố cục:
  - Xen kẽ section full-bleed, bất đối xứng, ảnh và chữ chồng lớp, ảnh tràn mép, khoảng trắng hào phóng.
  - Không lặp cùng một kiểu lưới thẻ cho mọi section.
- Ảnh luôn dàn dựng như ảnh tạp chí: crop có chủ đích, kích thước tương phản (một ảnh rất lớn đi cùng ảnh nhỏ), có thể chuyển ảnh sang đơn sắc rồi hiện màu khi hover.
- Chi tiết tinh xảo: đường kẻ mảnh, số thứ tự (01/04), nhãn mùa, icon nét mảnh đồng bộ, lưới khoảng cách 8px.
- Trên điện thoại phải đẹp ngang desktop: thiết kế riêng cho mobile, không chỉ dồn cột.

### 6C. Motion (khách rất thích, phải là điểm nhấn số 1)
Dùng GSAP + ScrollTrigger + SplitText/Flip (CDN ghim phiên bản). Có thể thêm Lenis để cuộn mượt (ghim phiên bản). Mỗi khoảnh khắc motion phải có lý do kể chuyện. Gợi ý (chọn và sắp nhịp, không nhồi tất cả):
- Intro wordmark → video hero → video co lại khi cuộn (mục 5).
- Tuyên ngôn thương hiệu hiện theo từng chữ hoặc dòng, chạy theo thanh cuộn (scrub).
- **Runway Experience** (theo pin Pinterest 2):
  - Section ghim. Các look xếp theo chiều sâu, look phía trước sắc nét, phía sau mờ và nhỏ dần.
  - Cuộn để đẩy từng look lên trước, kèm số "LOOK 01".
  - Cột bên hiện tên look, ngách, nút "Đặt may mẫu này".
- **Người mẫu tách nền chồng lên chữ lớn** (theo pin Pinterest 1): các lớp parallax với tốc độ khác nhau, kèm vài nét vẽ mảnh trang trí.
- Bộ sưu tập nổi bật dạng "chương" toàn màn hình như D&G, hoặc gallery ghim cuộn ngang. Ảnh lộ ra bằng clip-path khi vào khung.
- Danh sách ngách thời trang dạng chữ lớn. Desktop: hover hiện ảnh theo con trỏ. Mobile: chạm để mở.
- Quy trình may đo, thiết kế cho xưởng: các bước ghim và scrub theo cuộn.
- Marquee có tốc độ theo vận tốc cuộn. Chuyển trang mượt giữa các trang (màn che hoặc fade). Trên gallery ở desktop, con trỏ hiện chữ "Xem".
- Quy tắc:
  - Chỉ animate transform, opacity, clip-path, filter nhẹ.
  - Mỗi đoạn ghim không dài quá khoảng 150–250vh.
  - Không phá thanh cuộn và bàn phím. Mobile mượt, không giật.
  - `prefers-reduced-motion` thì tắt scrub và parallax, giữ fade ngắn.
  - Easing và duration thống nhất bằng token (chuẩn /transitions-polish).

### 6D. Cấm (dấu hiệu AI slop)
- Hero căn giữa "tiêu đề + 2 nút" trên gradient tím hoặc xanh. Hero bằng ảnh tĩnh thay cho video.
- Lặp lại bố cục hay bảng màu của bản ESER cũ.
- Icon emoji, clipart, thẻ bo góc đổ bóng giống nhau lặp khắp trang.
- Motion ngẫu nhiên, mọi thứ cùng fade-up một kiểu.
- Câu chữ sáo rỗng ("Nâng tầm phong cách", "Đẳng cấp vượt trội"…). Viết copy ngắn, có chất, giọng nhà mốt. Được xen một ít tiếng Anh cho nhãn.
- Bịa số liệu, năm thành lập, giải thưởng, đánh giá, đối tác: dùng placeholder `[[CẦN XÁC NHẬN]]`.
- Sao chép văn bản, ảnh, video, logo của web tham khảo.

## 7. Các trang (điều hướng được qua lại như web thật)
Nếu có `ESER-so-do-website.pdf` thì theo sơ đồ đó. Nếu không thì làm:
- `index.html` – Trang chủ:
  - intro + video hero;
  - tuyên ngôn;
  - bộ sưu tập hot nhất;
  - Runway Experience;
  - các ngách thời trang;
  - dịch vụ (Thiết kế cho xưởng / May đo riêng);
  - quy trình;
  - khối kêu gọi liên hệ.
- `bo-suu-tap.html` – Danh sách bộ sưu tập: mỗi bộ là một chương có ảnh bìa lớn, lọc theo ngách.
- `chi-tiet-bo-suu-tap.html?id=…` – Lookbook kiểu runway: cuộn qua từng look, modal xem nhanh, nút "Đặt may mẫu này" và "Nhắn Zalo".
- `dich-vu.html` – Hai phần:
  - "Thiết kế cho xưởng" (năng lực, quy trình hợp tác, form thuê thiết kế);
  - "May đo riêng" (các bước, đặt lịch đo).
- `gioi-thieu.html` – Câu chuyện Harmay Studio (dùng placeholder cho thông tin chưa có).
- `lien-he.html` – Form có ô chọn nhu cầu (Đặt may / Thuê thiết kế / Hỏi về bộ sưu tập). Bấm gửi chỉ hiện thông báo thành công.
- Chung cho mọi trang:
  - header tối giản, trong suốt trên video và đổi nền khi cuộn;
  - menu toàn màn hình có ảnh preview;
  - footer có wordmark lớn;
  - nút liên hệ nổi (Zalo, Messenger, Hotline); trên mobile là thanh liên hệ ở đáy màn hình.

## 8. Kỹ thuật và bàn giao
- HTML/CSS/JS thuần, không cần build, không backend. Thư viện (GSAP, Lenis…) nạp qua CDN có ghim phiên bản.
- Cấu trúc:
  - `assets/css/main.css` (design tokens ở đầu file: màu, font, khoảng cách, motion);
  - `assets/js/main.js` (object `SITE`, intro, video, motion chung);
  - `assets/js/data.js`;
  - `assets/img/`;
  - `assets/video/`.
- Xem thử bằng `npx serve .` hoặc `python3 -m http.server`. Đưa nguyên thư mục lên Cloudflare Pages được. KHÔNG tự deploy.
- `README.md`: cách xem thử, cấu trúc thư mục, cách thay video và ảnh, nguồn và giấy phép video, ảnh minh hoạ.
- `content-map.md`: nguồn của từng nội dung, ảnh nào còn logo ESER, và các mục `[[CẦN XÁC NHẬN]]`.
- Báo cáo cuối gồm:
  - ý tưởng thiết kế và điểm khác bản cũ;
  - font và thang chữ;
  - kịch bản motion;
  - các trang;
  - nguồn video;
  - những thứ cần khách cung cấp: logo, video thật, ảnh mới không có logo cũ, tên bộ sưu tập, thông tin liên hệ, sơ đồ website.
