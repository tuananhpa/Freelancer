import React, { useState, useMemo } from 'react';
import { Calculator, Check, Info } from 'lucide-react';
import Modal from '../ui/Modal';

export interface DistributableQuestion {
  id: string;
  points: number;
  questionType?: string;
  content?: string;
}

interface DistributePointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: DistributableQuestion[];
  onApply: (updatedPoints: { id: string; points: number }[]) => void;
  defaultTotalPoints?: number;
}

export function calculateDistributedPoints(
  totalScore: number,
  count: number,
  decimals: number = 2,
  exactSum: boolean = true
): number[] {
  if (count <= 0) return [];
  const factor = Math.pow(10, decimals);
  const basePoint = Math.floor((totalScore / count) * factor) / factor;
  const result = new Array(count).fill(basePoint);

  if (exactSum) {
    let currentSum = Math.round(result.reduce((a, b) => a + b, 0) * factor);
    let targetScaled = Math.round(totalScore * factor);
    let diff = targetScaled - currentSum;
    const step = 1 / factor;

    let i = 0;
    while (diff > 0 && i < count) {
      result[i] = Math.round((result[i] + step) * factor) / factor;
      diff--;
      i++;
    }
    while (diff < 0 && i < count) {
      result[i] = Math.round((result[i] - step) * factor) / factor;
      diff++;
      i++;
    }
  }

  return result;
}

