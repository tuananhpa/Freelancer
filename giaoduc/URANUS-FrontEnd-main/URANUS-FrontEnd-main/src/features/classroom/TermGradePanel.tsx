import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Calculator, Download } from 'lucide-react';
import type { GradebookResponse } from '../../services/class.service';
import { useToast } from '../../context/ToastContext';
import { formatScore } from '../../utils/formatUtils';
import { ASSESS_LABEL, DEFAULT_WEIGHTS, inferAssessType, termAverage, type AssessType, type TermWeights } from '../../utils/termGrade';

const WEIGHT_KEY = 'ds-term-weights';
const readWeights = (): TermWeights => {
  try { return { ...DEFAULT_WEIGHTS, ...JSON.parse(localStorage.getItem(WEIGHT_KEY) || '{}') }; } catch { return DEFAULT_WEIGHTS; }
};
const TONE: Record<AssessType, string> = { TX: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300', GK: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300', CK: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' };

/** Bảng điểm học kì: gom điểm bài kiểm tra 15 phút / 1 tiết / cuối kì theo hệ số và tính TB môn. */
export default function TermGradePanel({ gradebook, className }: { gradebook: GradebookResponse; className: string }) {
  const toast = useToast();
  const [w, setW] = useState<TermWeights>(readWeights);

  const cols = useMemo(() => gradebook.classworks.map((cw) => ({ ...cw, kind: inferAssessType(cw as { title: string; assessmentType?: string }) })), [gradebook]);
  const rows = useMemo(() => gradebook.students.map((s) => {
    const ten = (id: string, max: number) => { const g = s.grades[id]; return g?.status === 'GRADED' && g.score != null ? (g.score / (max || 10)) * 10 : null; };
    const tx = cols.filter((c) => c.kind === 'TX').map((c) => ten(c.id, c.maxScore)).filter((x): x is number => x != null);
    const pick = (k: AssessType) => { const v = cols.filter((c) => c.kind === k).map((c) => ten(c.id, c.maxScore)).filter((x): x is number => x != null); return v.length ? v[v.length - 1] : null; };
    const gk = pick('GK'), ck = pick('CK');
    return { s, tx, gk, ck, avg: termAverage(tx, gk, ck, w) };
  }), [gradebook, cols, w]);

  const setWeight = (k: keyof TermWeights, v: number) => {
    const next = { ...w, [k]: Math.max(0, Math.min(5, v || 0)) };
    setW(next);
    try { localStorage.setItem(WEIGHT_KEY, JSON.stringify(next)); } catch { /* chỉ là tiện ích nhớ lựa chọn */ }
  };

  const counts = (['TX', 'GK', 'CK'] as AssessType[]).map((k) => [k, cols.filter((c) => c.kind === k).length] as const);

  const exportExcel = () => {
    const data = rows.map(({ s, tx, gk, ck, avg }, i) => ({
      STT: i + 1, 'Họ và tên': s.studentName,
      'Điểm thường xuyên': tx.map((x) => formatScore(x)).join('; '),
      'Giữa kì': gk != null ? formatScore(gk) : '', 'Cuối kì': ck != null ? formatScore(ck) : '',
      'TB môn học kì': avg ? avg.value : '', 'Ghi chú': avg?.provisional ? 'Tạm tính' : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 22 }, { wch: 9 }, { wch: 9 }, { wch: 13 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Điểm học kì');
    XLSX.writeFile(wb, `Diem_hoc_ki_${className.replace(/\s+/g, '_')}.xlsx`);
    toast.success('Đã xuất bảng điểm học kì');
  };

  return (
    <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-100 dark:border-night-border">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white"><Calculator size={20} /></span>
          <div>
            <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text">Điểm học kì tự tổng hợp</h3>
            <p className="text-xs text-vutruNhat">Bài kiểm tra học sinh nộp được chấm và ghi vào đây ngay. TB = (ΣTX×{w.tx} + GK×{w.gk} + CK×{w.ck}) / (số TX×{w.tx} + {w.gk + w.ck})</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['tx', 'gk', 'ck'] as const).map((k) => (
            <label key={k} className="flex items-center gap-1.5 rounded-xl bg-kem/70 dark:bg-night-elevated px-2.5 py-1.5 text-xs font-semibold text-vutru">
              Hệ số {k.toUpperCase()}
              <input type="number" min={0} max={5} value={w[k]} onChange={(e) => setWeight(k, Number(e.target.value))} className="w-11 rounded-lg border border-gray-200 bg-white px-1.5 py-0.5 text-center" aria-label={`Hệ số ${k.toUpperCase()}`} />
            </label>
          ))}
          <button type="button" onClick={exportExcel} className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5">
            <Download size={14} /> Xuất Excel học kì
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 px-4 sm:px-5 pt-3 text-[11px] font-semibold">
        {counts.map(([k, n]) => <span key={k} className={`rounded-full px-2.5 py-1 ${TONE[k]}`}>{ASSESS_LABEL[k]}: {n} bài</span>)}
      </div>
      <div className="overflow-x-auto custom-scrollbar p-2 sm:p-3">
        <table className="w-full text-left text-xs border-collapse min-w-[640px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-vutruNhat">
              <th className="px-3 py-2">Học sinh</th>
              <th className="px-3 py-2">Thường xuyên</th>
              <th className="px-3 py-2 text-center">Giữa kì</th>
              <th className="px-3 py-2 text-center">Cuối kì</th>
              <th className="px-3 py-2 text-center">TB học kì</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-night-border/70">
            {rows.map(({ s, tx, gk, ck, avg }) => (
              <tr key={s.studentId} className="hover:bg-kem/50 dark:hover:bg-night-elevated/50">
                <td className="px-3 py-2 font-semibold text-vutru dark:text-night-text whitespace-nowrap">{s.studentName}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">{tx.length ? tx.map((x, i) => <span key={i} className="rounded-md bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 font-semibold text-sky-700 dark:text-sky-300 tabular-nums">{formatScore(x)}</span>) : <span className="text-vutruNhat">—</span>}</div>
                </td>
                <td className="px-3 py-2 text-center font-semibold tabular-nums">{gk != null ? formatScore(gk) : <span className="text-vutruNhat">—</span>}</td>
                <td className="px-3 py-2 text-center font-semibold tabular-nums">{ck != null ? formatScore(ck) : <span className="text-vutruNhat">—</span>}</td>
                <td className="px-3 py-2 text-center">
                  {avg ? (
                    <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-heading text-sm font-bold tabular-nums ${avg.value >= 8 ? 'text-emerald-600' : avg.value >= 6.5 ? 'text-cam' : avg.value >= 5 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {avg.value.toFixed(1).replace('.', ',')}
                      {avg.provisional && <span className="rounded bg-amber-100 dark:bg-amber-500/15 px-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300" title="Chưa đủ điểm giữa kì/cuối kì">tạm</span>}
                    </span>
                  ) : <span className="text-vutruNhat">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
