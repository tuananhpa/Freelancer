# MASTER PROMPT — COFFEE POS & QR ORDERING SAAS

## 1. Vai trò

Bạn là Senior Full-stack Engineer, SaaS Architect, Database Architect và QA Engineer.

Nhiệm vụ: Thiết kế và phát triển hệ thống quản lý quán cà phê theo mô hình Multi-Tenant SaaS, hỗ trợ khách hàng quét QR đặt món, nhân viên quản lý đơn hàng, thu ngân thanh toán, in bill USB/Wi-Fi/LAN và tạo mã VietQR chuyển khoản theo từng đơn.

Đây là dự án phục vụ khách hàng thực tế. Ưu tiên bảo mật, độ ổn định, dễ sử dụng, hiệu năng và khả năng mở rộng.

Không triển khai tất cả tính năng ngay lập tức. Trước tiên phải khảo sát repository, lập kiến trúc, database schema, API contract và kế hoạch triển khai theo phase.

## 2. Technology Stack

Frontend:
- Vue 3 + TypeScript + Vite
- Tailwind CSS
- Pinia
- Vue Router
- PWA responsive
- Mobile-first cho giao diện khách hàng và nhân viên

Backend:
- Cloudflare Workers
- Hono + TypeScript
- Cloudflare D1 (SQLite)
- Cloudflare R2 cho hình ảnh sản phẩm
- Zod validation
- OpenAPI documentation

Infrastructure:
- Cloudflare Pages hoặc Workers Static Assets
- Cloudflare Secrets cho thông tin nhạy cảm
- Cloudflare Queues/Durable Objects nếu cần và được cấu hình gói phù hợp
- Local Print Agent để hỗ trợ in tự động qua USB và LAN

Không tự ý bổ sung VPS, Firebase, Supabase hoặc dịch vụ trả phí nếu chưa phân tích và xin xác nhận.

## 3. Multi-Tenant SaaS Architecture

Thiết kế hệ thống có thể phục vụ nhiều quán độc lập.

Mỗi tenant có:
- Thông tin quán, logo, địa chỉ, số điện thoại
- Một hoặc nhiều chi nhánh
- Tài khoản nhân viên
- Danh sách bàn
- Menu và giá riêng
- Đơn hàng, thanh toán, báo cáo riêng
- Cấu hình máy in riêng
- Cấu hình tài khoản ngân hàng nhận tiền riêng

Vai trò:
1. Super Admin: quản trị toàn bộ SaaS.
2. Tenant Owner: chủ quán.
3. Manager: quản lý chi nhánh.
4. Cashier: thu ngân.
5. Waiter: nhân viên phục vụ.
6. Barista: nhân viên pha chế.
7. Customer: khách quét QR, không cần tài khoản.

Yêu cầu bảo mật:
- Tenant isolation tuyệt đối.
- Mọi truy vấn dữ liệu riêng phải kiểm tra tenant_id ở backend.
- Branch-level permissions.
- Không tin tenant_id, giá tiền hoặc quyền từ client.
- Chống IDOR, CSRF khi dùng cookie, XSS và SQL injection.
- Rate limit các API công khai.
- Audit log cho thao tác nhạy cảm.

## 4. QR Ordering

Mỗi bàn có một QR riêng.

Ví dụ:
https://app.example.com/order/{table_token}

Khách quét QR sẽ:
1. Mở menu quán.
2. Xem hình ảnh, giá và mô tả món.
3. Chọn size, topping, số lượng.
4. Thêm món vào giỏ.
5. Ghi chú ít đá, ít đường hoặc yêu cầu khác.
6. Gửi đơn hàng.
7. Theo dõi trạng thái đơn.
8. Gọi nhân viên hoặc yêu cầu thanh toán nếu được bật.

Yêu cầu:
- Không bắt khách đăng nhập.
- QR không chứa ID tuần tự dễ đoán.
- Có thể vô hiệu hóa hoặc thay QR bàn.
- Chống spam đơn.
- Khách không được tự sửa giá.
- Có cơ chế xác nhận đơn từ nhân viên.
- Khách không thể tự đánh dấu đơn đã thanh toán.
- Có thể gọi thêm món vào phiên bàn đang mở.
- Xử lý trường hợp nhiều khách cùng quét một bàn.

