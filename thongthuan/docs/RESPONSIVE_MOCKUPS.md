# Bộ mockup responsive — CEC JSC

## Phạm vi hiện tại
8 màn hình website và 5 màn hình quản trị, tổng 39 bố cục trên desktop 1440 px, tablet 768 px và điện thoại 390 px. Các ảnh là định hướng thiết kế, chưa được duyệt để xây sản phẩm.

| Màn hình | Ảnh |
| --- | --- |
| Trang chủ | [01-home.png](mockups/01-home.png) |
| Giới thiệu | [02-about.png](mockups/02-about.png) |
| Sản phẩm | [03-products.png](mockups/03-products.png) |
| Nhà máy | [04-factories.png](mockups/04-factories.png) |
| Tin tức | [05-news.png](mockups/05-news.png) |
| Liên hệ · Maps | [06-contact-maps.png](mockups/06-contact-maps.png) |
| Chi tiết nhà máy | [07-factory-detail.png](mockups/07-factory-detail.png) |
| Gửi yêu cầu đặt hàng | [13-order-request.png](mockups/13-order-request.png) |
| Admin · Nội dung | [08-admin-pages.png](mockups/08-admin-pages.png) |
| Admin · Sản phẩm | [09-admin-products.png](mockups/09-admin-products.png) |
| Admin · Đơn hàng | [10-admin-orders.png](mockups/10-admin-orders.png) |
| Admin · Bản tin | [11-admin-news.png](mockups/11-admin-news.png) |
| Admin · Widget | [12-admin-widgets.png](mockups/12-admin-widgets.png) |

## Luồng đặt hàng đã chốt
Sản phẩm → chọn sản phẩm/số lượng → nhập họ tên, công ty (tùy chọn), số điện thoại, email/lời nhắn → gửi yêu cầu → admin xem sản phẩm đã yêu cầu và cập nhật trạng thái. Chưa thanh toán online.

## Maps và widget
- Liên hệ: map Vĩnh Hảo lấy từ iframe trên trang gốc; mở Google Maps và chỉ đường.
- Chi tiết nhà máy: map riêng theo cơ sở, không dùng chung pin. Map Phan Rang trong ảnh là minh họa bố cục, chưa xác nhận pin chính xác.
- Widget: lưu cấu hình nền tảng, liên kết công khai, cách nhúng/nút liên kết, trang và vị trí hiển thị, thứ tự, trạng thái. Chưa có URL tài khoản khách để nhúng nội dung thật.
- Gallery chỉ có Google Maps thật cho vị trí nguồn Vĩnh Hảo. Các thao tác admin trong ảnh chưa thực thi.

## Bằng chứng
Ảnh được tạo bằng công cụ ImageGen tích hợp; prompt đầy đủ lưu tại EXPANSION_PROMPTS.json. Mỗi ảnh đã được xem để kiểm tra đủ ba thiết bị và chức năng được yêu cầu. Chữ, thương hiệu và ảnh nhà máy minh họa cần chuẩn hóa khi code.

## Nguồn kỹ thuật
- Trang gốc: https://www.thongthuanseafood.com/lien-he
- Google Maps embed: https://developers.google.com/maps/documentation/embed/embedding-map
- Google Maps URL: https://developers.google.com/maps/documentation/urls/get-started
- TikTok embed: https://developers.tiktok.com/doc/embed-videos


## Kiểm tra bản xem trước (10/10/2026)
- HTTP 200 cho gallery và toàn bộ 13 ảnh; prompt JSON đọc được với 9 mục (8 ảnh mới/bổ sung + 1 lần sửa).
- Chuyển cả 13 màn hình và liên kết ảnh đúng; map tham chiếu chỉ hiện ở Liên hệ.
- Kiểm tra gallery ở 1440×1000, 768×1024, 390×844: không tràn ngang trang; phóng to nằm trong vùng cuộn ảnh.
- Sticky: menu nằm top 0 sau khi cuộn; tiêu đề không bị menu che trên tablet.
- Google Maps Vĩnh Hảo tải được bản đồ/pin trên điện thoại; ảnh bằng chứng lưu tại C:/Users/buiti/.codex/visualizations/2026/10/10/01a1235c-4d64-7a53-b7cc-b8effe831b47/cec-map-mobile.png.
- Đã trả viewport trình duyệt về kích thước ban đầu và giữ tab http://127.0.0.1:4173/.
- Phạm vi kiểm tra là gallery và ảnh mockup. Chưa kiểm tra CRUD/đặt hàng/backend vì những chức năng này chưa được triển khai.
