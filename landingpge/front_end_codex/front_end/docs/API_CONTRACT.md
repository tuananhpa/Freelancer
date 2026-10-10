# Hợp đồng API đề xuất

Nguồn DTO: `src/types/domain.ts`; các call: `src/services/apiRepository.ts`. JSON response trực tiếp, không bọc `{data}`. Lỗi dùng HTTP tương ứng và `{message: string}`. 204 cho thao tác không có body. UTF-8, ISO dates.

`Product.timeline[].images?: {src:string,display?:{fit:'cover'|'contain',x:number,y:number}}[]` bổ sung ảnh theo mốc, tương thích record cũ thiếu field. Frontend hiện lưu cùng Product và dùng adapter media có sẵn để upload/chọn thư viện; fit và vùng hiển thị riêng cho từng ảnh. Hợp đồng backend production trong `../../backend/PLAN.md` thay src đầu vào bằng assetId, bổ sung association `timeline_event_assets`, kiểm tra quyền và reference khi đọc/xóa file. Không chấp nhận `local-media:`/Blob URL của browser làm tham chiếu production. Các endpoint trong bảng sau là adapter frontend hiện tại, không thay thế thiết kế production trong PLAN.

Form mua/quà tặng gửi `name`, `phone`, `note`, `type: 'purchase'`, `productId`, `quantity`, `unit`, `productName`. Tên sau trim và số điện thoại có 9–15 chữ số là bắt buộc; số lượng phải hữu hạn và lớn hơn 0; sản phẩm và đơn vị là bắt buộc. Backend cần kiểm tra lại các điều kiện này, xác nhận sản phẩm đang công khai và lấy tên sản phẩm từ database để lưu snapshot, không tin `productName` từ client. Inbox hiển thị tên, số lượng và đơn vị; snapshot giữ thông tin khi sản phẩm bị xóa. Yêu cầu `type: 'partner'` chỉ bắt buộc thông tin liên hệ, không yêu cầu sản phẩm/số lượng/đơn vị. Những field mới của Inquiry là optional trong DTO để đọc được dữ liệu cũ.

`Product.orderUnit?: string` là đơn vị mặc định do admin chọn/nhập (kg, g, hộp, giỏ, túi, quả hoặc tùy chỉnh). Sản phẩm cũ chưa có field này dùng kg. Người xem có thể đổi đơn vị khi gửi yêu cầu; `quantity` luôn được hiểu theo `unit` trong yêu cầu, không tự quy đổi.

Widget chat hiển thị từng lượt người dùng và trợ lý. Câu hỏi nhanh/nhập đúng câu hỏi cấu hình dùng đáp án từ FAQ, không gửi inbox. Các câu hỏi tự do gọi POST `/messages`, lưu một record mỗi lượt và hiển thị xác nhận tiếp nhận, không giả lập phản hồi trực tiếp. Khi đóng/mở widget, lịch sử của trang hiện tại vẫn còn; chuyển trang hoặc reload bắt đầu hội thoại mới. Live reply và lịch sử giữa thiết bị cần backend sau này.

| Method | Endpoint (sau API base URL)  | Nội dung                                                                         |
| ------ | ---------------------------- | -------------------------------------------------------------------------------- |
| GET    | /products                    | Product[] chỉ gồm published                                                      |
| GET    | /products/:slug              | Product hoặc 404, không cho thấy draft                                           |
| GET    | /admin/products              | Product[] kể cả draft                                                            |
| PUT    | /admin/products/:id          | Upsert Product, trả Product; slug bất biến khi đã tồn tại                        |
| DELETE | /admin/products/:id          | Xóa sản phẩm, trả 204; không còn truy cập public/QR                              |
| GET    | /admin/media                 | MediaAsset[]: {id,name,kind:'image'\|'video',url,poster?}                        |
| POST   | /admin/media                 | multipart/form-data, field file; trả MediaAsset                                  |
| GET    | /products/:productId/reviews | Review[]                                                                         |
| POST   | /products/:productId/reviews | name, rating, text, image?; trả Review                                           |
| GET    | /admin/reviews               | Review[]                                                                         |
| POST   | /inquiries                   | name, phone, note, type, productId?, quantity?, unit?, productName?; trả Inquiry |
| GET    | /admin/inquiries             | Inquiry[]                                                                        |
| PATCH  | /admin/inquiries/:id         | {status: 'new'\|'contacted'}, trả 204                                            |
| POST   | /messages                    | name, question, productId?; trả Message                                          |
| GET    | /admin/messages              | Message[]                                                                        |
| POST   | /admin/messages/:id/reply    | {reply: string}, trả 204                                                         |
| GET    | /settings                    | Settings (chỉ field công khai)                                                   |
| PUT    | /admin/settings              | Settings, trả 204                                                                |
| GET    | /auth/me                     | {name, role:'admin'} hoặc 401                                                    |
| POST   | /auth/login                  | {email,password}, trả AdminUser và set session cookie                            |
| POST   | /auth/logout                 | Hủy session, trả 204                                                             |
| GET    | /admin/analytics             | {totalScans,series:[{label,value}],regions:[{label,percent}]}                    |

