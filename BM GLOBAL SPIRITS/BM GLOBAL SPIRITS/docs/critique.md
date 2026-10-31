# Các vòng tự đánh giá

Thang chấm theo skill design-taste-frontend (`references/critique.md`): design 40% · usability 30% · creativity 20% · content 10%.
Công cụ: chụp màn hình Playwright ở 1440 / 768 / 390 px với font thật; `inspect.mjs` của skill; detector của /impeccable.

Ý tưởng (một câu): *nét chéo trong monogram BM trở thành vệt sáng rọi vào từng chai rượu trong bóng tối, màu sáng lấy từ chính màu rượu.*
Thứ sống được: bộ chọn "Soi một dòng rượu" ở hero — đổi chai, đổi màu vệt sáng, đọc con số thật của dòng đó trong kho.

---

## Vòng 1 — trang chủ bản đầu

```
Seen in one second: chai Royal Salute xanh trong vệt sáng, bên trái tiêu đề serif.
Layout words: hero=split / cats=frame-run / feat=tag-grid / story=pinned-split / origins=list / brands=marquee+index / contact=coupon / footer=tiles
Scores: design 7 · usability 6.5 · creativity 7.5 · content 7 → 7.0
Caps: tiêu đề 3 dòng (≤6.5 nếu tính chặt)
Top 3:
1. Hero: bộ chọn dòng rượu đè lên cổ chai; H1 3 dòng ở 1440 và 4 dòng ở 390; trên điện thoại H1 rơi khỏi màn hình đầu.
2. Chai tối màu (Macallan M Black) chìm hẳn vào hốc tối; ảnh có hộp (Yamazaki 18) lọt vào "Tuyển chọn".
3. Câu chuyện thương hiệu có khoảng trống dài giữa các chương; nhiều tiêu đề phụ 3 dòng (story, coupon).
```
Sửa: dời bộ chọn xuống mặt kính, nới max-width H1, đổi chai tuyển chọn sang chai đứng một mình, sáng hốc mạnh hơn, giảm chiều cao chương, nới các tiêu đề.

## Vòng 2 — sau inspector

Inspector lần đầu báo 15 FAIL. Phần lớn có thật:
- nhãn nhỏ trên tiêu đề chương ("Tuyển chọn", "Bảo quản", "Trao tay") → xoá, tiêu đề tự nói;
- số đếm thương hiệu nằm trên tên quốc gia → chuyển sang cột phải;
- nút hover dùng gradient → đổi thành dải sáng phẳng;
- dải danh mục tràn mép phải → đưa tiêu đề lên trên, dải nằm gọn trong lưới; điện thoại chuyển thành lưới 2 cột;
- chữ dưới 13px, `[[CẦN XÁC NHẬN]]` 12,5px → nâng lên 13px;
- menu/tìm kiếm/drawer đóng vẫn để chữ ẩn trong trang → đóng hẳn bằng `display:none` sau chuyển động;
- ba ô liên hệ có icon trên đầu (dạng "icon card") → đổi thành danh sách hàng chữ.

Ngoại lệ có lý do, cho phép bằng `--allow`:
- `gradient`: brief mục 5B yêu cầu nền gradient tối, ánh sáng, phản chiếu để dàn dựng chai — chỉ dùng trong hốc chai.
- `focal-point`: brief 5A khoá H1 ≤ 60px; tiêu điểm là hốc sáng chiếm nửa màn hình đầu và chai cao ~70% chiều cao màn hình.
- `hairline`: brief 5B yêu cầu "đường kẻ mảnh" — chỉ dùng cho danh sách liên hệ, bảng thông số, thanh công cụ catalog.

```
Seen in one second: một chai whisky đứng trong vệt sáng chéo, bên phải là thực đơn dòng rượu.
Scores: design 8 · usability 8 · creativity 8 · content 7.5 → 8.0
Top 3 còn lại:
1. Hero điện thoại: các nút chọn đè lên chú thích chai → chuyển dock và bộ chọn thành dòng chảy bình thường dưới đáy hốc.
2. Catalog: nền mobile thanh công cụ 3 hàng, tên thẻ sản phẩm và "Liên hệ" chen nhau.
3. Trang Liên hệ không có ảnh nào → thêm kệ 4 chai ở đầu trang.
```

Các vòng sau (critique /impeccable, typeset, bolder, polish) ghi tiếp bên dưới.

## Vòng 3 — /impeccable critique (hai đánh giá độc lập)

Chạy theo quy trình của skill /impeccable: **A** — một tác tử chỉ xem ảnh chụp và mã, chấm theo kinh nghiệm thiết kế; **B** — một tác tử khác chạy detector của impeccable (quét file, quét URL qua CDP, overlay trong trình duyệt) và kiểm thử chức năng bằng Playwright. Hai bên không thấy kết quả của nhau.

**A — điểm Nielsen: 20/32** (H7, H10 không áp dụng cho trang thuyết phục). Đánh giá: phần dàn dựng chai là của riêng BM, phần khung xung quanh còn "template". Các vấn đề chính và cách đã sửa:

