/** Helpers for exam question types by subject (STEM vs English). */

export function isEnglishSubject(subject: string): boolean {
  const s = (subject || '').trim().toLowerCase();
  return /tiếng anh|tieng anh|english|ielts|toeic|vstep/.test(s);
}

export type ExamQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY';

export type QuestionTypeOption = {
  value: ExamQuestionType;
  label: string;
  hint?: string;
};

/** STEM (Toán/Lý/Hóa…): TN + Đúng/Sai + Trả lời ngắn + Tự luận. English: TN + Tự luận. */
export function getQuestionTypesForSubject(subject: string): QuestionTypeOption[] {
  if (isEnglishSubject(subject)) {
    return [
      { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
      { value: 'ESSAY', label: 'Tự luận' },
    ];
  }
  return [
    { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm', hint: 'Phần I — chọn 1 phương án A/B/C/D' },
    { value: 'TRUE_FALSE', label: 'Đúng / Sai', hint: 'Phần II — từng ý a/b/c/d chọn Đúng hoặc Sai' },
    { value: 'SHORT_ANSWER', label: 'Trả lời ngắn', hint: 'Phần III — điền đáp án ngắn' },
    { value: 'ESSAY', label: 'Tự luận' },
  ];
}

export function getQuestionTypeBadge(type?: string): { label: string; className: string } {
  switch (type) {
    case 'ESSAY':
      return { label: 'TL', className: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' };
    case 'TRUE_FALSE':
      return { label: 'Đ/S', className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' };
    case 'SHORT_ANSWER':
      return { label: 'TN ngắn', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' };
    default:
      return { label: 'TN', className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' };
  }
}

// ─── TRUE_FALSE Scoring ─────────────────────────────────────────────────────

export type TfScoringThreshold = { wrongCount: number; ratio: number };
export type TfScoringConfig =
  | { type: 'ALL_OR_NOTHING' }
  | { type: 'PARTIAL'; thresholds: TfScoringThreshold[] };

/**
 * Trả về scoring config mặc định theo chuẩn BGDĐT (4 ý):
 *   Sai 0 ý → 100%  |  Sai 1 ý → 50%  |  Sai 2 ý → 25%  |  Sai 3 ý → 10%  |  Sai ≥4 ý → 0%
 * Với n ý bất kỳ: sai 1 = 50%, sai 2 = 25%, sai 3 = 10%, sai ≥4 = 0%.
 */
export function getDefaultTfScoringConfig(statementCount = 4): TfScoringConfig {
  if (statementCount <= 0) return { type: 'ALL_OR_NOTHING' };
  const defaultRatios: Record<number, number> = { 1: 0.5, 2: 0.25, 3: 0.1 };
  const thresholds: TfScoringThreshold[] = Array.from(
    { length: statementCount },
    (_, i) => ({
      wrongCount: i + 1,
      ratio: defaultRatios[i + 1] ?? 0,
    }),
  );
  return { type: 'PARTIAL', thresholds };
}

export function makeTrueFalseStatements(count = 4) {
  const base = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `${base}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    content: '',
    isCorrect: true,
  }));
}

/** Default A/B/C/D blank options for multiple choice (first marked correct). */
export function makeMultipleChoiceOptions(count = 4) {
  const base = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `${base}-mc-${i}-${Math.random().toString(36).slice(2, 7)}`,
    content: '',
    isCorrect: i === 0,
  }));
}

/** Ensure MC has exactly one correct option. */
export function ensureSingleCorrectOption<T extends { isCorrect: boolean }>(opts: T[]): T[] {
  if (opts.length === 0) return opts;
  const correctIndexes = opts
    .map((o, i) => (o.isCorrect ? i : -1))
    .filter((i) => i >= 0);
  if (correctIndexes.length === 1) return opts;
  const keep = correctIndexes[0] ?? 0;
  return opts.map((o, i) => ({ ...o, isCorrect: i === keep }));
}

/** @deprecated Dạng classic 2-button không còn dùng nữa. Luôn dùng multi-statement. */
export function isClassicTrueFalse(options: { content: string }[]): boolean {
  if (options.length !== 2) return false;
  const texts = options.map((o) => o.content.replace(/<[^>]+>/g, '').toLowerCase());
  return texts.every((t) => /đúng|sai|true|false/.test(t));
}

export function getStatementLabel(index: number): string {
  return String.fromCharCode(97 + index); // a, b, c, ...
}