## Ghi chú backend

- Mọi endpoint admin bắt buộc xác thực và phân quyền phía server; route guard trong frontend chỉ điều hướng UI. API phải kiểm tra quyền độc lập.
- Dữ liệu public không chứa password, token, email nội bộ hay thông tin riêng tư của khách hàng.
- Backend xác thực dữ liệu, limit payload, rate limit và chống spam cho form/review/chat. Frontend render plain text để tránh chèn HTML.
- Review image hiện truyền data URL JPG/PNG/WebP ≤ 2 MB. Backend có thể nhận JSON này, decode an toàn và trả URL HTTPS; renderer nhận cả data URL lẫn URL HTTPS/cùng origin. Nếu dùng multipart, đổi adapter/service. Không đặt base64 trong database production nếu không cần.
- Product gồm localized VI/EN, nguồn media và blocks. URI ảnh/video trong API phải là HTTPS hoặc cùng origin. GET/POST `/admin/media` được gọi qua `src/services/mediaLibrary.ts`. Giới hạn frontend: JPG/PNG/WebP ≤12 MB, MP4/WebM ≤300 MB. Server xác thực định dạng, kích thước và quyền, trả MediaAsset với URL lưu trữ; có thể bổ sung transcoding. Mock lưu Blob trong IndexedDB và reference `local-media:UUID`; reference này chỉ dùng trong demo và không được đưa vào dữ liệu production. Gỡ ảnh/video khỏi sản phẩm chỉ xóa reference, vẫn giữ file trong thư viện để dùng lại.
- Mã lô tự sinh `HY-năm-8 ký tự`, sửa được. ID và slug tự sinh khi tạo, slug bất biến khi cập nhật. Backend kiểm tra mã lô theo quy tắc nghiệp vụ và chống trùng.
- QR mã hóa URL ổn định `/q/:id`. Product có `qrDestination?: {kind:'product',productId:string} | {kind:'external',url:string}`. Mặc định mở chính sản phẩm đó. PUT Product lưu lựa chọn đích; route `/q/:id` frontend đọc dữ liệu public đã lưu để mở đích. Khi xóa hoặc chuyển sản phẩm nguồn/đích thành nháp, QR ngừng mở câu chuyện đó. Backend dùng chung mapping và kiểm tra quyền trạng thái, URL http/https hợp lệ, chống vòng lặp và đích nguy hiểm. Liên kết ra domain khác được hiển thị với tên miền cho khách chủ động mở. Các QR cũ `/p/:slug` vẫn dùng được nhưng chỉ mở chính câu chuyện, không hỗ trợ đổi đích qua mapping.
- Settings thêm `socialWidgetEnabled:boolean` và `socialLinks:Array<{id,platform,label,url,enabled}>`. platform hỗ trợ zalo/facebook/instagram/messenger/tiktok/youtube/website. Kênh URL trống hoặc disabled không hiện; global toggle tắt tất cả. URL không trống phải http/https hợp lệ. `zaloUrl` giữ để tương thích CTA cũ và được suy ra từ kênh Zalo đang bật. Không có liên kết mặc định đến tài khoản giả.
- QR generator frontend sử dụng URL, error correction H, màu tối và logo nhỏ; không phụ thuộc backend để xuất PNG/SVG/PDF.
- Analytics thật cần endpoint redirect/scan event, timestamp và cách xác định vùng. Không dùng dashboard demo làm chứng cứ về người dùng thật.
- Settings thêm `chatGreeting:{vi,en}` và `quickReplies:QuickReply[]`, dùng cho lời chào và bộ câu hỏi chung. QuickReply gồm `{id?:string,enabled?:boolean,question:{vi,en},answer:{vi,en}}`. `enabled` bỏ trống tương đương true để tương thích dữ liệu cũ. Admin quản lý qua `/admin/quick-replies`; bộ chung gọi GET `/settings` và PUT `/admin/settings`, bộ sản phẩm lưu trong `Product.faq` qua PUT `/admin/products/:id`. Backend phải bảo toàn thứ tự và các trường này, kiểm tra câu hỏi/trả lời VI, độ dài và quyền admin. Bản frontend đọc thiết lập cũ sẽ bổ sung bộ mặc định; một mảng rỗng chủ động sẽ được giữ rỗng.
- Trợ lý ở trang sản phẩm dùng `Product.faq`; các trang khác dùng bộ chung. Câu đã ẩn không hiển thị. EN trống dùng VI; lời chào dùng chung toàn website. Mỗi lần mở trợ lý sẽ đọc lại dữ liệu để nhận bản cập nhật. Chat cũng hỗ trợ gửi câu hỏi vào inbox. Live chat cần conversationId, public reply polling/SSE/WebSocket và trạng thái delivery; chưa có backend nên demo chỉ lưu phản hồi.
- Backend triển khai chứng nhận/hồ sơ nguồn gốc, consent/contact policy và nội dung phụ đề nếu cần. Chỉ gắn huy hiệu khi có hồ sơ xác minh.

