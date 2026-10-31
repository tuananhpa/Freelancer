/** Điểm trung bình môn học kì theo Thông tư 22/2021: (ΣĐĐGtx + 2·ĐĐGgk + 3·ĐĐGck) / (số ĐĐGtx + 5). Hệ số chỉnh được. */
export type AssessType = 'TX' | 'GK' | 'CK';
export interface TermWeights { tx: number; gk: number; ck: number }
export const DEFAULT_WEIGHTS: TermWeights = { tx: 1, gk: 2, ck: 3 };

export const ASSESS_LABEL: Record<AssessType, string> = { TX: 'Thường xuyên (15 phút)', GK: 'Giữa kì (1 tiết)', CK: 'Cuối kì' };

/** Backend cũ chưa có assessmentType thì đoán theo tên bài */
export function inferAssessType(cw: { title: string; assessmentType?: string | null }): AssessType {
  if (cw.assessmentType === 'TX' || cw.assessmentType === 'GK' || cw.assessmentType === 'CK') return cw.assessmentType;
  const t = cw.title.toLowerCase();
  if (/giữa k[ìỳ]|giua ki|midterm/.test(t)) return 'GK';
  if (/cuối k[ìỳ]|cuoi ki|final/.test(t)) return 'CK';
  return 'TX';
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Trả null khi chưa có điểm nào. `provisional` = thiếu GK hoặc CK, điểm là tạm tính trên các cột đã có.
 */
export function termAverage(tx: number[], gk: number | null, ck: number | null, w: TermWeights = DEFAULT_WEIGHTS) {
  const sum = tx.reduce((a, b) => a + b, 0) * w.tx + (gk ?? 0) * w.gk + (ck ?? 0) * w.ck;
  const n = tx.length * w.tx + (gk != null ? w.gk : 0) + (ck != null ? w.ck : 0);
  if (!n) return null;
  return { value: r1(sum / n), provisional: gk == null || ck == null || tx.length === 0 };
}

console.assert(termAverage([8, 9, 7], 7.5, 8)?.value === 7.9, 'termAverage: đủ cột');
console.assert(termAverage([8, 9, 7], 7.5, 8)?.provisional === false, 'termAverage: đủ cột không tạm tính');
console.assert(termAverage([8], 8, null)?.provisional === true, 'termAverage: thiếu CK là tạm tính');
console.assert(termAverage([6], 6, 9, { tx: 1, gk: 1, ck: 1 })?.value === 7, 'termAverage: hệ số tùy chỉnh');
console.assert(termAverage([], null, null) === null, 'termAverage: chưa có điểm');
