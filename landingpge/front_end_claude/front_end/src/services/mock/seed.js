/**
 * Dữ liệu khởi tạo cho chế độ mock. Cấu trúc object = cấu trúc JSON backend cần trả về
 * (xem docs/API_CONTRACT.md). Nội dung câu chuyện lấy từ kịch bản voice của dự án.
 * Ngày thu hoạch / hạn dùng / mã lô là DỮ LIỆU MẪU, admin sẽ sửa trong CMS.
 */
const media = (p) => `/media/${p}`;

const FILMS = {
  'nhan-long': {
    id: 'v-nhan-long',
    title: 'Nhãn lồng Hưng Yên – vị ngọt từ đất Phố Hiến',
    videoUrl: media('videos/nhan-long-full.mp4'),
    posterUrl: media('posters/nhan-long.jpg'),
    duration: '2:05',
  },
  'vai-trung': {
    id: 'v-vai-trung',
    title: 'Vải trứng Hưng Yên – từ một cây vải cổ',
    videoUrl: media('videos/vai-trung-full.mp4'),
    posterUrl: media('posters/vai-trung.jpg'),
    duration: '1:30',
  },
  'cam-duong-canh': {
    id: 'v-cam-duong-canh',
    title: 'Cam Đường Canh – sắc vàng Hưng Yên',
    videoUrl: media('videos/cam-duong-canh-full.mp4'),
    posterUrl: media('posters/cam-duong-canh.jpg'),
    duration: '1:33',
  },
};

const filmsFor = (key) => [FILMS[key], ...Object.entries(FILMS).filter(([k]) => k !== key).map(([, v]) => v)];

const defaultTimeline = (third) => [
  { id: 't1', when: 'Mùa chăm sóc', title: 'Chăm sóc & bao trái hữu cơ VietGAP', description: 'Bón phân hữu cơ, tỉa cành, bao từng chùm quả để hạn chế sâu bệnh mà không lạm dụng hóa chất.' },
  { id: 't2', when: 'Mùa thu hoạch', title: 'Thu hái thủ công sáng sớm', description: 'Hái khi sương còn đọng để quả giữ độ tươi giòn, nhẹ tay xếp vào sọt tre lót lá.' },
  { id: 't3', when: 'Sau thu hoạch', title: third.title, description: third.description },
  { id: 't4', when: 'Trước khi xuất bán', title: 'Kiểm định chất lượng & dán tem QR', description: 'Kiểm tra mẫu, ghi nhật ký lô hàng và dán tem vỡ chống bóc mang mã QR động riêng của lô.' },
];

