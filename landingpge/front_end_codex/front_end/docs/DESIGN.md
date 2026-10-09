# HYTales frontend — 09/10/2026

## Mục tiêu và nguồn

Frontend phục vụ cuộc thi, thể hiện giải pháp truyền thông di sản bằng QR động. Nguồn nội dung: HYTales.md (master brief), Detailed_content.docx (định vị, mô hình, lợi ích), KỊCH BẢN NÔNG SẢN HƯNG YÊN.xlsx (câu chuyện/voice). Media gốc chỉ đọc, media tối ưu được đặt trong public/media.

## Thiết kế

Xanh vườn #294b35, xanh lá #405a37, trắng #ffffff, nền nhạt #f5f7f0, vàng nhãn #e8cf8f, chữ #24382b và chữ phụ #334638. Noto Serif self-host cho tiêu đề tiếng Việt mang tinh thần chuyện kể, Segoe UI cho thao tác. Nội dung chính 16–17 px, menu công khai 16 px/600 và dropdown 17 px, menu quản trị 15 px. Nội dung phụ chủ yếu 14–15 px; placeholder dùng cùng màu chữ phụ và không giảm opacity. Các đoạn kể chuyện, hành trình, mô tả sản phẩm/form dùng màu chữ chính như hero. Chữ trên nền tối dùng màu sáng, nhãn video và nút trên ảnh có lớp nền tối tăng độ rõ.

Timeline dùng số mốc theo dữ liệu thực, không cố định 4 cột. Mỗi mốc nối đến tâm mốc kế tiếp; mốc cuối không vẽ đoạn nối tiếp. Desktop nhiều mốc có vùng cuộn ngang riêng; mobile xếp dọc, đường nối cũng dừng tại mốc cuối. Một mốc không có đường nối; chưa có mốc thì ẩn cả section và link điều hướng. Trong admin, tab Hành trình hiển thị số mốc, nút thêm trên đầu và nút xóa từng mốc; số thứ tự tự cập nhật sau khi xóa.

Hero dùng video nông sản trong khung cong mềm, bỏ thẻ hộ chiếu nổi. Phát trực tiếp tắt tiếng, nút phát/âm thanh/toàn màn hình rõ ràng và dấu chọn phim. Chuyển bằng mũi tên/phím/vuốt; người xem chủ động đổi phim. Link câu chuyện tách khỏi điều khiển. Trạng thái tạm dừng được giữ, tạm dừng khi cuộn ra ngoài/ẩn tab, không autoplay khi giảm chuyển động hoặc tiết kiệm dữ liệu. Menu chuyển sang dropdown ở ≤1100 px để giữ cỡ chữ. Không sử dụng số liệu kinh doanh dự kiến như thành tích đã đạt.

## Luồng

Theme hiện tại là Day, giữ xanh vườn/trắng/vàng nhãn. Night dùng nền xanh tối #102018, bề mặt #192c21, chữ sáng #eff5e9 và chữ phụ #c7d5be; màu nút riêng #31583d để giữ chữ trắng rõ. Nút đổi theme cạnh VI/EN, icon khi màn hình nhỏ, lưu lựa chọn theo thiết bị và áp dụng trước khi render để tránh chớp theme. QR/asset nền tảng giữ màu phù hợp để quét/nhận diện.

Logo HYTales và các khung ảnh đều chỉnh vùng hiển thị được: ảnh câu chuyện, ảnh đại diện, gallery, poster/thumbnails, ảnh cảm nhận và ảnh hộ chiếu. Có tùy chọn lấp đầy/giữ toàn bộ, vị trí ngang/dọc và preset, preview trước khi lưu; file gốc không bị thay đổi. Lightbox hiển thị toàn bộ ảnh để xem rõ chi tiết. Widget dùng logo gốc của từng nền tảng, cho tải/chọn/gỡ logo tùy chỉnh và chỉnh vùng hiển thị.

Phần hero bỏ nhãn địa điểm, giảm khoảng cách trên/dưới và kéo nội dung lên. Đoạn kể chuyện dùng ảnh người trồng cam, kiến trúc trong phim Phố Hiến và mùa nhãn từ kho dự án, thay cho hai cột chỉ có chữ. Widget liên hệ dùng vùng cuộn riêng cho các nút; tooltip nằm bên ngoài với chiều rộng theo nội dung để không bị bó/cắt chữ. Trang quản trị Hỏi đáp nhanh chỉnh được bộ chung và bộ từng sản phẩm, lời chào, thứ tự và trạng thái hiển thị, kèm xem trước trước khi lưu.

- `/`: giới thiệu dự án, ba đặc sản, cơ chế hộ chiếu, giải pháp cho HTX, kết nối.
- `/p/:slug`: năm khối theo master brief: video/định danh, chuyện/ảnh, timeline, phim ngắn, CTA/đánh giá. Không yêu cầu đăng nhập.
- `/admin/login`: vào phiên quản trị demo khi dùng mock; form xác thực backend khi dùng api.
- `/admin`: quản lý sản phẩm/lô, CMS khối, QR, số liệu demo, hộp thư, yêu cầu mua, đánh giá, thiết lập liên hệ.

## Ranh giới

Frontend không cung cấp xác thực an toàn, truy xuất được kiểm chứng hay analytics thật. Mock localStorage chỉ để trình diễn, phiên demo trong sessionStorage. API mode sử dụng cookie HttpOnly do backend cấp và kiểm tra `/auth/me`. Backend bắt buộc phân quyền mọi endpoint admin. QR tạo thật cho URL ổn định; analytics/đổi đích là trách nhiệm backend.

## Khả năng kiểm tra

Build TypeScript, unit test dữ liệu/service, thử desktop/mobile, truy cập URL sản phẩm trực tiếp, form/đánh giá/admin/save/reload, QR xuất SVG/PNG/PDF. Hero có poster, chỉ tải phim đang chọn, thư viện phim tải khi mở. Kiểm tra carousel bằng `npm run test:hero`.