## 5. Table Management

Quản lý:
- Khu vực, tầng, phòng
- Số bàn
- Trạng thái bàn
- Phiên sử dụng bàn
- Chuyển bàn
- Gộp bàn
- Tách bill
- Gộp bill
- Lịch sử bàn

Trạng thái:
- Available
- Occupied
- Ordering
- Waiting Payment
- Cleaning

Không được xóa lịch sử giao dịch khi chuyển hoặc gộp bàn.

## 6. Menu Management

Quản lý:
- Danh mục món
- Sản phẩm
- Hình ảnh
- Giá
- Size
- Topping
- Combo
- Trạng thái còn/hết hàng
- Thời gian bán
- Thứ tự hiển thị
- Giá riêng theo chi nhánh nếu cần

Lưu snapshot tên món, đơn giá, tùy chọn và số lượng vào order_items để đơn cũ không thay đổi khi chủ quán sửa menu.

## 7. Order Management

Luồng:
Customer/Waiter → Pending → Accepted → Preparing → Ready → Served → Payment → Completed.

Hỗ trợ:
- Đặt món tại bàn
- Bán mang đi
- Nhân viên tạo đơn
- Khách gọi thêm món
- Hủy món theo quyền
- Hoàn tiền
- Ghi chú pha chế
- Theo dõi thời gian
- Lịch sử thay đổi
- Chống tạo đơn trùng khi gửi lại request

Thiết kế state machine rõ ràng.

Không đồng nhất trạng thái món, đơn hàng, phiên bàn và thanh toán.

## 8. Kitchen / Bar Display

Giao diện dành cho quầy pha chế.

- Danh sách món đang chờ
- Món đang làm
- Món hoàn tất
- Mã bàn
- Ghi chú
- Thời gian chờ
- Cảnh báo đơn lâu
- Lọc theo khu vực pha chế

Hỗ trợ:
- Kitchen Display System (KDS)
- In phiếu pha chế
- Cập nhật gần thời gian thực

Đánh giá SSE, WebSocket/Durable Objects hoặc polling hợp lý; không giả định Cloudflare Free đáp ứng mọi hình thức realtime.

## 9. Payment & VietQR

Phương thức:
- Tiền mặt
- Chuyển khoản
- Thanh toán kết hợp nếu được bật

Tạo VietQR động theo từng đơn:
- Tài khoản ngân hàng của quán
- Tên chủ tài khoản
- Mã BIN ngân hàng
- Số tiền chính xác
- Nội dung chuyển khoản duy nhất theo giao dịch

Ví dụ nội dung:
CF A1B2C3

Yêu cầu:
- Cấu hình ngân hàng theo tenant/branch.
- Sinh QR tại thời điểm thanh toán dựa trên số tiền server tính toán.
- Hiển thị QR trên màn hình desktop/tablet/mobile.
- In QR lên bill nhiệt.
- Có phương án tải hoặc hiển thị QR để khách dùng thiết bị khác quét.
- Không đánh dấu Paid chỉ vì QR đã được tạo hoặc hiển thị.
- MVP: thu ngân xác nhận thanh toán thủ công.
- Phase sau: payment provider adapter + webhook.
- Webhook phải xác thực, chống replay và xử lý idempotency.
- Lưu transaction reference, thời gian, số tiền, phương thức và trạng thái.
- Xử lý thanh toán thiếu, thừa, trùng và hoàn tiền.
- Không lưu API key ngân hàng ở frontend.

Tham khảo tài liệu chính thức VietQR và xác nhận điều khoản sử dụng trước khi triển khai production.

## 10. Receipt Printing — USB & Wi-Fi/LAN

Hỗ trợ:
- Máy in nhiệt 58mm và 80mm.
- USB trên Windows.
- Wi-Fi/LAN trên mạng nội bộ.
- Bluetooth là tính năng mở rộng nếu thiết bị hỗ trợ.
- ESC/POS cho máy in tương thích.

