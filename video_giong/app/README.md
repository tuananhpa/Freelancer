# Phát thanh nội bộ: bản demo

App máy tính (Electron) để biên tập kịch bản phát thanh, dựng âm thanh trên timeline kiểu CapCut và xuất **một file MP3 hoặc video MP4 hoàn chỉnh**. Khi app đang chạy, điện thoại cùng Wi-Fi mở được giao diện qua `http://IP-máy-tính:4173`.

## Các màn hình

- **Chương trình**: danh sách chương trình, nạp file Word.
- **Kịch bản**: sửa, duyệt từng đoạn, chọn giọng, nghe thử.
- **Dựng âm thanh**: timeline 3 track (Lời đọc, Nhạc, Nhạc nền), luôn xếp **đúng thứ tự trong Kịch bản**. Mỗi lần mở trang, app tự tạo giọng cho đoạn mới duyệt và xếp lại theo kịch bản.
  - Ở đây chỉ cắt xén: kéo hai mép clip để cắt bớt đầu, đuôi (các clip sau tự dồn lại), chỉnh fade vào/ra. Không thêm, bớt hay đổi chỗ clip; muốn vậy thì sửa ở Kịch bản.
  - Phần cắt được giữ khi đồng bộ lại, trừ khi đoạn đó đổi nội dung, giọng hoặc file nhạc.
  - Hoàn tác (Ctrl+Z), làm lại (Ctrl+Y), phát/dừng (Space), Ctrl + lăn chuột để thu phóng.
- **Xuất file**: MP3, hoặc MP3 kèm MP4. Nút tải mở hộp thoại **Lưu thành** để chọn nơi lưu.
- **Thư viện âm thanh** (nhạc mp3 và bản ghi âm), **Từ điển phát âm**.

## Chức năng

| Yêu cầu | Trong app |
|---|---|
| Soạn thảo, chỉnh sửa, quản lý kịch bản trên điện thoại | Danh sách chương trình. Mỗi chương trình gồm các mục lời đọc và nhạc, có thể sửa, thêm, xóa, đổi thứ tự. Tự lưu. |
| Đọc file Word | Nhận cả `.doc` lẫn `.docx`. Phần phê duyệt ở đầu văn bản được bỏ qua. Mỗi mục `1.`, `2.`… trong phần **II. NỘI DUNG** thành một đoạn. Dòng `[NHẠC: tên bài]` hoặc `[NHẠC HIỆU]` trong file Word tạo sẵn chỗ chèn nhạc. |
| Chèn ca khúc (mp3 từ thiết bị) | Mục **Nhạc**, chọn file từ **Thư viện âm thanh** (nhạc mp3 hoặc bản ghi âm). Tải mp3 lên một lần, dùng lại cho mọi chương trình. |
| Nhạc nền dưới lời đọc, tự ngắt khi có ca khúc hoặc nhạc hiệu | Chọn nhạc nền và âm lượng. Nhạc nền nhỏ dần trước ca khúc hoặc nhạc hiệu, rồi lên lại khi lời đọc tiếp tục. |
| Kiểm tra và phê duyệt trước khi tạo giọng | Mỗi đoạn phải bấm **Duyệt** thì mới nghe thử hay xuất được. Sửa nội dung thì đoạn đó tự bỏ duyệt. |
| Nhiều giọng trong một file, chỉnh tốc độ và âm lượng | Mỗi đoạn chọn giọng riêng (nam/nữ, Bắc/Trung/Nam), tốc độ 0.7–1.5x, âm lượng 0–200%. |
| Quy tắc phát âm, lưu dùng lại | Trang **Từ điển phát âm**, ví dụ "QĐND" đọc thành "Quân đội nhân dân", "Trung đoàn 143" đọc thành "Trung đoàn một bốn ba". Văn bản gốc giữ nguyên. Nút **Xem cách đọc** cho thấy văn bản máy sẽ đọc. Ngày tháng (`16/11/2026`) và khoảng năm (`2015–2020`) được tự đọc đúng. |
| Nghe thử từng đoạn và cả chương trình | **Nghe thử** ở mỗi đoạn trong Kịch bản. Nút phát trên timeline nghe cả chương trình đúng như khi xuất. |
| Đầu ra | **Xuất file** ra MP3, hoặc MP3 kèm MP4. Video có nền xanh, sóng âm, phụ đề chạy theo lời đọc và tên bài khi phát nhạc. |

