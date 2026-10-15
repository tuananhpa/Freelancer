# Phạm vi frontend — 15/10/2026

Thiết kế A, giao diện tiếng Việt. Đủ16 nhóm giao diện của brief; không đồng nghĩa đã triển khai16 module backend production.

| Nhóm ban đầu | Route | Hoạt động trong bản xem | Còn cần backend/thiết bị |
| --- | --- | --- | --- |
|1 Super Admin SaaS | /platform | overview tenant đang xem, liên kết Admin | tenant provisioning/lock, platform auth/isolation |
|2 Tenant dashboard | /admin/dashboard | lọc ngày/cơ sở, doanh thu/thực thu/hoàn/chưa thu, bill, CSV | server aggregates, audit bền vững |
|3 Branch management | /admin/branches | thêm/sửa/ngừng cơ sở, giữ lịch sử báo cáo | branch permissions trên server |
|4 Cashier POS | /pos | menu ảnh, tìm/lọc, size/topping, số lượng, ghi chú, đơn/bill | giá xác minh server, ca, multi-client sync |
|5 Waiter mobile | /waiter | chọn bàn, gọi món, giỏ mobile riêng | tài khoản/role và phiên phục vụ server |
|6 Customer QR | /order/:token | menu mobile, giỏ riêng, gửi Pending local, theo dõi own orders qua reload, gọi nhân viên/request bill | gửi thật tới quán, session/capability/rate limits |
|7 Kitchen/bar | /kitchen | queue, time/overdue, lọc quầy, trạng thái riêng từng món, chuyển đơn | realtime giữa thiết bị, ticket quantities chi tiết |
|8 Menu management | /admin/products /images /categories | CRUD/archives, ảnh upload/gỡ, size/topping/availability/combo dạng sản phẩm | R2, lịch bán, branch price overrides, combo inventory rules |
|9 Table management | /tables | thêm bàn/khu vực, trạng thái, mở/đóng, chuyển/gộp, QR tải/rotate local | table sessions/concurrency và revoke token giữa thiết bị |
|10 Payment | dialog POS/Orders | tiền mặt/chuyển khoản, thiếu/thừa, QR đúng amount/account/ref, snapshot, xác nhận local | ngân hàng thật, authorization, provider webhook |
|11 Receipt preview | /receipt/:id |58/80mm, HTML browser print, QR khi còn phải thu | silent/physical print acknowledgement |
|12 Printer settings | /admin/printers | CRUD cấu hình USB/LAN/paper/station, pending queue | Windows Print Agent, ESC/POS, retry/hardware |
|13 Reports | /admin/reports | đối soát, món, payment/refund/branch, CSV for Excel | shift/staff/server reports, XLSX nếu yêu cầu |
|14 Staff/permissions | /admin/staff /permissions | CRUD nhân viên, role và branch assignments, matrix và preview controls | login/auth server, tenant/branch RBAC enforcement |
|15 Subscription | /admin/subscription | overview usage và trạng thái chưa kết nối | plan billing/entitlements/renewal |
|16 E-invoice | /admin/invoices | provider configuration và empty state tách bill | ký hợp đồng/provider API, issue/lookup/adjust/replace |

## Thanh toán / số liệu

QR tạo cục bộ EMV/NAPAS payload + CRC và qrcode library, không gửi thông tin ngân hàng tới dịch vụ ảnh. Chưa kiểm tra bằng app ngân hàng thật; chỉ dùng cấu hình thử để review. Bản backend sẽ lấy amount authoritative từ server như API.md.
Cash change không tính vào tiền thu. Transfer excess là thực nhận, không áp tất cả vào debt. Refund giữ collected/applied lịch sử và trường refunded, không tự mở lại công nợ.
Bill/item snapshots không đổi khi sửa sản phẩm; frozen QR giữ bank/amount. Tách/gộp giữ totals, item fulfillment mapping và events; số bill không trùng khi tách.
Reporting bao gồm cơ sở archived để không mất lịch sử. Ngày theo Asia/Ho_Chi_Minh; report sales và cashflow có mốc sự kiện khác nhau đã ghi trong API.md.

## Browser-local boundary

Không có tài khoản đăng nhập thật. “Vai trò xem” chỉ đổi UI; không là cơ chế bảo mật server. Owner-only bank editing được phản ánh trong controls.
Từng trình duyệt có state riêng. Các tab stale bị chặn ghi đè, cần tải lại; không cam kết database transaction atomicity của localStorage. QR fixture ổn định cho người xem mới, nhưng bàn/QR mới tạo hoặc rotate ở một browser chưa đồng bộ sang browser khác.
Mọi xác nhận tiền/refund/order request có thông báo lưu trên trình duyệt; không giả đã gửi server, nhận tiền ngân hàng, in thật hoặc phát hành invoice.

## Assets

Ảnh món là ảnh minh họa AI tạo bằng imagegen built-in, dùng CSS spritesheet apps/web/public/drinks.png; không ảnh khách hàng thật. Logo mặc định icon vector Coffee POS; có thể upload logo riêng. Font Be Vietnam Pro được bundle local.
