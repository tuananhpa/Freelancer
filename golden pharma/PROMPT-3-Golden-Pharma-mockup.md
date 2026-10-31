# Golden Pharma – HOÀN THIỆN BẢN MOCKUP GIAO DIỆN (gửi khách duyệt)

Mục tiêu: hoàn thiện bản mockup giao diện ĐẸP, cao cấp, chuyên nghiệp, trông như một website thật, để gửi khách duyệt và thuyết phục khách chốt.
Đây KHÔNG phải frontend hoàn chỉnh: không backend, không admin, không SEO, không test tự động. Frontend và backend hoàn chỉnh sẽ làm sau khi khách chốt mockup.

## 0. Tiết kiệm token (bắt buộc)
- Dựng MỚI HOÀN TOÀN, không có code cũ. Làm luôn, KHÔNG dừng chờ xác nhận, trừ khi thiếu dữ liệu bắt buộc.
- ẢNH ĐÃ XỬ LÝ XONG THEO YÊU CẦU CỦA KHÁCH, DÙNG LẠI, KHÔNG XỬ LÝ LẠI:
  - `public/products/<mã-sản-phẩm>/`: ảnh hoàn thiện (tách nền, nền trắng vuông), mỗi ảnh có WebP 400/800/1200 và JPG 1200, kèm file JSON mô tả;
  - `scripts/product-selection.json` và `docs/product-mapping.md`: danh sách 30 sản phẩm và cách nối ảnh ↔ sản phẩm trong `products.xlsx`;
  - `public/brand/`, `favicon.ico`, `apple-touch-icon.png`: logo và icon đã xuất sẵn;
  - `assets/`, `.work/`, `.venv/`, `scripts/process-images.py`: nguồn và công cụ xử lý ảnh, chỉ dùng khi cần xử lý thêm ảnh mới.
- Các ảnh `01.png`–`30.png` ở thư mục gốc là ảnh chụp màn hình nguồn của khách, KHÔNG dùng trên website.
- Không đọc toàn bộ file lớn, không mở từng ảnh. Đọc `products.xlsx` bằng script.
- Với mỗi skill, chỉ đọc phần liên quan trong SKILL.md.
- Tự kiểm tra bằng ảnh chụp: chỉ các trang chính, ở 2 kích thước 375px và 1440px, ảnh thu nhỏ.
- Báo cáo cuối ngắn gọn.

## 1. Skill sử dụng
| Skill | Dùng để |
|---|---|
| /design-taste-frontend | Hướng thiết kế và dựng giao diện (skill chính). Chọn hướng thiết kế cao cấp, chạy vòng nhìn và sửa trên ảnh chụp |
| /gsap-scrolltrigger | Vài chuyển động tinh tế: hero xuất hiện, reveal section. Tôn trọng `prefers-reduced-motion` |
| /transitions-dev | Giỏ hàng trượt ra, toast "Đã thêm vào giỏ", menu mobile, hover thẻ sản phẩm |
| /impeccable | Ở cuối: chạy `critique`; nếu giao diện còn nhạt thì chạy `bolder`; sau đó `polish` |
| /playwright-cli | Chỉ dùng để chụp ảnh tự kiểm tra |

## 2. Thông tin khách hàng
- Công ty: Công Ty Cổ Phần Quốc Tế Thú Y Vàng. Thương hiệu: Golden Pharma (thuốc và sản phẩm thú y).
- Địa chỉ: Tầng 4, lô 30-31 Liền kề 2, khu đô thị Đại Thanh, Xã Đại Thanh, TP Hà Nội
- Hotline/Zalo: 0968486985 · Email: goldenvet10@gmail.com
- TikTok: @thuyvanghanoi (Dược Phẩm Vàng) – https://www.tiktok.com/@thuyvanghanoi

