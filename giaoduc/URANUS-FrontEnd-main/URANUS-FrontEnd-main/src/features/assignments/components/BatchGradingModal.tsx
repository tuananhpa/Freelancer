import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Loader2,
  Clock
} from 'lucide-react';
import Button from '../../../components/ui/Button';
import { aiGradingApi, BatchAiGradingStatusResponse } from '../../../services/aiGradingApi';
import { useToast } from '../../../context/ToastContext';

import Portal from '../../../components/ui/Portal';
interface Props {
  assignmentId: string;
  batchId: string;
  onClose: () => void;
  onComplete: () => void;
}

export const BatchGradingModal: React.FC<Props> = ({
  assignmentId,
  batchId,
  onClose,
  onComplete
}) => {
  const [status, setStatus] = useState<BatchAiGradingStatusResponse | null>(null);
  const [polling, setPolling] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const toast = useToast();

  const fetchStatus = async () => {
    try {
      const res = await aiGradingApi.getBatchStatus(assignmentId, batchId);
      if (res.data) {
        setStatus(res.data);
        if (res.data.isDone) {
          setPolling(false);
          onComplete();
        }
      }
    } catch (e) {
      console.error('Lỗi khi lấy tiến trình batch:', e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (polling) {
        fetchStatus();
      }
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling, batchId]);

  const handleRetryFailed = async () => {
    if (!status) return;
    const failedIds = status.items.filter((i) => i.status === 'FAILED').map((i) => i.submissionId);
    if (failedIds.length === 0) return;

    try {
      setRetrying(true);
      await aiGradingApi.batchGradeSelected(assignmentId, failedIds);
      toast.info('Đã gửi lại yêu cầu chấm cho các bài lỗi.');
      setPolling(true);
      fetchStatus();
    } catch (e) {
      toast.error('Không thể kích hoạt chấm lại bài lỗi');
    } finally {
      setRetrying(false);
    }
  };

  const total = status?.total || 1;
  const completed = status?.completed || 0;
  const percent = Math.min(100, Math.round((completed / total) * 100));

  return (
    <Portal><div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-200 dark:border-night-border p-6 max-w-lg w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-night-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cam/15 text-camDam dark:text-cam">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-vutru dark:text-night-text">Tiến Trình Chấm AI Hàng Loạt</h3>
              <p className="text-xs text-vutruNhat dark:text-night-muted">Hệ thống đang tự động đánh giá từng bài viết</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-vutruNhat hover:text-vutru p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar & Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-vutru dark:text-night-text flex items-center gap-1.5">
              {status?.isDone ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <Loader2 size={14} className="animate-spin text-cam" />
              )}
              {status?.isDone ? 'Đã hoàn tất toàn bộ' : 'Đang xử lý bài làm...'}
            </span>
            <span className="text-camDam dark:text-cam font-mono">{percent}% ({completed}/{total})</span>
          </div>

          <div className="w-full bg-gray-100 dark:bg-night-elevated rounded-full h-3 overflow-hidden p-0.5 border border-gray-200/60 dark:border-night-border">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                status?.isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-cam to-amber-500 animate-pulse'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs pt-1 text-vutruNhat dark:text-night-muted">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ {status?.successful || 0} thành công</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">⚠ {status?.failed || 0} lỗi</span>
            <span>Đang chờ: {status?.inProgress || 0}</span>
          </div>
        </div>

        {/* List of submissions */}
        <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-gray-50/70 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border text-xs">
          {status?.items.map((item) => (
            <div 
              key={item.submissionId}
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border"
            >
              <span className="font-semibold truncate max-w-[200px]">{item.studentName}</span>
              <div className="flex items-center gap-1.5">
                {item.status === 'COMPLETED' && (
                  <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded text-[10px]">
                    {item.score !== undefined ? `${item.score.toFixed(1)}đ` : 'Hoàn thành'}
                  </span>
                )}
                {item.status === 'GRADING' && (
                  <span className="text-cam font-semibold flex items-center gap-1 bg-cam/10 px-2 py-0.5 rounded text-[10px]">
                    <Loader2 size={10} className="animate-spin" /> Đang chấm
                  </span>
                )}
                {item.status === 'QUEUED' && (
                  <span className="text-gray-500 bg-gray-100 dark:bg-night-elevated px-2 py-0.5 rounded text-[10px]">
                    Chờ lượt
                  </span>
                )}
                {item.status === 'FAILED' && (
                  <span className="text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded text-[10px]" title={item.errorMessage}>
                    Lỗi chấm
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-night-border">
          {(status?.failed || 0) > 0 && status?.isDone ? (
            <button
              onClick={handleRetryFailed}
              disabled={retrying}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <RefreshCw size={13} className={retrying ? 'animate-spin' : ''} /> Thử lại bài lỗi ({status?.failed})
            </button>
          ) : <div />}

          <Button
            onClick={onClose}
            variant={status?.isDone ? 'primary' : 'secondary'}
            size="sm"
          >
            {status?.isDone ? 'Đóng & Xem Kết Quả' : 'Chạy ngầm'}
          </Button>
        </div>
      </div>
    </div></Portal>
  );
};

export default BatchGradingModal;
