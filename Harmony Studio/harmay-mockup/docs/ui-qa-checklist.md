# Sổ Tay Các Lỗi UI/UX Cần Tránh Khi Thiết Kế & Kiểm Thử (UI QA Lessons Learned)

Tài liệu này ghi nhận chi tiết 4 lỗi thực tế đã gặp trên dự án **HARMONY.STUDIO** để luôn đối chiếu khi code, chạy Playwright visual review và test giao diện ở các dự án sau — đảm bảo **không bao giờ lặp lại các lỗi này**.

---

## Lỗi 1: Chữ nội dung (Foreground Text) trùng màu với chữ trang trí nền (Giant Background Watermark)
- **Hiện tượng lỗi:**
  - Trong trang Bộ sưu tập (`bo-suu-tap.html`), chữ khổng lồ làm nền phía sau người mẫu (`ROUGE`, `JARDIN`, `ATELIER`, `SOIR` — `.cl-item__giant .mega`) dùng cùng mã màu `var(--cink)` (`#8A1117` đỏ đậm) ở độ đậm `100%` với khối chữ nội dung phía trước (`Đỏ Son`, tags `ĐẦM DỰ TIỆC`, mô tả, và nhãn `MẪU TIÊU BIỂU / LOOK 04`).
  - Khi chữ nội dung đè lên chữ `R` và `E` của `ROUGE`, hai lớp chữ hòa làm một, gây mù chữ và rất khó đọc.
  - Ngoài ra, selector `.cl-item .btn { background: var(--cink) }` ghi đè cả nút phụ `.btn--ghost`, làm 2 nút cạnh nhau biến thành 2 cục màu đỏ đặc giống hệt nhau.
- **Nguyên tắc phòng tránh bắt buộc:**
  1. **Tách biệt tuyệt đối màu chữ đọc (Foreground Ink) và chữ trang trí nền (Background Watermark):**
     - Chữ trang trí khổng lồ ở hậu cảnh (`.mega` watermark) **chỉ được để opacity `0.08 – 0.14`** (hoặc dùng stroke mảnh / màu lệch tông hẳn với chữ chính).
     - Chữ nội dung đọc (tiêu đề, mô tả, nhãn) trên nền màu sáng/pastel phải dùng màu mực tối tương phản cao (`#111112` — tỷ lệ tương phản $\ge 7:1$).
  2. **Bảo vệ khối chữ đè lên vùng giao thoa:**
     - Khi khối thông tin (`.cl-item__info`, `.cd-hero__meta`, `.cl-item__more`) nằm đè lên vùng có chữ lớn hoặc ảnh mẫu, bọc khối chữ trong nền kính mờ (`background: rgba(244, 241, 236, 0.84); backdrop-filter: blur(8px)`) để đảm bảo đọc rõ 100% ở mọi kích thước màn hình.
  3. **Không ghi đè `.btn--ghost` khi style `.btn` theo từng section:**
     - Luôn dùng `.section .btn:not(.btn--ghost)` cho nút chính để nút phụ (`.btn--ghost`) giữ nguyên kiểu viền trong suốt phân biệt rõ Chính – Phụ.

---

## Lỗi 2: Hai thanh Menu cùng lúc hoặc Header giật lên/xuống theo gia tốc cuộn (`scrollY` + Lenis)
- **Hiện tượng lỗi:**
  - Trên trang Dịch vụ (`dich-vu.html`), có thanh chuyển mục `.svc-tabs` (`01 · Thiết kế cho xưởng` / `02 · May đo riêng`) nằm dưới `.header`.
  - Code JS dùng công thức ẩn/hiện header theo tốc độ cuộn từng frame:
    ```js
    // LỖI CẤM DÙNG KHI CÓ LENIS SMOOTH SCROLL:
    header.classList.toggle('is-hidden', !open && y > 180 && y > lastY + 4);
    ```
  - Khi dùng Lenis smooth scroll, mỗi cú lăn chuột xuống ban đầu có `y - lastY > 4` (làm `.header` tụt lên), nhưng 200ms sau khi Lenis giảm tốc thì `y - lastY` giảm xuống `< 4` dù vẫn đang cuộn xuống — khiến `.header` lập tức trượt ngược xuống! Kết quả là mỗi lần kéo chuột xuống qua thanh `.svc-tabs`, thanh `.header` ở trên cứ nhấp nhô lên xuống (`động theo`) cực kỳ khó chịu.
- **Nguyên tắc phòng tránh bắt buộc:**
  1. **Không bao giờ dùng `y > lastY + threshold` trực tiếp trong `scroll` event khi có Lenis:**
     - Lenis làm mượt cuộn nên cuối mỗi nhịp cuộn `deltaY` luôn tiến về `0`, sẽ làm điều kiện `y > lastY + 4` đảo chiều liên tục.
  2. **Khi trang có thanh Sub-menu / Tab neo (`.svc-tabs`):**
     - Khi người dùng cuộn qua vị trí của thanh `.svc-tabs`, cho thanh `.svc-tabs` **stick cố định ở sát mép trên cùng (`top: 0`)**, đồng thời ẩn gọn `.header` dựa theo **tọa độ tuyệt đối** (`window.scrollY >= svcTabsTriggerY`) chứ không theo tốc độ cuộn.
     - Nhờ vậy, khi đã qua thanh sub-menu, chỉ có duy nhất 1 thanh cố định tuyệt đối ở đỉnh màn hình, kéo lên hay kéo xuống trong vùng nội dung đều đứng yên, không có thanh thứ hai nhấp nhô theo.

