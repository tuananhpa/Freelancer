import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { Flashcard, FlashcardDeck } from '../../types/flashcard';
import { ChevronLeft, ChevronRight, Settings, Shuffle, Play, Pause, Maximize, ArrowLeft } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import CardFlip from './CardFlip';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

const FlashcardStudyMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ratingBusy, setRatingBusy] = useState(false);

  const flipRef = useRef<() => void>();
  const autoPlayTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (id) fetchDeck();
  }, [id]);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        flipRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, cards, currentIndex]);

  const fetchDeck = async () => {
    try {
      setLoading(true);
      const res = await flashcardApi.getDeckById(id!);
      setDeck(res.data);
      setCards(res.data.cards || []);
    } catch (err) {
      error('Không thể tải bộ thẻ');
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleCardFeedback = async (knew: boolean) => {
    const card = cards[currentIndex];
    if (!card?.id || ratingBusy) return;

    try {
      setRatingBusy(true);
      await flashcardApi.updateProgress(card.id, knew).catch(() => {});

      if (!knew) {
        // Put the card back near the end so it comes up again this session.
        const wasLast = currentIndex >= cards.length - 1;
        setCards((prev) => {
          const next = [...prev];
          const [item] = next.splice(currentIndex, 1);
          next.push(item);
          return next;
        });
        if (wasLast) setCurrentIndex(0);
      } else if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } finally {
      setRatingBusy(false);
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    if (!isShuffled && deck?.cards) {
      const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
      setCards(shuffled);
    } else if (deck?.cards) {
      setCards(deck.cards);
    }
    setCurrentIndex(0);
  };

  useEffect(() => {
    if (!isAutoPlay || cards.length === 0) return;

    let timer1: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;

    timer1 = setTimeout(() => {
      flipRef.current?.(); // Lật sang mặt sau
      timer2 = setTimeout(() => {
        if (currentIndex < cards.length - 1) {
          handleNext(); // Chuyển thẻ tiếp theo
        } else {
          setIsAutoPlay(false); // Dừng lại khi hết thẻ
        }
      }, 2000); // 2s ở mặt sau
    }, 2000); // 2s ở mặt trước

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAutoPlay, currentIndex, cards.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading || !deck) return <LoadingOverlay text="Đang tải thẻ ghi nhớ..." />;

  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  return (
    <div className={`flex flex-col h-screen max-h-screen bg-kem/30 dark:bg-night-page text-vutru dark:text-night-text ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-night-surface border-b border-gray-200 dark:border-night-border shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <BackButton to={`/flashcards/${id}`} size={20} />
          <div className="h-6 w-px bg-gray-200 dark:bg-night-border mx-1" />
          <div>
            <h1 className="font-heading font-bold text-base sm:text-lg text-vutru dark:text-night-text leading-tight truncate max-w-xs sm:max-w-md">
              {deck.title}
            </h1>
            <p className="text-[11px] text-vutruNhat dark:text-night-muted font-bold">
              Thẻ {currentIndex + 1} / {cards.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
              isShuffled
                ? 'bg-camNhat/60 text-camDam dark:bg-cam/25 dark:text-cam shadow-xs'
                : 'hover:bg-gray-100 dark:hover:bg-night-elevated text-vutruNhat dark:text-night-muted'
            }`}
            title={isShuffled ? 'Đang bật trộn thẻ' : 'Trộn thẻ'}
          >
            <Shuffle size={18} />
          </button>
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
              isAutoPlay
                ? 'bg-camNhat/60 text-camDam dark:bg-cam/25 dark:text-cam shadow-xs'
                : 'hover:bg-gray-100 dark:hover:bg-night-elevated text-vutruNhat dark:text-night-muted'
            }`}
            title={isAutoPlay ? 'Tạm dừng tự động lật' : 'Tự động lật thẻ'}
          >
            {isAutoPlay ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 dark:hover:bg-night-elevated rounded-xl text-vutruNhat dark:text-night-muted transition-colors"
            title="Toàn màn hình"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-night-border w-full">
        <div className="h-full bg-cam transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Main Study Area */}
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4 md:p-8">
        {currentCard ? (
          <div className="w-full h-full max-w-5xl flex items-center justify-center transform transition-transform">
            <CardFlip
              key={currentCard.id} // Quan trọng: Đảm bảo reset trạng thái lật khi sang thẻ mới
              frontContent={currentCard.frontContent}
              backContent={currentCard.backContent}
              imageUrl={currentCard.imageUrl}
              flipRef={flipRef}
              onKnow={() => {
                void handleCardFeedback(true);
              }}
              onReview={() => {
                void handleCardFeedback(false);
              }}
              className="w-full max-w-full h-[60vh] min-h-[400px]"
            />
          </div>
        ) : (
          <div className="text-center text-vutruNhat dark:text-night-muted">Bộ thẻ trống</div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="p-4 sm:p-5 bg-white dark:bg-night-surface flex justify-center gap-6 sm:gap-8 items-center border-t border-gray-200 dark:border-night-border shrink-0">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3.5 rounded-2xl bg-gray-100 dark:bg-night-elevated hover:bg-gray-200 dark:hover:bg-night-border disabled:opacity-40 text-vutru dark:text-night-text transition-colors shadow-xs"
          title="Thẻ trước (←)"
          aria-label="Thẻ trước"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>

        <div className="text-xs font-semibold text-vutruNhat dark:text-night-muted text-center hidden sm:flex items-center gap-1.5">
          <span>Phím <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded font-mono text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded font-mono text-[10px]">→</kbd> chuyển thẻ · <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded font-mono text-[10px]">Space</kbd> để lật thẻ</span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="p-3.5 rounded-2xl bg-gray-100 dark:bg-night-elevated hover:bg-gray-200 dark:hover:bg-night-border disabled:opacity-40 text-vutru dark:text-night-text transition-colors shadow-xs"
          title="Thẻ tiếp theo (→)"
          aria-label="Thẻ tiếp theo"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default FlashcardStudyMode;
