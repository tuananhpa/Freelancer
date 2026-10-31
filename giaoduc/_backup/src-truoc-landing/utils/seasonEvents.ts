export type SeasonTheme =
  | 'halloween'
  | 'christmas'
  | 'tet'
  | 'english-week'
  | 'ielts-vstep'
  | 'summer'
  | 'midterm'
  | 'finals'
  | 'back-to-school'
  | 'default';

export interface SeasonEvent {
  id: SeasonTheme;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  accentClass: string;
  bonus?: string;
  cta?: { label: string; to: string };
}

export interface WeekendWarrior {
  active: boolean;
  label: string;
  tagline: string;
  xpHint: string;
}

function inRange(month: number, day: number, start: [number, number], end: [number, number]): boolean {
  const d = month * 100 + day;
  const s = start[0] * 100 + start[1];
  const e = end[0] * 100 + end[1];
  if (s <= e) return d >= s && d <= e;
  return d >= s || d <= e;
}

const SEASONS: { match: (m: number, d: number) => boolean; event: SeasonEvent }[] = [
  {
    match: (m, d) => inRange(m, d, [10, 20], [10, 31]),
    event: {
      id: 'halloween',
      name: 'Halloween',
      emoji: '🎃',
      tagline: 'Spooky season — luyện từ vựng ma quái và thử thách bài quiz đêm Halloween!',
      gradient: 'from-purple-600/20 via-orange-500/15 to-amber-500/10 dark:from-purple-600/25 dark:via-orange-600/15 dark:to-amber-600/10',
      accentClass: 'border-purple-400/50 dark:border-purple-500/35 season-halloween',
      bonus: 'Oct 20–31',
      cta: { label: 'Học thẻ ghi nhớ', to: '/flashcards' },
    },
  },
  {
    match: (m, d) => inRange(m, d, [12, 15], [12, 31]),
    event: {
      id: 'christmas',
      name: 'Giáng sinh',
      emoji: '🎄',
      tagline: 'Mùa lễ hội — hoàn thành bài học để mở quà XP cuối tuần!',
      gradient: 'from-emerald-500/15 via-red-500/10 to-green-400/15 dark:from-emerald-600/20 dark:via-red-600/15 dark:to-green-500/10',
      accentClass: 'border-emerald-400/50 dark:border-emerald-500/35 season-christmas',
      bonus: 'Noël',
      cta: { label: 'Xem tiến độ', to: '/progress' },
    },
  },
  {
    match: (m, d) => inRange(m, d, [1, 15], [2, 15]),
    event: {
      id: 'tet',
      name: 'Mùa Tết',
      emoji: '🧧',
      tagline: 'Chúc mừng năm mới! Học mỗi ngày để giữ streak may mắn.',
      gradient: 'from-red-500/15 via-amber-400/10 to-orange-500/15 dark:from-red-500/20 dark:via-amber-500/10 dark:to-orange-600/15',
      accentClass: 'border-red-300/50 dark:border-red-500/30 season-tet',
      bonus: 'Tết',
    },
  },
  {
    match: (m, d) => inRange(m, d, [10, 1], [10, 7]),
    event: {
      id: 'english-week',
      name: 'English Week',
      emoji: '🇬🇧',
      tagline: 'Tuần lễ tiếng Anh — thử placement test và khoe chứng chỉ!',
      gradient: 'from-blue-500/15 via-indigo-400/10 to-red-400/10 dark:from-blue-600/20 dark:via-indigo-500/15 dark:to-red-500/10',
      accentClass: 'border-blue-400/50 dark:border-blue-500/35 season-english-week',
      bonus: 'Tuần 1/10',
      cta: { label: 'Kiểm tra trình độ', to: '/learning-path' },
    },
  },
  {
    match: (m, d) => {
      if (![3, 6, 9, 12].includes(m)) return false;
      if (m === 12 && d >= 15) return false;
      if (m === 10 && d >= 20) return false;
      return true;
    },
    event: {
      id: 'ielts-vstep',
      name: 'Mùa IELTS / VSTEP',
      emoji: '🎯',
      tagline: 'Luyện format chuẩn — mock test, Kho lỗi sai và đề thi có giám sát.',
      gradient: 'from-sky-500/15 via-blue-500/10 to-indigo-500/15 dark:from-sky-600/20 dark:via-blue-600/15 dark:to-indigo-600/15',
      accentClass: 'border-sky-400/50 dark:border-sky-500/35 season-ielts',
      bonus: 'IELTS · VSTEP',
      cta: { label: 'Kho lỗi sai', to: '/mistake-vault' },
    },
  },
  {
    match: (m, d) => inRange(m, d, [5, 1], [6, 20]) || inRange(m, d, [12, 1], [1, 10]),
    event: {
      id: 'finals',
      name: 'Mùa Thi cuối kỳ',
      emoji: '🔥',
      tagline: 'Thi cử cận kề — Focus mode & mock test có proctoring!',
      gradient: 'from-red-600/15 via-orange-500/10 to-cam/15 dark:from-red-600/20 dark:via-orange-600/15 dark:to-cam/20',
      accentClass: 'border-red-400/50 dark:border-red-500/35 season-survival',
      bonus: 'Cuối kỳ',
      cta: { label: 'Kho lỗi sai', to: '/mistake-vault' },
    },
  },
  {
    match: (m, d) => inRange(m, d, [6, 15], [8, 15]),
    event: {
      id: 'summer',
      name: 'Summer Break',
      emoji: '☀️',
      tagline: 'Hè vui mà không quên English — 15 phút flashcard mỗi ngày!',
      gradient: 'from-yellow-400/20 via-orange-400/15 to-sky-400/15 dark:from-yellow-500/20 dark:via-orange-500/15 dark:to-sky-500/15',
      accentClass: 'border-yellow-400/50 dark:border-yellow-500/35 season-summer',
      bonus: 'Hè 2026',
      cta: { label: 'Học từ vựng', to: '/vocabulary' },
    },
  },
  {
    match: (m, d) => inRange(m, d, [3, 1], [4, 30]) || inRange(m, d, [10, 8], [11, 15]),
    event: {
      id: 'midterm',
      name: 'Mùa Kiểm tra giữa kỳ',
      emoji: '📝',
      tagline: 'Survival mode: Ôn Kho lỗi sai và luyện đề mỗi ngày!',
      gradient: 'from-orange-500/15 via-cam/10 to-yellow-400/15 dark:from-orange-600/20 dark:via-cam/15 dark:to-yellow-500/10',
      accentClass: 'border-cam/40 dark:border-cam/30 season-survival',
      bonus: 'Giữa kỳ',
      cta: { label: 'Kho lỗi sai', to: '/mistake-vault' },
    },
  },
  {
    match: (m, d) => inRange(m, d, [8, 20], [9, 30]),
    event: {
      id: 'back-to-school',
      name: 'Mùa Khai giảng',
      emoji: '🎒',
      tagline: 'Năm học mới — bắt đầu streak và nuôi Uranian từ hôm nay!',
      gradient: 'from-blue-400/15 via-indigo-400/10 to-purple-400/15 dark:from-blue-500/20 dark:via-indigo-500/15 dark:to-purple-500/10',
      accentClass: 'border-blue-300/50 dark:border-blue-500/30',
      bonus: 'Khai giảng',
    },
  },
];

