# Design selection — Coffee SaaS

Ngày14/10/2026. Trạng thái: ĐÃ CHỌN A theo yêu cầu trực tiếp “Sử dụng cái A đi và tạo tunnel cho t xem”.

## Scope và hướng so sánh

Cùng cashier POS, Chi nhánh Quận1, Bàn08; 2 cà phê sữa35000 +1 trà đào45000 =115000; Chưa thanh toán. Ảnh raster thật tạo bằng imagegen built-in, không phải frontend chạy được.
A — Menu trực quan: navigation trái, grid ảnh giữa, bill cố định phải; teal/navy và humanist sans.
B — Bàn là trung tâm: navigation ngang, board bàn trái, list món giữa, bill phải; indigo/lilac và geometric sans.
C — Điều phối đơn nhanh: navigation trái, queue đơn + list món gọn + bill; slate/cobalt và typography dữ liệu.

## Candidate tokens — chưa persist hệ thống chính thức

| Candidate | Palette | Type / layout |
| --- | --- | --- |
| A | #075E63 #17313C #F5F8FA #FFFFFF #DDE7EB | Be Vietnam Pro direction; spacious photo catalog |
| B | #343778 #24283F #F4F4FA #FFFFFF #DADBED | Nunito Sans direction; table-centric columns |
| C | #235AC9 #273449 #F5F6F8 #FFFFFF #D9DFE8 | IBM Plex Sans direction; order queue and compact lists |

Bảng trên giữ lịch sử3 candidate; chỉ A được chọn. Icon coherent line family, controls POS target48CSSpx và gap8px, color kèm text trạng thái. Motion restrained. Mobile customer/waiter role-specific, không shrink desktop.
Tra cứu UI/UX: kết quả design-system lần đầu ra landing/glassmorphism không phù hợp cashier; retry có Data-Dense Dashboard phù hợp console C, nhưng Enterprise Gateway/Contact Sales không áp dụng. Không persist kết quả chưa phù hợp/được chốt. UX result loading button/touch spacing dùng làm guideline; 48CSSpx là lựa chọn POS, không nhầm pt/dp thành chuẩn WCAG web.

## Admin — scope được chủ dự án bổ sung

/admin dashboard daily by branch; /admin/products, images, categories/options/prices, banks, tables, printers, staff/roles, settings theo quyền. Landing Admin hiển thị daily collected cash/transfer/refund/debt và original receipt list; e-invoice list riêng.
Mockup cashier là màn hình đại diện; thêm ảnh Admin-dashboard.png theo yêu cầu dashboard mới. Ảnh Admin đang chờ review, không phải phương án POS D và chưa được duyệt. Build sẽ đưa Admin vào navigation, kể cả A image ban đầu chưa có nhãn Admin. Không coi thiếu nhãn trong ảnh là bỏ tính năng.

## Chọn/mix

Đã chọn A, không mix. Chỉnh sửa theo scope được yêu cầu: bổ sung Admin, dashboard ngày/cơ sở và đủ16 nhóm giao diện. Người dùng yêu cầu build/tunnel trong chat này. Mix đáng kể phải có ảnh tổng hợp mới để chốt. Chữ/interactions trên code sẽ chính xác hơn ảnh, không dùng text render ảnh làm final functional spec.

## Assets

Đích docs/mockups/A-menu.png, B-tables.png, C-queue.png. Chỉ ghi saved/verified sau khi copy và đọc kiểm tra.
Không nhận logo, ảnh sản phẩm thật hoặc screenshot khách. Drink images illustrative.
Prompt set lưu docs/mockups/PROMPTS.md; built-in tool, không API/CLI fallback.


## Kết quả ảnh đã quan sát

A/B/C được tạo, xem inline và copy vào docs/mockups. Tổng giỏ115.000đ đúng trong cả3 ảnh. Ảnh C tự sinh ngày tham khảo không khớp ngày làm việc; typography/separators/từ trạng thái chỉ là định hướng. Code sẽ dùng ngày thật, format VND thống nhất và enum tiếng Việt từ contract. Ảnh A sẽ bổ sung Admin vào navigation khi build.

Admin-dashboard.png minh họa hai cơ sở, cash1.150.000đ + transfer2.300.000đ = collected3.450.000đ;20+10=30bill. Chưa thu115.000đ riêng. Bill bán hàng và e-invoice có tab riêng. Số liệu chỉ phục vụ mockup, chưa có database.

Đã build A; palette teal/navy, font Be Vietnam Pro bundle local; CSS variables ở apps/web/src/styles.css.
