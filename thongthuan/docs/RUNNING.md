# CEC JSC — bản frontend đang chạy

Ngày kiểm tra: 10/10/2026.

- Public: https://transportation-vessel-while-podcast.trycloudflare.com/
- Admin: https://transportation-vessel-while-podcast.trycloudflare.com/admin
- Local: http://127.0.0.1:4180/
- Server Node PID: 25364. Cloudflared PID: 34888.

Link public hoạt động khi máy có mạng và hai tiến trình trên còn chạy. Khởi động tunnel mới sẽ tạo link mới. Chỉ thư mục `dist` được phục vụ; tài liệu khách hàng, mã nguồn và file runtime không được công khai.

## Chạy lại

Trong PowerShell tại `D:\Freelancer\thongthuan`:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run build
./scripts/start-preview.ps1
Get-Content .runtime/tunnel-error.log
```

Nếu cổng 4180 đang chạy, script giữ phiên hiện tại và báo lỗi để tránh tạo phiên chồng nhau. PID phiên mới được ghi ở `.runtime/processes.json`. Dừng đúng tiến trình của phiên này khi không cần chia sẻ nữa.

## Phạm vi thực tế

Website gồm các trang riêng, VI/EN, menu sticky, sản phẩm có tìm kiếm/bộ lọc, yêu cầu sản phẩm và số lượng, bản tin/chi tiết bài, danh sách/chi tiết cơ sở, Maps liên hệ. Admin có chỉnh ảnh/chữ, bản nháp/xem trước/công bố, sản phẩm/bản tin/widget CRUD, chỉnh cơ sở/Maps, yêu cầu/trạng thái/ghi chú/CSV.

Đây là giai đoạn frontend theo client-web-flow. Nội dung admin và yêu cầu được lưu bằng localStorage riêng theo trình duyệt và origin. Người khác mở tunnel sẽ có dữ liệu riêng; admin trên máy chủ chưa nhận đơn từ thiết bị đó. Chưa có đăng nhập, phân quyền, database dùng chung, email hay thanh toán. Giao diện thông báo rõ trước và sau khi lưu. Không dùng để tiếp nhận đơn thật trước khi triển khai backend.

Ảnh ngành sữa/khu đô thị/vịnh là minh họa, không xác nhận địa điểm/dự án cụ thể. Logo được trích dựng từ ảnh người dùng cung cấp. Ảnh và dữ liệu thủy sản tham chiếu website Thông Thuận; không gán ảnh nhà máy không xác minh vào từng cơ sở.

## Kiểm chứng

- 11 domain/storage tests pass; production build pass.
- 15 trang/nhánh kiểm tra ở 390×844, 768×1024, 1440×1000, không tràn ngang.
- Kiểm tra UI chọn sản phẩm, lỗi form thiếu thông tin, lưu yêu cầu kiểm thử, xem/cập nhật trạng thái admin, thêm/ẩn sản phẩm, reload giữ dữ liệu, tạo bản tin nháp, widget tắt, xem trước bản nháp riêng, VI/EN, menu điện thoại, đổi Maps từng cơ sở.
- Maps Vĩnh Hảo hiển thị qua tunnel; website public tải được ảnh. Lỗi console ứng dụng: không ghi nhận trong phiên kiểm tra.
- Reviewer độc lập đã rà soát. Hai lỗi phục hồi dữ liệu được sửa, regression test chạy FAIL → PASS. Có banner phục hồi rõ và giữ bản dữ liệu lỗi trước khi tạo dữ liệu mới.
- Dữ liệu kiểm thử chỉ ở origin local: một yêu cầu ghi rõ kiểm thử, sản phẩm ẩn, bài nháp, widget tắt, bản nháp trang chủ. Origin public sạch khi bàn giao.

## Cập nhật admin/widget
Nút Công bố đổi thành Lưu & áp dụng; Lưu nháp chỉ dùng xem trước. Đã kiểm tra sửa tiêu đề admin rồi nhìn thấy nội dung mới trên public cùng origin localhost và Cloudflare. Widget vị trí floating hiển thị icon tròn ở góc dưới phải; khi thêm widget mới vị trí mặc định là floating. Chưa tự thêm link mạng xã hội doanh nghiệp khi chưa được cung cấp URL.
Phiên Quick Tunnel cũ đã dừng và trả 530; người dùng chọn link tạm mới. Không thể lấy lại hostname ngẫu nhiên của phiên đã mất.