| Mức | Vấn đề | Đã làm |
|---|---|---|
| P1 | Màu hốc theo vị trí lưới (sồi/đỏ/xanh luân phiên) làm loãng ý tưởng "màu sáng lấy từ rượu" | Mọi hốc dùng chung một nền sồi tối; chỉ vệt sáng và quầng sáng mang màu của chai (đậm hơn). Thẻ treo một chất liệu duy nhất: giấy ngà, chữ mực. |
| P1 | Trang chi tiết là bảng thông số, trên điện thoại tên chai nằm dưới màn hình đầu | Tên + thương hiệu lên trên ảnh ở mobile; "Giá liên hệ" thành một dòng nhẹ; thêm khối "Ghi chú của BM" (dữ liệu thật + chỗ chờ ghi chú nếm); bỏ góc xem thứ ba trùng lặp; ẩn nút liên hệ nổi trên trang này. |
| P1 | Trang chủ đổ 171 thương hiệu A–Z giữa phễu | Thay bằng 24 thương hiệu nhiều chai nhất (chữ lớn, có số chai và xuất xứ) + nút "Xem cả 171 thương hiệu"; giữ một dòng chữ chạy theo cuộn. Bỏ dải vàng chói ở bảng xuất xứ; chai "trượt" giờ có vệt sáng riêng. |
| P2 | Bộ lọc: cuộn trong cuộn, chỉ thấy 1 thương hiệu | Bỏ khung cuộn con; hiện 10 thương hiệu nhiều chai nhất + "Xem tất cả"; tiêu đề nhóm viết thường bằng Cormorant; bỏ chữ "Liên hệ" trên mọi thẻ, thay bằng quy cách thùng. |
| P2 | Mobile: 9 nút chọn đẩy H1 xuống; chai ghim của câu chuyện rơi xuống cuối | Mobile còn 6 dòng rượu chính; chai ghim đặt ngay sau đoạn mở đầu. |
| — | Khoảng trống bên trái hero, hàng số liệu kiểu template | Bỏ hàng số liệu; vệt sáng giờ băng qua cả hai nửa hero, không còn đường ráp giữa. |
| — | 6 cách gọi nút hành động khác nhau | Thống nhất: "Hỏi giá qua Zalo" / "Gửi yêu cầu báo giá"; menu đổi "Cognac" thành "Rượu Việt". |
| — | Câu sáo "Từ nhà chưng cất đến bàn tiệc của bạn" | Đổi thành "Trước khi chai rượu đến tay bạn". |

**B — detector & kiểm thử chức năng:**
- Detector quét file: 10 cảnh báo `cramped-padding` — **dương tính giả** (các section tràn viền, nội dung nằm trong `.wrap` có lề).
- Detector quét URL: tương phản chữ "Liên hệ" trên thẻ giấy 3,9:1 → **đã sửa** (#6f4a1c); trang catalog nhảy h1→h3 → **đã thêm h2 ẩn** "Danh sách sản phẩm". Không bắt lỗi nào về gradient/bóng/đường kẻ trong hốc chai.
- Lỗi chức năng có thật, **đã sửa và kiểm lại bằng Playwright (6/6 PASS)**: menu mobile không đóng được bằng chạm; ngăn bộ lọc mobile không cuộn được (không tới được thương hiệu/dung tích); mega menu bị cắt ở màn 900px; hộp 18+, xem nhanh, tìm kiếm, ngăn lọc không giữ focus; nút lối tắt danh mục giữ lại bộ lọc thương hiệu cũ (ra 0 kết quả); thông báo gửi form không được đọc cho trình đọc màn hình.
- Thêm: lỗi form hiển thị ngay dưới ô (không dùng bong bóng mặc định), nút "Đang gửi…", ô số điện thoại kiểm định dạng.

## Vòng 4 — typeset → bolder → polish

- **typeset:** gom 15 cỡ chữ về 7 vai trò bằng token: H1 36→60 · H2 28→40 · H3 20→24 · lead 18 · body 16 · phụ 14 · nhãn 13. Tên sản phẩm 16/500. `text-wrap: balance` cho tiêu đề, `pretty` cho đoạn văn.
- **bolder** (một mục tiêu: khối câu chuyện): đổi thành sân khấu chia đôi — nửa trái là hốc chai cao hết màn hình, ghim suốt ba chương, chai đổi theo chương; nửa phải là chữ trên nền giấy. Dùng đúng thiết bị sẵn có của hệ (hốc + vệt sáng), không thêm màu hay font.
- **polish:** thanh cuộn, con trỏ nhập, màu chọn chữ theo bảng màu; vùng chạm ≥ 40px trên mobile; nút liên hệ nổi chỉ hiện sau khi cuộn qua header; danh mục mobile thành lưới 2 cột; chân trang thẳng lề với nội dung.

Inspector cuối (1440/768/390, cho phép `gradient`, `focal-point`, `hairline` vì brief yêu cầu): **0 FAIL ở cả 5 trang.** Cảnh báo còn lại và lý do giữ:
- `palette-cream`: chữ ngà #efebe5 trên nền tối — màu ngà rút từ dải vàng của logo, độ bão hoà thấp.
- `no-footage`: không tải được video (mạng bị chặn); ảnh sản phẩm là hình ảnh thật duy nhất.
- `off-centre`: lề phải đo theo mép chữ so le, không phải lỗi lề trang.
- `card-rows` (Giới thiệu): là danh sách hàng chữ có đường kẻ, không phải lưới thẻ.
- `grey-body`: chữ phụ màu ngà xám đạt 6,2:1.

```
ROUND 4 (cuối)
Seen in one second: một chai rượu đứng trong vệt sáng chéo, đúng góc nét cắt của logo.
Idea: nét chéo của monogram BM thành vệt sáng rọi vào từng chai; màu sáng lấy từ chính màu rượu.
Live thing: "Soi một dòng rượu" — đổi chai, đổi màu sáng, đọc số chai thật của dòng đó.
Layout words: hero=split-light / cats=frame-run / feat=tag-grid / story=split-stage(pinned) / origins=list+rider / brands=marquee+name-list / contact=coupon / footer=tiles
Scores: design 8.5 · usability 8.5 · creativity 8.5 · content 7.5 → 8.4
Caps applied: không
Còn thiếu (cần khách): ảnh không khí/footage thật, ghi chú nếm, thông tin liên hệ thật, ảnh chụp lại cho 9 mã lỗi.
```
