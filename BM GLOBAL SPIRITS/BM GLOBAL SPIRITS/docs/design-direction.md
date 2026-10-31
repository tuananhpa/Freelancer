# BM Global Spirits — Hướng thiết kế

## 1. Ý tưởng: "Vệt sáng"

Logo BM được cắt bởi **một nét chéo** chạy từ góc dưới trái lên góc trên phải (≈ 57°). Nét chéo đó là thứ duy nhất chỉ BM có — đối thủ nào cũng có chai, có hầm rượu, có màu vàng đồng, nhưng không ai có nét cắt này.

> Trên website này, **nét chéo trong monogram BM** trở thành **vệt sáng rọi xiên vào từng chai rượu trong bóng tối**.

Mỗi chai được đặt trong một "hốc tủ" tối như hầm rượu. Một vệt sáng chéo đúng góc của logo rọi phía sau chai; màu của vệt sáng lấy từ chính màu rượu/nhãn của chai đó (đo tự động khi xử lý ảnh), nên whisky hắt ánh hổ phách, gin hắt ánh lục, Campari hắt ánh đỏ. Dưới chai là mặt kính đen phản chiếu và bóng tiếp xúc. Toàn site là một dãy hốc tủ được chiếu sáng — từ hero, danh mục, sản phẩm nổi bật đến từng thẻ trong catalog 615 chai.

**Thứ sống được (live thing):** ở hero, khách chọn một dòng rượu (Single Malt, Cognac, Gin, Rum, Tequila, Sake, Rượu Việt…) — chai trong hốc đổi, vệt sáng đổi màu theo rượu, và dòng chú thích cho biết con số thật: "1 trong 167 chai Single Malt đang có". Dữ liệu lấy thẳng từ catalog.

## 2. Ba hướng đã cân nhắc

| Hướng | Mô tả | Kết luận |
|---|---|---|
| A. Hầm rượu & thùng gỗ | Ảnh không khí hầm đá, thùng sồi, ánh nến; chai đặt trên kệ gỗ. | Gần với mọi nhà phân phối rượu (và với web tham khảo). Cần ảnh không khí chất lượng — môi trường làm việc không tải được ảnh Unsplash/Pexels. Loại. |
| B. Bảo tàng / tiêu bản (specimen catalogue) | Mỗi chai là một tiêu bản trên ô màu phẳng, cùng tỉ lệ, cùng góc — catalogue chính là trang. | Rất hợp với 615 ảnh đã chuẩn hoá cùng chiều cao. Nhưng nền màu phẳng sáng làm mất chất "rượu mạnh cao cấp" và không đáp ứng yêu cầu ánh sáng – bóng – phản chiếu. |
| **C. Vệt sáng (chọn)** | Lấy bố cục tiêu bản của B (mỗi chai một ô, cùng tỉ lệ, cùng góc), nhưng mỗi ô là một hốc tối được rọi bằng vệt sáng chéo của logo, màu sáng theo rượu. | Mang được ý tưởng riêng của BM (nét chéo), biến 615 ảnh sản phẩm thành chất liệu chính (không phụ thuộc ảnh stock), đáp ứng yêu cầu dàn dựng như ảnh quảng cáo. **Chọn.** |

Hướng do skill design-taste-frontend chia: `specimen-catalogue` (seed 1925028642), giữ màu và font của thương hiệu (`--keep palette,type`).

## 3. Moodboard bằng lời

- Phòng thử rượu lúc 10 giờ tối: tường tối màu gỗ sồi đã hun, một đèn rọi duy nhất chiếu xiên.
- Thuỷ tinh hổ phách bắt sáng ở vai chai; nhãn giấy dày hơi ánh lên.
- Mặt quầy đá đen bóng, phản chiếu mờ đáy chai.
- Chữ khắc trên nắp hộp gỗ: serif cổ điển, khoảng cách rộng, không phô trương.
- Tem thuế, nhãn cổ chai, phiếu xuất kho — những vật in ấn của nghề nhập khẩu rượu (dùng cho khối liên hệ dạng "phiếu").

## 4. Bảng màu

Lấy từ chính logo (dải vàng đồng) và màu chủ đạo của web tham khảo (đỏ rượu vang `#6B1E2B`, lấy từ `theme-color`). Không lấy font của web tham khảo.

