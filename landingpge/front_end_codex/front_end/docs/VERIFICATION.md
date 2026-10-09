# Kiểm tra frontend — 09/10/2026

- `npm run build`: TypeScript và Vite production build thành công.
- `npm test`: 21 kiểm tra service; lưu CMS/slug ổn định, mã lô tự tạo/sửa, xóa sản phẩm, đổi đích QR, cấu hình kênh liên hệ, lưu hỏi đáp/lời chào và bộ rỗng, chuyển thiết lập cũ sang mặc định, dữ liệu lỗi, phân tách review, yêu cầu mua, ẩn bản nháp, URL thiếu, HTTP 404/401 và response 204. Kiểm tra tên/số điện thoại không được chỉ chứa khoảng trắng, số lượng dương hữu hạn, sản phẩm/đơn vị bắt buộc, giữ snapshot yêu cầu sau xóa sản phẩm, gửi payload số lượng/đơn vị qua API.
- `npm run test:e2e`: browser Chromium với ngôn ngữ tiếng Việt; khách vào trực tiếp, admin redirect, timeline, gallery, form, review sau reload, FAQ đúng sản phẩm, hộp thư, CMS, trạng thái draft, đăng xuất.
- `npm run test:admin`: thêm/sửa/xóa/ẩn widget và tắt/bật toàn bộ; tạo mã lô tự động, sửa mã; chọn thư viện, tải ảnh/video, gỡ media, ảnh/video vẫn mở sau reload; video tải lên tự phát khi không giảm chuyển động; thêm/sửa/xóa sản phẩm, hủy xóa; chọn đích sản phẩm hoặc URL riêng, từ chối URL không hợp lệ, mã QR giữ nguyên; xóa và tải lại cùng logo.
- `npm run test:hero`: bỏ thẻ hộ chiếu nổi, phát phim trực tiếp tắt tiếng, điều khiển phát/tạm dừng/âm thanh/toàn màn hình, chuyển bằng mũi tên/dấu chọn/phím/vuốt; giữ lựa chọn tạm dừng khi đổi phim, dừng/phát theo vùng nhìn; giảm chuyển động chỉ phát khi bấm; đo menu và chữ nội dung; responsive 360/390/768/1024/1280/1440 px.
- `npm run test:content`: bỏ nhãn địa điểm và giảm padding hero; ảnh kể chuyện hiển thị thành lưới; nhãn Messenger đọc ngang, nằm trong viewport; admin thêm/sửa/ẩn/sắp xếp/xóa câu hỏi chung và theo sản phẩm, lời chào, VI/EN và lưu sau reload; responsive 360/390/768/1440 px. Có chụp và xem bố cục thực.
- Responsive: kiểm tra không tràn ngang ở 360, 390, 768 và 1440 px; chụp và xem giao diện thực.
- `npm run test:inquiry-chat`: bỏ thẻ ghi chú QR, chọn sản phẩm/số lượng/đơn vị tùy chỉnh, chặn thiếu tên hoặc số điện thoại không hợp lệ/số lượng 0, lưu payload và inbox, đổi đơn vị mặc định theo sản phẩm, viền focus đầy đủ và một vùng cuộn editor; nhiều lượt hỏi–đáp, giữ lịch sử khi đóng/mở, nhập câu hỏi cấu hình, gửi nhiều câu hỏi tự do, responsive 360/390/1440 px, xem ảnh thực.
- `npm run test:journey`: thêm/xóa mốc qua admin và lưu ra trang công khai, kiểm tra 7/4/2/1/0 mốc; đo đầu/cuối đoạn nối đúng tâm từng mốc, mốc cuối không có đoạn nối thừa; ẩn phần hành trình khi không có dữ liệu; chọn mốc cuối trên 360/390/768/1440 px. Rà tương phản chữ và placeholder trên nền phẳng của trang chủ, ba sản phẩm, các trang admin, các tab editor, form yêu cầu và chat (tối thiểu 4.5:1); xem ảnh timeline thực. Việc rà màu CSS này không thay thế kiểm tra toàn diện accessibility hoặc phép đo chữ trên từng khung hình video.
- QR: xuất PNG, SVG, PDF thật; giải mã PNG để xác nhận URL đúng, cả trước và sau khi chèn logo. Màu trắng/thiếu tương phản bị chặn.
- Đích ngoài website hiển thị tên miền trước khi mở. File demo trong IndexedDB chỉ có trên browser tải lên; backend media chưa chạy thực tế.
- Không có JavaScript exception trong lượt kiểm tra browser.
- Thanh trượt sản phẩm: `npm run test:carousel` kiểm tra 20 thẻ giữ một hàng và chiều cao giới hạn ở 360/390/768/1280/1440 px, không làm tràn ngang toàn trang; nút trước/sau vô hiệu đúng ở đầu/cuối, phím trái/phải/Home/End, vuốt bằng touch events trên browser mobile, danh sách 0/1/3 sản phẩm, link chi tiết và Day/Night. Đã chụp và xem ảnh desktop/mobile. Sau cập nhật đã chạy lại build, 21 unit tests, `test:e2e` và smoke test Cloudflare HTTPS thật.
- `npm audit --omit=dev`: không phát hiện lỗ hổng dependency production tại thời điểm kiểm tra.

## Giới hạn của kiểm tra

Lượt cập nhật Day/Night và chỉnh khung ảnh đã chạy lại toàn bộ các script browser cũ cùng `test:appearance`. Kiểm thử mới xác nhận theme cạnh VI/EN, đổi màu/nhớ sau reload, upload/chọn thư viện/gỡ logo HYTales và widget, các logo chính thức tải được, vị trí ảnh câu chuyện/ảnh kho/ảnh đại diện/gallery lưu đúng, QR sau chọn vùng logo vẫn giải mã đúng. Rà chữ Night trên homepage, sản phẩm, editor, thiết lập, QR, dashboard, inbox, hỏi đáp, chat và form liên hệ; kiểm tra layout 360–1440 px.

`node scripts/verify-shared.cjs` đã kiểm tra link Cloudflare HTTPS thật: home, asset logo, Day/Night, mobile, mở trực tiếp trang sản phẩm, bấm phát video, QR redirect và admin. Production preview chỉ phục vụ bản dist. Có script mở/tắt chia sẻ trong scripts và hướng dẫn LOCAL_SHARING.md.

Đây là frontend local, chưa có backend thực. Chưa chứng minh hiệu năng dưới 2 giây trên mạng 4G thật, chưa có lượt quét/người dùng thật, không xác minh hồ sơ lô hoặc chứng nhận. Form và chat demo chỉ lưu trong browser. Các tác vụ kiểm tra sử dụng browser context riêng, không thêm dữ liệu thử vào phiên browser của người dùng.

Kế hoạch bàn giao backend trong `../../backend/PLAN.md`; folder backend hiện chỉ có tài liệu, chưa có code. Thanh trượt hiện tải toàn bộ mảng sản phẩm của repository; pagination/API và đo mobile 4G thực tế là các bước triển khai ghi trong kế hoạch.
