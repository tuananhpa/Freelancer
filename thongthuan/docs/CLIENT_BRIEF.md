# CLIENT BRIEF — CEC JSC

Cập nhật: 10/10/2026. Giai đoạn: brief và mockup; chưa chọn thiết kế, chưa triển khai website.

## Yêu cầu từ người dùng và tài liệu khách hàng

- Website quảng bá, khẳng định thương hiệu và PR/marketing cho công ty mới mang vai trò công ty mẹ của Thông Thuận.
- Nhận diện: logo CEC JSC trong ảnh câu trả lời; xanh biển, xanh cyan, vàng, trắng. Giữ tỷ lệ và hình dạng logo khi triển khai; ảnh mockup chỉ tham khảo thị giác.
- Cấu trúc tương tự website Thông Thuận. Sáu trang: Trang chủ, Giới thiệu, Sản phẩm, Nhà máy, Liên hệ, Tin tức.
- Hai ngôn ngữ: Việt và Anh.
- Sản phẩm/lĩnh vực: thủy sản; bổ sung sữa và khu đô thị.
- Có nhu cầu tự cập nhật nội dung qua trang quản trị. Backend/CMS thuộc giai đoạn sau; chưa có yêu cầu kiến trúc hoặc công nghệ cụ thể.
- Khách cho biết có sẵn nội dung/hình ảnh/video; hiện nhận được bốn ảnh brief và hội thoại, chưa nhận bộ tài sản riêng hoặc source code.
- Chưa có tên miền/hosting; mong muốn hoàn thành sớm. Các mức giá, hỗ trợ hosting và hẹn bàn giao trong ảnh là thông tin hội thoại, không phải cam kết mới của dự án này.
- Yêu cầu hiện tại: dùng client-web-flow, lấy thông tin từ trang gốc và cho xem kết quả.

## Nguồn nội dung đã khảo sát

Nguồn gốc: https://www.thongthuanseafood.com/

- Giới thiệu: https://www.thongthuanseafood.com/gioi-thieu/thong-thuan-co-ltd
  Thông Thuận bắt đầu từ cơ sở sản xuất tôm giống năm 1990, do ông Trương Hữu Thông thành lập tại Vĩnh Hảo, Tuy Phong, Bình Thuận. Đây là lịch sử Thông Thuận, không tự gán thành lịch sử pháp nhân CEC.
- Sản phẩm: https://www.thongthuanseafood.com/san-pham
  Tôm và cá tra, các dạng phi lê, tôm chế biến. Dữ liệu gốc trộn Việt/Anh, cần chuẩn hóa biên tập và bản dịch.
- Nhà máy/cơ sở: https://www.thongthuanseafood.com/co-so-vat-chat
  Nội dung trang gồm trại nuôi, phòng thí nghiệm, tôm giống. Trang chủ và footer có hệ thống Phan Rang, Cam Ranh, Trà Vinh, Sa Đéc. Phân biệt trại nuôi và nhà máy; không tự suy diễn ảnh bất kỳ thuộc cơ sở nào.
- Liên hệ: https://www.thongthuanseafood.com/lien-he
  Thông tin thuộc Thông Thuận: KCN Thanh Hải, Phan Rang–Tháp Chàm; dnquoctuan@thongthuanseafood.com; 090 3522797. Footer có 0258.3743.173. Không dùng làm thông tin pháp nhân CEC khi chưa xác nhận.
- Trang chủ có đoạn Lorem ipsum và các kế hoạch năm 2023/2024: không sao chép các đoạn giữ chỗ hoặc mô tả kế hoạch cũ thành thành tựu hiện tại.
- Chưa thấy mục Tin tức trong menu trang gốc đã khảo sát. Không tạo bài báo, ngày đăng hoặc sự kiện giả.

## Tài sản và giới hạn

Logo nằm trong ảnh: C:/Users/buiti/AppData/Local/Temp/codex-clipboard-3b119f0d-ccc7-4602-9faa-8c40cfb2352a.png
Ba ảnh hội thoại còn lại là nguồn yêu cầu; không phải hình ảnh dùng công khai cho khách truy cập.
Ảnh sữa và đô thị trong mockup là minh họa định hướng, chưa đại diện dự án/sản phẩm thật của CEC.
Chưa rõ tên pháp lý đầy đủ, thông tin liên hệ CEC, chi tiết ngành sữa/đô thị, bộ ảnh riêng và bài tin tức; dùng tên CEC JSC trong đề xuất, không bịa các dữ kiện còn thiếu.

## Phạm vi phiên hiện tại

Thư mục dự án trống khi khảo sát, chưa có ứng dụng để chạy.
Chuẩn bị ba mockup trang chủ A/B/C theo client-web-flow. Sau khi người dùng chọn/mix: chốt tokens, lập kế hoạch frontend, triển khai 6 trang bằng dữ liệu tĩnh và kiểm tra desktop/mobile. CMS/backend lập kế hoạch ở giai đoạn sau.

## Điều chỉnh trực tiếp của người dùng
Giao diện phải đẹp và hiện đại hơn; không lấy template từ trang cũ. Trang cũ chỉ cung cấp nội dung và ảnh. UI vẫn dễ dùng, rõ ràng. Điều chỉnh này thay thế yêu cầu giữ bố cục tương tự ở phần brief ban đầu; giữ menu 6 trang và cấu trúc nội dung dễ tìm. A sẽ được thiết kế lại theo hướng này.

