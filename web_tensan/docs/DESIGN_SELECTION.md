# Lựa chọn thiết kế — ĐÃ CHỐT
Cập nhật: 2026-10-17

## Điều chỉnh theo phản hồi mới nhất
Yêu cầu mới nhất là mô hình đẹp, đầy đủ và chi tiết hơn, tự xoay ngay khi vào trang và nhanh hơn. Cụm tản nhiệt được bổ sung quạt chín cánh nghiêng có khung, ốc và điểm nhấn xanh nhẹ; chỉnh ánh sáng kim loại. Bật tự xoay mặc định ở tốc độ 1.1 và quay cánh quạt, vẫn dừng khi người dùng xem keo/kéo mô hình hoặc thiết bị bật giảm chuyển động. Giữ lớp keo TS1001 và bố cục tách lớp đã chọn.

Người dùng tiếp tục yêu cầu mô hình và phần đầu hiện đại, đầy đủ hơn, đồng thời giữ cùng URL Cloudflare và push vào Git có sẵn tại D:/Freelancer. Đã tăng chi tiết PCB (vias, đường mạch, linh kiện, đầu nối, chân đế), cụm lá tản nhiệt cong và ống đồng, bề mặt kim loại có texture; vẫn giữ bố cục tách lớp và trọng tâm keo TS1001. Đầu trang dùng khung trưng bày, thẻ ảnh sản phẩm và dải liên kết ứng dụng. Phần danh mục/sản phẩm/giới thiệu được chỉnh đồng bộ trong phạm vi trang chủ.

Người dùng đính kèm lại mô hình bo mạch và làm rõ: vẫn phải giữ thiết kế tách lớp, chỉ cải thiện độ rõ và cho thấy keo tản nhiệt trên chính mô hình. Phương án thay hero bằng bao bì bị bác bỏ. Thiết kế hiện hành giữ bo mạch + chip + lớp keo + tản nhiệt nhôm, nhãn nổi bật “Keo tản nhiệt TS1001” nối đúng vị trí khi xoay; có ảnh TS1001 thật bên cạnh. Lớp keo có viền mềm và vệt dàn, đặt giữa chip và đế tản nhiệt khi lắp ghép. Có kéo xoay, nút 30°, góc ban đầu, tự xoay tùy chọn và nút xem lớp keo. Phản hồi mới nhất này là yêu cầu đang thực hiện, không có thêm bước phê duyệt thiết kế của người dùng.

## Lựa chọn gốc

Người dùng đã đính kèm lại ảnh phương án A ban đầu và yêu cầu: "vậy làm với cái này đi, có 3d với animation nhé".
Quyết định này thay thế mọi hướng đề xuất trước đó (campus sát Mentech và bàn ứng dụng vật liệu).

- Ảnh chốt: mockups/selected-design.png.
- Hero tối xanh với bảng mạch tách lớp, chữ trắng/xanh ngọc.
- Bên dưới là nền sáng, bốn nhóm vật liệu, bốn nhóm ứng dụng, sản phẩm tiêu biểu và giới thiệu/liên hệ.
- Thực hiện bằng mô hình Three.js thật và GSAP, không dùng ảnh mockup toàn trang để giả website.
- Giữ logo và ảnh sản phẩm nguồn Tensan; sửa nhãn sai trong mockup: TS1001 là keo tản nhiệt, TS8833 là keo AB hai thành phần.
- Người dùng tiếp tục yêu cầu triển khai Cloudflare sau khi hoàn thành.
- Các file mockup khác chỉ là lịch sử trao đổi, không phải thiết kế hiện hành.

Triển khai: source trong src/, 29 sản phẩm từ nguồn công khai, 39 trang HTML tĩnh khi build.
Xem FRONTEND_PLAN.md, VALIDATION.md và README.md để tiếp tục công việc.

