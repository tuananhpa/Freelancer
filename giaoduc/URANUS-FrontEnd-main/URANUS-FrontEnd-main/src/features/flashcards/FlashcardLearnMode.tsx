import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { FlashcardDeck, Flashcard } from '../../types/flashcard';
import { getSpeakableText } from '../../utils/speech';
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowLeft,
  Volume2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

const FlashcardLearnMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);

  // Learning State
  const [learningCards, setLearningCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (id) {
      flashcardApi
        .getDeckById(id)
        .then((res) => {
          setDeck(res.data);
          setLearningCards([...(res.data.cards || [])].sort(() => 0.5 - Math.random()));
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const speakText = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(getSpeakableText(text));
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (knew: boolean) => {
    if (knew) setKnownCount((p) => p + 1);

    // Truoc day chi cap nhat state cuc bo, khong bao gio goi API nen tien do
    // hoc (Leitner box, thong ke) khong duoc luu - lam lai deck van thay
    // "Moi" nhu chua hoc bao gio.
    const currentCard = learningCards[currentIndex];
    if (currentCard?.id) {
      flashcardApi.updateProgress(currentCard.id, knew).catch(() => {});
    }

    setTimeout(() => {
      if (currentIndex < learningCards.length - 1) {
        setCurrentIndex((p) => p + 1);
        setShowAnswer(false);
      } else {
        setIsFinished(true);
      }
    }, 300);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (!showAnswer) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          setShowAnswer(true);
        }
      } else {
        if (e.key === '1') {
          e.preventDefault();
          handleAnswer(false);
        } else if (e.key === '2') {
          e.preventDefault();
          handleAnswer(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAnswer, currentIndex, learningCards, isFinished]);

  const restartSession = () => {
    setLearningCards((prev) => [...prev].sort(() => 0.5 - Math.random()));
    setCurrentIndex(0);
    setKnownCount(0);
    setShowAnswer(false);
    setIsFinished(false);
  };

  if (loading) return <LoadingOverlay text="Đang tải chế độ học..." />;
  if (!deck || learningCards.length === 0) {
    return (
      <div className="text-center py-20 text-vutruNhat dark:text-night-muted">
        Không có thẻ nào để học.
      </div>
    );
  }

  const currentCard = learningCards[currentIndex];
  const progress = isFinished ? 100 : (currentIndex / learningCards.length) * 100;

  return (
    <div className="min-h-screen bg-kem/30 dark:bg-night-page text-vutru dark:text-night-text flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-night-surface border-b border-gray-200 dark:border-night-border shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <BackButton to={`/flashcards/${id}`} size={20} />
          <div className="h-6 w-px bg-gray-200 dark:bg-night-border mx-1" />
          <div>
            <h1 className="font-heading font-bold text-base sm:text-lg text-vutru dark:text-night-text leading-tight truncate max-w-xs sm:max-w-md">
              Học: {deck.title}
            </h1>
            <p className="text-[11px] text-vutruNhat dark:text-night-muted">
              {currentIndex + 1} / {learningCards.length} thuật ngữ
            </p>
          </div>
        </div>

        <div className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
          <CheckCircle2 size={15} />
          <span>{knownCount} / {learningCards.length} Đã thuộc</span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-gray-200 dark:bg-night-border w-full">
        <div className="h-full bg-cam transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        {isFinished ? (
          <div className="w-full max-w-2xl bg-white dark:bg-night-surface rounded-3xl shadow-soft border border-gray-100 dark:border-night-border p-8 sm:p-12 flex flex-col items-center justify-center animate-scale-in text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-3xl text-vutru dark:text-night-text flex items-center justify-center mb-6 shadow-soft">
              <Trophy size={36} aria-hidden="true" />
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text mb-2">
              Bạn đã hoàn thành xuất sắc!
            </h2>
            <p className="text-vutruNhat dark:text-night-muted mb-8 text-xs sm:text-sm max-w-md">
              Bạn vừa học xong <strong className="text-cam font-bold tabular-nums">{learningCards.length}</strong> thuật ngữ. Hãy tiếp tục ôn tập để ghi nhớ lâu dài nhé!
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={restartSession}
                className="btn btn-chinh px-6 py-3 text-xs font-bold flex items-center gap-1.5 shadow-soft hover:shadow-bouncy"
              >
                <RotateCcw size={15} /> Học lại từ đầu
              </button>
              <BackButton to={`/flashcards/${id}`} label="Về bộ thẻ" variant="pill" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-white dark:bg-night-surface rounded-3xl shadow-soft border border-gray-100 dark:border-night-border p-6 sm:p-10 min-h-[420px] flex flex-col justify-between transition-all duration-300">
            {/* Term Section */}
            <div className="flex-1 flex flex-col justify-center items-center text-center my-4">
              <div className="text-[11px] font-bold text-vutruNhat dark:text-night-muted uppercase tracking-widest mb-3">
                Thuật ngữ
              </div>
              <div className="flex items-center gap-2 justify-center mb-4">
                <div className="font-heading text-2xl sm:text-4xl font-bold text-vutru dark:text-night-text">
                  {currentCard.frontContent}
                </div>
                <button
                  type="button"
                  onClick={(e) => speakText(currentCard.frontContent, e)}
                  className="p-1.5 text-vutruNhat hover:text-cam dark:hover:text-night-text hover:bg-camNhat/40 dark:hover:bg-night-elevated rounded-lg transition-colors"
                  title="Nghe phát âm"
                >
                  <Volume2 size={20} />
                </button>
              </div>

              {currentCard.imageUrl && (
                <img
                  src={currentCard.imageUrl}
                  alt="card illustration"
                  className="max-h-36 rounded-2xl object-cover border border-gray-200 dark:border-night-border mb-4"
                />
              )}
            </div>

            {/* Answer Section */}
            {!showAnswer ? (
              <div className="space-y-2">
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full btn btn-chinh py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-soft hover:shadow-bouncy"
                >
                  Xem đáp án <span className="text-xs opacity-80">(Phím Space)</span>
                </button>
              </div>
            ) : (
              <div className="animate-fade-in border-t border-gray-100 dark:border-night-border pt-6">
                <div className="text-[11px] font-bold text-vutruNhat dark:text-night-muted uppercase tracking-widest mb-2 text-center">
                  Định nghĩa
                </div>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className="font-heading text-xl sm:text-2xl font-bold text-camDam dark:text-cam text-center">
                    {currentCard.backContent}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => speakText(currentCard.backContent, e)}
                    className="p-1.5 text-vutruNhat hover:text-cam dark:hover:text-night-text hover:bg-camNhat/40 dark:hover:bg-night-elevated rounded-lg transition-colors"
                    title="Nghe định nghĩa"
                  >
                    <Volume2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAnswer(false)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 shadow-xs"
                  >
                    <XCircle size={18} />
                    <span>Vẫn đang học</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300 font-bold">1</span>
                  </button>
                  <button
                    onClick={() => handleAnswer(true)}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm transition-all hover:-translate-y-0.5 shadow-xs"
                  >
                    <CheckCircle2 size={18} />
                    <span>Đã thuộc</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold">2</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardLearnMode;