## Bổ sung mockup theo trang và thiết bị
Người dùng yêu cầu mockup cụ thể cho từng trang trên điện thoại, tablet, desktop; không phải landing page một trang. Phạm vi bộ ảnh: 6 trang x 3 kích thước = 18 bố cục, trình bày trong 6 bảng ảnh so sánh. Dùng hướng A sửa mới làm đề xuất chung, chưa coi là thiết kế đã được duyệt. Trang chủ chỉ tổng quan; Giới thiệu, Sản phẩm, Nhà máy, Tin tức, Liên hệ là các trang độc lập.

## Yêu cầu mở rộng: bản đồ, admin và đơn hàng

Người dùng yêu cầu:
- Liên hệ có bản đồ Google Maps theo ảnh mẫu, có thông tin điểm và nút mở Maps/chỉ đường.
- Bấm vào từng cơ sở nhà máy mở trang chi tiết có bản đồ riêng của đúng cơ sở.
- Menu chính sticky khi cuộn trên toàn website; điện thoại/tablet có menu gọn và nhãn rõ, không che nội dung.
- Trang admin chỉnh ảnh và chữ ở từng trang, có nội dung Việt/Anh; lưu nháp, xem trước, công bố là các trạng thái riêng.
- Admin thêm/sửa/xóa sản phẩm; xem các sản phẩm khách đặt và thông tin đơn.
- Admin thêm/sửa/xóa bài viết trong Bản tin doanh nghiệp.
- Admin thêm/sửa/xóa widget Facebook, TikTok và các nền tảng tương tự; bật/tắt hiển thị, chọn vị trí, thứ tự; xem trước widget. Widget nội dung nhúng khác với nút liên kết mạng xã hội.

Ảnh bản đồ mẫu ghi Thông Thuận Co., Ltd tại Vĩnh Hảo. Đây là vị trí Thông Thuận, chưa xác nhận là địa chỉ của CEC hay các nhà máy khác. Liên hệ có bộ chọn cơ sở; chi tiết cơ sở dùng địa chỉ/map riêng. Admin cho sửa tên, địa chỉ, map URL của từng cơ sở. Không sao chép cùng một pin Vĩnh Hảo cho tất cả nhà máy.

Đang hỏi loại đặt hàng: gửi yêu cầu chọn sản phẩm/số lượng/thông tin liên hệ hay ecommerce thanh toán/giao hàng. Chưa giả định có thanh toán online, giá bán hoặc tồn kho. Các mockup admin Đơn đặt hàng có thể thể hiện thông tin sản phẩm và trạng thái tiếp nhận độc lập với quyết định này.

Giai đoạn hiện tại vẫn là cập nhật mockup; chưa có thiết kế được duyệt và chưa triển khai backend/admin thật. Scope backend sau này phải có đăng nhập, phân quyền, lưu dữ liệu/upload ảnh và nhận đơn thật; gallery ảnh không được coi là hệ thống quản trị hoạt động.
## Bổ sung đã chốt — Maps, quản trị, yêu cầu đặt hàng (10/10/2026)

- Menu chính bám theo khi cuộn trên desktop, tablet, điện thoại; mobile dùng hamburger.
- Liên hệ có Google Maps, mở Maps/chỉ đường và chọn cơ sở.
- Mỗi mục Nhà máy mở trang chi tiết có ảnh, thông tin, bản đồ riêng. Không dùng pin Vĩnh Hảo cho tất cả nhà máy.
- Admin: sửa ảnh/chữ từng trang theo VI/EN; thêm/sửa/xóa sản phẩm; xem sản phẩm trong yêu cầu khách; quản lý bài viết; quản lý widget Facebook/TikTok/YouTube và vị trí, thứ tự, bật/tắt.
- Người dùng đã chọn: **Gửi yêu cầu đặt hàng**, chọn sản phẩm + số lượng + thông tin liên hệ. Admin tiếp nhận và xử lý. Không thanh toán online.
- Thông tin liên hệ và lời nhắn khách để trống trong mockup, không tạo đơn thật.
- Map tham chiếu Vĩnh Hảo được lấy từ iframe trên https://www.thongthuanseafood.com/lien-he, tương ứng ảnh người dùng. Các link/pin chính xác từng cơ sở cần khách xác nhận khi triển khai.
- Bộ ảnh mở rộng gồm 8 màn hình website và 5 màn hình admin, mỗi màn hình có ba bố cục thiết bị.
- Trạng thái: đang duyệt mockup. Gallery hoạt động để chọn ảnh, phóng to và xem bản đồ thật; chưa có sản phẩm frontend/CMS/server/database thực.


## Chuyển sang frontend đã được chấp thuận
Ngày 10/10/2026 người dùng chốt bộ giao diện và yêu cầu triển khai ngay, chạy Cloudflare Tunnel. Thực hiện frontend dữ liệu tĩnh theo skill, bao gồm admin tương tác trong trình duyệt; chưa triển khai backend thực. Các mục trạng thái chưa duyệt phía trên là lịch sử, đã được thay thế bởi quyết định này.
