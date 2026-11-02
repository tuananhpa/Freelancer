# SỔ TAY KIỂM THỬ GIAO DIỆN & DANH SÁCH LỖI CẦN TRÁNH (QA PREVENTION CHECKLIST)
*Dự án: HARMONY.STUDIO — Luxury Fashion Atelier*

---

## I. TỔNG QUAN 4 LỖI ĐÃ XẢY RA & NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE)

| STT | Lỗi quan sát được | Nguyên nhân kỹ thuật | Hậu quả người dùng | Giải pháp triệt để |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Chữ trùng màu nền / mờ / khó đọc** (Bộ sưu tập Rouge chữ đỏ trên nền hồng, trùng màu váy). | Khai báo biến `--cink` lấy từ mã màu chủ đạo của BST (`#9E1B17` đỏ đậm) và áp lên toàn bộ text trên nền tint (`#E7B2A8`), cộng thêm nhãn `[[CẦN XÁC NHẬN]]` viền đỏ. | Độ tương phản (contrast ratio) < 3:1. Nhìn nhức mắt, khó chịu, chìm chữ khi nhìn từ xa. | **Quy tắc Tương phản Độc lập**: Màu chữ nội dung (heading, body, label) luôn dùng màu than đậm (`#161413`) hoặc đặt trong thẻ thẻ nền mờ frosted glass (`backdrop-filter: blur`). Màu BST chỉ dùng cho watermark mờ (`opacity: 0.08`) hoặc đường kẻ accent. |
| **2** | **Thanh menu bị giật / nhảy khi cuộn** (Vừa có header vừa có sub-nav, khi cuộn qua thì header nhảy lên ẩn/hiện rung lắc). | JS bắt sự kiện cuộn `passedSubMenu = rect.top <= 4` rồi ép `header.classList.toggle('is-hidden')` kết hợp với animation `translateY(-101%)`. Khi cuộn ngập ngừng gần biên giới, header thụt vào thụt ra liên tục. | Giao diện bị rung giật, nhảy khung hình, gây ức chế khi lướt xem dịch vụ. | **Quy tắc Neo Tầng (Layered Sticky)**: Header chính giữ `position: fixed; top: 0`. Sub-navigation gắn `position: sticky; top: var(--header-h)` (72px). Tuyệt đối không giấu/hiện header đột ngột bằng JS khi người dùng đang xem sub-menu. |
| **3** | **Khung hiển thị Look bị tràn khung / mất nút** (Mỗi Look trong Lookbook bị kéo dài quá 1 viewport, nút bấm bị cắt xén ở đáy). | Khung `.lb-item` và ảnh `.lb-item__fig` dùng `height: min(70svh, 540px)` kết hợp với padding lớn và danh sách chi tiết dài, khiến tổng chiều cao vượt quá `100vh - 72px`. | Người dùng lướt chuột thì thấy nửa Look này nửa Look kia, nút "Đặt may", "Nhắn Zalo" bị cắt mất một nửa dưới đáy màn hình. | **Quy tắc Single Viewport Fit**: Giới hạn khung `.lb-item` vừa khít màn hình `calc(100svh - var(--header-h))`. Scale ảnh người mẫu `min(58svh, 460px)`, giảm padding và khoảng cách dòng để toàn bộ Ảnh + Tiêu đề + 4 thông số + 3 nút bấm luôn hiển thị trọn vẹn trong 1 khung hình duy nhất trên mọi màn hình từ 1366px trở lên. |
| **4** | **Footer bị kéo giãn quá xa, khoảng trống mênh mông, chữ bị lỗi font** (4 cột footer dàn hết bề ngang màn hình, khoảng cách tới logo to bất thường, nhãn `[[CẦN XÁC NHẬN]]` đỏ rực, lỗi ký tự `? HARMONY.STUDIO ?`). | 1) Grid footer dùng `repeat(4, 1fr)` trải dài 100% full-width màn hình 1440–1920px mà không có `max-width`. 2) Thẻ `<div></div>` trống chèn giữa grid và logo. 3) Ký tự tiếng Việt bị lưu bằng encoding ANSI/CP1252 gây lỗi mojibake. | Footer nhìn rời rạc, trống hoác, thiếu thẩm mỹ cao cấp của thời trang luxury. | **Quy tắc Đóng Khung Footer (Contained Footer)**: Giới hạn nội dung footer trong `max-width: 1200px; margin: 0 auto;`. Xóa sạch các div rỗng. Dùng UTF-8 chuẩn. Gỡ bỏ toàn bộ nhãn tạm `[[CẦN XÁC NHẬN]]`. |

---

## II. CHECKLIST 5 BƯỚC KIỂM THỬ TRƯỚC KHI BÀN GIAO (PRE-RELEASE CHECKLIST)

Khi tạo mới trang hoặc chỉnh sửa bất kỳ giao diện nào sau này, **BẮT BUỘC** đối chiếu checklist dưới đây:

### 1. Kiểm tra Độ tương phản & Màu sắc (Color & Contrast Audit)
- [ ] **Không tone-sur-tone chữ với nền**: Nền màu pastel (kem, hồng, xanh nhạt) thì chữ bắt buộc phải là màu tối đậm (`#111112` đến `#1E1D1B`). Không bao giờ dùng chữ đỏ trên nền đỏ pastel, chữ kem trên nền vàng kem.
- [ ] **Watermark nền**: Các chữ trang trí khổng lồ (ROUGE, CREME, NOIR, FLORA) chỉ để `opacity: 0.07 – 0.09` và `pointer-events: none`, không được nổi rõ hơn ảnh mẫu hay che khuất chữ đọc.
- [ ] **Vị trí ảnh người mẫu phụ**: Không bao giờ đặt ảnh người mẫu đứng đè lên khu vực chữ text / tiêu đề (như lỗi model 2 đè lên chữ Đỏ son trước đây).

### 2. Kiểm tra Cuộn & Thanh điều hướng Sticky (Sticky Navigation Protocol)
- [ ] **Không giật layout khi cuộn (No Layout Jitter)**: Khi trang có cả Header chính và Thanh Tabs phụ (như trang Dịch vụ), hai thanh phải xếp tầng mượt mà (`top: 0` và `top: var(--header-h)`).
- [ ] **Không gắn animation giấu header giật cục** khi cuộn qua tab menu.
- [ ] Thử cuộn lên/xuống chậm rãi tại ranh giới giữa 2 section để chắc chắn không có hiện tượng chớp giật (flickering).

### 3. Kiểm tra Khung hình đơn (Single Viewport / 100vh Fit)
- [ ] **1 Look = 1 Màn hình**: Khi xem Lookbook chi tiết từng mẫu, cuộn đến mẫu nào thì mẫu đó phải nằm gọn gàng 100% trong khung hình.
- [ ] **Nút bấm không bị cắn vào cạnh dưới**: Nút "Đặt may mẫu này", "Nhắn Zalo", "Phóng to" phải cách đáy màn hình tối thiểu 24px - 32px trên độ phân giải laptop tiêu chuẩn (1366x768, 1440x900, 1920x1080).
- [ ] Chiều cao ảnh không vượt quá `58svh` để chừa chỗ cho tiêu đề và các nút bấm.

### 4. Kiểm tra Độ co cụm & Bố cục Footer (Footer Proportions)
- [ ] **Có container giới hạn**: Toàn bộ cột footer, logo và dòng bản quyền phải nằm trong `max-width: 1200px` căn giữa màn hình. Không để cột thông tin bay dạt sang tận mép màn hình rộng 27 inch.
- [ ] **Khoảng cách vừa phải**: Khoảng cách giữa các khối trong footer chỉ từ `20px` đến `40px`. Tuyệt đối không để khoảng trống rỗng hàng trăm pixel.

### 5. Kiểm tra Dọn sạch Nhãn nháp & Mã hóa UTF-8 (Content Sanitization)
- [ ] **Xóa 100% nhãn nháp**: Không để sót bất kỳ chữ `[[CẦN XÁC NHẬN]]`, `TBC`, hay ghi chú nội bộ nào hiển thị ra giao diện người dùng cuối.
- [ ] **UTF-8 sạch sẽ**: Mọi ký tự tiếng Việt có dấu, dấu gạch ngang em-dash (`—`), ký hiệu bản quyền (`©`) phải hiển thị đúng chuẩn, không bị biến thành dấu hỏi chấm `?` hay ký tự lạ.
- [ ] Đường link Zalo, Hotline, Messenger, Hotline click vào phải mở đúng ứng dụng hoặc thực hiện cuộc gọi.

### 6. Kiểm tra Video 'Lookbook chuyển động' (Video Pan/Zoom Shake Prevention)
- [ ] **Tuyệt đối không dùng filter zoompan nội suy số nguyên**: FFmpeg zoompan làm tròn tọa độ x/y sang integer pixel khiến mỗi giây hình ảnh bị giật 1-2 pixel liên tục (tạo cảm giác rung lắc dữ dội).
- [ ] **Chuẩn lookbook thời trang cao cấp**: Giữ khung hình tĩnh sắc nét trên nền tint, sử dụng hiệu ứng chuyển cảnh mềm (xfade=fade:0.8s), đảm bảo hình người mẫu và đường may đứng yên tĩnh lặng sang trọng.
- [ ] **Đồng bộ ScrollTrigger + Lenis**: Trên section pin (như Hero), dùng scrub: true, anticipatePin: 1 thay vì đặt scrub: 0.5 đè lên lerp của Lenis để tránh hiện tượng rung lắc cao su (rubber-banding).

### 7. Kiểm tra Khoảng cách Phân tầng (Section Spacing & Absolute Children)
- [ ] **Không dính sát tiêu đề**: Các thẻ con tuyệt đối (position: absolute) trong section phân bước không được để 	op: 0 sát rạt tiêu đề cha.
- [ ] Luôn có margin-bottom: clamp(36px, 5vh, 64px) và đường viền phân cách mỏng (order-bottom) để nội dung các bước có không gian thở thoải mái, không bị cảm giác chật chội ('sát quá').