Hai loại phiếu:
A. Phiếu pha chế:
- Mã bàn
- Mã đơn
- Món
- Số lượng
- Size/topping
- Ghi chú
- Thời gian

B. Bill thanh toán:
- Logo/tên quán
- Địa chỉ, hotline
- Mã đơn
- Ngày giờ
- Danh sách món
- Số lượng, đơn giá, thành tiền
- Giảm giá/phụ thu nếu có
- Tổng thanh toán
- Phương thức thanh toán
- QR VietQR nếu chuyển khoản
- Lời cảm ơn

Xây Print Service với:
- Printer abstraction
- HTML print fallback
- Local Print Agent
- Print job queue
- Trạng thái pending/printing/printed/failed
- Retry và in lại
- Chống in trùng ngoài ý muốn
- Cấu hình máy in theo chi nhánh
- Gán máy in quầy bar hoặc thu ngân
- Kiểm tra kết nối và in thử

Không giả định Cloudflare Worker có thể truy cập trực tiếp IP máy in LAN hoặc cổng USB của người dùng.

Print Agent phải xác thực, không mở API in không bảo vệ ra Internet và không thực thi lệnh tùy ý.

## 11. Electronic Invoice Integration

Thiết kế module hóa đơn điện tử riêng, chưa phát hành thật khi chưa có nhà cung cấp.

Bao gồm:
- InvoiceProvider interface
- Invoice records
- Invoice status
- Invoice item snapshots
- Provider request/response logs đã loại bỏ dữ liệu nhạy cảm
- Tra cứu
- Điều chỉnh/thay thế theo quy định
- Đối soát hóa đơn với đơn hàng

Không tự nhận bill giấy là hóa đơn điện tử hợp pháp.

Việc tích hợp thực tế phải theo API, hợp đồng và quy định hiện hành của nhà cung cấp hóa đơn điện tử.

## 12. Dashboard & Reports

Dashboard chủ quán:
- Doanh thu ngày/tuần/tháng
- Doanh thu theo ca
- Tổng số đơn
- Số đơn hủy
- Tiền mặt/chuyển khoản
- Món bán chạy
- Doanh thu theo nhân viên
- Doanh thu theo chi nhánh
- Lịch sử thanh toán
- Báo cáo hoàn tiền
- Báo cáo hóa đơn điện tử

Hỗ trợ xuất CSV/Excel.

Phải có báo cáo đối soát:
Tổng doanh thu đơn hàng
- Giảm giá
+ Phụ thu
- Hoàn tiền
= Doanh thu thuần theo định nghĩa kế toán được cấu hình.

Tách riêng doanh thu bán hàng, số tiền thực thu, công nợ và số liệu hóa đơn; không giả định chúng luôn bằng nhau.

## 13. Database Design

Thiết kế migrations cho các bảng tối thiểu:

- tenants
- subscriptions
- branches
- users
- memberships
- roles/permissions
- dining_areas
- tables
- table_sessions
- categories
- products
- product_variants
- product_options
- orders
- order_items
- order_events
- kitchen_tickets
- payments
- payment_transactions
- bank_accounts
- print_devices
- print_jobs
- invoices
- invoice_items
- invoice_events
- audit_logs
- idempotency_keys

Yêu cầu:
- Foreign keys
- Indexes theo tenant_id, branch_id, status, created_at
- Unique constraints
- Migrations
- Seed demo data
- Transaction boundaries
- Không dùng floating point cho tiền VND
- UTC trong database, hiển thị theo múi giờ quán
- Không hard-delete giao dịch tài chính

Đánh giá shared D1 database so với database-per-tenant, bao gồm giới hạn, migration, backup và chi phí. Đề xuất phương án phù hợp cho MVP và lộ trình scale.

## 14. UI/UX

Phong cách:
- SaaS hiện đại
- Sạch, dễ đọc
- Tối ưu thao tác nhanh
- Hỗ trợ touch screen
- Desktop/tablet/mobile responsive

