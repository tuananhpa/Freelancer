# Warecon – Các phần của app quản lý xưởng

Bản mockup PWA (chạy trên trình duyệt, cài được lên điện thoại). Dựa trên `Warecon/OVERVIEW.md` (gồm phần ghi chú yêu cầu ở đầu file) + `Warecon/PLAN.md` + các yêu cầu mới: lịch sử nhập hàng, điểm danh, quy trình sản xuất tuỳ chọn với block tạo sẵn, trang thu chi / giá thành.

> Trạng thái: **mockup**. Dữ liệu mẫu, lưu trong trình duyệt (localStorage). Chưa có đăng nhập thật, máy chủ hay đồng bộ nhiều máy. Vai trò chỉ là nút chuyển để xem thử.

## 1. Bản đồ màn hình

| Phần | Đường dẫn | Ai thấy | Làm được gì |
|---|---|---|---|
| **Tổng quan** | `#/` | Mọi vai trò | Báo đỏ **lịch kín**; đơn đang làm, đơn trễ, hàng sắp hết, có mặt hôm nay; thu/chi tháng (chủ); **công việc hôm nay** (công đoạn hiện tại + việc được giao, tích xong); đề xuất chờ duyệt, ghi chú chưa xử lý. |
| **Giao việc & chat** | `#/giao-viec` | Mọi vai trò | Chủ xưởng giao việc cho **một người hoặc cả tổ** (gắn đơn tuỳ chọn) → người nhận có **thông báo**, bấm **Xác nhận nhận việc** → làm xong / cuối ca bấm **Đã xong**, gặp lỗi bấm **Báo lỗi** (mô tả + tối đa 4 ảnh) → chủ xưởng **kiểm tra**: Đạt, hoặc **Yêu cầu làm lại** kèm ghi chú. **Nhóm chat**: kênh Toàn xưởng + mỗi tổ một kênh, nhắn chữ/ảnh, việc được giao hiện ngay trong kênh tổ. Nhân viên chỉ thấy kênh của tổ mình. |
| **Đơn hàng & khách** | `#/don-hang` | Mọi vai trò (nhân viên không thấy tiền) | Gộp đơn hàng + khách hàng. Đơn: Chờ / Đang làm / Xong / Huỷ. Bấm đơn để mở đủ thông tin: quy trình, hàng, vật tư, **tiền của đơn**, giá thành. Tạo đơn kèm tạo khách, tạo đơn tương tự, huỷ, giao việc. Khách: danh sách, còn nợ, hay đặt gì, lịch sử đơn. |
| **Kho** | `#/kho` | Mọi vai trò (nhân viên không thấy giá) | Tồn kho lọc theo NVL / thành phẩm / sắp hết / **danh mục**; thuộc tính riêng theo danh mục. Phiếu nhập (lịch sử nhập hàng). Sổ kho (mọi lần nhập/xuất/điều chỉnh, có giá trị). |
| **Thu chi** | `#/thu-chi` | Chủ xưởng | **Tổng hợp** theo ngày/tháng/năm: tiền thu vào, chi ra, chênh lệch, khách còn nợ, đơn nhận vào / đơn giao ra, biểu đồ 6 kỳ, chi theo loại. **Sổ thu chi** (tiền vào/ra từng dòng). **Giá thành đơn** (bảng tính đủ cột). **Chi phí**. **Hoá đơn**. Tất cả xuất Excel. |
| **Điểm danh** | `#/diem-danh` | Chủ, nhập liệu | Chấm Có / Muộn / ½ / Phép / Vắng + giờ vào/ra; bảng công tháng, xuất Excel. |
| **Báo cáo ca** | `#/bao-cao` | Mọi vai trò | Báo cáo cuối ca: sản lượng + hàng lỗi theo đơn, ghi chú, **ảnh chụp** (nén còn ~1024px). Sửa phải ghi lý do, giữ lịch sử. |
| **Ghi chú & đề xuất** | `#/ghi-chu` | Mọi vai trò | Ghi chú chung gắn đơn/khách/mặt hàng, đánh dấu đã xử lý. **Đề xuất thay đổi** chỉ gửi được trước ca hoặc 30 phút đầu ca, sau đó khoá; chủ xưởng duyệt/từ chối. |
| **Cài đặt** | `#/cai-dat` | Chủ xưởng | Tên xưởng, giờ vào ca, số đơn song song; **block công đoạn**; **danh mục kho** + trường riêng; nhân viên; **nhập từ Excel** (mặt hàng, khách hàng); sao lưu / khôi phục / đặt lại. |
| **Thêm** | `#/them` | Mọi vai trò | Lối vào các trang không nằm ở thanh dưới, chọn vai trò (demo), cài app. |

