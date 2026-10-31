import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  Building2,
  Calculator,
  FlaskConical,
  GraduationCap,
  Languages,
  Leaf,
  MonitorPlay,
  PenLine,
  Target,
  Users,
  Zap,
} from 'lucide-react';

export type NavLink = {
  href: string;
  label: string;
};

/** Thứ tự menu = thứ tự section trên trang */
export const NAV_LINKS: NavLink[] = [
  { href: '#ve-chung-toi', label: 'Giới thiệu' },
  { href: '#chuong-trinh', label: 'Khoá học' },
  { href: '#lo-trinh', label: 'Lộ trình' },
  { href: '#doi-ngu', label: 'Đội ngũ' },
  { href: '#hoat-dong', label: 'Hoạt động' },
  { href: '#lien-he', label: 'Liên hệ' },
];

export const TRUST_STATS = [
  { label: 'Thành lập', value: '2015' },
  { label: 'Cấp học', value: 'Lớp 1–12' },
  { label: 'Luyện thi', value: 'ĐGNL · VSTEP · TOEIC · IELTS' },
  { label: 'Cơ sở', value: 'Hai chi nhánh tại TP.HCM' },
] as const;

export const ABOUT_PILLARS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Target,
    title: 'Lộ Trình Rõ Ràng',
    body:
      'Tư vấn mục tiêu trước khi vào học, từ nền tảng phổ thông đến luyện thi chứng chỉ.',
  },
  {
    icon: Building2,
    title: 'Lớp Học Tại Các Cơ Sở',
    body:
      'Hai chi nhánh tại TP.HCM với môi trường học tập năng động, kết hợp cùng đội ngũ giáo viên và trợ giảng tận tâm, nhiệt tình.',
  },
  {
    icon: MonitorPlay,
    title: 'Nền Tảng LMS',
    body:
      'Bài giảng, luyện đề và báo cáo tiến độ học tập, đồng bộ với lịch học tại lớp.',
  },
];

export const SUBJECTS = [
  { name: 'Tiếng Anh', icon: Languages },
  { name: 'Toán', icon: Calculator },
  { name: 'Vật Lý', icon: Zap },
  { name: 'Hoá Học', icon: FlaskConical },
  { name: 'Sinh Học', icon: Leaf },
  { name: 'Ngữ Văn', icon: PenLine },
] as const;

export const EXAMS = [
  { name: 'Đánh Giá Năng Lực', short: 'ĐGNL', icon: Target },
  { name: 'VSTEP', short: 'VSTEP', icon: GraduationCap },
  { name: 'TOEIC', short: 'TOEIC', icon: Languages },
  { name: 'IELTS', short: 'IELTS', icon: Award },
] as const;

export const LEARNING_STEPS = [
  {
    icon: BookOpen,
    title: 'Tư Vấn & Chọn Lộ Trình',
    body: 'Xác định mục tiêu — chương trình phổ thông theo khối lớp hoặc luyện thi chứng chỉ — trước khi bắt đầu.',
  },
  {
    icon: MonitorPlay,
    title: 'Học Tập Kết Hợp',
    body: 'Tham gia học tại trung tâm và ôn luyện trên hệ thống LMS để theo dõi tiến độ học tập.',
  },
  {
    icon: GraduationCap,
    title: 'Đánh Giá & Cải Thiện',
    body: 'Theo dõi kết quả học tập, nhận phản hồi từ giáo viên và cải thiện năng lực qua các bài đánh giá định kỳ.',
  },
] as const;

export const FACULTY_POINTS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: GraduationCap,
    title: 'Giáo Viên Chuyên Môn',
    body: 'Giáo viên phụ trách chuyên môn theo từng môn và chương trình thi.',
  },
  {
    icon: Users,
    title: 'Trợ Giảng Đồng Hành',
    body: 'Trợ giảng hỗ trợ ôn tập, giải đáp và nhắc nhở tiến độ hàng ngày.',
  },
  {
    icon: MonitorPlay,
    title: 'Hệ Thống LMS',
    body: 'Nền tảng giúp học viên luyện tập, theo dõi tiến độ nhằm cải thiện điểm số.',
  },
];

// mapQuery: chuoi dua cho Google Maps. Tach rieng khoi address de chinh cho
// dung vi tri ma khong phai doi chu hien thi tren trang.
export const CAMPUSES = [
  {
    code: 'Cơ Sở 1',
    address: '82 Phan Bội Châu, Phường Dĩ An, TP. Hồ Chí Minh',
    mapQuery: '82 Phan Bội Châu, Dĩ An, Bình Dương, Việt Nam',
  },
  {
    code: 'Cơ Sở 2',
    address: '25 Đường N5, KDC Biconsi, Phường Tân Đông Hiệp, TP. Hồ Chí Minh',
    // Toa do chinh xac (10°55'56.8"N 106°46'14.6"E) - tim theo dia chi bi lech vi tri
    mapQuery: '10.932444,106.770722',
  },
] as const;