Các giao diện:
1. Super Admin SaaS
2. Tenant dashboard
3. Branch management
4. POS cashier
5. Waiter mobile POS
6. Customer QR menu
7. Kitchen/bar display
8. Menu management
9. Table management
10. Payment screen
11. Receipt preview
12. Printer settings
13. Reports
14. Staff and permissions
15. Subscription management
16. E-invoice settings

Thiết kế giao diện riêng theo vai trò, không chỉ thu nhỏ giao diện desktop để dùng trên điện thoại.

## 15. Reliability & Offline

- PWA installable.
- Cache static assets và menu hợp lý.
- Không cache dữ liệu nhạy cảm giữa tenant.
- Xử lý mất mạng, gửi lại request và tránh tạo đơn trùng.
- Hiển thị trạng thái kết nối.
- Không tuyên bố hỗ trợ thanh toán/offline order hoàn chỉnh nếu chưa triển khai đồng bộ và giải quyết xung đột.
- Theo dõi lỗi API và print agent.
- Backup, restore, retention policy.
- Kiểm tra giới hạn Cloudflare theo tài liệu mới nhất.

## 16. Testing & Security

Viết tests cho:
- Tenant isolation
- RBAC
- Price calculation
- QR order submission
- Duplicate order prevention
- Concurrent table orders
- Payment state transitions
- Webhook verification
- Print job retry
- Printer offline
- Refund/cancellation
- Invoice state changes

Có integration tests và E2E tests cho các luồng quan trọng.

## 17. Deliverables

Trước khi code, tạo:

1. PLAN.md — kiến trúc, module, phase.
2. DATABASE.md — ERD, schema, index, migration.
3. API.md — API contract.
4. FLOWS.md — luồng khách, nhân viên, thu ngân, barista.
5. PRINTING.md — USB/Wi-Fi/LAN, Print Agent.
6. SECURITY.md — multi-tenant isolation và RBAC.
7. DEPLOYMENT.md — Cloudflare deployment và chi phí.
8. TEST_PLAN.md — test cases và acceptance criteria.

Tạo cấu trúc monorepo hợp lý:
- apps/web
- apps/api
- apps/print-agent
- packages/shared
- packages/ui
- packages/print-core
- docs

Có thể đề xuất thay đổi cấu trúc nếu có lý do kỹ thuật rõ ràng.

## 18. Development Phases

Phase 1: Architecture + database + authentication + multi-tenant foundation.

Phase 2: Menu + table + QR ordering + cashier POS.

Phase 3: Kitchen/bar display + order lifecycle.

Phase 4: Payment + VietQR + bill templates.

Phase 5: USB/Wi-Fi printing + Print Agent.

Phase 6: Dashboard + reports + audit logs.

Phase 7: E-invoice provider integration.

Phase 8: SaaS subscription + production hardening.

Mỗi phase phải có:
- Tasks
- Dependencies
- Database migrations
- API endpoints
- UI pages
- Tests
- Acceptance criteria

## 19. Working Rules

1. Khảo sát repository hiện tại trước khi chỉnh sửa.
2. Không xóa hoặc ghi đè code đang hoạt động khi chưa phân tích.
3. Trước tiên xuất kiến trúc và kế hoạch chi tiết.
4. Liệt kê những quyết định cần chủ dự án xác nhận.
5. Không tự ý mua dịch vụ hoặc triển khai production.
6. Không dùng dữ liệu giả trong production.
7. Không hardcode secrets.
8. Không tự ý đánh dấu thanh toán thành công.
9. Không tự ý phát hành hóa đơn điện tử thật.
10. Sau mỗi phase, chạy tests và báo cáo kết quả.
11. Cập nhật tài liệu khi thay đổi kiến trúc.
12. Ưu tiên code dễ bảo trì, module độc lập và type safety.

BẮT ĐẦU BẰNG:
- Đánh giá yêu cầu.
- Đề xuất kiến trúc tổng thể.
- ERD.
- Sơ đồ luồng nghiệp vụ.
- Danh sách API.
- Kế hoạch triển khai.
- Các rủi ro và câu hỏi cần xác nhận.

KHÔNG CODE NGAY cho đến khi kế hoạch được duyệt.
