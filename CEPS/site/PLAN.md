# KẾ HOẠCH BÀN GIAO & TÀI LIỆU KỸ THUẬT FRONT-END CPES

> Dự án: Website Giới thiệu & Trưng bày Sản phẩm Công nghệ Công nghiệp
> Khách hàng: **Công ty TNHH Giải Pháp CPE (CPES)**
> Đơn vị thực hiện: Freelancer Front-End
> Phiên bản: 1.0 (Production Mockup Ready)

---

## 1. Cấu trúc thư mục Front-End (`site/`)

```
site/
├── index.html                   # Trang chủ / Giới thiệu CPES
├── san-pham.html                # Trang Sản phẩm (s::can 57 SP + ATi Flipbook 3D)
├── giai-phap.html               # Trang Giải pháp (Totem nước thải & nước cấp)
├── admin.html                   # Trang quản trị CMS Demo (CRUD, Xuất/Nhập JSON)
├── PLAN.md                      # Kế hoạch bàn giao & kiến trúc backend
├── assets/
│   ├── css/
│   │   ├── main.css             # Design system nhận diện CPES, typography, responsive
│   │   └── admin.css            # Giao diện quản trị CMS
│   ├── js/
│   │   ├── api.js               # Data Layer (localStorage cache & mock API)
│   │   ├── main.js              # Tương tác giao diện, carousel 3 cột, modals
│   │   ├── flipbook.js          # Sách lật 3D brochure ATi 11 trang
│   │   ├── chatbot.js           # Widget Trợ lý AI nổi thông minh
│   │   └── admin.js             # Logic CRUD và xuất nhập dữ liệu
│   ├── img/
│   │   ├── brand/               # Logo CPES ngang, đứng, cẩm nang màu
│   │   ├── scan/                # 57 ảnh sản phẩm s::can + ảnh trạm quan trắc
│   │   └── ati/                 # 11 trang ảnh webp brochure ATi
│   └── doc/
│       └── ati-brochure-vietnamese.pdf  # File gốc tải về
└── data/
    ├── products.json            # 57 sản phẩm s::can dịch đầy đủ tiếng Việt
    ├── solutions.json           # Dữ liệu giải pháp totem nước thải & nước cấp
    ├── scan_products_vi.json    # Bản dịch thô định dạng JSON
    └── scan_products_vi.md      # Tài liệu tổng hợp toàn bộ 57 sản phẩm s::can
```

---

## 2. Điểm nổi bật đã thực hiện theo yêu cầu

1. **Trích xuất & Dịch toàn bộ sản phẩm s::can (Badger Meter)**:
   - Đã tải và biên dịch toàn bộ **57 sản phẩm** từ trang web chính thức `https://www.badgermeter.com/products/water-quality-monitoring/scan/`.
   - Chuẩn hóa tên sản phẩm s::can với dấu hai chấm đặc trưng (`spectro::lyser`, `carbo::lyser`, `ammo::lyser`, `i::scan`...).
   - Dịch toàn bộ thông số kỹ thuật (BOD, COD, TOC, TSS, Nitrat, Amoni, Clo, pH...) và ứng dụng công nghiệp sang tiếng Việt chuyên ngành.
   - Toàn bộ 57 sản phẩm đều có ảnh minh họa tách nền chất lượng cao lưu cục bộ tại `assets/img/scan/`.
2. **Tuân thủ nhận diện thương hiệu CPES**:
   - Màu sắc: Xanh đậm `#1d5321`, xanh chính `#157f1f`, xanh sáng `#53ba36`, nền trắng và xám xanh nhạt `#f6faf6`.
   - Typography: **Montserrat** cho tiêu đề (line-height ≥ 1.24 chống chồng dấu tiếng Việt), **Be Vietnam Pro** cho thân bài.
   - Họa tiết nhận diện: Khối lục giác isometric 3 sắc xanh của logo CPES ứng dụng làm background pattern và điểm nhấn.
3. **Bố cục Sản phẩm s::can kiểu Badger Meter**:
   - 3 khối giới thiệu công nghệ s::can độc quyền.
   - Lưới sản phẩm **3 cột lướt ngang** (scroll-snap + nút ‹ › + phân trang), lọc nhanh danh mục và tìm kiếm theo thời gian thực (hỗ trợ tiếng Việt không dấu).
   - Modal xem chi tiết sản phẩm và Modal gửi yêu cầu báo giá tự động điền tên thiết bị.