| Vai trò | Token | Mã |
|---|---|---|
| Nền chính (hầm) | `--c-night` | `#0E0B09` |
| Mặt nền nâng 1 | `--c-cellar` | `#17120E` |
| Mặt nền nâng 2 (gỗ sồi hun) | `--c-oak` | `#221A14` |
| Chữ trên nền tối (ngà) | `--c-ivory` | `#F2EADD` |
| Chữ phụ trên nền tối | `--c-soft` | `#B9AB95` |
| Nhấn — vàng đồng logo | `--c-gold` | `#C9974B` |
| Vàng sáng (điểm sáng logo) | `--c-gold-hi` | `#E4BE6C` |
| Đỏ rượu (từ web tham khảo) | `--c-claret` | `#5E1B27` |
| Đỏ rượu sâu | `--c-claret-deep` | `#3A1119` |
| Xanh chai (ô thứ ba của tiêu bản) | `--c-bottle` | `#17231C` |
| Nền sáng (giấy nhãn) | `--c-paper` | `#F2ECE2` |
| Chữ trên nền sáng | `--c-ink` | `#1B150F` |

Tỉ lệ: ~75% nền tối, ~15% đỏ rượu/xanh chai cho các ô và một section đổi trường màu, ~8% nền giấy sáng (câu chuyện thương hiệu), vàng đồng chỉ ở hành động chính, đường kẻ mảnh và điểm nhấn số liệu.

## 5. Font (theo mục 5A của brief — ưu tiên hơn skill)

- Tiêu đề: **Cormorant Garamond** 500 (H1, H2) / 600 (H3, tên lớn). Đã chụp kiểm tra câu "Rượu Whisky Single Malt hảo hạng – Xuất xứ Scotland": dấu chồng (ấ, ợ, ữ) chuẩn, không rơi về font dự phòng → không cần Playfair.
- Nội dung, menu, nút, nhãn: **Be Vietnam Pro** 400 / 500 / 600.
- Google Fonts, có `subset=vietnamese`.

Thang chữ (clamp):

| Cấp | Mobile → Desktop | Line-height |
|---|---|---|
| H1 (chỉ hero) | 36px → 60px | 1.1 |
| H2 | 28px → 40px | 1.15 |
| H3 | 20px → 24px | 1.2 |
| Body | 16px | 1.65 |
| Phụ | 14px | 1.55 |
| Nhãn nhỏ | 12–13px, viết hoa, tracking 0.12em | — |
| Tên sản phẩm trên thẻ | 15–16px, 500 | 1.35 |

Tiêu đề tracking −0.01em; đoạn văn tối đa ~62ch.

## 6. Nhịp bố cục trang chủ

| # | Section | Bố cục | Nền |
|---|---|---|---|
| 1 | Hero | Chữ neo trái dưới; nửa phải là hốc sáng lớn với chai đổi theo dòng rượu đã chọn (live thing) | tối |
| 2 | Danh mục | Một dải hốc cùng chiều cao, một hốc được nâng cao gấp đôi (Whisky — 316 chai); dải tràn mép phải | tối nâng |
| 3 | Sản phẩm nổi bật | Lưới tiêu bản kèm "thẻ treo" màu (như thẻ giấy buộc cổ chai), màu thẻ luân phiên | tối |
| 4 | Câu chuyện | Chai lớn ghim (sticky) bên trái; ba chương cuộn bên phải đổi chai | giấy sáng |
| 5 | Thương hiệu & xuất xứ | Danh sách quốc gia dạng bảng hàng lớn, chai "trượt" xuống theo cuộn; dưới là bức tường tên ~170 thương hiệu chạy theo cuộn | đỏ rượu sâu → tối |
| 6 | Liên hệ | "Phiếu" đục lỗ như tem/nhãn cổ chai: tiêu đề trái, ba kênh liên hệ + form ngắn phải | tối |
| 7 | Footer | Lưới ô: câu khép, menu, giờ làm việc, liên hệ; hàng dưới là wordmark lớn + ô vàng "Nhắn Zalo" | tối |

## 7. Chỗ brief và skill khác nhau — cách xử lý

- Brief yêu cầu nền gradient tối, bóng đổ, phản chiếu để dàn dựng chai; skill cấm gradient/bóng. → Theo brief, nhưng **chỉ trong hốc chai** (vệt sáng, bóng tiếp xúc, phản chiếu); nút, thẻ, nền section vẫn phẳng.
- Brief cho phép đường kẻ mảnh và nhãn chữ hoa nhỏ; skill cấm. → Theo brief, dùng tiết chế: đường kẻ mảnh vàng đồng chỉ ở bảng thông số, form, footer; nhãn chữ hoa chỉ cho metadata (dung tích, danh mục), không đặt làm "eyebrow" trên mọi tiêu đề.
- Skill muốn chữ rất to; brief giới hạn H1 ≤ 60px. → Theo brief: sang nhờ tiết chế, chiều sâu bằng ánh sáng và khoảng trắng.