const DEFAULT_SEASON: SeasonEvent = {
  id: 'default',
  name: 'Hành trình Điểm Sáng',
  emoji: '🪐',
  tagline: 'Mỗi ngày một bước nhỏ — chinh phục tiếng Anh cùng Uranian của bạn.',
  gradient: 'from-cam/10 via-indigo-400/5 to-purple-400/10 dark:from-cam/15 dark:via-indigo-500/10 dark:to-purple-500/10',
  accentClass: 'border-cam/20 dark:border-cam/25',
};

export function getCurrentSeason(date = new Date()): SeasonEvent {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  for (const { match, event } of SEASONS) {
    if (match(m, d)) return event;
  }
  return DEFAULT_SEASON;
}

export function getWeekendWarrior(date = new Date()): WeekendWarrior {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  return {
    active: isWeekend,
    label: 'Weekend Warrior',
    tagline: 'Cuối tuần rồi — học flashcard hoặc vocab để nhận bonus XP!',
    xpHint: '+15 XP flashcard · +12 XP ôn lỗi sai',
  };
}

export function getSeasonDashboardClass(season: SeasonEvent): string {
  if (season.id === 'finals' || season.id === 'midterm') return 'season-survival';
  if (season.id === 'tet') return 'season-tet';
  if (season.id === 'halloween') return 'season-halloween';
  if (season.id === 'christmas') return 'season-christmas';
  if (season.id === 'summer') return 'season-summer';
  return '';
}
