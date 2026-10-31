import type { LucideIcon } from 'lucide-react';
import { Calculator, FlaskConical, Languages, Target, Zap, BookOpen } from 'lucide-react';

/**
 * Phân loại lớp học theo MÔN HỌC và KHỐI.
 *
 * Dữ liệu lớp học hiện tại không có trường "khối" riêng và trường `subject`
 * thường bị bỏ trống (VD: lớp "TOÁN 12.1 (HOÀNG ANH)" có subject rỗng,
 * section = "2026-2027"). Vì vậy môn học và khối được suy ra theo thứ tự:
 *   - Môn học: `subject` → tên lớp → mô tả
 *   - Khối:    tên lớp → section → mô tả
 * Nếu sau này backend bổ sung trường riêng, chỉ cần sửa 2 hàm detect bên dưới.
 */

export type SubjectKey = 'PHYSICS' | 'CHEMISTRY' | 'MATH' | 'ENGLISH' | 'APTITUDE' | 'OTHER';

export interface SubjectMeta {
  key: SubjectKey;
  /** Nhãn hiển thị đầy đủ, viết hoa theo yêu cầu của trung tâm */
  name: string;
  /** Nhãn ngắn dùng cho tab trên màn hình nhỏ */
  short: string;
  icon: LucideIcon;
  /** Gradient cho banner / header của nhóm môn */
  gradient: string;
  /** Màu chữ cho chip môn học */
  text: string;
  /** Màu nền cho chip môn học */
  chip: string;
  /** Màu vạch nhận diện môn học (Academic Stripe) */
  stripeColor: string;
  /** Lớp badge chuẩn LMS */
  badgeClass: string;
}

/** Thứ tự hiển thị đúng theo yêu cầu: VẬT LÝ → HOÁ HỌC → TOÁN → TIẾNG ANH → ĐGNL */
export const SUBJECT_ORDER: SubjectKey[] = ['PHYSICS', 'CHEMISTRY', 'MATH', 'ENGLISH', 'APTITUDE', 'OTHER'];