## 3. Phong cách – THIẾT KẾ ĐẸP LÀ YÊU CẦU SỐ 1
- BỎ QUA yêu cầu "đơn giản, không cầu kỳ" trước đây của khách. Bản mockup trước làm theo hướng đơn giản nên trông sơ sài, thiếu chuyên nghiệp, và đã bị loại. Lần này giao diện phải ĐẸP, ấn tượng ngay từ cái nhìn đầu tiên, đủ sức thuyết phục khách chốt.
- Đẳng cấp hướng tới: một website thương hiệu dược phẩm cao cấp do agency thiết kế, KHÔNG phải template hay trang bán hàng sơ sài.
- Cụ thể:
  - Hero mạnh: bố cục có chiều sâu, ảnh sản phẩm làm nhân vật chính, tiêu đề lớn và có điểm nhấn, không phải banner phẳng.
  - Màu sắc: vàng thương hiệu (theo logo) làm điểm nhấn sang trọng, kết hợp một màu trầm (xanh đậm hoặc xanh rêu) tạo cảm giác uy tín. Dùng thêm các mảng nền nhạt, gradient tinh tế, khối màu xen kẽ để các section có nhịp.
  - Typography: cặp font có cá tính, phân cấp rõ, tiêu đề lớn và tự tin, hỗ trợ tiếng Việt đầy đủ.
  - Chi tiết chỉn chu: thẻ sản phẩm có chiều sâu (bóng, viền, trạng thái hover), khoảng trắng hào phóng, icon đồng bộ, góc bo và khoảng cách thống nhất.
  - Các khối tạo niềm tin: số liệu nổi bật, chứng nhận và cam kết chất lượng, quy trình, đối tượng sử dụng (gia súc, gia cầm, thú cưng). Nội dung chữ để giữ chỗ, không bịa số liệu thật.
  - Chuyển động tinh tế, có chủ đích, làm trang sống động mà không rối mắt.
  - Trên điện thoại phải đẹp ngang desktop, không chỉ là bản thu nhỏ.
- Tự kiểm tra: sau khi dựng xong, chụp trang chủ và trang chi tiết sản phẩm. Nếu trông giống template, phẳng hoặc sơ sài thì chỉnh lại trước khi bàn giao (tối đa 2 vòng).

## 4. Phạm vi mockup
Các trang, điều hướng được qua lại như web thật:
- Trang chủ: banner, danh mục, sản phẩm nổi bật, lý do chọn Golden Pharma, khối liên hệ nhanh.
- Danh sách sản phẩm: lưới sản phẩm, lọc theo danh mục, tìm kiếm, sắp xếp theo giá (chạy được trên dữ liệu mẫu).
- Chi tiết sản phẩm:
  - bộ ảnh theo bố cục ảnh mẫu `reference/sample-product.png`: ảnh chính lớn, hàng thumbnail bo góc bên dưới, thumbnail đang chọn có viền màu nhấn, ô "Xem thêm N ảnh", bấm vào ảnh mở lightbox;
  - giá, mô tả, chọn số lượng, nút "Thêm vào giỏ" và "Mua ngay", sản phẩm liên quan.
- Giỏ hàng dạng drawer → trang đặt hàng (họ tên, SĐT, địa chỉ, ghi chú; thanh toán khi nhận hàng) → trang xác nhận đơn. Chỉ là giao diện, dữ liệu giỏ lưu localStorage.
- Giới thiệu; Liên hệ (form chỉ hiện thông báo gửi thành công, bản đồ Google Maps nhúng theo địa chỉ).
- Nút chat nổi: Zalo (https://zalo.me/0968486985), Hotline (tel:0968486985), TikTok; Messenger để giữ chỗ.
- Nút chuyển VI/EN trên header. Riêng bản tiếng Anh chỉ cần làm cho trang chủ, đủ để khách thấy tính năng song ngữ.

Dữ liệu:
- 30 sản phẩm theo `scripts/product-selection.json`, lấy thông tin (tên, giá, mô tả) từ `products.xlsx` bằng script. Gom vào một file JSON.
- KHÔNG bịa công dụng, liều dùng, thành phần thuốc; thiếu thì ẩn trường.

Ảnh sản phẩm: dùng ảnh đã xử lý trong `public/products/` (xem mục 0), không xử lý lại.

Không làm: admin, backend, database, SEO, test tự động, thanh toán online.

## 5. Kỹ thuật
- Dùng Astro + Tailwind, xuất static, để sau phát triển tiếp thành bản hoàn chỉnh.
- Nội dung chữ và dữ liệu mẫu để trong file JSON riêng, không rải trong component, để dễ sửa theo góp ý của khách.
- Build ra bản static để tôi deploy xem trước lên Cloudflare. KHÔNG tự deploy.

## 6. Bàn giao
- `npm run dev` chạy được; `npm run build` ra thư mục tĩnh.
- README ngắn: cách chạy local, build và deploy bản xem trước lên Cloudflare.
- Báo cáo tối đa 15 dòng: đã làm gì, các trang có trong mockup, thông tin cần khách cung cấp.
