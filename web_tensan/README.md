# TENSAN Việt Nam

Website giới thiệu sản phẩm theo thiết kế đã chọn, có mô hình bo mạch tách lớp 3D làm rõ keo tản nhiệt TENSAN TS1001.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm run build` tạo `dist/` và 39 trang HTML tĩnh, gồm các trang giới thiệu, danh mục, 29 sản phẩm, ứng dụng, bài viết, liên hệ và tuyển dụng. Mã giao diện ở `src/`, hình ảnh và font được lưu tại `public/assets/`.

## 3D và animation

Hero có năm banner theo thứ tự: nhà máy 2D, keo tản nhiệt TS1001 3D, keo đỏ SMT 2D, silicone LED 3D, kem hàn TS-350 3D. Mô hình được dựng thành hình học thật từ ảnh tham chiếu, có bao bì, nhãn CanvasTexture, xoay tự động/kéo xoay, nút xoay, lắp ghép/tách lớp và tạm dừng. Hai banner 2D có hoạt ảnh SVG/GSAP và nút dừng riêng. Mặc định tự trình chiếu: mỗi cảnh 3D xoay 3 giây sau khi sẵn sàng, lắp ráp 0,9 giây, giữ 0,7 giây rồi chuyển; ảnh 2D chạy 3 giây rồi chuyển. Có nút dừng/chạy toàn bộ; thao tác chuột hoặc focus trong nội dung dừng trình chiếu để xem thủ công. Đổi slide bằng nút sản phẩm, trái/phải, phím mũi tên hoặc vuốt ngoài vùng mô hình. Chữ điều hướng 16px trên desktop/13px trên mobile và khung mô hình được phóng lớn. Slide ẩn không nhận focus; WebGL và GSAP dừng khi ngoài màn hình/ẩn tab. Reduced motion tắt tự trình chiếu. Tài nguyên và bộ đếm được dọn khi chuyển trang.

Three.js dựng bo mạch, chip, lớp keo có bề mặt dàn keo, tản nhiệt nhôm và quạt chín cánh nghiêng có khung bảo vệ. Nhãn TS1001 bám đúng vị trí lớp keo khi xoay; thẻ ảnh thật liên kết tới trang sản phẩm. Mô hình tự xoay ngay khi vào trang, trừ khi thiết bị yêu cầu giảm chuyển động. Người dùng có thể tạm dừng, kéo xoay, xoay từng 30°, trở về góc ban đầu hoặc lắp ghép/tách lớp. Nút xem lớp keo dừng tự xoay và khôi phục góc nhìn tách lớp. Hình học tĩnh được gộp theo vật liệu để giảm số lượt vẽ. GSAP điều khiển chuyển cảnh và nội dung theo cuộn; có reduced motion, dừng khi ngoài màn hình/ẩn tab và dọn tài nguyên khi chuyển trang. Nếu WebGL hoặc tệp 3D lỗi tải, hiển thị sơ đồ SVG cùng liên kết sản phẩm. Mô hình minh họa nguyên lý, độ dày keo được phóng đại, không phải bản vẽ kỹ thuật sản xuất.

## Nội dung

Hero hiện hành có PCB nhiều lớp, đầu nối, tụ điện, chân đế, cụm 23 lá nhôm và ống đồng minh họa. Bề mặt kim loại dùng roughness texture dựng bằng mã; lớp keo màu xám phù hợp nội dung TS1001. Phần đầu có thẻ sản phẩm thật và bốn liên kết ứng dụng; các thay đổi bố cục bên dưới chỉ áp dụng cho trang chủ.

- 29 sản phẩm từ danh mục công khai của Tensan, lưu snapshot ở `docs/catalog-source.json`.
- `src/data.js` chứa nội dung đã biên tập; `src/catalog-imported.json` chứa phần danh mục bổ sung.
- Nguồn ảnh sản phẩm/logo/doanh nghiệp: `docs/ASSET_SOURCES.json` và `imageSource` trong dữ liệu nhập.
- `public/assets/applications.png`: hình ứng dụng minh họa do image_gen tạo, không phải ảnh nhà máy Tensan. Prompt được lưu trong `docs/ASSETS.md`.
- Thiết kế đã chọn: `docs/mockups/selected-design.png`.

## Liên hệ

Form liên hệ tạo bản nháp `mailto:` tới `contact@tensanvn.com`. Người dùng tự kiểm tra và gửi trong ứng dụng email. Website chưa có API tiếp nhận form, CRM, database hay trang quản trị. Không có giỏ hàng hoặc thanh toán.

## Cloudflare

```sh
npm run build
npx wrangler deploy
```

Cấu hình `wrangler.jsonc` triển khai static assets lên Worker riêng `tensan-vietnam`. Không sửa DNS hay website đang hoạt động tại tensanvn.com. Đăng nhập Wrangler bằng tài khoản Cloudflare trước khi triển khai từ máy khác. Xem kết quả kiểm tra và URL thực tế trong `docs/VALIDATION.md`.
