# BM Global Spirits — mockup website

Bản mockup để khách duyệt: trang chủ, bộ sưu tập 615 sản phẩm có lọc, chi tiết sản phẩm, giới thiệu, liên hệ, hộp xác nhận 18+.
HTML/CSS/JS thuần, không cần build. Không có backend, admin, database.

## Xem thử

```bash
cd "BM GLOBAL SPIRITS"
npx serve .            # hoặc: python3 -m http.server 8000
```

Mở `http://localhost:3000` (serve) hoặc `http://localhost:8000` (python).
Cần mạng để tải font Google Fonts và GSAP từ CDN; không có mạng trang vẫn hiển thị đủ nội dung, chỉ mất font và chuyển động.

Lần đầu vào sẽ gặp hộp "Bạn đã đủ 18 tuổi?". Muốn thấy lại: xoá `localStorage` khoá `bm-age-ok` (DevTools → Application) hoặc mở cửa sổ ẩn danh.

**Đưa lên Cloudflare Pages:** kéo thả nguyên thư mục (hoặc nối repo, build command để trống, output directory `/`). Thư mục `products/`, `scripts/`, `docs/` không cần thiết khi chạy — có thể loại ra để nhẹ hơn. Chưa deploy.

## Sửa thông tin liên hệ

Mọi số điện thoại, link Zalo/Messenger/Facebook, email, địa chỉ, giờ làm việc nằm trong **một object `SITE` ở đầu `assets/js/main.js`**. Sửa ở đó là cả site đổi theo. Giá trị hiện tại là giữ chỗ.

## Cấu trúc

```
index.html                  Trang chủ
san-pham.html               Bộ sưu tập (lọc danh mục/loại/thương hiệu/dung tích, tìm kiếm, sắp xếp, Xem thêm, xem nhanh; lọc lưu trên URL)
chi-tiet-san-pham.html      Chi tiết: ?id=<mã 4 số>, vd ?id=0352
gioi-thieu.html             Giới thiệu
lien-he.html                Liên hệ (form chỉ hiện thông báo gửi thành công)
assets/
  css/main.css              Toàn bộ giao diện; design tokens ở đầu file
  js/main.js                SITE + khung chung (header, mega menu, tìm kiếm, footer, nút liên hệ, 18+) + trang chủ, giới thiệu, liên hệ
  js/catalog.js             Logic trang bộ sưu tập
  js/product.js             Logic trang chi tiết
  js/data.js                Dữ liệu 615 sản phẩm — TỰ SINH, không sửa tay
  img/brand/                Logo vector hoá từ logo.png (mark.svg, word.svg…), favicon
  img/products/1200|600|300 Ảnh sản phẩm WebP nền trong suốt, khung 3:4, chai cùng chiều cao, cùng mặt kệ
  img/products/meta.json    Kích thước, màu chủ đạo, cờ cảnh báo của từng ảnh
scripts/
  process_images.py         Tách nền + cắt + chuẩn hoá + xuất WebP 3 cỡ (rembg isnet-general-use)
  build_data.py             Sinh data.js từ cây products/ (tên đẹp, dung tích, nồng độ, quy cách…)
docs/
  design-direction.md       Ý tưởng, 3 hướng đã cân nhắc, bảng màu, font, nhịp bố cục
  critique.md               Các vòng tự đánh giá
  contact-sheet.jpg         Toàn bộ 615 ảnh đã xử lý (viền đỏ = ảnh cần xem lại)
  screenshots/              Bộ ảnh chụp cuối (1440px và 390px)
content-map.md              Nguồn của từng nội dung và danh sách [[CẦN XÁC NHẬN]]
products/, logo.png         Ảnh gốc của khách (không sửa)
```

## Thêm / sửa sản phẩm

1. Thả ảnh vào `products/<danh mục>/<loại>/<thương hiệu>/<mã>_<tên-dung-tích>.jpg` theo đúng quy ước cũ.
2. `pip install "rembg[cpu]" pillow scipy` (lần đầu tải model ~180 MB).
3. `python3 scripts/process_images.py --src products --out assets/img/products` (chỉ xử lý ảnh mới; `--force` để làm lại hết).
4. `python3 scripts/build_data.py --src products --meta assets/img/products/meta.json --out assets/js/data.js`

Đến giai đoạn có trang admin, `data.js` sẽ được thay bằng dữ liệu từ hệ quản trị; cấu trúc từng sản phẩm đã sẵn (`id, name, cat, type, brand, ml, vol, abv, pack, nobox, rgb`).

## Font và thư viện

- Google Fonts: **Cormorant Garamond** 500/600 (tiêu đề) + **Be Vietnam Pro** 400/500/600 (nội dung), có `subset=vietnamese`. Dấu tiếng Việt của Cormorant đã được chụp kiểm tra, không cần Playfair.
- GSAP 3.13.0 + ScrollTrigger, nạp từ jsDelivr, ghim phiên bản.
- Không dùng framework, không cần build.

## Ảnh minh hoạ & nguồn

- **Ảnh sản phẩm:** của khách (`products/`). Đã tách nền (rembg, model isnet-general-use, giấy phép Apache-2.0), không chỉnh sửa nhãn.
- **Logo:** của khách, vector hoá từ `logo.png`.
- **Ảnh không khí (hầm rượu, quầy bar, thùng gỗ):** *chưa dùng ảnh nào.* Môi trường dựng mockup chặn truy cập Unsplash, Pexels, Wikimedia và Openverse, nên toàn bộ không khí được tạo bằng ánh sáng CSS quanh chai (vệt sáng, quầng màu, mặt kính phản chiếu, hạt film). Không có ảnh nào lấy từ web tham khảo.
  Nếu muốn bổ sung, hai vị trí hợp nhất: nền khối "Từ nhà chưng cất đến bàn tiệc" (thay hốc chai ghim bằng ảnh hầm rượu dọc 4:5) và đầu trang Giới thiệu (thay kệ chai). Ghi nguồn ảnh vào mục này.
- **Bảng màu:** lấy từ dải vàng đồng của logo và màu `theme-color` (#6B1E2B) của web tham khảo lux-wine.myharavan.com. Không lấy font, văn bản, ảnh, logo của web này.
