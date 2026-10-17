# Tài sản hình ảnh

## Năm concept hiện hành
- Nguồn do người dùng chỉ định: C:/Users/buiti/.codex/generated_images/01a1498f-bc57-7952-a843-9378193ee504/.
- reference-led-3d.webp: exec-9464c161-5cd6-4be9-a3b0-376685bba014.png. Dựng ống RTV, nhãn TENSAN, đế trưng bày, cụm tản nhiệt, bảng LED, vòng silicone, kính khuếch tán và bezel bằng hình học thật trong product-models.js.
- reference-solder-3d.webp: exec-8292be27-7040-4262-ad52-a6ab3a54ca94.png. Dựng hũ/nắp TS-350 có rãnh, PCB, linh kiện, pad, khuôn có lỗ thật, vệt kem và thanh gạt bằng hình học thật.
- reference-thermal-3d.webp: exec-a8e26eda-c99a-4180-af33-79f82d912103.png. Dùng làm concept để bổ sung hũ keo vào mô hình bo mạch tách lớp hiện có; giữ nhãn đúng vị trí keo TS1001.
- banner-factory-motion.webp: exec-62dadaab-c173-4cd5-90a1-4e55bb218a76.png. Ảnh 2D minh họa doanh nghiệp, thêm overlay SVG/GSAP quay chi tiết, nhấp nháy đèn và đường sáng; không dùng ảnh AI làm bằng chứng nhà máy thật.
- banner-red-smt-motion.webp: exec-9f054d4e-9b21-4726-85be-96e49c755537.png. Ảnh 2D keo đỏ SMT, thêm đường mạch chạy sáng và điểm keo nhấp nháy.
- Các bản WebP chỉ chuyển định dạng, giữ nội dung ảnh. Nhãn bao bì 3D được vẽ bằng CanvasTexture với tên/mã sản phẩm, không sao chép các lot/thông số do AI sinh. Ảnh sản phẩm thật và liên kết thông tin vẫn hiện bên cạnh mô hình. Hai ảnh 2D-03/2D-04 của lượt trước đã được thay bằng lựa chọn mới; mô tả sau đây ghi lại nguồn cũ.

- Banner silicone LED và kem hàn: người dùng cung cấp/chọn từ chat “Đề xuất banner hero 2D và 3D” (01a1498f-bc57-7952-a843-9378193ee504). Hai ảnh AI minh họa được chuyển định dạng WebP, không chỉnh nội dung: public/assets/banner-silicone-led.webp từ exec-f5f05940-9a9c-485a-9dfa-c848f61057e3.png (2D-03); public/assets/banner-kem-han-ts350.webp từ exec-6ee1ba81-c7aa-4f5b-b19d-3bee22e9ce9d.png (2D-04). Bản gốc 2172×724 ở C:/Users/buiti/.codex/generated_images/01a1498f-bc57-7952-a843-9378193ee504/. Bao bì trong banner là minh họa; liên kết đi tới sản phẩm thật TS6603 và TS350. Không dùng thông số/lot trên ảnh minh họa làm dữ liệu sản phẩm.

- Logo, ảnh sản phẩm và ảnh cơ sở được tải từ nội dung công khai trên tensanvn.com. Danh sách nguồn: ASSET_SOURCES.json; sản phẩm nhập thêm có imageSource trong src/catalog-imported.json.
- Các mã keo tản nhiệt trên website cũ có dùng chung ảnh nguồn. Danh mục giữ đúng ảnh được nguồn công bố.
- applications.png: ảnh minh họa bốn nhóm ứng dụng, tạo bằng image_gen tích hợp; không dùng như bằng chứng về cơ sở sản xuất của Tensan.
- Các icon là SVG đồng bộ nét, viết trong src/icons.js.
- Hero là bo mạch nhiều lớp/chip/keo màu xám/cụm 23 lá nhôm và ống đồng minh họa, dựng bằng hình học Three.js. Roughness texture kim loại được dựng bằng DataTexture trong mã, không tải ảnh ngoài. Keo có viền không đều và vệt dàn keo; nhãn TS1001 chỉ đúng vị trí trong mô hình. Độ dày phóng đại để quan sát; không trình bày như bản vẽ kỹ thuật. Thẻ TS1001 dùng ảnh thật từ website nguồn. thermal-assembly-fallback.svg là sơ đồ vector viết trong dự án cho chế độ dự phòng. Dải ứng dụng ở hero dùng lại applications.png, giữ ảnh minh họa riêng với ảnh sản phẩm thật.

## Prompt ảnh ứng dụng
Lượt bổ sung quạt: cánh nghiêng, khung có lỗ tròn, trục, ốc và viền màu đều dựng bằng hình học Three.js trong src/thermal-assembly.js; không thêm ảnh ngoài hay mô hình tải từ bên thứ ba.

Create one wide photographic contact sheet for a premium industrial materials company website. Four equal photographic panels side-by-side in a single row, zero gaps, zero borders, no text, no labels, no logos. Panel 1: detailed macro of real dark-green electronic circuit board with black ICs and tiny gold connectors. Panel 2: silver LED lighting module with clear optical lenses and softly illuminated white LEDs. Panel 3: industrial switching power supply board with copper coils, yellow transformer and black capacitors. Panel 4: automated precision dispensing nozzle over a populated PCB. Consistent cool daylight, restrained turquoise shadow tones, crisp engineering detail. Illustrative application photographs, not a specific real company's factory.