4. **Brochure ATi dạng sách lật 3D (Flipbook)**:
   - Nhúng 11 trang brochure tiếng Việt của ATi mở đôi (2 trang/màn hình) trên desktop và 1 trang vuốt lật trên mobile.
   - Nút phóng to toàn màn hình và nút tải file PDF gốc tiện lợi.
5. **Trang Giải pháp Totem**:
   - Totem 1: Giải pháp quan trắc nước thải tự động liên tục (Thông tư 10/2021/TT-BTNMT).
   - Totem 2: Giải pháp giám sát nước cấp & nước uống (QCVN 01-1:2018/BYT).
6. **Chatbot AI nổi góc phải dưới (Tích hợp mọi trang)**:
   - Trợ lý kỹ thuật CPES thông minh với kịch bản trả lời tự động về sản phẩm s::can, ATi, báo giá và liên hệ.
7. **Admin Panel Mockup**:
   - Đăng nhập demo (`admin` / `cpes2026`).
   - Quản lý danh sách sản phẩm, xem danh sách yêu cầu báo giá, xuất/nhập file JSON dự phòng.

---

## 3. Kiến trúc tích hợp Backend thật & AI Chatbot

### 3.1. Chatbot AI Backend (Khuyến nghị dùng Cloudflare Workers)

Để bảo mật API Key và có tốc độ phản hồi dưới 300ms, không được để API Key ở Front-End:

```
[Trình duyệt Người dùng] 
       │ (Fetch / SSE)
       ▼
[Cloudflare Worker / Express API] (Bảo mật API Key bí mật)
       │
       ├─► [RAG Vector Store / System Prompt Context]
       │     (Nạp dữ liệu từ products.json + solutions.json + cpes_profile.md)
       │
       ▼
[LLM Provider: Claude 3.5 Sonnet / Gemini 1.5 Pro]
```

**Mã nguồn mẫu cho Cloudflare Worker (`worker.js`):**

```javascript
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    const { message, conversationHistory } = await request.json();

    // System prompt nạp tri thức sản phẩm CPES
    const systemPrompt = `Bạn là Trợ lý Kỹ thuật cao cấp của Công ty TNHH Giải Pháp CPE (CPES), chuyên gia về thiết bị s::can và ATi...`;

    // Gọi API (Claude hoặc Gemini)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [...conversationHistory, { role: "user", content: message }]
      })
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};
```

### 3.2. Chuyển đổi Data Layer từ Mock sang REST API thật

Trong file `assets/js/api.js`, chỉ cần thay đổi cờ cấu hình:

```javascript
const CONFIG = {
  mode: 'live', // Đổi từ 'mock' sang 'live'
  apiUrl: 'https://api.cpes.vn/v1'
};

// Trong CPES_API:
async submitQuoteRequest(quoteData) {
  if (CONFIG.mode === 'live') {
    return await fetch(`${CONFIG.apiUrl}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteData)
    }).then(res => res.json());
  }
  // Chế độ mock lưu localStorage như hiện tại
}
```

---

## 4. Danh sách các mục `[[CẦN XÁC NHẬN]]` dành cho khách hàng

1. **Logo khách hàng tiêu biểu**: Hiện tại đang hiển thị các khối placeholder `[[CẦN XÁC NHẬN: logo khách hàng]]`. Khi khách duyệt logo đối tác phân phối hoặc logo nhà máy khách hàng, chỉ cần thêm ảnh vào `assets/img/partner/`.
2. **Nội dung & Ảnh chi tiết các giải pháp mở rộng**:
   - Giải pháp Giám sát an toàn, khí độc & cháy nổ (Dầu khí & Hóa dầu).
   - Giải pháp Van điều khiển & phân tích nước cấp lò hơi (Nhiệt điện).
   - Giải pháp Bơm công nghiệp & Bôi trơn tự động (Khai khoáng).
3. **Mã số thuế & Thông tin pháp lý đầy đủ** để cập nhật vào chân trang (Footer).
4. **Kênh nhận thông báo báo giá**: Khách muốn nhận email báo giá về `Sales@cpes.vn` hay nhận thông báo qua Zalo OA / Telegram Bot?