---

## Lỗi 3: Khung Lookbook / Card chi tiết quá cao, tràn khỏi 1 màn hình (1 Viewport)
- **Hiện tượng lỗi:**
  - Trên trang Chi tiết Bộ sưu tập (`chi-tiet-bo-suu-tap.html`), mỗi mục `.lb-item` để `padding: clamp(48px, 7vw, 112px)` và khung ảnh `.lb-item__fig` chiếm 6 cột với `aspect-ratio: 3 / 4` mà không giới hạn `max-height`.
  - Trên màn hình 1440×900, 6 cột rộng ~670px khiến khung ảnh cao tới **~893px** (cộng padding là **> 1.080px**), vượt quá chiều cao 1 khung hình!
  - Hậu quả: nút thứ 3 (`PHÓNG TO`) ở cột phải bị rớt dòng và bị cắt cụt ở mép dưới màn hình; nhãn số thứ tự `03 / 06` cạnh chữ `LOOK 05` bị ép hẹp gãy thành 3 dòng dọc (`03` / `/` / `06`).
- **Nguyên tắc phòng tránh bắt buộc:**
  1. **Mọi khối trưng bày từng sản phẩm/look (`.lb-item`) phải vừa gọn trong 1 khung hình (`100svh - header`):**
     - Khung ảnh dọc (`aspect-ratio: 3 / 4`) trên desktop **bắt buộc phải có `height: min(70svh, 540px); max-height: calc(100svh - var(--header-h) - 56px); width: auto;`** để không bao giờ tràn chiều cao màn hình.
  2. **Căn giữa trục dọc (`align-items: center`) cho 2 cột Ảnh – Thông tin:**
     - Không dùng `position: sticky` đẩy lệch cột chữ xuống dưới khi cả khối đã vừa 1 màn hình.
  3. **Chống gãy dòng cho nhãn đếm (`03 / 06`) và hàng nút CTA:**
     - Luôn đặt `white-space: nowrap; flex-shrink: 0;` cho nhãn số thứ tự (`03 / 06`).
     - Thiết kế kích thước nút vừa vặn (`height: 42px; padding: 0 16px; font-size: 11.5px`) để nhóm 2–3 nút hành động luôn nằm gọn trên 1 hàng ngang, không bị rớt dòng hay cắt mất ở đáy viewport.

---

## Lỗi 4: Footer hoặc Section dùng `min-height: 100svh` + `1fr` tạo khoảng trống chết khổng lồ
- **Hiện tượng lỗi:**
  - `.footer` đặt `min-height: 100svh; display: grid; grid-template-rows: auto 1fr auto;`.
  - Hàng `1fr` ở giữa giãn ra chiếm tới ~450px khoảng đen trống rỗng, đẩy 4 cột thông tin lên sát mép trên và chữ `HARMONY.STUDIO` xuống sát đáy màn hình, nhìn rời rạc và rất mỏi mắt khi cuộn.
  - Biến `--sec: clamp(88px, 12vw, 200px)` tạo khoảng cách 200px quá xa giữa các section.
- **Nguyên tắc phòng tránh bắt buộc:**
  1. **Cấm dùng `min-height: 100svh` với `grid-template-rows: auto 1fr auto` hoặc `justify-content: space-between` cho Footer / CTA ít nội dung:**
     - Footer phải có chiều cao tự nhiên theo nội dung (`min-height: auto; display: flex; flex-direction: column; gap: clamp(24px, 3.5vw, 40px); padding: clamp(40px, 5vw, 60px) var(--m) 24px;`).
     - Các thành phần trong cùng một khung phải liên kết chặt chẽ bằng khoảng cách hợp lý (`24px – 48px`), tuyệt đối không đẩy 2 đầu trên–dưới cách nhau cả nửa màn hình.
  2. **Giới hạn `--sec` (khoảng cách dọc giữa các section):**
     - Giữ trong khoảng `clamp(56px, 6.5vw, 96px)` thay vì `200px`.

---

## Checklist Tự Động Trước Khi Bàn Giao (Bắt Buộc Chạy Bằng Playwright)
1. **Kiểm tra độ tương phản chữ đè lên chữ nền (`.mega` watermark):**
   - Mọi watermark chữ lớn phía sau chỉ được có `opacity <= 0.15`.
2. **Kiểm tra cuộn qua Sub-menu / Sticky bar:**
   - Cuộn từng nấc 100px từ `y = 0` đến `y = 1200`: không được có hiện tượng 2 thanh menu cùng nhấp nhô hoặc `.header` trượt lên rồi trượt xuống ngay trong cùng 1 chiều cuộn.
3. **Kiểm tra chiều cao từng Card / Lookbook item (`getBoundingClientRect().height`):**
   - Chiều cao mỗi `.lb-item` hoặc `.cl-item` phải `<= window.innerHeight` (vừa trọn 1 khung hình `1440x900`), toàn bộ nút bấm trong card phải nằm trong viewport (`rect.bottom <= window.innerHeight`).
4. **Kiểm tra khoảng trống trong Footer & Section:**
   - Chiều cao `.footer` trên desktop `1440x900` phải gọn (`<= 520px`), khoảng cách giữa khối cột link (`.footer__cols`) và chữ thương hiệu lớn (`.footer__big`) phải `<= 48px`.
