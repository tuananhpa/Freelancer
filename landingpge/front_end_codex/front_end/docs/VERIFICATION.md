# Kiểm tra frontend — 09/10/2026

## Sửa thương hiệu và logo — 10/10/2026

- Brand trước đây chỉ thay ảnh trong biểu tượng tròn; giờ có full (toàn bộ ảnh logo) hoặc symbol (biểu tượng + tên/mô tả). Tên thương hiệu và mô tả sửa trong Thiết lập, mô tả trống được ẩn. Logo/tên/mô tả/kiểu hiển thị có xem trước và tự lưu riêng, đọc bản settings hiện tại trước khi ghi, queue giữ thứ tự cập nhật; không lưu các trường khác đang nhập dở.
- Browser context riêng đã kiểm tra upload không cần bấm Lưu thiết lập, tên/mô tả cập nhật và giữ khi reload; cả hai chế độ, thay/gỡ ảnh, gỡ ảnh vẫn giữ tên đã chỉnh, ẩn mô tả và mobile 390 không tràn ngang. 28 unit tests và TypeScript qua. Mock vẫn lưu theo origin/trình duyệt, không đồng bộ giữa localhost/tunnel hoặc thiết bị.

## Giá và upload logo — 10/10/2026

- Thêm priceVnd theo orderUnit vào form sản phẩm/bảng thông tin lô; chưa có giá hiển thị Liên hệ để biết giá. Không tự đặt giá seed. Kiểm tra số nguyên không âm/safe integer trước khi lưu mock/API; giá 0 vẫn được hiển thị.
- Lối tắt upload logo trong Thiết lập, dùng luồng ManagedImageEditor và Settings.brandLogo hiện có. Kiểm tra bằng browser context riêng: nhập/lưu 120000 VND / giỏ, tải lại trang vẫn có giá, mobile 390 không tràn ngang; upload WebP, lưu và logo thực sự tải trên header. Không thay dữ liệu phiên người dùng.
- 28 unit tests qua; TypeScript qua. PLAN đã bổ sung trường D1/API và quy tắc xóa giá/đơn vị.

## Nền Dark/mobile và nguồn video duy nhất

- Mobile dùng SVG riêng với viewBox 390×900, đặt lá dưới header thay vì cắt giữa canvas desktop; Dark dùng màu nét vẽ sáng, bỏ lớp phủ tối. Đã xem ảnh desktop/mobile ở Day/Night, không sửa kích thước/bố cục component. Ảnh kiểm tra: test-results/orchard-fixed-1440-night.png, orchard-mobile-night-final.png.
- Video phát/tải đều lấy cùng file gốc từ HYTales/Video. Không có video trong public/media, không chuyển mã hoặc tạo bản phát thứ hai. Vite dev hỗ trợ HEAD/Range qua danh sách ba URL cho phép; build đóng gói ba file vào dist/hytales-videos. PLAN bàn giao đã sửa nguồn import.
- TypeScript và production build qua; 22 unit tests qua, gồm kiểm tra chuyển đường dẫn cũ nhưng giữ nguyên nội dung admin đã sửa/video tự tải lên. test:hero qua. test:video-sources qua: cả ba file phát HEVC 1080×1920 trên Chrome Windows; byte đầu/cuối URL khớp file nguồn, HEAD đúng dung lượng, Range 206 và ngoài file 416. Chưa kiểm tra HEVC trên iPhone/Android thực tế.

## Khôi phục giao diện hero theo ảnh chủ dự án

- Đã đưa hero về khung video gọn theo tỷ lệ nguồn, vùng trồng/tên/link câu chuyện nằm trên video; caption “Từ phù sa…” nhỏ gọn. Gỡ ba ưu điểm và phần blur/info bên dưới. Các phần ghi bên dưới mục này là lịch sử kiểm tra các phiên bản trước.
- Trước khi khôi phục đã giữ bản sao các file thay đổi trong `.runtime/snapshots/hero-before-restore-20261009-125827/`. Media và dữ liệu admin không thay đổi.
- TypeScript, `test:hero`, `test:players` và `test:video-aspect` qua. Kiểm tra trực tiếp vị trí overlay nằm trong khung, video dọc có chiều rộng dưới 400px ở viewport 1440, caption không có khung rộng, không còn benefits/backdrop/info panel; đã xem ảnh desktop và kiểm tra mobile không tràn ngang. Các kiểm tra fullscreen/thoát, âm thanh, sidebar và ảnh timeline vẫn qua.

## Ba lợi ích được duyệt dưới phần giới thiệu

