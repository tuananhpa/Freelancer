# Vĩnh Thuận Phát — frontend B

Frontend catalog nhang theo thiết kế xanh trầm đã chọn. Vanilla JS + CSS, Vite; Node >=22.12 (đã chạy Node 24).

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Preview ở `http://127.0.0.1:5173`; có thể đặt `PORT` để đổi cổng. Preview server chỉ phục vụ `dist`, hỗ trợ deep link, không directory listing/source/docs. Server preview có `X-Robots-Tag: noindex`.

- Thiết kế: `docs/DESIGN_SELECTION.md`, ảnh `docs/mockups/B-xanh-tram.png`.
- Backend handoff: **[PLAN.md](PLAN.md)**. Chưa có backend/API/database/auth.
- Nguồn tài sản: `docs/ASSETS.md`, `docs/asset-sources.json`.
- Dữ liệu: `src/data.js` gồm 16 sản phẩm thật từ trang chủ gốc, chưa phải catalog đầy đủ. `src/catalog.js` tìm/lọc/route thuần, `src/main.js` render và tương tác.
- Liên hệ hiện soạn email bằng ứng dụng thư, không gửi từ server. Login/reset không lưu credentials hoặc giả session.
- Không có giỏ hàng/thanh toán vì luồng gốc đang liên hệ mua sỉ/lẻ.
- Audio tải từ web gốc theo thao tác người dùng; chưa xác minh playback/quyền host lại.

## Tunnel preview

Sau khi build và chạy preview, dùng công cụ cloudflared đã cài:

```sh
cloudflared tunnel --url http://127.0.0.1:5173 --no-autoupdate
```

Chỉ expose server preview, không dùng Vite dev server. URL trycloudflare là tạm và phụ thuộc máy/server/tunnel đang chạy. Log/PID local nằm trong `.runtime/` đã được gitignore, không commit credentials.

Không sửa dự án anh em trong repository `Freelancer`.