## 2. Tiền của mỗi đơn hàng

| Mục | Cách tính |
|---|---|
| Giá trị đơn | Σ số lượng × đơn giá các dòng hàng |
| Tiền cọc yêu cầu | Nhập khi tạo đơn; hiện “Đã cọc đủ” / “Còn thiếu …” |
| Đã thu | Σ các lần thu (đặt cọc + thanh toán − hoàn tiền). Mỗi lần thu là một dòng có ngày, hình thức (tiền mặt / chuyển khoản), không sửa/xoá |
| Còn phải thu | Giá trị − đã thu |
| Giá vốn | Vật tư đã xuất kho cho đơn (theo giá nhập) + chi phí khác của đơn (nhân công, vận chuyển, gia công ngoài…) |
| Lãi | Giá trị − giá vốn, kèm % biên; nhãn **Tạm tính** cho tới khi bấm **Chốt giá thành** |

Hoá đơn tạo từ đơn: Nháp → Phát hành (khoá nội dung) → có thể Huỷ (vẫn giữ lịch sử). Trạng thái thu tiền (chưa thu / một phần / đủ) tự tính từ các lần thu. Hoá đơn không hiện giá vốn, lãi. In hoặc lưu PDF bằng trình duyệt.

**Tiền vào** = cọc + thanh toán của khách. **Tiền ra** = phiếu nhập kho (mua vật tư) + khoản chi (lương, mặt bằng, điện nước…) + hoàn tiền cho khách.

## 3. Quy tắc nghiệp vụ đã chạy trong mockup

- Hàng chờ xếp theo **ưu tiên G1 → G4**, rồi **ngày kết thúc**, rồi ngày khách muốn nhận.
- **Đủ vật tư mới được chuyển sang “Đang làm”**; khi bắt đầu, app tự xuất kho vật tư của đơn (ghi sổ kho, tính vào giá vốn).
- Đơn hoàn thành / huỷ hoặc nhập thêm hàng → tự đưa đơn đầu hàng chờ **đủ vật tư** lên “Đang làm”, trong giới hạn số đơn song song.
- **Lịch kín**: ngày nào có nhiều đơn chạy cùng lúc hơn mức cho phép thì báo đỏ ở Tổng quan và ngay trong form tạo đơn.
- **Quy trình sản xuất (tuỳ chọn)**: chọn block theo thứ tự; tính ngày dự kiến từng công đoạn (bỏ Chủ nhật); báo nếu vượt ngày khách nhận; bấm “Xong công đoạn” thì chuyển sang công đoạn sau; có hoàn tác.
- Sổ kho chỉ thêm; xuất quá tồn bị chặn. Đã thu không vượt giá trị đơn; hoàn tiền không vượt số đã thu.
- Cảnh báo khách có thể trùng (cùng SĐT hoặc tên).
- **Tổ**: mỗi nhân viên thuộc một tổ (Cài đặt → Nhân viên & tổ). Điểm danh nhóm theo tổ, có nút “Cả tổ có mặt”. Việc giao cho cả tổ: người đầu tiên bấm nhận sẽ là người làm, những người khác không thấy nữa.
- **Thông báo**: chuông trên thanh trên cùng (số chưa đọc) + số trên mục “Giao việc”. Có thể bật thông báo hệ thống trên máy (Thêm → Thông báo trên máy). Mockup chỉ báo trên máy đang mở; gửi tới điện thoại người khác cần máy chủ Web Push.
- Vai trò: chọn “Nhân viên: tên” ở ô vai trò để xem đúng màn hình của từng người. **Nhân viên** không thấy tiền/giá, không vào Thu chi, Cài đặt, Điểm danh; **người nhập liệu** thấy giá trị, cọc, đã thu nhưng không thấy giá vốn, lãi, Thu chi.

Logic nằm ở `assets/logic.js`, kiểm tra tự động: `node tests/check.js`.

## 4. Khác với ghi chú cũ

