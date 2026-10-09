/** Khung dữ liệu mặc định khi tạo sản phẩm / lô hàng mới. */
export const emptyProduct = () => ({
  status: 'draft',
  name: '',
  slug: '',
  tagline: '',
  category: '',
  batchCode: '',
  harvestDate: '',
  expiryDate: '',
  origin: '',
  cooperative: '',
  certifications: [],
  coverUrl: '',
  hero: { loopUrl: '', videoUrl: '', posterUrl: '', duration: '' },
  story: { title: '', paragraphs: [''], facts: [], gallery: [] },
  timeline: [
    { id: 't1', when: '', title: 'Chăm sóc & bao trái hữu cơ VietGAP', description: '' },
    { id: 't2', when: '', title: 'Thu hái thủ công sáng sớm', description: '' },
    { id: 't3', when: '', title: 'Sấy than củi 36h / Chế tác thủ công', description: '' },
    { id: 't4', when: '', title: 'Kiểm định chất lượng & dán tem QR', description: '' },
  ],
  shortVideos: [],
  cta: { zaloUrl: '', hotline: '', orderEnabled: true },
  faqs: [],
  qr: { color: '#17110D', withLogo: true },
});

export const newId = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
