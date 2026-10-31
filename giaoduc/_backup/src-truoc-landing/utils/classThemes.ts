export interface ClassThemePreset {
  id: string;
  name: string;
  subject: string;
  category: 'STEM' | 'HUMANITIES' | 'SOCIAL' | 'ACADEMY';
  url: string;
  previewColor: string;
}

/**
 * Sinh anh bia dang "icon tren nen cam" (data URI SVG) dung chung mau
 * thuong hieu (--accent) thay vi anh chup, de moi mon co san 1 lua chon
 * mac dinh gon gang, chuyen nghiep, khong phu thuoc anh stock ben ngoai.
 * icon: markup SVG con (path/polygon/...) theo toa do goc 24x24 nhu lucide-react.
 */
function buildIconCover(icon: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#FF5A1F"/><stop offset="1" stop-color="#F4380B"/>` +
    `</linearGradient></defs>` +
    `<rect width="100" height="100" fill="url(#g)"/>` +
    `<g transform="translate(26,26) scale(2)" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">${icon}</g>` +
    `</svg>`;
  // '(' va ')' khong duoc encodeURIComponent ma hoa, nhung lai bi CSS hieu
  // la dong url(...) som neu dat truc tiep trong style={{backgroundImage:
  // `url(${...})`}} khong co dau nhay - phai tu ma hoa rieng 2 ky tu nay.
  const encoded = encodeURIComponent(svg).replace(/\(/g, '%28').replace(/\)/g, '%29');
  return `data:image/svg+xml,${encoded}`;
}

const ICON = {
  calculator: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  flask: '<path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><path d="M5.52 16h12.96"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  bookOpen: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  landmark: '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  graduationCap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
};

