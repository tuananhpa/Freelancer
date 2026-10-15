# Coffee POS & QR Ordering SaaS — Client brief

Ngày: 14/10/2026. Trạng thái: đề xuất để duyệt, chưa triển khai sản phẩm.

## Mục tiêu và nguồn yêu cầu

Nguồn: MASTER PROMPT do chủ dự án đính kèm. Xây SaaS cho nhiều quán cà phê độc lập, phục vụ khách QR không tài khoản, nhân viên, barista, thu ngân, quản lý, chủ quán và Super Admin. Thành công là đặt món nhanh, không lộ dữ liệu giữa quán, tính tiền đúng, không tạo đơn/thu tiền trùng, in có khả năng phục hồi.

Chủ dự án yêu cầu áp dụng client-web-flow và thực hiện trong chat Codex này. Không chuyển sang ChatGPT. Không code trước khi kế hoạch được duyệt. Không tự mua dịch vụ, deploy production, xác nhận tiền hay phát hành hóa đơn thật.

## Khảo sát workspace

- D:/Freelancer/cafesaas trống tại thời điểm khảo sát.
- Git root là D:/Freelancer; có thay đổi ở các dự án anh em. Không stage/commit các thay đổi đó.
- Không tìm thấy AGENTS.md tại D:/, D:/Freelancer/ hoặc thư mục cafesaas.
- Chưa có mã nguồn, package.json, migrations, tests, Cloudflare resources hay tài sản thương hiệu trong thư mục này.
- Phiên sandbox thông thường bị từ chối đọc D:/; khảo sát thành công bằng lệnh được auto-review cho phép. Không suy ra thư mục không tồn tại từ lỗi sandbox.

## Ràng buộc

Frontend Vue 3, TypeScript, Vite, Tailwind, Pinia, Vue Router, PWA; backend Workers, Hono, D1, R2, Zod, OpenAPI. Tiền VND số nguyên, thời gian UTC và hiển thị Asia/Ho_Chi_Minh mặc định. Print Agent Windows cho USB/LAN; không truy cập máy in từ Worker. QR ngân hàng chỉ là yêu cầu chuyển tiền, thu ngân xác nhận ở MVP.

## Flow làm việc

1. Hoàn thiện và duyệt bộ tài liệu kiến trúc trong root cùng brief này.
2. Tạo 3 ảnh mockup POS A/B/C ngay trong Codex, chọn hoặc mix.
3. Sau khi kế hoạch và thiết kế được duyệt: frontend dữ liệu tĩnh theo docs/FRONTEND_PLAN.md sẽ được viết ở bước đó. Backend chưa được thực thi chỉ vì duyệt hình.
4. Khi chủ dự án nói “hết demo”: dọn nội dung/logic thử, khảo sát frontend rồi cập nhật PLAN.md thành kế hoạch backend thực tế.
5. Thực thi backend từng phase chỉ sau yêu cầu tiếp theo của chủ dự án.

PLAN.md hiện tại là roadmap kiến trúc ban đầu, không phải báo cáo dọn demo hoặc kế hoạch đã duyệt.

## Scope giao diện

16 nhóm màn hình trong brief: Super Admin, dashboard quán, chi nhánh, POS, waiter mobile, QR menu, KDS, menu, bàn, thanh toán, receipt preview, printer settings, reports, staff/RBAC, subscription, e-invoice settings.

Mockup chỉ dùng POS thu ngân đại diện để chọn ngôn ngữ thị giác. Customer và waiter sẽ có flow mobile riêng; KDS ưu tiên đọc từ xa. Không thu nhỏ POS desktop làm mobile.

## Giả định thiết kế chưa duyệt

Tiếng Việt; desktop/tablet cho cashier, mobile cho customer/waiter. Tên Coffee POS chỉ là nhãn làm việc. Chưa nhận logo, ảnh sản phẩm hoặc ảnh UI tham chiếu. Ảnh đồ uống sinh ra chỉ phục vụ mockup; không coi là ảnh sản phẩm thật. Giỏ so sánh: 2 cà phê sữa 35.000đ + 1 trà đào 45.000đ = 115.000đ.

## Các quyết định cần chốt

- MVP vận hành cần phase 1–5 hay ưu tiên QR/POS trước in tự động?
- Số quán/chi nhánh, đơn/ngày và thiết bị đồng thời dự kiến để sizing; đề xuất tải kiểm thử ban đầu nằm trong TEST_PLAN.md.
- QR bàn: đề xuất nhân viên mở phiên, khách gửi đơn chờ xác nhận; gọi thêm chỉ trong phiên mở.
- Chốt mô hình D1 chung MVP, polling, xác nhận tiền thủ công và chưa hỗ trợ offline write.
- Quy tắc giảm giá, phụ thu, thuế, tip, tách bill, hoàn tiền và đóng ca.
- Logo/màu/tên thương hiệu và máy in thực tế (model, USB/LAN, khổ giấy).
- Ngân hàng/VietQR/provider hóa đơn, ngân sách Cloudflare, retention và mục tiêu backup/restore.

Mọi đề xuất chưa có câu trả lời được giữ ở trạng thái đề xuất, không ghi “đã duyệt”.


## Yêu cầu bổ sung trực tiếp — 14/10/2026

Chủ dự án đã yêu cầu có một trang Admin của quán, được thêm/sửa/xóa hình ảnh, sản phẩm, ngân hàng và cấu hình chỉnh sửa được theo quyền. Xóa dữ liệu đã tham chiếu được thực hiện bằng archive/inactive; không xóa lịch sử giao dịch.

Admin có dashboard chọn ngày/cơ sở, danh sách bill đã xuất, tiền thực thu mỗi ngày mỗi cơ sở, tiền mặt/chuyển khoản/hoàn tiền/chưa thu và chi tiết đối soát. Phân biệt bill bán hàng và hóa đơn điện tử đã phát hành.

VietQR hỗ trợ số tiền chính xác của bill: mặc định số tiền còn phải thu do server tính, tài khoản quán/chi nhánh và reference riêng. Không tự Paid chỉ vì tạo QR.

Các yêu cầu này được ghi nhận từ người dùng; không đồng nghĩa kiến trúc hoặc ảnh đã được duyệt.

## Tiến độ15/10/2026
Người dùng chọn A, yêu cầu build và tunnel trong chat này, sau đó yêu cầu git add/commit/push cafesaas vào repository D:/Freelancer. Frontend browser-local đã dựng, đủ16 nhóm giao diện theo FRONTEND_SCOPE.md; backend chưa triển khai. Không tự coi yêu cầu xem frontend là phê duyệt giao dịch hoặc phát hành hóa đơn thật.
