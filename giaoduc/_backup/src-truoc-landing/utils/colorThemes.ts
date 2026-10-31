export interface ColorThemeTokens {
  accent: string;
  accentDark: string;
  accentLight: string;
  accentSecondary: string;
  accentTertiary: string;
  shadowAccent: string;
}

export interface ColorThemeOption {
  id: string;
  label: string;
  icon: string;
  category: 'brand' | 'colorhunt' | 'pastel' | 'dark' | 'season';
  description: string;
  /** 4 swatches — inspired by Color Hunt palettes */
  preview: [string, string, string, string];
  tokens: ColorThemeTokens;
}

export function tokenToCss(rgbStr: string, alpha?: number): string {
  return alpha !== undefined ? `rgb(${rgbStr} / ${alpha})` : `rgb(${rgbStr})`;
}

export const COLOR_THEME_KEY = 'uranus-color-theme';

function rgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function shadow(r: number, g: number, b: number, a = 0.18): string {
  return `0 8px 24px rgba(${r}, ${g}, ${b}, ${a})`;
}

function luminance(rgbStr: string): number {
  const [r, g, b] = rgbStr.split(' ').map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function mixRgb(a: string, b: string, weightA: number): string {
  const [ar, ag, ab] = a.split(' ').map(Number);
  const [br, bg, bb] = b.split(' ').map(Number);
  const w2 = 1 - weightA;
  return `${Math.round(ar * weightA + br * w2)} ${Math.round(ag * weightA + bg * w2)} ${Math.round(ab * weightA + bb * w2)}`;
}

/**
 * Map 4 Color Hunt swatches → UI roles for every palette.
 * Swatch order: [chính, phụ, nhấn, neo tối/sáng] — darkest/lightest auto-detected.
 */
export function fromPreview(preview: [string, string, string, string]): ColorThemeTokens {
  const accent = rgb(preview[0]);
  const accentSecondary = rgb(preview[1]);
  const accentTertiary = rgb(preview[2]);

  const rgbSwatches = preview.map((hex) => rgb(hex));
  const darkest = rgbSwatches.reduce((a, b) => (luminance(a) < luminance(b) ? a : b));
  const lightest = rgbSwatches.reduce((a, b) => (luminance(a) > luminance(b) ? a : b));
  const accentDark = darkest;
  const accentLight = mixRgb('255 255 255', lightest, 0.18);

  const [r, g, b] = accent.split(' ').map(Number);
  return {
    accent,
    accentDark,
    accentLight,
    accentSecondary,
    accentTertiary,
    shadowAccent: shadow(r, g, b),
  };
}

/** 2 bảng màu của Điểm Sáng: "Mực xanh" (mặc định) và "Phấn bảng". */
const colorThemeDefinitions: (Omit<ColorThemeOption, 'tokens'> & { tokens: ColorThemeTokens })[] = [
  {
    id: 'ink',
    label: 'Mực xanh',
    icon: '🖋️',
    category: 'brand',
    description: 'Xanh mực và nét bút đỏ chấm bài — sáng, rõ, hợp lớp học',
    preview: ['#2F6BFF', '#FF5A47', '#7C5CFF', '#EDF2FD'],
    tokens: { accent: '47 107 255', accentDark: '29 66 196', accentLight: '230 238 255', accentSecondary: '255 90 71', accentTertiary: '124 92 255', shadowAccent: shadow(47, 107, 255) },
  },
  {
    id: 'chalk',
    label: 'Phấn bảng',
    icon: '🧑‍🏫',
    category: 'brand',
    description: 'Xanh bảng phấn và cam phấn màu — dịu mắt khi dạy lâu',
    preview: ['#12B39A', '#FF8A1F', '#3FA9F5', '#EAF7F2'],
    tokens: { accent: '18 179 154', accentDark: '10 112 96', accentLight: '224 246 239', accentSecondary: '255 138 31', accentTertiary: '63 169 245', shadowAccent: shadow(18, 179, 154) },
  },
];

export const colorThemeOptions: ColorThemeOption[] = colorThemeDefinitions;

export type ColorThemeId = (typeof colorThemeOptions)[number]['id'];

export const colorThemeTokens: Record<ColorThemeId, ColorThemeTokens> = Object.fromEntries(
  colorThemeOptions.map((o) => [o.id, o.tokens]),
) as Record<ColorThemeId, ColorThemeTokens>;

const themeIds = colorThemeOptions.map((o) => o.id);

export function isColorThemeId(value: string): value is ColorThemeId {
  return themeIds.includes(value);
}

export function readStoredColorTheme(): ColorThemeId {
  const stored = localStorage.getItem(COLOR_THEME_KEY);
  if (stored && isColorThemeId(stored)) return stored;
  return 'ink';
}

export function applyColorTheme(id: ColorThemeId): void {
  const tokens = colorThemeTokens[id];
  const root = document.documentElement;

  root.setAttribute('data-color-theme', id);
  root.style.setProperty('--accent', tokens.accent);
  root.style.setProperty('--accent-dark', tokens.accentDark);
  root.style.setProperty('--accent-light', tokens.accentLight);
  root.style.setProperty('--accent-secondary', tokens.accentSecondary);
  root.style.setProperty('--accent-tertiary', tokens.accentTertiary);
  root.style.setProperty('--shadow-accent', tokens.shadowAccent);
  root.style.setProperty('--page', id === 'chalk' ? '234 247 242' : '237 242 253');
  root.style.colorScheme = root.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem(COLOR_THEME_KEY, id);
}

export const themeCategories: { id: ColorThemeOption['category']; label: string }[] = [
  { id: 'brand', label: 'Bảng màu Điểm Sáng' },
];