export const CLASS_COVER_PRESETS: ClassThemePreset[] = [
  // ── TOÁN HỌC (Math) ──
  {
    id: 'math-icon-default',
    name: 'Toán học • Mặc định',
    subject: 'TOÁN',
    category: 'STEM',
    url: buildIconCover(ICON.calculator),
    previewColor: '#FF5A1F',
  },
  {
    id: 'math-tools-clean',
    name: 'Toán học • Thước kẻ, Com-pa & Máy tính',
    subject: 'TOÁN',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#2563eb',
  },
  {
    id: 'math-board-chalk',
    name: 'Toán học • Bảng công thức & Không gian học',
    subject: 'TOÁN',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#0284c7',
  },

  // ── VẬT LÝ (Physics) ──
  {
    id: 'physics-icon-default',
    name: 'Vật lý • Mặc định',
    subject: 'VẬT LÝ',
    category: 'STEM',
    url: buildIconCover(ICON.zap),
    previewColor: '#FF5A1F',
  },
  {
    id: 'physics-prism-clean',
    name: 'Vật lý • Lăng kính & Khúc xạ ánh sáng',
    subject: 'VẬT LÝ',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#7c3aed',
  },
  {
    id: 'physics-astronomy',
    name: 'Vật lý • Vũ trụ & Vật lý Thiên văn',
    subject: 'VẬT LÝ',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#4f46e5',
  },

  // ── HÓA HỌC (Chemistry) ──
  {
    id: 'chem-icon-default',
    name: 'Hóa học • Mặc định',
    subject: 'HOÁ HỌC',
    category: 'STEM',
    url: buildIconCover(ICON.flask),
    previewColor: '#FF5A1F',
  },
  {
    id: 'chem-beakers-clean',
    name: 'Hóa học • Bình thí nghiệm & Dung dịch xanh',
    subject: 'HOÁ HỌC',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#0891b2',
  },
  {
    id: 'chem-tubes-lab',
    name: 'Hóa học • Dụng cụ Nghiên cứu Thí nghiệm',
    subject: 'HOÁ HỌC',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#0d9488',
  },

  // ── SINH HỌC (Biology) ──
  {
    id: 'bio-icon-default',
    name: 'Sinh học • Mặc định',
    subject: 'SINH HỌC',
    category: 'STEM',
    url: buildIconCover(ICON.leaf),
    previewColor: '#FF5A1F',
  },
  {
    id: 'bio-microscope-lab',
    name: 'Sinh học • Kính hiển vi Quang học',
    subject: 'SINH HỌC',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#059669',
  },
  {
    id: 'bio-leaves-nature',
    name: 'Sinh học • Tự nhiên & Thực vật học',
    subject: 'SINH HỌC',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#16a34a',
  },

  // ── TIẾNG ANH & NGOẠI NGỮ (English & Languages) ──
  {
    id: 'english-icon-default',
    name: 'Tiếng Anh • Mặc định',
    subject: 'TIẾNG ANH',
    category: 'HUMANITIES',
    url: buildIconCover(ICON.languages),
    previewColor: '#FF5A1F',
  },
  {
    id: 'english-desk-sunlight',
    name: 'Tiếng Anh • Bàn đọc sách, Kính & Nắng mai',
    subject: 'TIẾNG ANH',
    category: 'HUMANITIES',
    url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#e11d48',
  },
  {
    id: 'english-stack-books',
    name: 'Tiếng Anh • Chồng sách Học thuật & Từ điển',
    subject: 'TIẾNG ANH',
    category: 'HUMANITIES',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#be123c',
  },

  // ── NGỮ VĂN & LỊCH SỬ (Literature & History) ──
  {
    id: 'literature-icon-default',
    name: 'Ngữ văn • Mặc định',
    subject: 'NGỮ VĂN',
    category: 'HUMANITIES',
    url: buildIconCover(ICON.bookOpen),
    previewColor: '#FF5A1F',
  },
  {
    id: 'literature-pen-journal',
    name: 'Ngữ văn • Bút mực, Giấy viết & Tác phẩm',
    subject: 'NGỮ VĂN',
    category: 'HUMANITIES',
    url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#b45309',
  },
  {
    id: 'history-icon-default',
    name: 'Lịch sử & Địa lý • Mặc định',
    subject: 'LỊCH SỬ',
    category: 'SOCIAL',
    url: buildIconCover(ICON.landmark),
    previewColor: '#FF5A1F',
  },
  {
    id: 'history-map-compass',
    name: 'Lịch sử & Địa lý • Bản đồ & La bàn Cổ điển',
    subject: 'LỊCH SỬ',
    category: 'SOCIAL',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#854d0e',
  },

  // ── ĐÁNH GIÁ NĂNG LỰC & TƯ DUY LOGIC (Aptitude & Logic) ──
  {
    id: 'aptitude-icon-default',
    name: 'ĐGNL • Mặc định',
    subject: 'ĐGNL',
    category: 'SOCIAL',
    url: buildIconCover(ICON.target),
    previewColor: '#FF5A1F',
  },
  {
    id: 'aptitude-chess-strategy',
    name: 'ĐGNL • Cờ vua & Tư duy Chiến lược',
    subject: 'ĐGNL',
    category: 'SOCIAL',
    url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#d97706',
  },
  {
    id: 'aptitude-exam-desk',
    name: 'ĐGNL • Bàn làm bài thi & Bút chì',
    subject: 'ĐGNL',
    category: 'SOCIAL',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#f59e0b',
  },

  // ── TIN HỌC & CÔNG NGHỆ (Informatics & Tech) ──
  {
    id: 'tech-icon-default',
    name: 'Tin học • Mặc định',
    subject: 'TIN HỌC',
    category: 'STEM',
    url: buildIconCover(ICON.code),
    previewColor: '#FF5A1F',
  },
  {
    id: 'tech-coding-laptop',
    name: 'Tin học • Máy tính & Lập trình Sáng tạo',
    subject: 'TIN HỌC',
    category: 'STEM',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#0284c7',
  },

  // ── CHUNG / HỌC VIỆN ĐIỂM SÁNG (Điểm Sáng Academy) ──
  {
    id: 'academy-icon-default',
    name: 'Điểm Sáng • Mặc định',
    subject: 'CHUNG',
    category: 'ACADEMY',
    url: buildIconCover(ICON.graduationCap),
    previewColor: '#FF5A1F',
  },
  {
    id: 'academy-campus-lawn',
    name: 'Điểm Sáng • Giảng đường & Khuôn viên Xanh',
    subject: 'CHUNG',
    category: 'ACADEMY',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#ea580c',
  },
  {
    id: 'academy-students-team',
    name: 'Điểm Sáng • Học nhóm & Thảo luận Tri thức',
    subject: 'CHUNG',
    category: 'ACADEMY',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop',
    previewColor: '#f97316',
  },
];

function coverById(id: string): string {
  return CLASS_COVER_PRESETS.find(p => p.id === id)?.url ?? CLASS_COVER_PRESETS[0].url;
}

/**
 * Trả về ảnh bìa mặc định (icon trên nền cam) theo môn học nếu lớp chưa cài ảnh bìa.
 * Tra theo id thay vì vị trí trong mảng để không bị lệch khi mảng preset thay đổi.
 */
export function getDefaultCoverForSubject(subjectKey: string): string {
  switch (subjectKey) {
    case 'MATH':
      return coverById('math-icon-default');
    case 'PHYSICS':
      return coverById('physics-icon-default');
    case 'CHEMISTRY':
      return coverById('chem-icon-default');
    case 'BIOLOGY':
      return coverById('bio-icon-default');
    case 'ENGLISH':
      return coverById('english-icon-default');
    case 'LITERATURE':
      return coverById('literature-icon-default');
    case 'HISTORY':
      return coverById('history-icon-default');
    case 'APTITUDE':
      return coverById('aptitude-icon-default');
    case 'INFORMATICS':
      return coverById('tech-icon-default');
    default:
      return coverById('academy-icon-default');
  }
}