- Thêm đúng ba nội dung được chủ dự án duyệt: trao đổi giá với nhà vườn, kết nối người trồng, mở rộng đầu ra/nâng giá trị nông sản; có VI/EN. Caption “Từ phù sa…” chiếm toàn bộ chiều rộng cột trái và hiện cả trên mobile (CSS cũ từng ẩn phần này).
- Kiểm tra browser thực ở 360/390/768/1440 px: ba mục hiển thị, tiêu đề 20–21px, mô tả 18px, caption rộng bằng cột, không tràn ngang. Đã xem ảnh desktop/mobile/Night; `test:appearance` qua và build production qua.
- Đã chạy lại tunnel và xác nhận trực tiếp HTTPS: ba ưu điểm, cỡ chữ, caption mobile và chuyển Night hoạt động, không JavaScript exception. URL ở lượt này: `https://coordinate-national-ship-rely.trycloudflare.com`; URL hiện tại luôn lấy trong `.runtime/tunnel-url.txt`.

## Player, header, sidebar và ảnh hành trình

- `npm run test:players`: header public vẫn ở y=0 sau cuộn trên desktop/mobile; fullscreen thật trên Chrome và nút thu nhỏ; nút X/Escape thoát fallback khi API không có; gọi enter/exit và xử lý event của API video Safari qua stub. Kiểm tra fallback mobile phủ viewport 390×844, video giữ cùng DOM sau khi đóng, không khởi động lại player. API Safari dựa trên [Apple HTMLVideoElement](https://developer.apple.com/documentation/webkitjs/htmlvideoelement); đây là mô phỏng nhánh xử lý, **chưa kiểm thử Safari trên iPhone/iPad thật**.
- Nút âm thanh sản phẩm chỉ có icon, toggle thay trạng thái muted thật; sidebar kéo rộng, nhớ sau reload, thu gọn/mở rộng và đóng drawer mobile bằng vùng ngoài menu.
- Timeline: chọn ảnh thư viện, upload ảnh WebP vào IndexedDB, thêm/xóa khung ảnh, chỉnh contain/vị trí sang phải, lưu/reload và kiểm tra hai ảnh đều mở được. Lightbox mở ảnh lớn; gỡ một ảnh rồi lưu chỉ xóa placement đã chọn. Các dữ liệu kiểm thử trong context riêng, không sửa phiên admin của người dùng.
- Đã chụp và xem hero blur desktop, hero mobile, mở rộng mobile và ảnh timeline mobile. Video ngang với poster dọc là regression được phát hiện và sửa bằng aspect-ratio từ metadata; `test:video-aspect` qua lại ở 360/390/768/1440 px với video portrait/landscape, full duration/full resolution.
- Build production và TypeScript qua; 21 unit tests qua. Chạy lại `test:hero`, `test:players`, `test:video-aspect`, `test:appearance`, `test:admin`, `test:e2e`, `test:inquiry-chat`, `test:journey`, `test:carousel` đều qua, gồm tương phản chữ Day/Night và tính năng cũ.
- Ảnh timeline/backend metadata đã ghi bổ sung trong PLAN.md; chưa viết code backend. Blur chỉ là canvas nhỏ tối đa 8fps dùng cùng video, không hạ độ phân giải video chính. Chưa đo hiệu năng 4G thực tế.
- Đã build rồi mở lại tunnel và chạy `verify-shared.cjs` cùng `test:players` trên HTTPS thật: `https://equality-elvis-shades-strictly.trycloudflare.com`. Cả hai qua, không có JavaScript exception. URL tunnel có thể đổi khi mở lại; lấy URL hiện tại từ `.runtime/tunnel-url.txt`.

## Cập nhật video đầy đủ và giao diện trước phát hành

- `npm run test:video-aspect`: ba phim đầy đủ 1080×1920, thời lượng nhãn125,225s/vải90,465s/cam93,460s; khung home/product/modal đúng tỷ lệ ở360/390/768/1440px; thử video ngang640×360 cũng tự đổi sang16:9; seek gần cuối phim phát được. Phần transcript, ghi chú hành trình và nhãn demo không xuất hiện; mã seed legacy không bị trình bày như mã lô thật. Đã xem ảnh desktop/mobile.
- `npm test`:21 kiểm tra service qua. Sau cập nhật đã chạy lại `test:e2e`, `test:hero`, `test:admin`, `test:inquiry-chat`, `test:appearance`, `test:carousel`; các luồng chính, CMS/media, form/chat, QR, theme/khung ảnh và thanh trượt đều qua. Test hero chờ trạng thái player thay cho networkidle vì stream phim đầy đủ có thể giữ network hoạt động.
- `ffprobe` xác nhận độ phân giải/thời lượng mọi bản phát bằng bản gốc, H.264 phát web; bản HEVC original giữ riêng để tải, source HYTales không chỉnh. Khung video không dùng crop settings của ảnh để cắt phim.
- Dashboard không dùng analytics mẫu; ngày/chứng nhận chưa có vẫn để chờ cập nhật. Bỏ nhãn demo chỉ thay giao diện, không bổ sung backend hay xác thực server. Các mô tả preview/nhãn trong kiểm tra lịch sử bên dưới thuộc phiên bản trước cập nhật này.

## Các kiểm tra trước đó

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
