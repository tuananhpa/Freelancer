# NuTri Teens · Cân bằng
Ứng dụng tiếng Việt cho tuổi teen, xây theo mockup C đã được chọn. React/TypeScript frontend và Cloudflare Worker API dùng D1/R2; chạy local bằng cùng runtime Workers.

## Chạy local và chia sẻ
Cần Node.js 22.12+ (đã kiểm tra với Node 24), npm, PowerShell và cloudflared.
```powershell
cd D:\Freelancer\web_nutrient
npm ci
powershell -ExecutionPolicy Bypass -File scripts/start-local.ps1
```
Script build, áp migration D1 local, tạo secret riêng nếu chưa có, chạy Worker 8787, gateway 8788, lịch local và Quick Tunnel trong các tiến trình ẩn.
- Local: http://127.0.0.1:8788
- Link công khai: xem .local/tunnel.err.log hoặc `Select-String .local/tunnel.err.log -Pattern 'https://.*trycloudflare.com'`.
- Mật khẩu admin được tạo ngẫu nhiên trong **.local/admin-access.txt**, không được commit.
- Đăng nhập admin ở **/admin**. Người dùng thường tự tạo tài khoản từ trang chính.
- Sau cấu hình, **Về ứng dụng** mở nhật ký và giữ đăng nhập admin. Menu có **Quản trị Gemini** để quay lại. Nếu chưa có hồ sơ, bổ sung trong Hồ sơ; các mục tiêu ban đầu chỉ là tham khảo.
- Giữ máy và mạng hoạt động khi người khác thử. Quick Tunnel đổi URL mỗi lần khởi động; không phải hosting production.
- Dừng đúng các dịch vụ dự án: `powershell -ExecutionPolicy Bypass -File scripts/stop-local.ps1`.
- Sau thay đổi source: stop, chạy start lại để build và cập nhật manifest asset của Wrangler.
- Không mở tunnel tới cổng 8787. Cổng 8788 chặn đường dẫn dev explorer/scheduler, secret và source.
Dữ liệu D1/R2 local lưu trong .wrangler/state; dừng app không xóa dữ liệu.

## Gemini key
1. Mở /admin, dùng thông tin trong file riêng ở trên.
2. Dán key mới, chọn tên model đang khả dụng cho key, bấm kiểm tra và thay.
3. Server xác minh key/model với Google rồi mã hóa AES-GCM vào D1; root key chỉ nằm trong secret server.
4. Response chỉ có configured/updatedAt/model. Không có endpoint đọc lại key hoặc ciphertext.
5. Input bị xóa sau gửi, không lưu key vào localStorage, sessionStorage hay URL.
Khóa người nhập vẫn đi qua request của chính trình duyệt đó; không thể giấu request khỏi DevTools của người nhập. Chat/ước lượng món/phân tích hồ sơ/lộ trình AI cần một key thật có hạn mức. Chưa cung cấp key thì app báo rõ chưa cấu hình, vẫn dùng được nhật ký thủ công và thư viện.

## Tính năng
- Đăng nhập, onboarding 5 bước, avatar có sẵn/tải ảnh, hồ sơ/mục tiêu/sức khỏe/dị ứng/thói quen.
- Dashboard theo dữ liệu thật; nhật ký 4 bữa; camera trước/sau, tải ảnh, nhập tên món, phân tích AI và xác nhận/chỉnh sửa trước lưu.
- CRUD bữa ăn; theo dõi nước/cân nặng; biểu đồ năng lượng theo bữa/7 ngày, nước và lịch sử.
- Lộ trình 30 ngày, 4 bữa/ngày, công thức, vận động, hoàn thành và tạo lại bằng AI.
- Chat cá nhân hóa, chủ đề/câu hỏi gợi ý, sao chép và xóa lịch sử.
- 33 thí nghiệm có tìm kiếm, hướng dẫn, giải thích và lưu hoàn thành.
- 8 món lành mạnh/đồ uống; 4 hướng dẫn chăm sóc; 3 nhóm công cụ ảo (pH, hòa tan, 5 nhóm chất).
- Ẩm thực Việt/Nhật/Italia, 3 món mỗi nhóm, công thức/Việt hóa, nộp thành tích và ảnh tùy chọn.
- XP, ngày hoạt động liên tiếp, huy hiệu món đã nấu, chủ đề giao diện.
- PWA, Web Push opt-in, lịch ăn/nước/hỏi thăm/hoạt động theo Asia/Saigon, âm thanh/rung tùy chọn.
- Sao lưu riêng tư ngay/hằng ngày, tải JSON; đổi mật khẩu và vô hiệu hóa phiên cũ.
- Admin Gemini tách riêng, server kiểm quyền. Cookie phiên HttpOnly, bảo vệ origin/custom header, giới hạn tần suất.

