# PWA và backend — ghi chú bàn giao 15/10/2026

Ghi nhận theo yêu cầu của chủ dự án sau khi xem bản frontend và thử cài từ tunnel. Đây là danh sách công việc còn lại, không phải xác nhận đã sửa hoặc đã có backend.

## Hiện trạng đã xác minh

- Vue/Vite có manifest Coffee POS, display standalone và Service Worker precache giao diện.
- Lần kiểm tra trước đã xác nhận Service Worker hoạt động và reload POS/menu khi offline qua tunnel. Xem FRONTEND_VERIFICATION.md.
- Manifest hiện chỉ dùng icon.svg. Chưa kiểm tra cài/mở trên điện thoại Android hoặc iPhone thật; việc chủ dự án định thử chưa được tính là kết quả pass.
- Dữ liệu hiện lưu riêng trong trình duyệt. Chưa có đăng nhập server, đồng bộ thiết bị hoặc tenant isolation thực tế.
- Quick Tunnel là URL tạm, phụ thuộc máy local/server/cloudflared. Chưa phải môi trường vận hành chính thức.

## PWA: frontend và triển khai

- [ ] Bổ sung icon PNG 192×192 và 512×512, icon maskable có safe zone và apple-touch-icon; kiểm tra mọi URL icon trả đúng ảnh.
- [ ] Rà manifest id, scope, start_url và metadata iOS trên tên miền triển khai cố định; kiểm tra mở deep link /pos, /admin/dashboard và /order/:token.
- [ ] Cài từ Chrome Android, Safari iPhone và Chrome/Edge desktop; đóng/mở lại từ icon, kiểm tra standalone, icon, safe area, bàn phím và điều hướng.
- [ ] Nếu cần nút Cài ứng dụng trong UI: chỉ hiện khi trình duyệt hỗ trợ và đủ điều kiện; iOS có hướng dẫn riêng, không báo cài thành công giả.
- [ ] Chốt quy trình cập nhật Service Worker: thông báo bản mới, tránh reload giữa lúc nhập đơn/thanh toán, dọn cache phiên bản cũ và kiểm tra rollback.
- [ ] Dùng HTTPS và tên miền cố định, cấu hình SPA fallback cùng header cache cho HTML/manifest/sw.js; không trả HTML thay lỗi API.

## Backend: ưu tiên trước khi dùng thật

- [ ] Thay repository/localStorage bằng API và database; xác thực người dùng, tenant/branch context và RBAC trên server. Role preview frontend không phải cơ chế bảo mật.
- [ ] Giá, tổng hóa đơn, số còn phải thu và ngân hàng nhận tiền phải lấy từ server; transaction, version conflict và idempotency bảo vệ thao tác lặp hoặc đồng thời.
- [ ] VietQR lấy đúng amount/account/reference từ bill snapshot server; tạo hoặc quét QR không tự đánh dấu Paid. Xác nhận thu tiền cần quyền và audit; webhook chỉ dùng khi đã tích hợp nhà cung cấp thật.
- [ ] Đồng bộ POS, phục vụ, bếp và khách QR giữa nhiều thiết bị; kiểm tra mất mạng, reconnect, đơn cập nhật đồng thời và token QR bị thu hồi.
- [ ] Dashboard tính hóa đơn đã xuất, tiền thực thu, hoàn tiền và công nợ theo từng cơ sở/ngày từ dữ liệu server; chốt timezone Asia/Ho_Chi_Minh và quy tắc ngày kinh doanh. Phân biệt bill với hóa đơn điện tử.
- [ ] Admin CRUD sản phẩm, ảnh, ngân hàng, cơ sở và cấu hình qua API có kiểm quyền/audit; ảnh lưu R2, không chỉ tồn tại ở trình duyệt.
- [ ] Super Admin: API tạo tenant/provisioning, khóa/mở, backup/restore và quản lý thuê bao/entitlements. Trang “Vòng đời tenant & thuê bao” hiện chưa thực hiện được các thao tác này.
- [ ] Triển khai các phần còn thiếu của brief: ca làm việc, nhân viên/quyền, Print Agent USB/LAN, hóa đơn điện tử và thuê bao. Chi tiết đối chiếu FRONTEND_SCOPE.md và các tài liệu kiến trúc ở root.

## Chính sách offline và dữ liệu riêng tư

MVP hiện đã chốt trong PLAN.md: không nhận đơn hoặc thanh toán offline. Mất mạng chỉ xem giao diện/menu đã cache; phải hiển thị trạng thái và chặn thao tác cần server, không báo đã gửi/đã thu thành công.

- [ ] Sau khi nối API, kiểm tra toàn bộ nút gửi đơn, thanh toán, hoàn tiền, sửa cấu hình và in khi offline; lỗi phải rõ, có thể thử lại an toàn khi online.
- [ ] Không thêm cache API chứa dữ liệu nhạy cảm theo mặc định; logout/đổi tenant phải dọn dữ liệu riêng và tránh hiển thị thông tin tenant trước.
- [ ] Nếu muốn nhận đơn offline ở giai đoạn sau, cần thiết kế riêng IndexedDB/outbox, idempotency, conflict resolution, expiry và trạng thái chờ đồng bộ trước khi triển khai. Đây là thay đổi phạm vi, không phải tính năng đã có nhờ PWA.

## Điều kiện xác nhận hoàn thành

Ghi thiết bị/OS/browser, URL, phiên bản build và bằng chứng cho từng kiểm tra. Kiểm tra ít nhất: cài/mở lại, online→offline→online, nâng phiên bản khi đang có giỏ, đăng xuất/đổi tenant, hai thiết bị cùng sửa đơn và gửi lại sau timeout không tạo đơn/thu tiền trùng. Chưa có bằng chứng thì giữ trạng thái chưa kiểm tra.
