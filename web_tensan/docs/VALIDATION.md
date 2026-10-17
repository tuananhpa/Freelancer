# Kết quả kiểm tra TENSAN
Ngày: 2026-10-17 (Asia/Saigon)

## Phiên bản hiện hành
- URL: https://tensan-vietnam.tuananhha1710.workers.dev
- Cloudflare Worker: tensan-vietnam.
- Version: ed7c1afa-9e65-4eaa-8387-c90c3936679d.
- Người dùng yêu cầu giữ thiết kế bo mạch tách lớp, làm rõ lớp keo tản nhiệt. Phương án thay hero bằng bao bì đã được bỏ.
- Hero hiện hành: bo mạch/chip/keo TS1001/tản nhiệt nhôm, có nhãn chỉ đúng vị trí trên mô hình, ảnh TS1001 thật và liên kết sản phẩm.
- Wrangler xác nhận triển khai thành công; không đổi DNS hoặc website tên miền cũ.
- HTTP trang chủ hiện hành, TS1001 và trang ứng dụng: 200, có CSP; HTML trang chủ chứa dải ứng dụng mới. Chi tiết: thermal-cloudflare-checks.json. cloudflare-checks.json thuộc lượt triển khai trước.

## Kiểm tra đã thực hiện
- Lượt banner hiện hành: npm test 11/11 qua và npm run build tạo 39 trang. Bài kiểm tra điều hướng bao gồm quay vòng hai chiều và chỉ số không hợp lệ.
- Ba slide: TS1001 3D, silicone LED 2D-03, kem hàn TS-350 2D-04. Desktop 1440×1050 và mobile 375×812 không tràn ngang; ảnh tải thành công. Đã kiểm tra nút chọn slide, trái/phải, phím mũi tên và kéo ngang bằng công cụ browser ở kích thước mobile. Không dùng thiết bị cảm ứng thật.
- Liên kết banner TS350 mở đúng trang sản phẩm; slide ẩn có inert và aria-hidden. Source được reviewer độc lập rà soát, không có phát hiện quan trọng.
- Cloudflare: vòng 2D silicone → 2D TS350 → 3D hoạt động; nhãn mô hình đứng yên khi slide 3D bị ẩn; khi trở lại renderer=webgl, autoRotate=true. Không có console error trong lượt xác nhận. Ảnh: tensan-banner-carousel.jpg trong thư mục visualizations của chat.
- Lượt quạt trước: npm test 10/10 qua, npm run build qua và tạo 39 trang. Thêm kiểm tra cánh quạt không chạm cụm lá nhôm và nằm trong lỗ khung.
- Mô hình có quạt chín cánh nghiêng, khung, trục, ốc và viền xanh nhẹ. Ánh sáng được chỉnh giảm cháy bề mặt kim loại. Quạt và góc xem tự xoay từ lúc vào trang; autoRotateSpeed=1.1, trước đây 0.22.
- Bản Cloudflare mới: renderer=webgl; vị trí đường dẫn nhãn thay đổi khi tự xoay, đứng yên khi bấm dừng, bật lại được. Không có console error trong lượt kiểm tra này.
- Desktop 1440×1050 và mobile 375×812 không tràn ngang; mobile vẫn render WebGL, nút xem keo dừng xoay và đưa mô hình về góc tách lớp.
- Reviewer phát hiện khởi tạo gọi render trực tiếp sau khi đã lên lịch RAF có thể tạo hai vòng render. Đã sửa dùng wake() duy nhất; guard reduced motion được giữ và đồng bộ trạng thái nút.
- Ảnh Cloudflare hiện hành: tensan-fan-autoplay.jpg trong thư mục visualizations của chat. Các mục bên dưới ghi lại các đợt kiểm tra trước.
- npm test: 9/9 qua. Sáu kiểm tra nội dung/tìm kiếm/email; ba kiểm tra mới về gộp hình học, keo nằm giữa chip và tản nhiệt trong cả chuyển động lắp ghép, và toàn bộ mô hình nằm trong khung khi xoay ở các tỷ lệ màn hình.
- npm run build: qua, tạo 39 trang HTML tĩnh và giữ 29 sản phẩm công khai.
- Browser desktop 1440×1000, màn hình vừa 900×1000 và mobile 375×812: kiểm tra giao diện/mô hình, không tràn ngang.
- Đã thấy canvas thực sự render mô hình bo mạch và lớp keo; renderer=webgl trên localhost và Cloudflare.
- Kéo bằng chuột thay đổi góc mô hình; nhãn theo đúng điểm trên từng lớp.
- Lắp ghép/tách lớp thay đổi hình học và nhãn trạng thái. Nút xem lớp keo mở lại trạng thái tách lớp/góc ban đầu.
- Bản Cloudflare: kiểm tra nút lắp ghép và hotspot TS1001, không có console error trong lượt cuối.
- Touch-action cho phép cuộn dọc/phóng to trang; chưa thử thao tác cảm ứng trên điện thoại thật.
- Reviewer độc lập phát hiện hotspot nằm trong role=img; đã sửa sang role=group. AX browser đã thấy hotspot là button có tên.
- Hình học tĩnh được gộp theo vật liệu; bài kiểm tra giữ tổng mesh dưới 25 để tránh hàng trăm lượt vẽ linh kiện riêng.
- Ảnh desktop Cloudflare và ảnh mobile được lưu trong thư mục visualizations của chat: tensan-thermal-desktop.jpg, tensan-thermal-mobile.jpg.
- Các luồng danh mục, tìm kiếm, liên hệ, trang giới thiệu và menu đã được kiểm tra ở đợt trước; lần này thay hero, không thay luồng đó.

