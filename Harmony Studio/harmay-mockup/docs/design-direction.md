# Hướng thiết kế — HARMONY.STUDIO

## 1. Ba hướng đã cân nhắc (từ `design-taste-frontend`)

1. **`uneven-photographs` (Ảnh lệch cỡ như phòng tranh):** yên tĩnh, nhiều khoảng trắng, chữ nhỏ. *Loại* vì quá tĩnh so với yêu cầu khách "RẤT thích hiệu ứng cuộn và motion" và cần mở màn như D&G Alta Moda.
2. **`pinned-poster` (Poster ghim cố định):** một khung chữ giữ nguyên trong khi ảnh đổi bên dưới. *Hợp cho một section* nhưng nếu áp cho cả trang sẽ đơn điệu.
3. **`name-as-monument` + Chương sàn diễn (ĐƯỢC CHỌN):** tên thương hiệu và mã bộ sưu tập (`HARMONY`, `ROUGE`, `CREME`, `NOIR`, `FLORA`, `LOOK 01`) trở thành kiến trúc chữ khổng lồ (`18–25vw`) làm hậu cảnh cho người mẫu tách nền bước ra phía trước.

### Ý tưởng xuyên suốt
> **"Tại Harmony.Studio, từng bộ trang phục bước ra khỏi khung ảnh để đứng trực tiếp trên nền màu của chính nó — phía sau là chữ lớn như phông sân khấu, phía trước là đường chỉ đỏ dẫn lối từ bản rập cho xưởng đến chiếc đầm may theo số đo riêng."**

### Điểm khác hoàn toàn so với bản ESER cũ
| Hạng mục | Bản cũ (ESER) | Bản mới (HARMONY.STUDIO) |
|---|---|---|
| Mở đầu & Hero | 3 khung ảnh bo vòm + chữ ESER trên nền kem, có gắn giá | Intro màn đen → video `100svh` tự chạy → khi cuộn video thu vào khung như tấm vải mẫu, lộ chữ `HARMONY` phía sau |
| Bảng màu | Kem ngà `#f5efe6`, đồng thau `#8d6847`, đỏ rượu | Trắng phấn lạnh `#F1EFEA`, xám đá `#D4D6D8`, đen sân khấu `#0B0B0C`, nhấn **đỏ son `#C9241F`** rút từ bộ đầm đỏ Look 04 |
| Bố cục bộ sưu tập | Lưới thẻ đều nhau có viền | 4 chương toàn màn hình chồng lớp; người mẫu **tách nền** đứng đè lên chữ lớn (`ROUGE`, `CREME`, `NOIR`, `FLORA`) |
| Trải nghiệm lookbook | Thanh trượt ngang thông thường | **Runway Experience** theo chiều sâu (mẫu trước nét, mẫu sau mờ dần) + chấm màu thử trực tiếp + modal xem nhanh |
| Font chữ | Playfair + Cormorant + Be Vietnam Pro (3 họ) | **Prata** (display serif tương phản cao, đầy đủ tiếng Việt) + **Inter Tight** (sans hiện đại, 400/500/600) |
| Xử lý logo cũ trên ảnh | Để nguyên watermark ESER trên ảnh | Tách nền 18/18 người mẫu + cắt khung an toàn cho ảnh bối cảnh → **không còn bất kỳ chữ ESER nào hiển thị** |

---

## 2. Hệ thống chữ (Typography)
- **Display:** `Prata` (400) — nét cắt sắc kiểu Didone/Bodoni nhưng có bộ dấu tiếng Việt nguyên bản, không bị rơi về font dự phòng.
- **Nội dung & điều hướng:** `Inter Tight` (400, 500, 600).
- **Thang chữ:**
  - Chữ kiến trúc (`.mega`, chỉ dùng cho từ ngắn không dấu): `11vw` → `25vw`, `line-height: 0.84–0.9`.
  - `H1` tiếng Việt: `clamp(34px, 4.6vw, 64px)`, `line-height: 1.1`.
  - `H2`: `clamp(28px, 3.3vw, 44px)`, `line-height: 1.16`.
  - `H3`: `clamp(20px, 1.9vw, 24px)`, `line-height: 1.25`.
  - Body: `16px / 1.6`, độ rộng dòng ≤ `60ch`. Chữ phụ: `14px`. Nhãn: `12px`, viết hoa, `letter-spacing: 0.14em`.

---

## 3. Kịch bản chuyển động (Motion Score)
Toàn bộ dùng một bộ nhịp thống nhất (`hmOut = cubic-bezier(.22,1,.36,1)`, `hmInOut = cubic-bezier(.65,0,.35,1)`), chỉ biến đổi `transform`, `opacity`, `clip-path` và `filter`:

1. **Intro D&G Alta Moda:** từng ký tự `HARMONY.STUDIO` hiện dần trên nền đen sân khấu (1.65s), rồi mở màn che `clip-path` từ dưới lên. Chỉ chạy lần đầu mỗi phiên (`sessionStorage`), bấm/cuộn là bỏ qua ngay.
2. **Hero co khung khi cuộn:** ghim `95%` chiều cao màn hình; video phóng nhẹ `1.12` trong khi khung `clip-path: inset(...)` thu vào giữa trang, để lộ chữ `HARMONY` khổng lồ nằm sẵn trên nền trắng phấn phía sau.
3. **Tuyên ngôn & đường chỉ đỏ:** từng từ của câu tuyên ngôn sáng dần theo thanh cuộn (`scrub`), đồng thời đường chỉ đứt nét màu đỏ son tự khâu ngang qua trang (`stroke-dashoffset`).
4. **4 Chương bộ sưu tập chồng lớp:** mỗi chương `position: sticky; height: 100svh`; chữ mã chương (`ROUGE`, `CREME`, `NOIR`, `FLORA`), người mẫu chính và người mẫu phụ trượt parallax ở 3 tốc độ khác nhau.
5. **Marquee theo vận tốc cuộn:** dải chữ `HARMONY.STUDIO · RUNWAY` tăng tốc và đổi chiều theo lực lăn chuột (`ScrollTrigger.getVelocity()`).
6. **Runway Experience (đỉnh cảm xúc của trang):** ghim `220%` chiều cao; 10 người mẫu tách nền xếp theo chiều sâu trục Z. Cuộn trang hoặc bấm chấm màu ở đáy sẽ đẩy từng người mẫu tiến lên tiền cảnh (từ mờ sang sắc nét), cập nhật tức thì mã `LOOK`, tên mẫu và danh sách chi tiết bên phải.
7. **Danh sách 4 ngách thời trang:** trên desktop, ảnh đi theo con trỏ với độ trễ mềm và nghiêng nhẹ theo vận tốc ngang; trên mobile, chạm để mở khung xem trước mượt.
8. **Quy trình 4 bước (B2B / May đo):** ghim `170%` chiều cao; đường chỉ đỏ nối qua 4 nút `01 → 04` và đổi bước theo thanh cuộn, có thể chuyển qua lại giữa "Thiết kế cho xưởng" và "May đo riêng".
9. **Footer lộ dần:** phần thân trang trượt lên để lộ footer đen sân khấu cố định phía dưới với wordmark `HARMONY.STUDIO` căng tràn từ lề trái sang lề phải.