## Theme, logo và vùng hiển thị ảnh

`ImageDisplay = {fit:'cover'|'contain',x:number,y:number}`; `x/y` là phần trăm 0–100 tương ứng CSS object-position. `ManagedImage = {src:string,display?:ImageDisplay}`. Frontend chỉ đổi vùng hiển thị, không crop file nguồn.

Settings thêm `brandLogo?:ManagedImage`, `storyImages:ManagedImage[]` (ba ảnh Người trồng/Miền đất/Mùa quả), `imageDisplays:Record<string,ImageDisplay>` (vùng mặc định theo URL/reference của ảnh). `SocialLink.icon?:ManagedImage` là logo tùy chỉnh; bỏ field để dùng logo chính thức. Backend lưu/đọc các field qua GET `/settings` và PUT `/admin/settings`; kiểm tra quyền admin, URL media và giới hạn tọa độ.

Product thêm `imageDisplay?:ImageDisplay` và `galleryDisplays?:Record<string,ImageDisplay>`. Lựa chọn riêng trên sản phẩm được ưu tiên hơn thiết lập theo ảnh. Gallery/cover/thumbnails/poster dùng cùng dữ liệu hiển thị; lightbox vẫn cho xem toàn bộ ảnh gốc. Media upload tiếp tục dùng `/admin/media`; giữ nguyên reference URL khi lưu vùng hiển thị. Khi đổi URL trên backend, cập nhật key map tương ứng. Mock `local-media:*`/data URL chỉ tồn tại trên trình duyệt demo.

Theme là tùy chọn thiết bị trong `localStorage['hytales.theme']`, không cần endpoint mới. QR logo framing là tùy chọn của phiên xuất QR, render giống nhau trong PNG/SVG/PDF.

## Deployment

Các route `/p/*`, `/q/*` và `/admin/*` fallback về index.html. Thiết lập API base URL ở build time. Media dùng CDN và các phiên bản adaptive để hướng tới mục tiêu tải dưới 2 giây mạng 4G; chưa đo và chưa bảo đảm SLA này ở bản local.


Video VI/EN: `Product.video` là nguồn VI (tương thích dữ liệu cũ), `Product.videoEn` là nguồn EN tùy chọn. `Settings.homeVideo` và `Settings.homeVideoEn` là nguồn riêng cho video nền trang chủ, mặc định rỗng. Admin lưu/xóa bằng PUT sản phẩm/thiết lập, backend cần chuẩn hóa chuỗi rỗng/null và trả playable URL. EN thiếu thì dùng VI, VI không dùng EN. Không tự gán video sản phẩm cho trang chủ. Cửa sổ xem phim cũng chọn lại nguồn khi đổi ngôn ngữ. Xóa liên kết không tự xóa object R2; kiểm tra tất cả tham chiếu trước khi xóa file.