export type Campus = (typeof CAMPUSES)[number];

/** Nhung ban do trong iframe, khong can API key. */
export const campusEmbedUrl = (campus: Campus) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(campus.mapQuery)}&hl=vi&z=16&output=embed`;

/** Mo Google Maps that de xem duong di. */
export const campusMapUrl = (campus: Campus) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campus.mapQuery)}`;

/**
 * Lien ket mang xa hoi.
 * De url rong thi muc do tu an o giao dien - khi co link chi can dien vao day,
 * khong phai sua cho nao khac.
 */
export const SOCIAL_LINKS = [
  { key: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/UrnCenter' },
  { key: 'tiktok', label: 'TikTok', url: 'https://www.tiktok.com/@uranuscenter2015' },
] as const;

export type SocialLink = (typeof SOCIAL_LINKS)[number];

export const PHONES = [
  { label: 'HOTLINE TƯ VẤN', number: '0915 296 684', href: 'tel:0915296684' },
  { label: 'HOTLINE HỖ TRỢ', number: '0902 506 992', href: 'tel:0902506992' },
] as const;

export const HERO = {
  eyebrow: 'ĐIỂM SÁNG',
  title: 'NỀN TẢNG LUYỆN THI TOÀN DIỆN',
  lede:
    'Trung tâm Điểm Sáng triển khai hệ thống LMS (Learning Management System), mang đến môi trường học tập hiện đại, giúp học viên học tập mọi lúc, mọi nơi, theo dõi lộ trình học, luyện tập và đánh giá kết quả một cách hiệu quả.',
} as const;

export const SECTIONS = {
  about: {
    kicker: 'Giới thiệu',
    heading: 'ĐIỂM SÁNG DEVELOPING AND TRAINING CENTER',
    body:
      'Thành lập từ năm 2015, Trung tâm Điểm Sáng đồng hành cùng học viên trong quá trình chinh phục chương trình THPT và ôn luyện các kỳ thi chứng chỉ. Mô hình kết hợp giữa lớp học trực tiếp và nền tảng học trực tuyến (LMS) mang đến trải nghiệm học tập linh hoạt, giúp học viên dễ dàng theo dõi tiến độ, củng cố kiến thức và nâng cao hiệu quả ôn luyện.',
  },
  programs: {
    kicker: 'Khoá học',
    heading: 'CHƯƠNG TRÌNH HỌC PHÂN TẦNG THEO MỤC TIÊU',
    body:
      'Chọn khối phổ thông hoặc luyện thi chứng chỉ — mỗi chương trình có đầu ra và lộ trình riêng, dễ theo dõi trên LMS.',
  },
  path: {
    kicker: 'Lộ trình',
    heading: 'LỘ TRÌNH TƯ VẤN BAO GỒM BA GIAI ĐOẠN',
    body:
      'Lộ trình học tập minh bạch, giúp học sinh và phụ huynh dễ dàng theo dõi tiến độ và mục tiêu học tập.',
  },
  faculty: {
    kicker: 'Đội ngũ',
    heading: 'KINH NGHIỆM - TẬN TÂM - NHIỆT HUYẾT',
    body:
      'Mỗi lớp học đều có giáo viên phụ trách chuyên môn và trợ giảng giúp theo dõi tiến độ — đảm bảo học sinh được giải đáp kịp thời cả trên lớp lẫn trên nền tảng trực tuyến.',
  },
  contact: {
    kicker: 'Liên hệ',
    heading: 'ĐĂNG KÝ TƯ VẤN TẠI CƠ SỞ HOẶC QUA HOTLINE',
    body:
      'Hai chi nhánh tại TP. Hồ Chí Minh sẵn sàng tiếp đón phụ huynh và học sinh. Liên hệ để được tư vấn lộ trình miễn phí.',
  },
  cta: {
    kicker: 'Điểm Sáng',
    heading: 'Sẵn sàng chinh phục mục tiêu học tập?',
    body:
      'Học viên đã có tài khoản vui lòng đăng nhập để truy cập hệ thống học tập. Nếu cần hỗ trợ đăng nhập, đổi mật khẩu hoặc tư vấn, vui lòng liên hệ hotline hoặc cơ sở gần nhất.',
  },
} as const;