export const SUBJECTS: Record<SubjectKey, SubjectMeta> = {
  PHYSICS: {
    key: 'PHYSICS',
    name: 'VẬT LÝ',
    short: 'Vật lý',
    icon: Zap,
    gradient: 'from-indigo-600 to-indigo-700',
    text: 'text-indigo-600 dark:text-indigo-400',
    chip: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800',
    stripeColor: 'bg-indigo-600',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  },
  CHEMISTRY: {
    key: 'CHEMISTRY',
    name: 'HOÁ HỌC',
    short: 'Hoá học',
    icon: FlaskConical,
    gradient: 'from-teal-600 to-emerald-700',
    text: 'text-teal-600 dark:text-teal-400',
    chip: 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800',
    stripeColor: 'bg-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  },
  MATH: {
    key: 'MATH',
    name: 'TOÁN',
    short: 'Toán',
    icon: Calculator,
    gradient: 'from-blue-600 to-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    chip: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    stripeColor: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  },
  ENGLISH: {
    key: 'ENGLISH',
    name: 'TIẾNG ANH',
    short: 'Tiếng Anh',
    icon: Languages,
    gradient: 'from-rose-600 to-rose-700',
    text: 'text-rose-600 dark:text-rose-400',
    chip: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
    stripeColor: 'bg-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  },
  APTITUDE: {
    key: 'APTITUDE',
    name: 'ĐÁNH GIÁ NĂNG LỰC',
    short: 'ĐGNL',
    icon: Target,
    gradient: 'from-amber-600 to-amber-700',
    text: 'text-amber-600 dark:text-amber-400',
    chip: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
    stripeColor: 'bg-amber-600',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  },
  OTHER: {
    key: 'OTHER',
    name: 'MÔN KHÁC',
    short: 'Khác',
    icon: BookOpen,
    gradient: 'from-slate-600 to-slate-700',
    text: 'text-slate-600 dark:text-slate-400',
    chip: 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
    stripeColor: 'bg-slate-600',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  },
};

export type GradeKey = '12' | '11' | '10' | '9' | '8' | '7' | '6' | 'OTHER';

export const GRADE_ORDER: GradeKey[] = ['12', '11', '10', '9', '8', '7', '6', 'OTHER'];

export interface GradeMeta {
  key: GradeKey;
  label: string;
  short: string;
  badgeClass: string;
  pillClass: string;
  borderClass: string;
}

export const GRADES: Record<GradeKey, GradeMeta> = {
  '12': {
    key: '12',
    label: 'KHỐI 12',
    short: 'K12',
    badgeClass: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 font-mono font-bold',
    pillClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300',
    borderClass: 'border-amber-300 dark:border-amber-700/60',
  },
  '11': {
    key: '11',
    label: 'KHỐI 11',
    short: 'K11',
    badgeClass: 'bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-300 dark:border-sky-700/60 font-mono font-bold',
    pillClass: 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-300',
    borderClass: 'border-sky-300 dark:border-sky-700/60',
  },
  '10': {
    key: '10',
    label: 'KHỐI 10',
    short: 'K10',
    badgeClass: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 font-mono font-bold',
    pillClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300',
    borderClass: 'border-emerald-300 dark:border-emerald-700/60',
  },
  '9': {
    key: '9',
    label: 'KHỐI 9',
    short: 'K9',
    badgeClass: 'bg-violet-50 text-violet-900 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-300 dark:border-violet-700/60 font-mono font-bold',
    pillClass: 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-300',
    borderClass: 'border-violet-300 dark:border-violet-700/60',
  },
  '8': {
    key: '8',
    label: 'KHỐI 8',
    short: 'K8',
    badgeClass: 'bg-pink-50 text-pink-900 dark:bg-pink-950/40 dark:text-pink-300 border border-pink-300 dark:border-pink-700/60 font-mono font-bold',
    pillClass: 'bg-pink-100 text-pink-900 dark:bg-pink-900/30 dark:text-pink-300',
    borderClass: 'border-pink-300 dark:border-pink-700/60',
  },
  '7': {
    key: '7',
    label: 'KHỐI 7',
    short: 'K7',
    badgeClass: 'bg-lime-50 text-lime-900 dark:bg-lime-950/40 dark:text-lime-300 border border-lime-300 dark:border-lime-700/60 font-mono font-bold',
    pillClass: 'bg-lime-100 text-lime-900 dark:bg-lime-900/30 dark:text-lime-300',
    borderClass: 'border-lime-300 dark:border-lime-700/60',
  },
  '6': {
    key: '6',
    label: 'KHỐI 6',
    short: 'K6',
    badgeClass: 'bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-300 dark:border-orange-700/60 font-mono font-bold',
    pillClass: 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300',
    borderClass: 'border-orange-300 dark:border-orange-700/60',
  },
  OTHER: {
    key: 'OTHER',
    label: 'CHƯA PHÂN KHỐI',
    short: 'Khác',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono font-bold',
    pillClass: 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
    borderClass: 'border-slate-200 dark:border-slate-700',
  },
};

export const GRADE_LABELS: Record<GradeKey, string> = {
  '12': 'KHỐI 12',
  '11': 'KHỐI 11',
  '10': 'KHỐI 10',
  '9': 'KHỐI 9',
  '8': 'KHỐI 8',
  '7': 'KHỐI 7',
  '6': 'KHỐI 6',
  OTHER: 'CHƯA PHÂN KHỐI',
};

/** Bỏ dấu tiếng Việt + viết hoa, để so khớp không phụ thuộc dấu. */
export function normalizeText(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase();
}

/** Bỏ phần tên giáo viên trong ngoặc: "TOÁN 12.1 (HOÀNG ANH)" → "TOÁN 12.1" */
function stripParens(value: string): string {
  return value.replace(/\([^)]*\)/g, ' ');
}

const SUBJECT_PATTERNS: { key: SubjectKey; pattern: RegExp }[] = [
  // ĐGNL kiểm tra trước vì lớp ĐGNL có thể kèm tên môn thành phần
  { key: 'APTITUDE', pattern: /\bDGNL\b|DANH GIA NANG LUC|\bDANH GIA NL\b|\bHSA\b|\bTSA\b|\bAPT\b/ },
  { key: 'PHYSICS', pattern: /\bVAT LY\b|\bVATLY\b|\bLY\b|\bPHYSIC|\bQUANG HOC\b|\bCO HOC\b/ },
  { key: 'CHEMISTRY', pattern: /\bHOA HOC\b|\bHOAHOC\b|\bHOA\b|\bCHEM/ },
  { key: 'MATH', pattern: /\bTOAN\b|\bMATH\b|\bDAI SO\b|\bHINH HOC\b|\bHINH\b/ },
  { key: 'ENGLISH', pattern: /\bTIENG ANH\b|\bENGLISH\b|\bANH VAN\b|\bIELTS\b|\bTOEIC\b|\bVSTEP\b|\bANH\b|\bENG\b/ },
];

function matchSubject(raw?: string | null): SubjectKey | null {
  if (!raw || !raw.trim()) return null;

  // 1. Kiểm tra với chuỗi đã bỏ ngoặc trước (để không bị trùng tên GV như "(HOÀNG ANH)")
  const strippedText = normalizeText(stripParens(raw));
  if (strippedText.trim()) {
    for (const { key, pattern } of SUBJECT_PATTERNS) {
      if (pattern.test(strippedText)) return key;
    }
  }

  // 2. Nếu không khớp ngoài ngoặc, kiểm tra chuỗi gốc (trường hợp môn đặt trong ngoặc như "LỚP 12 (TOÁN)")
  const fullText = normalizeText(raw);
  for (const { key, pattern } of SUBJECT_PATTERNS) {
    if (pattern.test(fullText)) return key;
  }

  return null;
}

export interface ClassLike {
  name: string;
  subject?: string;
  section?: string;
  description?: string;
}

/** Suy ra môn học của một lớp. */
export function detectSubject(cls: ClassLike): SubjectKey {
  return (
    matchSubject(cls.subject) ??
    matchSubject(cls.name) ??
    matchSubject(cls.section) ??
    matchSubject(cls.description) ??
    'OTHER'
  );
}

const G = '(1[0-2]|[6-9])';
const EXPLICIT_GRADE = new RegExp(`\\bKHOI\\s*${G}(?![0-9])|\\bK\\s?${G}(?![0-9])|\\bLOP\\s*${G}(?![0-9])|\\bGRADE\\s*${G}(?![0-9])`);
// Không bắt số đứng sau dấu chấm/chữ số (VD ".9" trong "12.9", "2026").
const LOOSE_GRADE = new RegExp(`(?:^|[^0-9.])${G}(?![0-9])`);
// Lớp luyện thi chứng chỉ: số đơn lẻ trong tên là band điểm ("IELTS 6.5"), không phải khối.
const SCORE_CONTEXT = /\bIELTS\b|\bTOEIC\b|\bTOEFL\b|\bSAT\b|\bBAND\b|\bVSTEP\b/;

function looseGrade(text: string): GradeKey | null {
  const m = text.match(LOOSE_GRADE);
  if (!m) return null;
  if (m[1].length === 1 && SCORE_CONTEXT.test(text)) return null;
  return m[1] as GradeKey;
}

function matchGrade(raw?: string | null): GradeKey | null {
  if (!raw || !raw.trim()) return null;

  // 1. Kiểm tra trên chuỗi gốc trước (để nhận diện cả "TOÁN (12A1)", "TOÁN (KHỐI 12)", v.v.)
  const fullText = normalizeText(raw);
  const explicit = fullText.match(EXPLICIT_GRADE);
  if (explicit) {
    const value = explicit.slice(1).find(Boolean);
    if (value) return value as GradeKey;
  }

  const loose = looseGrade(fullText);
  if (loose) return loose;

  // 2. Dự phòng kiểm tra sau khi bỏ ngoặc
  const strippedText = normalizeText(stripParens(raw));
  if (strippedText !== fullText) {
    const looseStripped = looseGrade(strippedText);
    if (looseStripped) return looseStripped;
  }

  return null;
}

/** Suy ra khối (6 → 12) của một lớp. */
export function detectGrade(cls: ClassLike): GradeKey {
  return (
    matchGrade(cls.name) ??
    matchGrade(cls.section) ??
    matchGrade(cls.subject) ??
    matchGrade(cls.description) ??
    'OTHER'
  );
}

export interface GradeGroup<T> {
  grade: GradeKey;
  label: string;
  classes: T[];
}

export interface SubjectGroup<T> {
  subject: SubjectMeta;
  total: number;
  grades: GradeGroup<T>[];
}

/**
 * So sánh 2 lớp học theo mức độ ưu tiên hạn chót / bài tập cần làm:
 * 1. Lớp có bài chưa nộp (pendingCount > 0) đứng TRƯỚC
 * 2. Lớp có deadline gần hơn đứng TRƯỚC
 * 3. Lớp có nhiều bài chưa nộp hơn đứng TRƯỚC
 * 4. Thứ tự tên A-Z
 */
export function compareClassesByUrgency<T extends ClassLike>(a: T, b: T): number {
  const aPending = ((a as any).pendingCount && (a as any).pendingCount > 0) ? (a as any).pendingCount : 0;
  const bPending = ((b as any).pendingCount && (b as any).pendingCount > 0) ? (b as any).pendingCount : 0;

  if (aPending > 0 && bPending === 0) return -1;
  if (aPending === 0 && bPending > 0) return 1;

  const aDl = (a as any).nearestDeadline;
  const bDl = (b as any).nearestDeadline;

  if (aDl && bDl) {
    const diff = new Date(aDl).getTime() - new Date(bDl).getTime();
    if (diff !== 0) return diff;
  } else if (aDl && !bDl) {
    return -1;
  } else if (!aDl && bDl) {
    return 1;
  }

  if (aPending !== bPending) return bPending - aPending;

  return a.name.localeCompare(b.name, 'vi');
}

/**
 * Gom danh sách lớp thành cấu trúc MÔN HỌC → KHỐI → danh sách lớp.
 * Chỉ trả về nhóm khối có lớp; nhóm môn luôn giữ đúng thứ tự SUBJECT_ORDER.
 */
export function groupClassesBySubjectAndGrade<T extends ClassLike>(classes: T[]): SubjectGroup<T>[] {
  const buckets = new Map<SubjectKey, Map<GradeKey, T[]>>();

  for (const cls of classes) {
    const subject = detectSubject(cls);
    const grade = detectGrade(cls);
    if (!buckets.has(subject)) buckets.set(subject, new Map());
    const gradeMap = buckets.get(subject)!;
    if (!gradeMap.has(grade)) gradeMap.set(grade, []);
    gradeMap.get(grade)!.push(cls);
  }

  return SUBJECT_ORDER.map((key) => {
    const gradeMap = buckets.get(key) ?? new Map<GradeKey, T[]>();
    const grades: GradeGroup<T>[] = GRADE_ORDER.filter((g) => (gradeMap.get(g)?.length ?? 0) > 0).map((g) => ({
      grade: g,
      label: GRADE_LABELS[g],
      classes: [...(gradeMap.get(g) ?? [])].sort(compareClassesByUrgency),
    }));
    return {
      subject: SUBJECTS[key],
      total: grades.reduce((sum, g) => sum + g.classes.length, 0),
      grades,
    };
  });
}
