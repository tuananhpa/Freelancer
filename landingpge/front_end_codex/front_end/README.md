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
    │   └── media/             # WebP, khung hình và video preview từ kho HYTales
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

3 video nguồn 200–270 MB được cắt thành preview 30 giây, nén H.264/AAC 720p, faststart. Ảnh WebP và 3 khung hình mỗi phim. Hero trang đầu phát phim trực tiếp, mặc định tắt tiếng; chuyển bằng mũi tên, dấu chọn phim, phím trái/phải hoặc vuốt. Điều khiển phát/tạm dừng/âm thanh/toàn màn hình nằm riêng với link câu chuyện. Không tự đổi phim; trạng thái tạm dừng giữ khi chuyển. Phim tạm dừng khi cuộn ra ngoài màn hình hoặc ẩn tab. Chế độ giảm chuyển động/tiết kiệm dữ liệu chờ người xem bấm phát. Kiểm tra luồng này bằng `npm run test:hero`. Hero sản phẩm cũng tự phát mute khi cho phép. Với media gốc, có thể xuất bản lại bằng `python scripts/prepare_media.py` (cần Pillow và ffmpeg).

Chưa có thông tin lô thực, ngày SX/HSD hoặc hồ sơ chứng nhận, nên dùng mã có `DEMO` và trạng thái chờ cập nhật. Không tạo huy hiệu OCOP/VietGAP giả. Biểu đồ lượt quét ghi rõ minh họa. Các con số dự báo tài chính trong DOCX không được trình bày như thành tích đã đạt. Chỉ hỗ trợ VI/EN ở trải nghiệm công khai; các ngôn ngữ khác là giai đoạn nối backend.

QR là mã có thể quét thật, không phải hình minh họa. Xuất PNG 1200 px, SVG vector hoặc PDF; thêm và xóa logo. Đích đến có danh sách sản phẩm và ô nhập liên kết riêng. Bấm Áp dụng đích đến để lưu; QR `/q/:id` giữ nguyên. Với đích khác website, trang quét hiển thị tên miền trước khi người xem mở liên kết. Đường dẫn hiện tại trên localhost chỉ có tác dụng trên máy đang chạy; cấu hình domain đã deploy trước khi in/đưa cho người khác quét. Logo giữ kích thước nhỏ và mức sửa lỗi H; cần thử quét bản in trước khi sản xuất tem.
