// Text helpers: light cleanup ("biên tập nhẹ"), pronunciation rules, sentence split.
// The original text is never changed by pronunciation rules: toSpeech() returns a copy for TTS only.

const L = '\\p{L}\\p{N}';
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Light edit: spacing and punctuation only, never rewords.
export function tidy(text) {
  return String(text)
    .split(/\n+/)
    .map(line => line
      .replace(/[ \t ]+/g, ' ')
      .replace(/\s+([,.;:!?)\]”])/g, '$1')
      .replace(/([(\[“])\s+/g, '$1')
      .replace(/([,;:])(?=[\p{L}])/gu, '$1 ')
      .replace(/([.!?])(?=\p{Lu})/gu, '$1 ')
      .replace(/(\p{Ll}{2})([.!?])(?=\p{Ll}{2})/gu, '$1$2 ') // "chí.hôm" -> "chí. hôm"; skips "v.v."
      .replace(/(^|[.!?]\s+)(\p{Ll})/gu, (_, a, b) => a + b.toUpperCase())
      .replace(/\.{4,}/g, '...')
      .trim())
    .filter(Boolean)
    .join('\n');
}

// Built-in readings that TTS engines often get wrong; applied after user rules.
function normalize(text) {
  return text
    // 2015–2020 -> 2015 đến 2020
    .replace(/\b((?:1[89]|20)\d\d)\s*[-–—]\s*((?:1[89]|20)\d\d)\b/g, '$1 đến $2')
    // 22/11/1946 -> 22 tháng 11 năm 1946
    .replace(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, '$1 tháng $2 năm $3')
    // 4/1979 -> tháng 4 năm 1979 (month/year)
    .replace(/(tháng\s+)?\b(\d{1,2})\/(\d{4})\b/giu, 'tháng $2 năm $3')
    // 20/11 -> 20 tháng 11
    .replace(/\b(\d{1,2})\/(\d{1,2})\b/g, '$1 tháng $2')
    .replace(/[“”"]/g, '')
    .replace(/\s+[-–—]\s+|\s*[–—]\s*/g, ', ');
}

// rules: [{from, to}] — exact, case-sensitive, whole-word match. Longest first so
// "Trung đoàn 143" wins over "143".
export function applyRules(text, rules = []) {
  const sorted = rules.filter(r => r.from && r.from.trim()).sort((a, b) => b.from.length - a.from.length);
  if (!sorted.length) return text;
  const re = new RegExp(sorted.map(r => `(?<![${L}])${escRe(r.from.trim())}(?![${L}])`).join('|'), 'gu');
  const map = new Map(sorted.map(r => [r.from.trim(), r.to]));
  return text.replace(re, m => map.get(m) ?? m);
}

export const toSpeech = (text, rules) => normalize(applyRules(tidy(text), rules));

export function sentences(text) {
  return String(text).replace(/\n+/g, ' ').match(/[^.!?;]+[.!?;]*\s*/g)?.map(s => s.trim()).filter(Boolean) ?? [];
}

// Split into chunks of at most `max` chars at sentence (then word) boundaries.
export function chunk(text, max) {
  const out = [];
  let cur = '';
  const push = s => { if (s.trim()) out.push(s.trim()); };
  for (const s of sentences(text)) {
    if ((cur + ' ' + s).length <= max) { cur = cur ? cur + ' ' + s : s; continue; }
    push(cur); cur = '';
    if (s.length <= max) { cur = s; continue; }
    for (const w of s.split(' ')) {
      if ((cur + ' ' + w).length > max) { push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    }
  }
  push(cur);
  return out;
}

export const DEFAULT_RULES = [
  { from: 'QĐND', to: 'Quân đội nhân dân' },
  { from: 'LLVT', to: 'lực lượng vũ trang' },
  { from: 'CHQS', to: 'chỉ huy quân sự' },
  { from: 'Trung đoàn 143', to: 'Trung đoàn một bốn ba' },
  { from: 'TRUNG ĐOÀN 143', to: 'Trung đoàn một bốn ba' },
  { from: 'lần thứ IX', to: 'lần thứ chín' },
  { from: 'Đại hội IX', to: 'Đại hội chín' },
  { from: 'TP.', to: 'thành phố' },
];
