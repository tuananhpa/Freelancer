import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { FlashcardDeck, Flashcard } from '../../types/flashcard';
import { Trophy, ChevronLeft, ArrowLeft, RotateCcw, Flame, Sparkles } from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

interface Tile {
  id: string; // unique for each tile (e.g., cardId-term, cardId-def)
  cardId: string;
  content: string;
  type: 'TERM' | 'DEF';
  isMatched: boolean;
}

const FlashcardMatchGame: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<Tile[]>([]);
  const [errorTiles, setErrorTiles] = useState<string[]>([]);

  // Timer state
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (id) {
      flashcardApi
        .getDeckById(id)
        .then((res) => {
          setDeck(res.data);
          const savedBest = localStorage.getItem(`flashcard-match-best-${id}`);
          if (savedBest) setBestTime(parseFloat(savedBest));
        })
        .catch(() => {
          error('Không tải được trò chơi');
          navigate(`/flashcards/${id}`);
        })
        .finally(() => setLoading(false));
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id, navigate, error]);

  const initGame = () => {
    if (!deck || !deck.cards || deck.cards.length < 2) {
      error('Bộ thẻ cần ít nhất 2 thẻ để chơi ghép thẻ.');
      return;
    }

    // Pick up to 6 random cards for a game
    const shuffledCards = [...deck.cards].sort(() => 0.5 - Math.random());
    const selectedCards = shuffledCards.slice(0, 6);

    const newTiles: Tile[] = [];
    selectedCards.forEach((card) => {
      newTiles.push({
        id: `${card.id}-term`,
        cardId: card.id || '',
        content: card.frontContent || '',
        type: 'TERM',
        isMatched: false,
      });
      newTiles.push({
        id: `${card.id}-def`,
        cardId: card.id || '',
        content: card.backContent || '',
        type: 'DEF',
        isMatched: false,
      });
    });

    // Shuffle tiles
    setTiles(newTiles.sort(() => 0.5 - Math.random()));
    setSelectedTiles([]);
    setErrorTiles([]);
    setTime(0);
    setIsActive(false);
    setIsFinished(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (deck && !isFinished && tiles.length === 0) {
      initGame();
    }
  }, [deck]);

  useEffect(() => {
    if (isActive && !isFinished) {
      timerRef.current = setInterval(() => {
        setTime((t) => +(t + 0.1).toFixed(1));
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isFinished]);

  const handleTileClick = (tile: Tile) => {
    if (isFinished || tile.isMatched || selectedTiles.find((t) => t.id === tile.id) || selectedTiles.length >= 2) return;

    if (!isActive) setIsActive(true); // Start timer on first click

    const newSelected = [...selectedTiles, tile];
    setSelectedTiles(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (first.cardId === second.cardId && first.type !== second.type) {
        // Match!
        setTimeout(() => {
          setTiles((prev) => prev.map((t) => (t.cardId === first.cardId ? { ...t, isMatched: true } : t)));
          setSelectedTiles([]);

          // Check win condition
          setTiles((currentTiles) => {
            const allMatched = currentTiles
              .map((t) => (t.cardId === first.cardId ? { ...t, isMatched: true } : t))
              .every((t) => t.isMatched);
            if (allMatched) {
              setIsFinished(true);
              setIsActive(false);

              // Handle best time
              if (id) {
                const currentBest = localStorage.getItem(`flashcard-match-best-${id}`);
                if (!currentBest || time < parseFloat(currentBest)) {
                  localStorage.setItem(`flashcard-match-best-${id}`, time.toString());
                  setBestTime(time);
                }
              }
            }
            return currentTiles;
          });
        }, 300);
      } else {
        // Mismatch
        setErrorTiles([first.id, second.id]);
        setTimeout(() => {
          setErrorTiles([]);
          setSelectedTiles([]);
        }, 600);
      }
    }
  };

  if (loading) return <LoadingOverlay text="Đang tải trò chơi ghép thẻ..." />;
  if (!deck || !deck.cards || deck.cards.length < 2) {
    return (
      <div className="text-center py-20 text-vutruNhat dark:text-night-muted">
        <p className="text-red-500 mb-4 font-bold">Bộ thẻ cần ít nhất 2 thẻ để chơi ghép thẻ.</p>
        <button onClick={() => navigate(`/flashcards/${id}`)} className="text-cam hover:underline font-bold text-sm">
          Quay lại bộ thẻ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kem/30 dark:bg-night-page text-vutru dark:text-night-text flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-night-surface border-b border-gray-200 dark:border-night-border shadow-xs shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <BackButton to={`/flashcards/${id}`} size={20} />
          <div className="h-6 w-px bg-gray-200 dark:bg-night-border mx-1" />
          <div>
            <h1 className="font-heading font-bold text-base sm:text-lg text-vutru dark:text-night-text leading-tight truncate max-w-xs sm:max-w-md flex items-center gap-1.5">
              <Flame size={18} className="text-cam shrink-0" /> Ghép thẻ: {deck.title}
            </h1>
            <p className="text-[11px] text-vutruNhat dark:text-night-muted font-bold">
              Chạm để nối các cặp thuật ngữ và định nghĩa tương ứng
            </p>
          </div>
        </div>

        <div className="text-right flex items-center gap-3">
          {bestTime !== null && (
            <div className="hidden sm:block text-right">
              <div className="text-[10px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted">Kỷ lục</div>
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{bestTime.toFixed(1)}s</div>
            </div>
          )}
          <div className="px-3.5 py-1.5 rounded-2xl bg-camNhat/50 dark:bg-cam/20 border border-cam/30">
            <div className="text-[10px] font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted leading-tight">Thời gian</div>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-camDam dark:text-cam leading-tight">{time.toFixed(1)}s</div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col py-6 sm:py-8 px-4">
        {/* Game Board */}
        {isFinished ? (
          <div className="bg-white dark:bg-night-surface rounded-3xl p-8 sm:p-12 text-center shadow-soft border border-gray-100 dark:border-night-border animate-scale-in flex-1 flex flex-col items-center justify-center my-auto">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gray-100 dark:bg-night-elevated rounded-3xl text-vutru dark:text-night-text border border-gray-200 dark:border-night-border flex items-center justify-center shadow-soft animate-bounce">
                <Trophy size={36} aria-hidden="true" />
              </div>
            </div>
            <h3 className="font-heading text-2xl sm:text-4xl font-bold text-vutru dark:text-night-text mb-3">
              Tuyệt vời! Bạn đã hoàn thành!
            </h3>
            <p className="text-sm sm:text-base text-vutruNhat dark:text-night-muted mb-8">
              Thời gian hoàn thành:{' '}
              <strong className="font-heading text-cam font-extrabold text-2xl sm:text-3xl tabular-nums">{time.toFixed(1)}s</strong>
              {bestTime !== null && time <= bestTime && (
                <span className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center gap-1.5">
                  <Flame size={14} className="text-amber-500" aria-hidden="true" />
                  <span>Đây là kỷ lục mới của bạn!</span>
                </span>
              )}
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={initGame}
                className="btn btn-chinh px-6 py-3 text-xs font-bold flex items-center gap-1.5 shadow-soft hover:shadow-bouncy"
              >
                <RotateCcw size={15} /> Chơi lại ván mới
              </button>
              <BackButton to={`/flashcards/${id}`} label="Về bộ thẻ" variant="pill" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 content-start">
            {tiles.map((tile) => {
              const isSelected = selectedTiles.some((t) => t.id === tile.id);
              const isError = errorTiles.includes(tile.id);

              return (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile)}
                  className={`
                    p-5 rounded-2xl cursor-pointer min-h-[130px] sm:min-h-[150px] flex items-center justify-center text-center transition-all duration-200 select-none
                    ${tile.isMatched ? 'opacity-0 scale-95 pointer-events-none' : 'bg-white dark:bg-night-surface shadow-soft hover:shadow-cam border border-gray-200 dark:border-night-border hover:border-cam/50'}
                    ${isSelected && !isError ? 'ring-2 ring-cam bg-camNhat/40 dark:bg-cam/20 border-cam transform scale-[1.02] shadow-soft font-bold' : ''}
                    ${isError ? 'bg-red-50 dark:bg-red-950/30 border-red-400 ring-2 ring-red-400 animate-shake' : ''}
                  `}
                >
                  <span
                    className={`font-semibold leading-snug break-words ${
                      tile.type === 'TERM'
                        ? 'text-vutru dark:text-night-text text-base sm:text-lg font-heading'
                        : 'text-vutruNhat dark:text-slate-300 text-xs sm:text-sm'
                    }`}
                  >
                    {tile.content}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default FlashcardMatchGame;
