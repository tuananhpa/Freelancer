import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import BackButton from '../../components/ui/BackButton';
import { flashcardApi } from '../../services/flashcardApi';
import { getSpeakableText } from '../../utils/speech';
import { Flashcard, FlashcardDeck } from '../../types/flashcard';
import { Bookmark, Lightbulb, X, Check, ArrowLeft, Shuffle, RotateCcw, BookText, Volume2, Trophy, ThumbsUp, Dumbbell, PartyPopper } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { mistakeVaultApi } from '../../services/mistakeVaultApi';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import './VocabStudy.css';

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Mask the target word in example sentence with asterisks */
function maskWord(example: string, word: string): string {
  if (!example || !word) return example || '';
  const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return example.replace(regex, '*'.repeat(word.length));
}

const VocabStudy: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Deck & cards
  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [isPromptingAccessCode, setIsPromptingAccessCode] = useState(false);
  const [accessError, setAccessError] = useState('');

  // Study state
  const [answer, setAnswer] = useState('');
  const [hintCount, setHintCount] = useState(0);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | 'reveal' | null>(null);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // Animation
  const [cardAnim, setCardAnim] = useState('vocab-card-enter');
  const [shakeAnim, setShakeAnim] = useState('');
  const [glowAnim, setGlowAnim] = useState('');
  const [hintPulse, setHintPulse] = useState('');

  // Favorite
  const [isFavorited, setIsFavorited] = useState(false);
  const [bookmarkAnim, setBookmarkAnim] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Load deck ────────────────────────────────
  const loadDeck = useCallback(async (code?: string) => {
    if (!id) return;
    setLoading(true);
    setAccessError('');
    try {
      const [res, favRes] = await Promise.all([
        flashcardApi.getDeckById(id, code),
        flashcardApi.isFavorited(id).catch(() => null)
      ]);
      const deckCards = res.data.cards || [];
      setDeck(res.data);
      setIsPromptingAccessCode(false);
      setCards(shuffleOn ? shuffleArray(deckCards) : deckCards);
      setCurrentIndex(0);
      resetStudyState();

      if (favRes?.data?.favorited !== undefined) {
        setIsFavorited(favRes.data.favorited);
      }
    } catch (err: any) {
      if (err.response?.data?.errorCode === 'ACCESS_CODE_REQUIRED' || err.response?.data?.errorCode === 'INVALID_ACCESS_CODE') {
        setIsPromptingAccessCode(true);
        if (code) {
          setAccessError('Mã truy cập không chính xác. Vui lòng thử lại.');
        }
      } else {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [id, shuffleOn]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const resetStudyState = () => {
    setAnswer('');
    setHintCount(0);
    setShowResult(null);
    setFinished(false);
    setCorrectCount(0);
    setWrongCount(0);
    setCardAnim('vocab-card-enter');
    setShakeAnim('');
    setGlowAnim('');
  };

  const speak = (text: string, accent: 'US' | 'UK') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(getSpeakableText(text));
    const voices = window.speechSynthesis.getVoices();
    const lang = accent === 'US' ? 'en-US' : 'en-GB';
    const voice = voices.find((v) => v.lang === lang || v.lang.includes(lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };

  const currentCard = cards[currentIndex];
  const correctAnswer = currentCard?.frontContent || '';

  // ─── Hint: reveal letters one at a time ───────
  const getHintText = useCallback(() => {
    if (!correctAnswer) return '';
    const revealed = correctAnswer.slice(0, hintCount);
    const remaining = correctAnswer.length - hintCount;
    return revealed + '*'.repeat(Math.max(0, remaining));
  }, [correctAnswer, hintCount]);

  const handleHint = () => {
    if (hintCount < correctAnswer.length) {
      setHintCount((c) => c + 1);
      setHintPulse('vocab-hint-pulse');
      setTimeout(() => setHintPulse(''), 350);
    }
  };

  // ─── Check answer ─────────────────────────────
  const handleCheck = async () => {
    if (!answer.trim() || showResult) return;

    const isCorrect = answer.trim().toLowerCase() === correctAnswer.toLowerCase();

    if (isCorrect) {
      setShowResult('correct');
      setCorrectCount((c) => c + 1);
      setGlowAnim('vocab-glow');
      sounds.correct();

      if (currentCard?.id) {
        try { await flashcardApi.updateProgress(currentCard.id, true); } catch { /* */ }
      }

      // Auto advance after delay
      setTimeout(() => goNext(), 1500);
    } else {
      setShowResult('wrong');
      setShakeAnim('vocab-shake');
      sounds.wrong();
      setTimeout(() => setShakeAnim(''), 500);

      // Let them try again after seeing the error
      setTimeout(() => {
        setShowResult(null);
        setAnswer('');
        inputRef.current?.focus();
      }, 1200);
    }
  };

  // ─── Don't know (reveal) ──────────────────────
  const handleDontKnow = async () => {
    if (showResult === 'correct') return;
    setShowResult('reveal');
    setWrongCount((c) => c + 1);
    sounds.wrong();

    if (currentCard?.id) {
      try { await flashcardApi.updateProgress(currentCard.id, false); } catch { /* */ }
      try {
        await mistakeVaultApi.addVocabMistake({
          flashcardId: currentCard.id,
          frontContent: currentCard.frontContent,
          backContent: currentCard.backContent || correctAnswer,
          sourceTitle: deck?.title,
        });
      } catch { /* */ }
    }

    // Auto advance after showing the answer
    setTimeout(() => goNext(), 2500);
  };

  // ─── Go to next card ──────────────────────────
  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setCardAnim('vocab-card-exit');
      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setAnswer('');
        setHintCount(0);
        setShowResult(null);
        setShakeAnim('');
        setGlowAnim('');
        setCardAnim('vocab-card-enter');
        inputRef.current?.focus();
      }, 300);
    } else {
      setFinished(true);
    }
  };

  // ─── Restart ──────────────────────────────────
  const handleRestart = () => {
    if (deck?.cards) {
      setCards(shuffleOn ? shuffleArray(deck.cards) : deck.cards);
      setCurrentIndex(0);
      resetStudyState();
    }
  };

  const handleShuffleToggle = () => {
    const next = !shuffleOn;
    setShuffleOn(next);
    if (deck?.cards) {
      setCards(next ? shuffleArray(deck.cards) : deck.cards);
      setCurrentIndex(0);
      resetStudyState();
    }
  };

  // ─── Favorite toggle ─────────────────────────
  const handleFavorite = async () => {
    if (!id) return;
    try {
      const res = await flashcardApi.toggleFavorite(id);
      setIsFavorited(res.data.favorited);
      setBookmarkAnim('vocab-bookmark-beat');
      setTimeout(() => setBookmarkAnim(''), 400);
    } catch { /* */ }
  };

  // ─── Key handler ──────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !showResult) {
      handleCheck();
    }
  };

  // ─── Loading ──────────────────────────────────
  if (loading) {
    return (
      <LoadingOverlay text="Đang tải bộ từ vựng..." />
    );
  }

  // ─── Empty / Not found ────────────────────────
  if (!deck || cards.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="flex justify-center mb-4"><BookText size={48} className="text-camDam" /></div>
        <p className="text-gray-500 mb-4">Không tìm thấy bộ từ vựng hoặc bộ thẻ trống.</p>
        <Link to="/vocabulary" className="btn btn-chinh">Quay lại danh sách</Link>
      </div>
    );
  }

  if (!deck && !isPromptingAccessCode) return null;

  if (isPromptingAccessCode) {
    return (
      <div className="max-w-md mx-auto p-6 mt-20 bg-white dark:bg-night-surface rounded-2xl shadow-sm border border-gray-100 dark:border-night-border text-center">
        <div className="w-16 h-16 bg-cam/10 text-cam rounded-full flex items-center justify-center mx-auto mb-4">
          <BookText size={32} />
        </div>
        <h2 className="text-xl font-bold text-vutru mb-2">Bộ từ vựng được bảo vệ</h2>
        <p className="text-vutruNhat text-sm mb-6">Bạn cần nhập mã truy cập để xem nội dung này.</p>
        <form onSubmit={(e) => { e.preventDefault(); loadDeck(accessCode); }} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nhập mã truy cập..."
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-night-border focus:border-cam outline-none text-center font-bold tracking-widest bg-gray-50 dark:bg-night-elevated"
              autoFocus
            />
            {accessError && <p className="text-red-500 text-xs mt-2 text-left">{accessError}</p>}
          </div>
          <button type="submit" disabled={!accessCode.trim()} className="btn btn-chinh w-full py-3 justify-center text-sm">
            Xác nhận
          </button>
        </form>
        <div className="mt-4 flex justify-center">
          <BackButton fallbackUrl="/vocab" label="Quay lại danh sách" variant="ghost" />
        </div>
      </div>
    );
  }

  if (!deck) return null;

  // ─── Finished ─────────────────────────────────
  if (finished) {
    const total = correctCount + wrongCount;
    const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    return (
      <div className="max-w-lg mx-auto text-center animate-fade-in">
        <div className="card !p-10">
          <div className="text-6xl mb-4 vocab-confetti">
            {percent >= 80 ? <Trophy size={64} className="mx-auto text-yellow-500" /> : percent >= 50 ? <ThumbsUp size={64} className="mx-auto text-camDam" /> : <Dumbbell size={64} className="mx-auto text-vutruNhat" />}
          </div>
          <h2 className="text-3xl font-bold text-vutru mb-2 font-heading">Hoàn thành!</h2>
          <p className="text-vutruNhat mb-8">
            Bạn đã học xong <strong>{cards.length}</strong> từ vựng trong bộ <strong className="text-camDam">{deck.title}</strong>
          </p>

          {/* Score ring */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={percent >= 80 ? '#22c55e' : percent >= 50 ? 'rgb(var(--accent-secondary))' : 'rgb(var(--accent))'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                strokeDashoffset={`${2 * Math.PI * 52 * (1 - percent / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-vutru vocab-count-up">{percent}%</span>
            </div>
          </div>

          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Check size={18} className="text-green-500" />
                <p className="text-2xl font-bold text-green-600 vocab-count-up">{correctCount}</p>
              </div>
              <p className="text-xs text-vutruNhat mt-1">Đúng</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <X size={18} className="text-red-400" />
                <p className="text-2xl font-bold text-red-500 vocab-count-up">{wrongCount}</p>
              </div>
              <p className="text-xs text-vutruNhat mt-1">Cần ôn lại</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleRestart} className="btn btn-chinh gap-2">
              <RotateCcw size={18} /> Học lại
            </button>
            <Link to="/vocabulary" className="btn btn-vien gap-2">
              <BookText size={18} /> Về danh sách
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Study Card ───────────────────────────────
  const progress = (currentIndex / cards.length) * 100;
  const maskedExample = currentCard.example
    ? maskWord(currentCard.example, correctAnswer)
    : null;

  return (
    <div className="min-h-screen bg-kem dark:bg-night-page animate-fade-in pb-10 w-full overflow-y-auto -mx-3 sm:-mx-6 -my-4 sm:-my-6 sm:w-[calc(100%+3rem)] w-[calc(100%+1.5rem)]">
      <main className="mx-auto p-4 sm:p-6 pb-20 w-full max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/vocab" />
            <div>
              <h1 className="text-3xl font-extrabold text-vutru font-heading leading-tight">{deck.title}</h1>
              <p className="text-sm text-vutruNhat mt-1">Học từ vựng</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleFavorite}
              className={`p-2.5 rounded-xl transition-all ${isFavorited ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-night-border border border-gray-200 dark:border-night-border bg-white'} ${bookmarkAnim}`}
              title="Lưu từ vựng"
            >
              <Bookmark size={20} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={handleShuffleToggle}
              className={`p-2.5 rounded-xl transition-all ${shuffleOn ? 'text-cam bg-camNhat' : 'text-gray-400 hover:text-cam hover:bg-camNhat border border-gray-200 dark:border-night-border bg-white'}`}
              title={shuffleOn ? 'Tắt xáo trộn' : 'Bật xáo trộn'}
            >
              <Shuffle size={20} />
            </button>
          </div>
        </div>

        <section className="bg-white dark:bg-night-surface p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-night-border w-full max-w-2xl mx-auto mb-8">

      {/* Progress */}
      <div className="mb-2 flex justify-between text-xs text-vutruNhat font-medium">
        <span>Từ {currentIndex + 1} / {cards.length}</span>
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-green-600">
            <Check size={14} /> {correctCount}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <X size={14} /> {wrongCount}
          </span>
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out vocab-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Vocabulary Card */}
      <div className={`card !p-0 overflow-hidden ${cardAnim} ${glowAnim}`}>
        {/* Image section */}
        {currentCard.imageUrl && (
          <div className="vocab-image-container bg-camNhat/40 flex justify-center py-6">
            <img
              src={currentCard.imageUrl}
              alt={currentCard.backContent}
              className="w-32 h-32 object-contain rounded-2xl drop-shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* If no image, show decorative header */}
        {!currentCard.imageUrl && (
          <div className="bg-camNhat/30 py-4 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-cam/15 flex items-center justify-center">
              <BookText size={32} className="text-cam" />
            </div>
          </div>
        )}

        <div className="px-6 pb-6 pt-4 space-y-5">
          {/* Vietnamese word + word type */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold text-vutru font-heading">
                {currentCard.backContent}
              </h2>
              {currentCard.wordType && (
                <span className="px-3 py-1 bg-gray-100 text-vutruNhat border border-gray-200 text-xs font-bold rounded-md">
                  {currentCard.wordType}
                </span>
              )}
            </div>
            {currentCard.phonetic && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <button
                  onClick={() => speak(currentCard.frontContent, 'UK')}
                  className="flex items-center gap-1 font-bold text-vutru text-sm hover:text-cam transition-colors bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg"
                  title="Nghe phát âm giọng Anh (UK)"
                >
                  <Volume2 size={14} /> UK
                </button>
                <span className="font-mono font-medium text-vutru">{currentCard.phonetic}</span>
                <button
                  onClick={() => speak(currentCard.frontContent, 'US')}
                  className="flex items-center gap-1 font-bold text-vutru text-sm hover:text-cam transition-colors bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg"
                  title="Nghe phát âm giọng Mỹ (US)"
                >
                  <Volume2 size={14} /> US
                </button>
              </div>
            )}
          </div>

          {/* English definition */}
          {currentCard.definitionEn && (
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Định nghĩa Tiếng Anh:</p>
              <p className="text-[15px] text-vutru leading-relaxed">{currentCard.definitionEn}</p>
            </div>
          )}

          {/* Vietnamese definition */}
          {currentCard.definitionVi && (
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Định nghĩa:</p>
              <p className="text-[15px] text-vutru leading-relaxed">{currentCard.definitionVi}</p>
            </div>
          )}

          {/* Example */}
          {maskedExample && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-4 mb-2">
                <p className="text-xs text-gray-400">Ví dụ:</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => speak(currentCard.example || '', 'US')}
                    className="flex items-center gap-1 text-xs font-bold text-vutru hover:text-cam transition-colors"
                  >
                    US <Volume2 size={14} />
                  </button>
                  <button
                    onClick={() => speak(currentCard.example || '', 'UK')}
                    className="flex items-center gap-1 text-xs font-bold text-vutru hover:text-cam transition-colors"
                  >
                    UK <Volume2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[15px] text-vutru italic leading-relaxed mb-1">
                {maskedExample.split('*'.repeat(correctAnswer.length)).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="vocab-masked">{'*'.repeat(correctAnswer.length)}</span>}
                  </React.Fragment>
                ))}
              </p>
              {currentCard.exampleTranslation && (
                <p className="text-sm text-gray-500 not-italic">
                  {currentCard.exampleTranslation}
                </p>
              )}
            </div>
          )}

          {/* Hint display */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-sao/5 border-2 border-sao/30 border-dashed rounded-xl">
              <Lightbulb size={16} className="text-sao" />
              <span className="font-mono font-bold tracking-[4px] text-xl">
                {getHintText().split('').map((char, i) => (
                  <span
                    key={i}
                    className={i < hintCount ? 'vocab-letter-reveal text-camDam' : 'text-gray-400'}
                  >
                    {char}
                  </span>
                ))}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-cam/10" />

          {/* Answer input */}
          <div className={`${shakeAnim}`}>
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập từ tiếng Anh..."
                disabled={showResult === 'correct' || showResult === 'reveal'}
                className={`
                  flex-1 px-5 py-3.5 rounded-2xl border-2 border-gray-200 
                  text-center text-lg font-medium text-vutru 
                  placeholder:text-gray-300 outline-none vocab-input
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${showResult === 'correct' ? 'vocab-input-correct' : ''}
                  ${showResult === 'wrong' ? 'vocab-input-wrong' : ''}
                `}
                autoFocus
              />
              <button
                onClick={handleHint}
                disabled={hintCount >= correctAnswer.length || showResult === 'correct' || showResult === 'reveal'}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-sao/40 text-sao font-bold text-sm hover:bg-sao/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${hintPulse}`}
              >
                <Lightbulb size={16} />
                Gợi ý
              </button>
            </div>

            {/* Result feedback */}
            {showResult === 'correct' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-green-600 font-bold animate-fade-in">
                <Check size={20} />
                <span>Chính xác! <PartyPopper size={16} className="inline mr-1" /></span>
              </div>
            )}
            {showResult === 'wrong' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-red-500 font-bold animate-fade-in">
                <X size={20} />
                <span>Sai rồi, thử lại nhé!</span>
              </div>
            )}
            {showResult === 'reveal' && (
              <div className="mt-3 text-center animate-fade-in">
                <p className="text-sm text-vutruNhat mb-1">Đáp án là:</p>
                <p className="text-2xl font-bold text-cam font-heading">{correctAnswer}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDontKnow}
              disabled={showResult === 'correct' || showResult === 'reveal'}
              className="flex-1 btn bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <X size={18} />
              KHÔNG BIẾT
            </button>
            <button
              onClick={handleCheck}
              disabled={!answer.trim() || showResult === 'correct' || showResult === 'reveal'}
              className="flex-1 btn btn-chinh disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              <Check size={18} />
              KIỂM TRA ĐÁP ÁN
            </button>
          </div>
        </div>
        </div>
        </section>
      </main>
    </div>
  );
};

export default VocabStudy;