const DistributePointsModal: React.FC<DistributePointsModalProps> = ({
  isOpen,
  onClose,
  questions,
  onApply,
  defaultTotalPoints = 10,
}) => {
  const [totalPoints, setTotalPoints] = useState<number>(() => {
    const currentSum = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    return currentSum > 0 ? currentSum : defaultTotalPoints;
  });
  const [decimals, setDecimals] = useState<number>(2);
  const [exactSum, setExactSum] = useState<boolean>(true);
  const [scope, setScope] = useState<'ALL' | 'EXCLUDE_ESSAY'>('ALL');

  // Filter questions according to scope
  const targetQuestions = useMemo(() => {
    if (scope === 'EXCLUDE_ESSAY') {
      return questions.filter((q) => q.questionType !== 'ESSAY');
    }
    return questions;
  }, [questions, scope]);

  const essayQuestions = useMemo(() => {
    return questions.filter((q) => q.questionType === 'ESSAY');
  }, [questions]);

  // Points reserved for essays if scope is EXCLUDE_ESSAY
  const essayPointsReserved = useMemo(() => {
    if (scope !== 'EXCLUDE_ESSAY') return 0;
    return essayQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
  }, [essayQuestions, scope]);

  const effectiveTotalPoints = useMemo(() => {
    if (scope === 'EXCLUDE_ESSAY') {
      return Math.max(0, totalPoints - essayPointsReserved);
    }
    return totalPoints;
  }, [totalPoints, essayPointsReserved, scope]);

  // Compute distributed points
  const distributedPointsList = useMemo(() => {
    return calculateDistributedPoints(
      effectiveTotalPoints,
      targetQuestions.length,
      decimals,
      exactSum
    );
  }, [effectiveTotalPoints, targetQuestions.length, decimals, exactSum]);

  const calculatedSum = useMemo(() => {
    const distributedSum = distributedPointsList.reduce((a, b) => a + b, 0);
    return Math.round((distributedSum + essayPointsReserved) * 1000) / 1000;
  }, [distributedPointsList, essayPointsReserved]);

  const samplePoint = distributedPointsList[0] || 0;
  const isVarying = distributedPointsList.some((p) => p !== samplePoint);

  const handleApply = () => {
    const pointMap: Record<string, number> = {};
    targetQuestions.forEach((q, idx) => {
      pointMap[q.id] = distributedPointsList[idx];
    });

    const result = questions.map((q) => ({
      id: q.id,
      points: pointMap[q.id] !== undefined ? pointMap[q.id] : q.points || 0,
    }));

    onApply(result);
    onClose();
  };

  const PRESETS = [
    { label: 'Thang 10 điểm (Chuẩn)', value: 10 },
    { label: 'Thang 100 điểm', value: 100 },
    { label: 'Thang 20 điểm', value: 20 },
    { label: 'Thang 50 điểm', value: 50 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chia đều thang điểm câu hỏi"
      maxWidth="lg"
    >
      <div className="space-y-6 text-vutru dark:text-night-text">
        {/* Header Intro */}
        <div className="flex items-start gap-3 p-3.5 bg-cam/5 dark:bg-cam/10 rounded-2xl border border-cam/20">
          <div className="p-2 bg-cam/10 rounded-xl text-cam shrink-0 mt-0.5">
            <Calculator size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-vutru dark:text-night-text">
              Tự động tính toán & phân bổ điểm
            </h4>
            <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5 leading-relaxed">
              Hệ thống sẽ chia đều tổng điểm mục tiêu cho{' '}
              <strong className="text-cam">{targetQuestions.length} câu hỏi</strong> và tự động làm tròn chuẩn xác.
            </p>
          </div>
        </div>

        {/* Target Total Score Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted flex items-center justify-between">
            <span>1. Chọn tổng điểm mong muốn</span>
            <span className="text-[11px] font-normal lowercase text-vutruNhat">
              (Hiện tại: {questions.reduce((s, q) => s + (q.points || 0), 0).toFixed(2)}đ)
            </span>
          </label>

          {/* Quick Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setTotalPoints(preset.value)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-0.5 ${
                  totalPoints === preset.value
                    ? 'border-cam bg-cam text-white shadow-soft ring-2 ring-cam/20'
                    : 'border-gray-200 dark:border-night-border bg-white dark:bg-night-surface hover:border-cam/50 text-vutru dark:text-night-text'
                }`}
              >
                <span className="text-sm font-extrabold">{preset.value} Điểm</span>
                <span className={`text-[10px] ${totalPoints === preset.value ? 'text-white/80' : 'text-vutruNhat'}`}>
                  {preset.value === 10 ? 'Phổ biến nhất' : preset.label.split(' ')[1] || ''}
                </span>
              </button>
            ))}
          </div>

          {/* Custom Input */}
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-semibold text-vutruNhat shrink-0">Hoặc tự nhập:</span>
            <div className="relative flex-1 max-w-[200px]">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={totalPoints || ''}
                onChange={(e) => setTotalPoints(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-3 pr-12 py-2 bg-white dark:bg-night-surface border border-gray-300 dark:border-night-border rounded-xl text-sm font-bold text-vutru dark:text-night-text focus:outline-none focus:border-cam focus:ring-2 focus:ring-cam/10"
                placeholder="Nhập điểm..."
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-vutruNhat">
                Điểm
              </span>
            </div>
          </div>
        </div>

        {/* Scope Options (if exam has essays) */}
        {essayQuestions.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-night-border">
            <label className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
              2. Phạm vi áp dụng
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  scope === 'ALL'
                    ? 'border-cam bg-cam/5 dark:bg-cam/10'
                    : 'border-gray-200 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'ALL'}
                  onChange={() => setScope('ALL')}
                  className="mt-0.5 text-cam focus:ring-cam"
                />
                <div>
                  <div className="text-xs font-bold">Tất cả {questions.length} câu hỏi</div>
                  <div className="text-[11px] text-vutruNhat">Bao gồm cả {essayQuestions.length} câu tự luận</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  scope === 'EXCLUDE_ESSAY'
                    ? 'border-cam bg-cam/5 dark:bg-cam/10'
                    : 'border-gray-200 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated'
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'EXCLUDE_ESSAY'}
                  onChange={() => setScope('EXCLUDE_ESSAY')}
                  className="mt-0.5 text-cam focus:ring-cam"
                />
                <div>
                  <div className="text-xs font-bold">Chỉ {targetQuestions.length} câu trắc nghiệm</div>
                  <div className="text-[11px] text-vutruNhat">
                    Giữ nguyên {essayPointsReserved.toFixed(1)}đ tự luận (còn {effectiveTotalPoints.toFixed(1)}đ trắc nghiệm)
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Rounding & Precision Options */}
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-night-border">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">
              3. Tùy chọn làm tròn điểm
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '2 chữ số (0.25đ)', val: 2, desc: 'Chuẩn Bộ GD&ĐT' },
              { label: '1 chữ số (0.5đ)', val: 1, desc: 'Làm tròn ngắn gọn' },
              { label: '3 chữ số (0.125đ)', val: 3, desc: 'Độ chi tiết cao' },
              { label: 'Số nguyên (1đ, 2đ)', val: 0, desc: 'Điểm chẵn' },
            ].map((r) => (
              <button
                key={r.val}
                type="button"
                onClick={() => setDecimals(r.val)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  decimals === r.val
                    ? 'border-cam bg-cam/10 dark:bg-cam/15 text-cam font-bold'
                    : 'border-gray-200 dark:border-night-border hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text font-medium'
                }`}
              >
                <div className="text-xs">{r.label}</div>
                <div className="text-[10px] text-vutruNhat font-normal mt-0.5">{r.desc}</div>
              </button>
            ))}
          </div>

          {/* Exact Sum Checkbox */}
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={exactSum}
              onChange={(e) => setExactSum(e.target.checked)}
              className="w-4 h-4 text-cam rounded border-gray-300 focus:ring-cam"
            />
            <span className="text-xs text-vutru dark:text-night-text font-medium">
              Tự động bù số dư thập phân để <strong>tổng điểm đạt chính xác 100% bằng {totalPoints} điểm</strong>
            </span>
          </label>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="p-4 bg-gray-50 dark:bg-night-elevated rounded-2xl border border-gray-200 dark:border-night-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-vutruNhat">Kết quả tính toán:</span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                Math.abs(calculatedSum - totalPoints) < 0.01
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
              }`}
            >
              Tổng sau khi chia: {calculatedSum} / {totalPoints} điểm
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white dark:bg-night-surface rounded-xl border border-gray-100 dark:border-night-border">
            <div className="space-y-0.5">
              <div className="text-xs text-vutruNhat">Điểm mỗi câu hỏi:</div>
              <div className="font-heading text-lg font-bold text-cam">
                {isVarying ? (
                  <span>
                    ~{samplePoint}đ - {distributedPointsList[distributedPointsList.length - 1]}đ
                  </span>
                ) : (
                  <span>{samplePoint} điểm / câu</span>
                )}
              </div>
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-xs text-vutruNhat">Số câu áp dụng:</div>
              <div className="font-heading text-lg font-bold text-vutru dark:text-night-text">
                {targetQuestions.length} câu hỏi
              </div>
            </div>
          </div>

          {/* Detail breakdown info */}
          {targetQuestions.length > 0 && (
            <div className="text-xs text-vutruNhat flex items-center gap-1.5">
              <Info size={14} className="shrink-0 text-blue-500" />
              <span>
                {isVarying ? (
                  <>
                    Phân bổ: {distributedPointsList.filter((p) => p === samplePoint).length} câu {samplePoint}đ +{' '}
                    {distributedPointsList.filter((p) => p !== samplePoint).length} câu{' '}
                    {distributedPointsList.find((p) => p !== samplePoint)}đ = {calculatedSum}đ
                  </>
                ) : (
                  <>
                    Công thức: {targetQuestions.length} câu × {samplePoint} điểm = {calculatedSum} điểm
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-night-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-vutruNhat hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={targetQuestions.length === 0}
            onClick={handleApply}
            className="px-6 py-2.5 bg-cam text-white text-xs font-bold rounded-xl shadow-soft hover:bg-camDam hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            <span>Áp dụng chia điểm ngay</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DistributePointsModal;
