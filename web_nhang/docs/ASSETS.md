# Tài sản hình ảnh

Ngày: 2026-10-15. Logo và 16 ảnh hàng trong `public/images` lấy từ nội dung công khai tại https://nhangthomcaocap.vn/, giữ nguyên ảnh, không dùng ảnh AI thay ảnh sản phẩm. URL nguồn cụ thể trong `asset-sources.json`. Hai ảnh 600px nguồn trả 503 đã dùng bản 300px tải được; một số ảnh hàng vì vậy có độ phân giải thấp.

Hai ảnh trang trí dưới đây được tạo bằng built-in image_gen, không dùng CLI/API key. Không dùng chúng làm bằng chứng vật liệu/đặc tính sản phẩm.

## `public/images/hero-incense.png`

Prompt cuối:

> Create a photorealistic ultra-wide 2400x1000 website hero photograph for a premium Vietnamese incense catalog, direction quiet botanical ritual. Entire image is only photography, NO text, NO graphic design, NO packaging or labels. On the RIGHT half: a beautiful deep jade green glazed Vietnamese ceramic incense burner with 3 slender lit incense sticks, delicate natural drifting smoke, small bowls of dark agarwood chips and pale sandalwood, a rich weathered wood table. Soft warm natural light filtered through a wooden screen and a green botanical garden in background. On LEFT half: dark out-of-focus green botanical shadows and soft warm wooden background, visually quiet and dark enough for white heading overlay, no subjects in left third. Premium editorial still-life photography, tactile and authentic, calm rather than mystical. Muted green #244B40, brown wood, amber highlights, no gold ornamental decor, no candles, no people, no health/marketing claims, no watermark. Sharp image detail on ceramic vessel and wood at right, shallow depth of field.

## `public/images/category-scenes.png`

Prompt cuối:

> Create a single ultra-wide 2400x600 photographic contact sheet, EXACTLY four EQUAL SQUARE photos edge-to-edge horizontally with NO gaps, NO borders, NO text, NO labels. Each panel independently centered so it can be cropped into a circle by a website. Panel 1 at far left: fresh Vietnamese green aromatic herb leaves and a small wooden bowl of dry botanical incense ingredients on a muted olive background, warm natural light. Panel 2: dark natural agarwood chips with characteristic rich grain in a small wooden bowl, soft deep green and brown bokeh background. Panel 3: pale golden sandalwood pieces and a small mound of fine sandalwood powder on a wooden surface, soft warm beige background. Panel 4 far right: a small bronze Vietnamese incense burner with thin incense sticks and one subtle red devotional candle in soft warm bokeh, background dark green. Natural realistic premium still life photographs, harmonious restrained green brown palette for a Vietnamese incense brand, no packaging, no logos, no watermark. Perfectly evenly sized four distinct images, square panel subjects centered, flat front on contact sheet.

Ảnh trả về khác tỉ lệ yêu cầu; CSS dùng background-position theo bốn panel và crop khi hiển thị. Không sửa ảnh sản phẩm thật. Mockup A/B/C và prompt gốc ở `docs/mockups/`, chỉ bản B được chọn để build.