## Giới hạn
- Mô hình giải thích nguyên lý truyền nhiệt, không phải bản vẽ kỹ thuật; độ dày keo được phóng đại và có chú thích trong giao diện.
- Chưa benchmark FPS/Core Web Vitals trên thiết bị thật, không khẳng định điểm Lighthouse.
- Fallback/mất WebGL và thay đổi reduced motion được rà soát source; chưa ép mất context hoặc thay cấu hình hệ điều hành trong lượt QA hero này.
- Build có cảnh báo chunk Three.js khoảng 560 kB trước gzip (143 kB gzip), tải động chỉ trên trang chủ.
- Driver của môi trường QA có một cảnh báo shader về độ chính xác số; không có lỗi render trong lượt xác nhận cuối.
- Form chỉ soạn email, chưa có API tiếp nhận/CRM/database/trang quản trị.
- Ảnh ứng dụng là minh họa AI; ảnh sản phẩm/cơ sở từ website nguồn Tensan.

## Lượt nâng cấp mô hình và phần đầu
- PCB có thêm lớp cạnh, vias, silkscreen, tụ điện có nắp, đầu nối, linh kiện phụ và chân đế; tản nhiệt có 23 lá cong, ống đồng và texture kim loại.
- Keo xám theo nội dung sản phẩm TS1001; mô hình vẫn minh họa nguyên lý, không phải bản vẽ sản xuất.
- Đầu trang có khung trưng bày, thẻ ảnh thật TS1001, nhóm chức năng vật liệu và bốn liên kết ứng dụng. Bố cục danh mục/sản phẩm/giới thiệu bên dưới được chỉnh trong phạm vi .home-page.
- npm test: 9/9 qua; kiểm tra hình học dùng đỉnh bề mặt thực ở cả hai giới hạn nghiêng và các góc xoay. npm run build: qua, 39 trang.
- Desktop 1440×1100 và mobile 375×812: không tràn ngang, mô hình nhìn thấy rõ; đã xem ảnh kết quả.
- Liên kết dải ứng dụng tới /ung-dung#den-led hoạt động; rời trang chủ không còn canvas, trở về tạo lại WebGL.
- Reviewer không thấy blocker. Điểm cắt khung nhỏ ở góc nghiêng cực hạn được sửa bằng nới camera; bài kiểm tra bao gồm giới hạn đó đã qua.
- Cloudflare hiện hành: renderer=webgl, bốn liên kết ứng dụng, lắp ghép rồi hotspot mở lại tách lớp; không có console error trong lượt cuối.
- Ảnh đối chiếu bản công khai: tensan-modern-assembly.jpg trong thư mục visualizations của chat.
- Giới hạn đo hiệu năng/thiết bị thật và backend bên trên vẫn áp dụng.
