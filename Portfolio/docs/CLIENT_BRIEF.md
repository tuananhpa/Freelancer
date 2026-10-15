# Portfolio nhóm freelance

## Trạng thái
Người dùng đã chọn mockup A ngày 2026-10-13. Ngày 2026-10-14 chọn thêm admin frontend cục bộ để quản lý dự án và các khối trang chủ; backend làm sau.

Cập nhật cùng ngày: người dùng yêu cầu làm backend Cloudflare Workers và deploy workers.dev, đã kết nối tài khoản Cloudflare. Backend hiện gồm D1, tài khoản/roles, draft/review/publish, media và contact thật; chế độ admin cục bộ vẫn được giữ cho server static phát triển.

## Mục tiêu đã xác nhận
Trưng bày portfolio nhóm freelance, giúp khách đánh giá năng lực qua dự án và liên hệ giao việc. Hình ảnh dự án là trọng tâm.

## Phạm vi
- Trang chủ, danh sách dự án, trang chi tiết có URL riêng, dịch vụ, giới thiệu nhóm, liên hệ.
- Project: ảnh đại diện, gallery, video khi cần, mô tả, loại, thời gian, công nghệ, bài toán, giải pháp, phạm vi công việc, thành viên/vai trò, link công khai khi được phép.
- Project nổi bật; phân biệt khách hàng/cá nhân/demo; bảo vệ thông tin dự án bảo mật.
- Admin frontend: thêm/sửa/xóa và sắp xếp dự án; thêm/sửa/bật/tắt/sắp xếp các khối trang chủ; thông tin nhóm; lưu trên trình duyệt, xem thử riêng, xuất/nhập JSON.
- Lọc, tìm kiếm, dự án liên quan là lựa chọn bổ sung.
- Quy trình, FAQ, báo giá qua liên hệ. Chỉ dùng đánh giá khách hàng thật đã được phép.
- Form: tên, email hoặc điện thoại, dịch vụ, nhu cầu; ngân sách và thời hạn tùy chọn. Backend cần lưu/chuyển yêu cầu, chống spam, trạng thái thành công/thất bại thật.
- Quản trị nhiều tài khoản, phân quyền, duyệt nội dung, thứ tự/nổi bật, nháp/công khai, yêu cầu liên hệ.
- Responsive, keyboard, contrast, hiệu ứng nhẹ, empty/error/not-found; sáng/tối tùy chọn.
- Tối ưu ảnh, metadata/share image, sitemap, hướng dẫn chạy/cập nhật/hosting/domain và kiểm tra trước bàn giao.

## Giả định chỉ dùng cho mockup
- Tiếng Việt; dịch vụ Website, Web app, UI/UX.
- Tên hiển thị: “Tên nhóm”; dự án minh họa ghi rõ “Dự án mẫu”. Không xem nội dung này là dữ liệu thật.
- Chưa có logo, ảnh hoặc website tham khảo được cung cấp.
- Thiết kế trang chủ desktop cùng nội dung cho cả 3 phương án; trang phụ làm sau khi chốt hướng.

## Còn thiếu để build/bàn giao
Tên nhóm, khách hàng mục tiêu, dịch vụ thực tế, ngôn ngữ cuối cùng, logo/màu, dữ liệu thành viên/dự án, kênh liên hệ, công nghệ, hosting/domain. Những thông tin này không ngăn việc tạo mockup định hướng.

## Các giai đoạn sau
Chọn hoặc mix ảnh → frontend dữ liệu tĩnh → khi yêu cầu hết demo: dọn nội dung/logic mẫu và viết PLAN.md backend. Quản trị, gửi form và auth thật thuộc backend, chưa triển khai ở giai đoạn mockup.