## Giọng đọc (miễn phí)

- **VieNeu-TTS v3 Turbo (offline, khuyên dùng)**: 25 giọng, gồm Adam, Mai Anh (tin tức), Quang Sơn và Ngọc Trân (miền Trung), Thùy Dung và Minh Triết (miền Nam)… Chạy ngay trên máy, không tốn phí, không cần Internet sau lần tải đầu. Giấy phép Apache-2.0.
  - Bản cài đặt đã kèm sẵn Python, thư viện và model (`resources/tts-runtime`), máy khách không cần cài gì, không cần Internet. Chạy trên CPU bằng ONNX.
  - Chạy từ mã nguồn mà chưa có `tts/offline` thì app dùng Python của máy (`pip install vieneu`).
  - Máy có card NVIDIA thì chạy rất nhanh: chương trình 25 phút tạo giọng trong vài phút. Chỉ có CPU thì chậm hơn nhiều lần.
  - Server khởi động sẽ nạp sẵn model (khoảng 1 phút). Góc trên bên phải báo **Giọng offline: sẵn sàng** là dùng được.
- **Microsoft (online)**: Hoài My (nữ), Nam Minh (nam). Nhanh, cần Internet.
- **Google (online)**: 1 giọng nữ, dùng dự phòng.

Giọng đã tạo được lưu lại (`data/tts`). Đoạn nào không sửa thì lần xuất sau không phải tạo lại.

## Chạy

- **Bản đóng gói**: chạy `dist/Phat thanh noi bo Setup <version>.exe` để cài (không cần quyền admin). Dữ liệu lưu ở `%APPDATA%/phat-thanh-noi-bo/data`.
- **Từ mã nguồn**: cài Node.js LTS (>= 20.12), rồi `npm install` và `npm run app`. Chỉ chạy server thì dùng `npm start` hoặc `CHAY-TREN-WINDOWS.bat`, rồi mở http://localhost:4173.
- Đóng gói lại: `npm run bundle:tts` (một lần, cần Python 3.12 và Internet trên máy build: tạo `tts/offline` gồm Python riêng, VieNeu và model), rồi `npm run dist`.

Tùy chọn: tạo file `.env` cạnh `server.mjs`:

```
PORT=4173
VIENEU=off           # không nạp giọng offline
```

Kiểm thử: `npm test`.

## Cấu trúc

- `server.mjs`: máy chủ, API, tác vụ xuất file.
- `lib/docparse.mjs`: đọc Word và tách đoạn.
- `lib/speech.mjs`: biên tập nhẹ, quy tắc phát âm, đọc ngày tháng.
- `lib/tts.mjs`: các nguồn giọng đọc và bộ nhớ đệm.
- `tts/vieneu_worker.py`: tiến trình Python giữ model VieNeu.
- `lib/timeline.mjs`: mô hình timeline, xếp clip từ kịch bản, filter ghép của ffmpeg, nhạc nền tự nhỏ khi có nhạc.
- `lib/render.mjs`: tạo giọng, ghép theo timeline ra MP3, dựng MP4 có phụ đề, tính sóng âm.
- `public/app.js`: khung app và các trang. `public/studio.js`: bàn dựng timeline.
- `electron/main.cjs`: cửa sổ app, quyền micro, hộp thoại lưu file.
- `data/`: chương trình, nhạc, từ điển, giọng đã tạo, file xuất. Sao lưu thư mục này là đủ.

## Giới hạn của bản demo

- Chưa có đăng nhập hay phân quyền. Chỉ chạy trong mạng nội bộ tin cậy.
- Cùng một chương trình mà mở sửa trên hai máy một lúc thì bản lưu sau sẽ ghi đè bản trước.
- Giọng VieNeu đọc tự nhiên nhưng không diễn cảm như người đọc thật. Câu quá dài nên ngắt bớt để nghe rõ hơn.