- Ghi chú cũ có “Bỏ checkin và kiểm soát tiến độ sản xuất” – **đã chốt ngày 17/11/2026: giữ cả điểm danh và quy trình (tuỳ chọn)**, dòng ghi chú cũ không còn áp dụng.
- “Bỏ nguồn lực”: không làm lịch theo máy/người, chỉ giới hạn số đơn song song.

## 5. Chưa làm (cần backend hoặc cần chốt)

1. Đăng nhập thật (Google/Facebook), mời nhân viên, phân quyền phía máy chủ (API phải tự ẩn dữ liệu tiền, không chỉ ẩn trên giao diện).
2. Máy chủ + cơ sở dữ liệu, nhiều máy dùng chung, chống ghi trùng khi mạng chập chờn.
3. Định mức vật tư theo từng công đoạn/block và tự trừ theo sản lượng báo cáo; nhập thành phẩm khi xong công đoạn cuối.
4. Phương án lịch tự tối ưu + chủ duyệt; trợ lý AI đọc mô tả đơn, gợi ý ưu tiên.
5. Thuế/VAT, giảm giá, phụ phí trên hoá đơn; mẫu hoá đơn theo quy định (hiện là hoá đơn nội bộ, địa chỉ/MST xưởng để `[[CẦN XÁC NHẬN]]`).
6. Tính lương từ bảng công; khoá sửa điểm danh ngày cũ.
7. Ảnh báo cáo đang lưu trong trình duyệt (giới hạn ~5MB) – bản thật cần lưu trữ ảnh (ImageKit/R2).
8. Lưu trữ (archive) khách/mặt hàng thay vì xoá; ngày nghỉ lễ của xưởng.

## 6. Chạy thật trên Cloudflare

- Địa chỉ: **https://warecon.edu-manage-ai.workers.dev** (Worker `warecon` + D1 `warecon-db`).
- Lần đầu: mở địa chỉ trên, nhập **mã khởi tạo** (trong file `.setup-code.txt` trên máy cài đặt, không đưa lên git), tạo tài khoản chủ xưởng. Có thể chọn nạp dữ liệu mẫu. Mã chỉ dùng được khi chưa có tài khoản nào.
- **Không có tự đăng ký.** Chủ xưởng tạo được mọi loại tài khoản; người nhập liệu chỉ tạo tài khoản nhân viên (trang **Tài khoản**). Tài khoản nhân viên gắn với một người trong danh sách nhân viên.
- **Lưu đăng nhập**: bật thì giữ đăng nhập 30 ngày, tự gia hạn mỗi lần mở app; tắt thì hết khi đóng trình duyệt (tối đa 12 giờ). Sai mật khẩu 5 lần khoá 10 phút. Đổi mật khẩu / bị khoá / đặt lại mật khẩu → đăng xuất trên mọi máy.
- **Dữ liệu** lưu trên D1, đồng bộ từng bản ghi giữa các máy khoảng 15 giây/lần (và ngay khi thao tác). Mất mạng vẫn dùng được trên máy, thay đổi tự gửi khi có mạng. Hai người sửa **cùng một bản ghi** cùng lúc thì bản gửi sau thắng.
- **Phân quyền ở máy chủ**: nhân viên không nhận được giá, tiền cọc, thanh toán, chi phí, hoá đơn; chỉ ghi được việc, tin nhắn, báo cáo, ghi chú, nhập/xuất kho và tiến độ công đoạn. Người nhập liệu không nhận giá vốn, chi phí, hoá đơn.
- Ảnh (báo lỗi, báo cáo, chat) lưu trên D1, chỉ người đã đăng nhập xem được.
- Cài lên điện thoại: mở địa chỉ bằng Chrome (Android) → menu ⋮ → Cài đặt ứng dụng; iPhone (Safari) → Chia sẻ → Thêm vào MH chính.

```bash
npm run deploy          # đưa bản mới lên Cloudflare
npm run db:migrate      # khi có file mới trong migrations/
npm run dev             # chạy thử trên máy với D1 cục bộ (cần .dev.vars có SETUP_CODE)
```

Chạy bản demo không cần máy chủ (dữ liệu mẫu trong trình duyệt): `python -m http.server 5178` rồi mở http://localhost:5178. Thông báo đẩy khi app đang đóng (Web Push) chưa làm: hiện thông báo chỉ hiện khi app đang mở hoặc vừa mở lại.
