# Phạm vi admin portfolio — bản đề xuất 2026-10-14

Trạng thái: người dùng chọn admin frontend cục bộ ngày 2026-10-14. Đã triển khai `/admin/` và `/xem-thu/`; backend làm sau.

## Quản lý dự án
- Thêm/sửa/xóa dự án, với xác nhận trước xóa.
- Tên, slug, loại, mô tả, ảnh đại diện/gallery, video tùy chọn, thời gian, công nghệ, bài toán, giải pháp, phạm vi công việc và thành viên/vai trò.
- Link website chạy thật, bản trải nghiệm và GitHub nếu được phép công khai; URL ngoài chỉ HTTP/HTTPS.
- Nháp/công khai, thứ tự hiển thị, dự án nổi bật, phân biệt dự án khách hàng/cá nhân/mẫu.
- Hồ sơ nhạy cảm phải ẩn danh và loại bỏ dữ liệu riêng khỏi bản công khai.

## Quản lý trang chủ
- Thêm khối từ thư viện thành phần: hero, dự án nổi bật, gallery ảnh, dịch vụ, quy trình, giới thiệu nhóm, FAQ, CTA liên hệ.
- Sửa nội dung và tùy chọn hiển thị theo từng loại khối, bật/tắt, đổi thứ tự và xóa khối.
- Chọn dự án cụ thể và thứ tự trong khối dự án nổi bật.
- Xem trước desktop/mobile trước khi công khai; giữ hướng thiết kế A.
- Không cần người quản trị viết HTML/CSS/JavaScript để thêm các khối chuẩn.

## Cách hiển thị project được đề xuất
Trang chủ và danh sách hiển thị ảnh, tên và mô tả ngay trên portfolio. Bấm dự án mở trang case study riêng (/du-an/slug/) với ảnh/video, bài toán, giải pháp, phần việc và vai trò. Trang này có nút mở sản phẩm thật/GitHub ở tab mới khi có link. Project không có link ngoài vẫn có thể trưng bày trên portfolio. Không cần nhúng nguyên website ngoài vào iframe.

## Quyết định đã xác nhận
Admin frontend: dữ liệu chỉnh sửa lưu cục bộ trong trình duyệt, xem trước và xuất/nhập cấu hình; không phải cập nhật công khai cho mọi người. Backend làm sau. Chưa có tài khoản riêng, phân quyền, duyệt bài hoặc xuất bản đồng bộ.

Không coi lựa chọn thiết kế A trước đó là quyết định về cơ chế lưu hoặc đăng nhập của admin.
