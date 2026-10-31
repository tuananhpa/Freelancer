import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, PartyPopper, Archive } from 'lucide-react';
import { mistakeVaultApi, MistakeVaultItem, MistakeVaultStats } from '../../services/mistakeVaultApi';
import { sounds } from '../../utils/soundEffects';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';


import PageHeader from '../../components/ui/PageHeader';
const MistakeVaultPage: React.FC = () => {
  const [stats, setStats] = useState<MistakeVaultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionItems, setSessionItems] = useState<MistakeVaultItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mistakeVaultApi.getVault();
      setStats(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startSession = () => {
    if (!stats?.dueItems.length) return;
    setSessionItems(stats.dueItems);
    setIdx(0);
    setRevealed(false);
    setSessionDone(false);
    setCorrectCount(0);
    setReviewing(true);
  };

  const current = sessionItems[idx];

  const handleRemembered = async (remembered: boolean) => {
    if (!current) return;
    if (remembered) {
      sounds.correct();
      setCorrectCount((c) => c + 1);
    } else {
      sounds.wrong();
    }
    await mistakeVaultApi.review(current.id, remembered).catch(() => {});
    if (idx < sessionItems.length - 1) {
      setIdx((i) => i + 1);
      setRevealed(false);
    } else {
      setSessionDone(true);
      setReviewing(false);
      load();
    }
  };

  if (loading) {
    return <LoadingOverlay text="Đang tải Kho lỗi sai..." />;
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-10">
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-cam font-semibold hover:underline">← Dashboard</Link>
        <PageHeader
          className="mt-2"
          icon={Archive}
          title="Kho lỗi sai"
          subtitle="Tự động gom câu sai từ bài thi & từ vựng — ôn lại theo spaced repetition."
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center !py-4">
          <p className="text-2xl font-black text-vutru">{stats?.totalItems ?? 0}</p>
          <p className="text-xs text-vutruNhat">Tổng lỗi</p>
        </div>
        <div className="card text-center !py-4 border-cam/30">
          <p className="text-2xl font-black text-camDam dark:text-cam">{stats?.dueToday ?? 0}</p>
          <p className="text-xs text-vutruNhat">Cần ôn hôm nay</p>
        </div>
        <div className="card text-center !py-4">
          <p className="text-2xl font-black text-emerald-600">{correctCount}</p>
          <p className="text-xs text-vutruNhat">Vừa nhớ</p>
        </div>
      </div>

      {!reviewing && !sessionDone && (
        <div className="card text-center py-10">
          {(stats?.dueToday ?? 0) > 0 ? (
            <>
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                <BookOpen size={28} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-vutru mb-2">Có {stats?.dueToday} mục cần ôn</h2>
              <p className="text-sm text-vutruNhat mb-6">Nhớ càng nhiều, lần ôn tiếp theo càng xa.</p>
              <Button onClick={startSession}>Bắt đầu ôn tập</Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
                <Sparkles size={28} strokeWidth={2} />
              </div>
              <h2 className="text-xl font-bold text-vutru mb-2">Không có gì cần ôn hôm nay</h2>
              <p className="text-sm text-vutruNhat">
                Làm bài thi hoặc học từ vựng — lỗi sai sẽ tự động vào đây.
              </p>
            </>
          )}
        </div>
      )}

      {reviewing && current && (
        <div className="card space-y-5">
          <div className="flex justify-between items-center text-xs font-bold text-vutruNhat">
            <span>{idx + 1} / {sessionItems.length}</span>
            <span className="px-2 py-0.5 rounded-full bg-cam/10 text-camDam dark:text-cam">
              {current.skillTag || current.itemType}
            </span>
          </div>

          {current.sourceTitle && (
            <p className="text-xs text-vutruNhat">Nguồn: {current.sourceTitle}</p>
          )}

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-night-elevated border border-gray-100 dark:border-night-border">
            <p className="text-vutru font-medium leading-relaxed">{current.content}</p>
          </div>

          {current.wrongAnswer && !revealed && (
            <p className="text-sm text-red-500 dark:text-red-400">
              Bạn đã chọn: <span className="font-semibold">{current.wrongAnswer}</span>
            </p>
          )}

          {!revealed ? (
            <Button onClick={() => setRevealed(true)} className="w-full">
              Xem đáp án đúng
            </Button>
          ) : (
            <>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Đáp án đúng</p>
                <p className="text-vutru font-semibold">{current.correctAnswer}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRemembered(false)}
                  className="btn bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-500/30"
                >
                  Chưa nhớ
                </button>
                <button
                  type="button"
                  onClick={() => handleRemembered(true)}
                  className="btn btn-chinh"
                >
                  Đã nhớ ✓
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {sessionDone && (
        <div className="card text-center py-10">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <PartyPopper size={28} strokeWidth={2} />
          </div>
          <h2 className="text-xl font-bold text-vutru mb-2">Hoàn thành phiên ôn tập!</h2>
          <p className="text-sm text-vutruNhat mb-6">
            Bạn nhớ {correctCount}/{sessionItems.length} mục.
          </p>
          <Button onClick={() => { setSessionDone(false); load(); }}>Quay lại</Button>
        </div>
      )}
    </div>
  );
};

export default MistakeVaultPage;
