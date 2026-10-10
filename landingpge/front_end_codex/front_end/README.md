# HYTales — Frontend

Frontend cho cuộc thi, dùng nội dung và media từ `HYTales`, không sửa dữ liệu nguồn.

## Chạy

Yêu cầu Node.js 22.12+ (khuyến nghị 24+).

```powershell
cd D:\Freelancer\landingpge\front_end_codex\front_end
npm install
npm run dev
```

Mở http://localhost:5173. Build: `npm run build`. Xem build: `npm run preview`. Test: `npm test`.

Kiểm tra các luồng trên browser: chạy server trước rồi `npm run test:e2e` và `npm run test:admin`. Windows dùng Chrome có sẵn; có thể đặt `BROWSER_EXECUTABLE` cho browser khác hoặc `TEST_URL` cho production preview. Script dùng browser context mới, không làm thay đổi dữ liệu demo trong browser của bạn. Các ảnh kiểm tra nằm trong test-results (gitignored).

## Các trang

Giá sản phẩm: trong Sản phẩm → Sửa → Thông tin lô, nhập “Giá trên một đơn vị (VND)” theo Đơn vị mặc định. Giá nguyên không âm; để trống để hiển thị “Liên hệ để biết giá”, 0 là giá 0. Giá/đơn vị xuất hiện trong bảng Thông tin lô hàng ở trang sản phẩm. Thiết lập có lối tắt “Tải file / thay logo HYTales” đến phần upload JPG/PNG/WebP, gỡ logo và chỉnh vùng hiển thị; logo được xem trước và tự lưu, thay toàn bộ ảnh thương hiệu hoặc biểu tượng tùy kiểu hiển thị. Tên thương hiệu và dòng mô tả cũng sửa được và tự lưu; mô tả trống sẽ ẩn. Các thiết lập khác vẫn cần Lưu thiết lập.

- `/`: landing page dự án, kể chuyện và kết nối HTX.
- `/p/nhan-long-pho-hien`: nhãn lồng.
- `/p/vai-trung-phu-cu`: vải trứng.
- `/p/cam-duong-canh-hung-yen`: cam Đường Canh.
- `/admin/login`: vào phiên quản trị demo, không dùng tài khoản/mật khẩu giả.
- `/admin/products`, `/admin/qr`, `/admin/inbox`, `/admin/settings`.
- `/admin/quick-replies`: quản lý lời chào và hỏi đáp nhanh chung hoặc riêng cho từng sản phẩm; thêm/sửa/xóa, ẩn, sắp xếp, nội dung VI/EN và xem trước. Bấm Lưu bộ câu hỏi để áp dụng.
- `/q/:id`: liên kết QR ổn định, mở sản phẩm hoặc đích đã chọn trong quản trị.

Người xem vào ngay, không cần tài khoản. Chế độ mock lưu nội dung trong localStorage, file tải lên trong IndexedDB; phiên admin demo trong sessionStorage. Dữ liệu demo chỉ nằm trên trình duyệt đang dùng, chưa chia sẻ giữa thiết bị. Đây là phân luồng giao diện, chưa phải phân quyền bảo mật. Chế độ API dùng xác thực backend.

Bộ sưu tập trên trang chủ lướt ngang, có nút trước/sau và chỉ báo vị trí. Desktop hiển thị ba thẻ, tablet hai thẻ, điện thoại chừa phần thẻ kế tiếp để dễ nhận biết có thể vuốt. Có thể dùng phím trái/phải, Home/End khi focus vào danh sách. Không tự chuyển sản phẩm. `npm run test:carousel` kiểm tra danh sách 20 sản phẩm ở 360–1440 px. Hiện repository vẫn tải toàn bộ danh sách; phân trang API nằm trong kế hoạch backend.

Quản trị sản phẩm hỗ trợ tạo/sửa/xóa, mã lô tự sinh và sửa được, chọn ảnh/video từ thư viện hoặc tải từ máy, gỡ ảnh/video và ảnh bộ sưu tập. Đường dẫn sản phẩm được quản lý tự động. Trong Thiết lập, thêm/sửa/xóa/ẩn widget Zalo, Facebook, Instagram, Messenger, TikTok, YouTube hoặc website; các kênh trống được ẩn. Mặc định chưa điền liên kết liên hệ.

