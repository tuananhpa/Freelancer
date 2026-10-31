# content-map — nguồn của từng nội dung

Ký hiệu nguồn:
- **[KH]** khách cung cấp (logo, ảnh sản phẩm, cây thư mục `products/`).
- **[TÊN FILE]** suy ra tự động từ đường dẫn/tên file ảnh bằng `scripts/build_data.py` (không bịa thêm).
- **[TÍNH]** con số tính trực tiếp từ dữ liệu catalog khi trang tải (đổi catalog là tự đổi).
- **[PT]** phổ thông — kiến thức công khai, cần khách xác nhận lại.
- **[COPY]** câu chữ do bên thiết kế viết cho mockup, khách duyệt lại giọng văn.
- **[[CẦN XÁC NHẬN]]** chỗ giữ chỗ, hiển thị trên trang bằng nhãn vàng nhỏ, phải thay trước khi chạy thật.

## 1. Dữ liệu dùng chung

| Nội dung | Nguồn | Ghi chú |
|---|---|---|
| Logo, monogram BM, wordmark | [KH] `logo.png` | Vector hoá thành `assets/img/brand/mark.svg`, `word.svg` (giữ đúng dải màu vàng đồng). |
| 615 ảnh sản phẩm | [KH] `products/` | Tách nền bằng rembg (isnet), cắt sát, chuẩn chiều cao, WebP 1200/600/300. Không chỉnh nhãn. |
| Tên sản phẩm | [TÊN FILE] | Ví dụ `0352_macallan-18-double-cask-2025-700ml-6pk` → "The Macallan 18 Double Cask 2025". Một số tên được sửa chính tả thương hiệu (Rémy, Patrón, Jägermeister, Hendrick's…) — danh sách trong `scripts/build_data.py`. |
| Danh mục / loại / thương hiệu | [TÊN FILE] | Theo thư mục `products/<danh mục>/<loại>/<thương hiệu>/`. |
| Dung tích | [TÊN FILE] | Token `700ml` → "700 ml", `1500ml` → "1,5 L". Không có token → ẩn trường (119 chai). |
| Nồng độ cồn | [TÊN FILE] | Chỉ khi tên file có `abvNN` (vd `abv58-6` → 58,6%). 551 chai không có → ẩn. |
| Quy cách thùng | [TÊN FILE] | Token `6pk`, `12pk` → "Thùng 6 chai". |
| "Không kèm hộp" | [TÊN FILE] | Token `no-box` / `no-case`. |
| Xuất xứ thương hiệu | [PT] **[[CẦN XÁC NHẬN]]** | Quốc gia của thương hiệu (Macallan → Scotland…). Thương hiệu không chắc chắn để trống (Kaibutsu, Amber Black, Czar's, Wall Street, Glen Turner, High Commissioner…). Bảng ở `ORIGIN` trong `scripts/build_data.py`. |
| Giá | — | Không có. Toàn site hiển thị "Liên hệ". |
| Màu vệt sáng của từng chai | [TÍNH] | Đo màu chủ đạo của chai khi xử lý ảnh (`meta.json`). |
| Số liệu 615 sản phẩm / 171 thương hiệu / 26 quốc gia / 316 whisky… | [TÍNH] | Tính từ `data.js` lúc tải trang. "26 quốc gia" phụ thuộc bảng xuất xứ ở trên. |

## 2. Thông tin liên hệ — object `SITE` trong `assets/js/main.js` (sửa một chỗ)

| Trường | Giá trị hiện tại | Trạng thái |
|---|---|---|
| Hotline | `0900 000 000` / `tel:+84900000000` | [[CẦN XÁC NHẬN]] |
| Zalo | `https://zalo.me/0900000000` | [[CẦN XÁC NHẬN]] |
| Messenger | `https://m.me/bmglobalspirits` | [[CẦN XÁC NHẬN]] |
| Facebook | `https://facebook.com/bmglobalspirits` | [[CẦN XÁC NHẬN]] |
| Email | `lienhe@bmglobalspirits.vn` | [[CẦN XÁC NHẬN]] |
| Địa chỉ showroom | "Số nhà, đường, phường, TP. Hồ Chí Minh" | [[CẦN XÁC NHẬN]] (cả thành phố) |
| Giờ làm việc | T2–T7 9:00–21:00, CN 10:00–18:00 | [[CẦN XÁC NHẬN]] |
| Tên pháp nhân, giấy phép kinh doanh rượu | trống | [[CẦN XÁC NHẬN]] (hiện ở chân trang) |

## 3. Theo trang

### Trang chủ `index.html`
| Khối | Nguồn |
|---|---|
| H1 "Rượu mạnh nhập khẩu, tuyển từng chai" + câu dẫn | [COPY]; "hơn 600 nhãn" lấy từ [TÍNH]. |
| Hốc sáng + bộ chọn "Soi một dòng rượu" | Chai đại diện chọn tay (`HERO_PICKS` trong main.js); số "1 trong 167 chai…" [TÍNH]. |
| Chọn theo dòng rượu | Danh mục + số chai [TÍNH]; chai đại diện chọn tay (`CAT_COVER`). |
| Tuyển chọn của BM (8 chai) | Chọn tay (`FEATURED`) — **khách nên chọn lại 8 chai muốn đẩy**. Không có chai nào bị đánh dấu ảnh lỗi. |
| Từ nhà chưng cất đến bàn tiệc | [COPY]. Điều kiện kho **[[CẦN XÁC NHẬN: điều kiện kho]]**, khu vực giao **[[CẦN XÁC NHẬN: khu vực giao]]**. |
| Thương hiệu & xuất xứ | [TÍNH] từ bảng xuất xứ [PT]. |
| Tất cả thương hiệu (A–Z) | [TÍNH]. |
| Phiếu hỏi giá | [COPY]; thời gian phản hồi **[[CẦN XÁC NHẬN]]**. Form chỉ hiện thông báo, chưa gửi dữ liệu. |

### Bộ sưu tập `san-pham.html`
Toàn bộ [TÊN FILE] + [TÍNH]. Bộ lọc lưu trên URL: `?cat=whisky&type=single-malt&brand=macallan,dalmore&vol=std&q=18&sort=name`.
Thứ tự "Nổi bật": theo danh mục, xen kẽ thương hiệu, chai đứng một mình trước chai có hộp; 9 ảnh cần xem lại xếp cuối (xem mục 4).

### Chi tiết `chi-tiet-san-pham.html?id=…`
Thông số chỉ hiện trường có dữ liệu (thương hiệu, danh mục, loại, dung tích, nồng độ, quy cách thùng, đóng gói, xuất xứ thương hiệu, mã). Ba góc xem trong "bộ ảnh" là cùng một ảnh gốc (toàn chai / cận nhãn / dưới ánh đèn) vì mỗi sản phẩm chỉ có một ảnh — **khách gửi thêm ảnh góc khác nếu có**. Ghi chú "Hình ảnh minh hoạ; bao bì có thể thay đổi theo lô nhập" [COPY].

### Giới thiệu `gioi-thieu.html`
| Khối | Nguồn |
|---|---|
| "Người đứng sau từng chai rượu" | [COPY]; năm thành lập **[[CẦN XÁC NHẬN: từ năm…]]**. |
| 4 con số | [TÍNH]. Không dùng số năm kinh nghiệm, số khách hàng, giải thưởng vì chưa có. |
| Cách chúng tôi làm việc | [COPY]; chứng từ/tem **[[CẦN XÁC NHẬN]]**, kho **[[CẦN XÁC NHẬN: điều kiện kho]]**, khu vực giao **[[CẦN XÁC NHẬN: khu vực]]**, hộp quà **[[CẦN XÁC NHẬN]]**. |
| Làm việc cùng BM | [COPY]; chính sách đại lý **[[CẦN XÁC NHẬN]]**. |
| Showroom | địa chỉ & giờ từ `SITE`; giờ mở showroom **[[CẦN XÁC NHẬN]]**. |

### Liên hệ `lien-he.html`
Kênh liên hệ từ `SITE`. Form (họ tên, SĐT, email, nhóm khách, chai quan tâm có gợi ý từ catalog, lời nhắn) chỉ hiện thông báo gửi thành công.
FAQ: câu "Vì sao không ghi giá" [COPY]; bán lẻ **[[CẦN XÁC NHẬN]]**; giao hàng **[[CẦN XÁC NHẬN: khu vực giao, thời gian, phí]]**; hoá đơn VAT **[[CẦN XÁC NHẬN]]**.

### Chung
- Hộp xác nhận 18+: [COPY], nhớ lựa chọn bằng localStorage (`bm-age-ok`).
- "Không dành cho người dưới 18 tuổi" ở chân trang, menu mobile, trang liên hệ.

## 4. Ảnh cần khách/thiết kế xem lại

Đã kiểm trên `docs/contact-sheet.jpg` (viền đỏ). Vẫn nằm trong catalog nhưng không đưa lên vị trí nổi bật, xếp cuối danh mục:

| Mã | Vấn đề |
|---|---|
| 0029 Ballantine's Finest 3 L | còn mảnh nền trắng bên trái |
| 0109 Chivas Regal 18 Mizunara | còn mảnh hộp rời |
| 0141 Dewar's 25 | còn chữ lạc bên trái |
| 0154 Don Julio Añejo | phần kính trong bị tách thành trong suốt |
| 0444 / 0447 Royal Salute 26 | còn vụn nhỏ cạnh chai |
| 0450 Royal Salute 62 Gun 1 L | còn nét viền hộp |
| 0472 Daishichi Shoka 1,8 L | còn ký tự lạc bên trái |
| 0548 The Glenlivet Founder's Reserve | ảnh gốc là hộp nằm ngang, khó nhận diện |

Ảnh gốc của các mã này nên được chụp/tách lại.

## 5. Ảnh không khí

Không dùng ảnh Unsplash/Pexels: môi trường làm mockup chặn truy cập các nguồn ảnh này (và cả Wikimedia/Openverse), nên toàn bộ hình ảnh là ảnh sản phẩm của khách được dàn dựng bằng ánh sáng CSS. Nếu muốn thêm ảnh hầm rượu/quầy bar, xem gợi ý vị trí trong README (mục "Ảnh minh hoạ").