## Nội dung và giới hạn đã biết
App public tham chiếu đã khảo sát qua UI; source trong AI Studio yêu cầu đăng nhập nên chưa được xuất/đối chiếu. Nội dung công thức, thí nghiệm và chăm sóc được biên soạn lại, không phải bản sao nguyên văn. Một số thao tác lửa/hóa chất/mỹ phẩm lưu trữ của bản gốc được thay bằng hoạt động phù hợp hơn. Không sao chép cam kết “an toàn 100%” hay tự xưng bác sĩ.
Mục tiêu mặc định là điểm khởi đầu tham khảo của nhật ký; không phải chỉ định dinh dưỡng. Số liệu AI/thư viện là ước lượng. Nội dung cần biên tập chuyên môn trước khi dùng như sản phẩm sức khỏe chính thức.
Ảnh food-grid được tạo bằng imagegen để minh họa một số món, không phải ảnh thành tích người dùng. Các ảnh còn lại do người dùng tự tải lên.
Web Push cần trình duyệt/thiết bị hỗ trợ và quyền thông báo; iOS cần cài PWA. Lịch chạy khi dịch vụ local còn hoạt động. Chưa xác minh phát thông báo tới thiết bị thật hoặc Gemini live vì chưa có key/thiết bị người dùng.
Không có khôi phục mật khẩu qua email vì app dùng tên đăng nhập và chưa cấu hình email provider. Sao lưu JSON dùng xuất dữ liệu, không tự import hay thay dữ liệu hiện tại.

## Kiểm thử
```powershell
npm test
npm run check
npm run build
# Sau khi app đã chạy:
node tests/api-integration.mjs
node tests/browser.mjs
```
Browser test dùng Chrome cài sẵn, context tách biệt. Kiểm thử tạo tài khoản QA bằng dữ liệu giả riêng; không thêm số liệu vào tài khoản thật. Ảnh QA trong docs/screenshots, không commit.
Xem docs/VERIFICATION.md và docs/FEATURE_MATRIX.md.

## Deploy Cloudflare thật
Bản hiện tại chạy local, chưa tạo resource hay deploy vào tài khoản Cloudflare.
1. `npx wrangler login`.
2. `npx wrangler d1 create nutri-teens`, thay database_id trong wrangler.jsonc bằng ID trả về.
3. `npx wrangler r2 bucket create nutri-teens-media`.
4. Khai báo các secrets bằng `npx wrangler secret put NAME`: ENCRYPTION_KEY (32 byte base64), ADMIN_USERNAME, ADMIN_PASSWORD, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, JOB_TOKEN.
5. Giữ ENCRYPTION_KEY ổn định; thay root key cần mã hóa lại key Gemini. Không đưa .dev.vars lên git.
6. `npm run db:remote`, `npm run deploy`.
7. Kiểm tra auth, AI, ảnh, push và Cron trên domain production. Cron Triggers trong config chạy mỗi 5 phút; scheduler local không cần khi deploy.
Tài liệu: [Workers local](https://developers.cloudflare.com/workers/local-development/), [Static assets](https://developers.cloudflare.com/workers/static-assets/), [D1](https://developers.cloudflare.com/d1/), [R2](https://developers.cloudflare.com/r2/), [Quick Tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/), [Gemini key](https://ai.google.dev/gemini-api/docs/api-key).