Form quà tặng cho chọn sản phẩm, số lượng và đơn vị; tên và số điện thoại hợp lệ là bắt buộc. Admin đặt Đơn vị mặc định trong Sản phẩm → Sửa → Thông tin lô; khách vẫn có thể chọn/nhập đơn vị khác. Hộp thư lưu cả sản phẩm, số lượng và đơn vị. Editor giữ header/footer, chỉ cuộn vùng nhập và chừa đủ chỗ cho viền focus.

Sản phẩm → Sửa → Hành trình cho thêm hoặc xóa mốc, tự đánh số lại. Trang công khai nối từ mốc đầu đến mốc cuối; số mốc thay đổi theo dữ liệu, một mốc không có đường nối và không có mốc thì ẩn phần hành trình. `npm run test:journey` kiểm tra CRUD mốc, bố cục và độ tương phản chữ trên các trang người dùng/admin.

Hỏi chuyện quê hoạt động theo hội thoại: câu hỏi nhanh xuất hiện dưới dạng tin nhắn của khách, sau đó là trả lời theo cấu hình admin. Có thể hỏi tiếp nhiều lượt; đóng/mở vẫn giữ lịch sử trong trang hiện tại. Câu hỏi tự do được gửi vào hộp thư; phản hồi trực tiếp cần backend. Kiểm tra các luồng mới bằng `npm run test:inquiry-chat`.

## Cây thư mục

Theme hiện tại là **Day**. Nút mặt trăng/mặt trời ngay cạnh VI/EN đổi sang **Night/Day** và nhớ lựa chọn trên trình duyệt. Cả trải nghiệm công khai và admin dùng chung lựa chọn.

Thiết lập → **Logo & khung ảnh** thay logo HYTales, ba ảnh câu chuyện và chỉnh vùng hiển thị của các ảnh khác trong kho/ảnh cảm nhận. Sản phẩm → Sửa → Ảnh & video chỉnh riêng ảnh đại diện và từng ảnh bộ sưu tập. Chọn **Lấp đầy khung/Giữ toàn bộ ảnh**, kéo vị trí ngang/dọc hoặc dùng các nút Trái/Giữa/Phải/Trên/Dưới; có xem trước và giữ nguyên file gốc. Logo widget cũng tải/thay/gỡ và chỉnh vùng hiển thị được. QR có phần chỉnh logo trước khi xuất; QR giữ nền trắng ở cả hai theme để quét được.

Kiểm tra bằng `npm run test:appearance`; nguồn logo gốc ghi trong [docs/BRAND_ASSETS.md](docs/BRAND_ASSETS.md).

Chia sẻ localhost bằng Cloudflare: chạy `powershell -ExecutionPolicy Bypass -File scripts/share-local.ps1`. Script build, mở production preview trên `127.0.0.1:4173` và tạo link HTTPS `trycloudflare.com`; URL/PID/log lưu riêng trong `.runtime/`. Link sống khi máy và tiến trình còn chạy; lần khởi động mới có thể đổi link. Đây là frontend demo: dữ liệu chỉnh sửa và file upload vẫn riêng trên từng trình duyệt. Xem [hướng dẫn chia sẻ](docs/LOCAL_SHARING.md).

```text
front_end_codex/
├── backend/
│   └── PLAN.md                # Bàn giao thiết kế backend, chưa có code
└── front_end/
    ├── public/
    │   └── media/             # WebP và khung hình; không chứa video
    ├── src/
    │   ├── app/               # Router, ngôn ngữ, phiên admin
    │   ├── components/        # Layout, modal, form, chat, đánh giá
    │   ├── data/              # Nội dung biên tập từ tài liệu nguồn
    │   ├── hooks/             # Tải dữ liệu, loading/error/retry
    │   ├── pages/
    │   │   └── admin/         # CMS, QR, dashboard, inbox, settings
    │   ├── services/          # Repository mock/API, QR, test
    │   ├── styles/            # Tokens, public, admin, responsive
    │   └── types/             # DTO cho backend
    ├── docs/                  # Thiết kế, kế hoạch, API contract, nội dung
    ├── scripts/               # Chuẩn bị media & kiểm tra trình duyệt
    └── package.json
```