export const seedProducts = [
  {
    id: 'p-nhan-long',
    slug: 'nhan-long-pho-hien-l01',
    qrCode: 'NL26L01',
    status: 'published',
    name: 'Nhãn lồng Hưng Yên',
    tagline: 'Vị ngọt từ đất Phố Hiến',
    category: 'Sản vật tiến vua',
    batchCode: '#HY-NL-2026-08',
    harvestDate: '2026-08-10',
    expiryDate: '2026-08-24',
    origin: 'Phố Hiến, Hưng Yên',
    cooperative: '[Tên HTX / nhà vườn]',
    certifications: ['ocop4', 'vietgap', 'gi'],
    coverUrl: media('images/nhan-long.jpg'),
    hero: {
      loopUrl: media('videos/nhan-long-hero.mp4'),
      videoUrl: FILMS['nhan-long'].videoUrl,
      posterUrl: media('posters/nhan-long.jpg'),
      duration: '2:05',
    },
    story: {
      title: 'Từ sản vật tiến vua đến khát vọng vươn xa',
      paragraphs: [
        'Trên mảnh đất từng vang danh với câu ca “Thứ nhất Kinh kỳ, thứ nhì Phố Hiến”, bên dòng sông Hồng màu mỡ, nhãn lồng đã gắn bó với nơi đây qua hàng trăm năm. Cây nhãn Tổ hơn 300 năm tuổi tại chùa Hiến vẫn được gìn giữ như một chứng nhân cho hành trình ấy.',
        'Tên gọi “nhãn lồng” bắt nguồn từ một câu chuyện mộc mạc: để bảo vệ những chùm quả quý khỏi chim, dơi, chuột và mưa gió, người dân dùng những chiếc lồng tre nhỏ chụp lên từng chùm nhãn. Cùi dày, giòn mọng, vị ngọt thanh — kết tinh của phù sa, nguồn nước và kinh nghiệm canh tác trao truyền qua nhiều thế hệ.',
      ],
      facts: [
        { value: '5.860 ha', label: 'vùng trồng nhãn' },
        { value: '~50.000 tấn', label: 'sản lượng mỗi năm' },
        { value: '16+ giống', label: 'có nhãn đường phèn, nhãn cùi cổ' },
      ],
      gallery: [
        { url: media('images/nhan-long.jpg'), alt: 'Chùm nhãn lồng trĩu cành trong vườn' },
        { url: media('posters/nhan-long.jpg'), alt: 'Khung hình trong phim nhãn lồng Hưng Yên' },
      ],
    },
    timeline: defaultTimeline({ title: 'Sấy than củi 36 giờ / chế tác thủ công', description: 'Lò sấy rực hồng đêm ngày, nghệ nhân đảo tay liên tục — di sản làm nên long nhãn Phố Hiến.' }),
    shortVideos: filmsFor('nhan-long'),
    cta: { zaloUrl: '', hotline: '', orderEnabled: true },
    faqs: [
      { id: 'f1', question: 'Giá bán bao nhiêu?', answer: 'Giá theo từng lô và quy cách đóng gói. Bạn để lại số điện thoại ở mục Đặt mua thêm, nhà vườn sẽ báo giá ngay.' },
      { id: 'f2', question: 'Bảo quản thế nào?', answer: 'Nhãn tươi: để ngăn mát tủ lạnh 3–5°C, dùng trong 5–7 ngày, không rửa trước khi cất. Long nhãn sấy: túi kín, nơi khô ráo.' },
      { id: 'f3', question: 'Có gửi hàng đi tỉnh không?', answer: 'Có. Nhà vườn gửi hàng toàn quốc qua chuyển phát nhanh, đóng thùng xốp giữ lạnh.' },
    ],
    qr: { color: '#17110D', withLogo: true },
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'p-vai-trung',
    slug: 'vai-trung-phu-cu-l01',
    qrCode: 'VT26L01',
    status: 'published',
    name: 'Vải trứng Hưng Yên',
    tagline: 'Từ một cây vải cổ đến sản vật đặc trưng',
    category: 'OCOP 4 sao',
    batchCode: '#HY-VT-2026-06',
    harvestDate: '2026-06-05',
    expiryDate: '2026-06-15',
    origin: 'Thôn Ba Đông, xã Phù Cừ, Hưng Yên',
    cooperative: '[Tên HTX / nhà vườn]',
    certifications: ['ocop4', 'vietgap'],
    coverUrl: media('images/vai-trung.jpg'),
    hero: {
      loopUrl: media('videos/vai-trung-hero.mp4'),
      videoUrl: FILMS['vai-trung'].videoUrl,
      posterUrl: media('posters/vai-trung.jpg'),
      duration: '1:30',
    },
    story: {
      title: 'Vải ông Diệm – hơn 150 năm bén rễ',
      paragraphs: [
        'Khi chín, vải trứng khoác lên mình sắc đỏ quyến rũ, dáng tròn đầy như quả trứng, cùi dày, hạt nhỏ, vị ngọt thanh và hương thơm khó quên.',
        'Tương truyền, cụ Nguyễn Văn Diệm là người mang vải trứng về trồng tại Hưng Yên. Tại thôn Ba Đông, xã Phù Cừ, cây vải tổ hơn 150 năm tuổi vẫn được hậu duệ đời thứ ba của cụ gìn giữ. Năm 2020, vải trứng được cấp chứng nhận nhãn hiệu và công nhận OCOP 4 sao; hai năm sau lần đầu đến thị trường châu Âu.',
      ],
      facts: [
        { value: '150+ năm', label: 'tuổi cây vải tổ' },
        { value: 'OCOP 4★', label: 'công nhận năm 2020' },
        { value: '2026', label: 'lên chuyến bay Vietnam Airlines' },
      ],
      gallery: [
        { url: media('images/vai-trung.jpg'), alt: 'Vải trứng đỏ mọng đặt cạnh quả trứng gà' },
        { url: media('posters/vai-trung.jpg'), alt: 'Khung hình trong phim vải trứng Hưng Yên' },
      ],
    },
    timeline: defaultTimeline({ title: 'Tuyển chọn & đóng gói giữ lạnh', description: 'Chọn từng chùm đủ độ chín, loại quả dập, đóng thùng giữ lạnh ngay trong ngày.' }),
    shortVideos: filmsFor('vai-trung'),
    cta: { zaloUrl: '', hotline: '', orderEnabled: true },
    faqs: [
      { id: 'f1', question: 'Vải trứng khác vải thường thế nào?', answer: 'Quả to tròn như trứng gà, vỏ mỏng đỏ mọng, cùi dày, hạt nhỏ và vị ngọt thanh.' },
      { id: 'f2', question: 'Bảo quản thế nào?', answer: 'Để nguyên chùm trong túi kín, ngăn mát tủ lạnh, dùng trong 3–5 ngày để giữ vị ngon nhất.' },
    ],
    qr: { color: '#B23A22', withLogo: true },
    updatedAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'p-cam-duong-canh',
    slug: 'cam-duong-canh-l01',
    qrCode: 'CD26L01',
    status: 'published',
    name: 'Cam Đường Canh',
    tagline: 'Sắc vàng Hưng Yên',
    category: 'Thức quả ngày Tết',
    batchCode: '#HY-CD-2026-01',
    harvestDate: '2026-01-15',
    expiryDate: '2026-02-05',
    origin: 'Hưng Yên',
    cooperative: '[Tên HTX / nhà vườn]',
    certifications: ['vietgap'],
    coverUrl: media('images/cam-duong-canh.jpg'),
    hero: {
      loopUrl: media('videos/cam-duong-canh-hero.mp4'),
      videoUrl: FILMS['cam-duong-canh'].videoUrl,
      posterUrl: media('posters/cam-duong-canh.jpg'),
      duration: '1:33',
    },
    story: {
      title: 'Sắc vàng phú quý trên mâm ngũ quả',
      paragraphs: [
        'Mỗi độ cuối năm, Hưng Yên khoác lên mình sắc vàng óng ả của những vườn cam Đường Canh vào mùa thu hoạch. Giữa vòm lá xanh mướt, từng chùm quả trĩu cành báo hiệu những ngày đoàn viên đang đến gần.',
        'Trong văn hóa Việt, sắc vàng là biểu tượng của phú quý và sung túc, vì thế cam Đường Canh hiện diện trên mâm ngũ quả, gửi gắm ước nguyện một năm mới bình an, đủ đầy. Quả tròn đầy, vỏ mỏng căng mịn, vị ngọt đậm đà cùng hương thơm thanh nhã.',
      ],
      facts: [
        { value: 'Cuối năm', label: 'mùa thu hoạch chính' },
        { value: 'Vỏ mỏng', label: 'căng mịn, dễ bóc' },
        { value: 'Ngọt đậm', label: 'hương thơm thanh nhã' },
      ],
      gallery: [
        { url: media('images/cam-duong-canh.jpg'), alt: 'Nhà vườn bên cây cam Đường Canh trĩu quả' },
        { url: media('posters/cam-duong-canh.jpg'), alt: 'Khung hình trong phim cam Đường Canh' },
      ],
    },
    timeline: defaultTimeline({ title: 'Phân loại & đóng hộp quà Tết', description: 'Phân loại theo kích cỡ, lau sạch, đóng hộp quà mang tem QR cho mùa Tết.' }),
    shortVideos: filmsFor('cam-duong-canh'),
    cta: { zaloUrl: '', hotline: '', orderEnabled: true },
    faqs: [
      { id: 'f1', question: 'Khi nào có cam?', answer: 'Mùa chính từ cuối năm đến trước Tết Nguyên đán. Bạn có thể đặt trước để giữ hàng.' },
      { id: 'f2', question: 'Có hộp quà biếu Tết không?', answer: 'Có. Chọn Mua tặng bạn bè và ghi chú quy cách hộp, nhà vườn sẽ liên hệ xác nhận.' },
    ],
    qr: { color: '#2F5D45', withLogo: true },
    updatedAt: '2026-10-01T08:00:00Z',
  },
];

export const createSeedDb = () => ({
  products: structuredClone(seedProducts),
  orders: [],
  reviews: [],
  scans: [],
  chatThreads: [],
  leads: [],
});