## Nối backend

Tài liệu bàn giao chính: [backend/PLAN.md](../backend/PLAN.md), thiết kế Cloudflare Workers + Hono + TypeScript, D1 và R2. Tài liệu ghi rõ chức năng đang có, đề xuất, thông tin còn thiếu, API/database/file permissions và các bước triển khai; chưa có code backend.

Copy `.env.example` thành `.env.local`, đặt `VITE_DATA_MODE=api`, `VITE_API_BASE_URL` và domain công khai `VITE_PUBLIC_URL` khi backend đã chạy. [docs/API_CONTRACT.md](docs/API_CONTRACT.md) mô tả adapter hiện tại. Kế hoạch backend mới bổ sung phân trang, CSRF, upload theo chunk và moderation; cần cập nhật adapter/caller theo mục 10 trong PLAN.md trước khi bật API mode, không chỉ đổi biến môi trường.

Admin backend cần kiểm tra session/role cho mọi request. CORS có credentials; dùng HTTPS và cookie HttpOnly, Secure, SameSite phù hợp, CSRF protection. Frontend không lưu token hay bí mật. Adapter media đã có GET/POST thư viện và multipart upload; backend triển khai lưu file/CDN, số liệu quét và gửi Zalo/live reply theo hợp đồng API.

## Media và nội dung

Nguồn video duy nhất là `../../HYTales/Video` tính từ frontend. Vite đọc trực tiếp ba file gốc tại URL `/hytales-videos/{nhan-long|vai-trung|cam-duong-canh}.mp4`, có hỗ trợ HTTP Range để tua/phát video. File gốc không bị sửa, chuyển mã hay cắt: HEVC 1080 × 1920, nhãn 125,225 giây; vải 90,465 giây; cam 93,460 giây. Phát và tải dùng cùng một URL/file. Các bản trùng trong `public/media` đã bỏ; dữ liệu trình duyệt dùng đường dẫn mặc định cũ được ánh xạ sang URL mới, video admin tự nhập/tải lên giữ nguyên. Khi build, plugin đóng gói đúng ba file nguồn vào `dist/hytales-videos` để bản build hoạt động độc lập; đây là đầu ra build (gitignored), không phải kho nguồn thứ hai. Checkout Git phải có thư mục HYTales/Video đầy đủ (pull LFS nếu repository dùng LFS). `python scripts/prepare_media.py` chỉ chuẩn bị ảnh/thumbnail, không tạo bản video riêng. HEVC cần kiểm tra trên các trình duyệt/thiết bị mục tiêu; hiện đã kiểm tra phát bằng Chrome Windows.

Khung video đọc kích thước thật từ metadata: video dọc/ngang đều giữ tỷ lệ và dùng contain; khung tự tính chiều cao. Player đầu trang/sản phẩm giới hạn kích thước hiển thị để vừa bố cục, không giới hạn thời lượng. Modal và fullscreen giữ đủ khung hình. Ảnh vẫn có chỉnh fit/vị trí riêng. `npm run test:video-aspect` kiểm tra tỷ lệ/thời lượng/độ phân giải và phần lời kể đã được bỏ khỏi mọi trang sản phẩm.

Hero phát trực tiếp, mặc định tắt tiếng; chuyển bằng mũi tên/dấu chọn/phím/vuốt. Không tự đổi phim, giữ lựa chọn tạm dừng và dừng khi ngoài màn hình/ẩn tab. Giảm chuyển động/tiết kiệm dữ liệu chờ bấm phát. Dùng `test:hero` để kiểm tra điều khiển. File phát đầy đủ lớn hơn preview trước đây; chưa có adaptive bitrate streaming hoặc phép đo mạng 4G thực tế.

Hero đã khôi phục bố cục khung video gọn theo tỷ lệ nguồn, vùng trồng/tên sản phẩm/link câu chuyện đặt trên video và caption nhỏ bên trái theo ảnh được chủ dự án chọn. Nút fullscreen đổi sang thu nhỏ khi mở, có nút đóng ở góc; hỗ trợ API video Safari và mở rộng trong trang khi API native không khả dụng. Video sản phẩm bật/tắt tiếng bằng icon có nhãn trợ năng. Header luôn bám khi cuộn; menu nội dung sản phẩm nằm dưới header. Sidebar admin có nút thu gọn và tay kéo cạnh phải (220–420px, có phím mũi tên/Home/End), nhớ lựa chọn trên browser; điện thoại dùng menu bật/tắt.

Admin → Sản phẩm & câu chuyện → Sửa sản phẩm → Hành trình → **Thêm ảnh cho mốc**. Có thể tải ảnh hoặc chọn thư viện, thay/gỡ, chỉnh fit và vị trí. Mỗi mốc có nhiều ảnh; public chỉ hiện ảnh của mốc đang chọn, bấm ảnh mở toàn bộ khung hình. Gỡ ảnh khỏi mốc giữ file trong thư viện. `npm run test:players` kiểm tra thao tác mới; iOS được kiểm thử bằng mô phỏng API, vẫn cần kiểm thử Safari trên iPhone/iPad thật.

Giao diện đã bỏ nhãn demo/bản trải nghiệm, ghi chú minh họa cạnh hành trình và phần Đọc lời kể trong phim. Mã lô seed để trống, ngày SX/HSD và chứng nhận chưa có vẫn chờ cập nhật; không tạo dữ liệu xác minh giả. Dashboard không còn lượt quét/biểu đồ mẫu, hiển thị chưa có dữ liệu khi chưa nối analytics. Flag demo nội bộ và storage key cũ giữ để tương thích, không hiển thị công khai. Bỏ nhãn không thay thế backend/xác thực server; dữ liệu hiện vẫn riêng từng trình duyệt. Dự báo tài chính trong DOCX không phải thành tích đã đạt.

QR là mã có thể quét thật, không phải hình minh họa. Xuất PNG 1200 px, SVG vector hoặc PDF; thêm và xóa logo. Đích đến có danh sách sản phẩm và ô nhập liên kết riêng. Bấm Áp dụng đích đến để lưu; QR `/q/:id` giữ nguyên. Với đích khác website, trang quét hiển thị tên miền trước khi người xem mở liên kết. Đường dẫn hiện tại trên localhost chỉ có tác dụng trên máy đang chạy; cấu hình domain đã deploy trước khi in/đưa cho người khác quét. Logo giữ kích thước nhỏ và mức sửa lỗi H; cần thử quét bản in trước khi sản xuất tem.


### Video trang chủ và ngôn ngữ

Video nền trang chủ quản lý riêng trong **Admin → Thiết lập → Video trang chủ** (VI/EN); để trống sẽ hiện ảnh nền, không lấy video sản phẩm. Video sản phẩm quản lý trong **Sản phẩm → Ảnh & video** (VI/EN). EN dùng bản EN nếu có, còn thiếu thì dùng VI. Tải lên/chọn/thay/xóa rồi bấm **Lưu thiết lập** hoặc **Lưu sản phẩm**. Xóa ở đây chỉ bỏ liên kết video, giữ file trong thư viện để không ảnh hưởng nơi khác. Hiện dữ liệu/file admin vẫn lưu riêng theo trình duyệt và origin, cần backend để chia sẻ cho tất cả người xem.


Video nền trang chủ giữ nguyên khung hero, hiển thị đủ hình bằng `contain`; phần dư dùng canvas blur lấy từ cùng video đang phát (tối đa 480 px, khoảng 8 khung/giây), không tải/giải mã thêm video thứ hai. Nguồn video chính không thay codec, độ phân giải hoặc thời lượng. Kiểm tra: `node scripts/verify-hero-contain.cjs` (cần ffmpeg trên PATH; tạo clip thử trong test-results, kiểm tra góc hình, blur và layout 1440/390 px). Có thể đặt TEST_URL để kiểm tra tunnel.
