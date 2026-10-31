import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { FlashcardDeck, Flashcard } from '../../types/flashcard';
import { getSpeakableText } from '../../utils/speech';
import {
  ChevronLeft,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Volume2,
  Trophy,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Check,
  CheckSquare,
  Scale,
  Keyboard,
} from 'lucide-react';
import BackButton from '../../components/ui/BackButton';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/ui/Button';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

interface Question {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TYPING';
  term: string; // The front content
  correctAnswer: string; // The back content
  imageUrl?: string | null;
  options?: string[]; // For multiple choice
}

interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
}

const FlashcardTestMode: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error } = useToast();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);

  // Test Configuration
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [questionCount, setQuestionCount] = useState(10);
  const [enableMultipleChoice, setEnableMultipleChoice] = useState(true);
  const [enableTrueFalse, setEnableTrueFalse] = useState(true);
  const [enableTyping, setEnableTyping] = useState(true);

  // Test State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const errorShown = useRef(false);

  useEffect(() => {
    if (id) {
      flashcardApi
        .getDeckById(id)
        .then((res) => {
          if (!res.data.cards || res.data.cards.length < 4) {
            if (!errorShown.current) {
              error('Bộ thẻ cần ít nhất 4 thẻ để tạo bài kiểm tra');
              errorShown.current = true;
            }
            navigate(`/flashcards/${id}`);
            return;
          }
          setDeck(res.data);
          setQuestionCount(Math.min(10, res.data.cards.length));
        })
        .catch(() => {
          error('Không tải được bài kiểm tra');
          navigate(`/flashcards/${id}`);
        })
        .finally(() => setLoading(false));
    }
  }, [id, navigate, error]);

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

  const generateTest = () => {
    if (!deck || !deck.cards || deck.cards.length < 4) {
      error('Cần ít nhất 4 thẻ để tạo bài kiểm tra đa dạng');
      return;
    }

    const enabledTypes: ('MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'TYPING')[] = [];
    if (enableMultipleChoice) enabledTypes.push('MULTIPLE_CHOICE');
    if (enableTrueFalse) enabledTypes.push('TRUE_FALSE');
    if (enableTyping) enabledTypes.push('TYPING');

    if (enabledTypes.length === 0) {
      error('Vui lòng chọn ít nhất một dạng câu hỏi');
      return;
    }

    const shuffled = [...deck.cards].sort(() => 0.5 - Math.random());
    const selectedCards = shuffled.slice(0, questionCount);
    const allDefs = deck.cards.map((c) => c.backContent);

    const generated: Question[] = selectedCards.map((card, index) => {
      // Pick random question type from enabled list
      const qType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];

      if (qType === 'MULTIPLE_CHOICE') {
        let options = [card.backContent];
        let wrongDefs = allDefs.filter((d) => d !== card.backContent).sort(() => 0.5 - Math.random());
        options = [...options, ...wrongDefs.slice(0, 3)].sort(() => 0.5 - Math.random());

        return {
          id: card.id!,
          type: 'MULTIPLE_CHOICE',
          term: card.frontContent,
          correctAnswer: card.backContent,
          imageUrl: card.imageUrl,
          options,
        };
      } else if (qType === 'TRUE_FALSE') {
        const isTrue = Math.random() > 0.5;
        let displayDef = card.backContent;
        if (!isTrue) {
          const wrongDefs = allDefs.filter((d) => d !== card.backContent);
          displayDef = wrongDefs[Math.floor(Math.random() * wrongDefs.length)];
        }
        return {
          id: card.id!,
          type: 'TRUE_FALSE',
          term: card.frontContent,
          correctAnswer: card.backContent,
          imageUrl: card.imageUrl,
          options: [displayDef, isTrue ? 'True' : 'False'],
        };
      } else {
        return {
          id: card.id!,
          type: 'TYPING',
          term: card.frontContent,
          correctAnswer: card.backContent,
          imageUrl: card.imageUrl,
        };
      }
    });

    setQuestions(generated);
    setAnswers({});
    setIsSubmitted(false);
    setIsConfiguring(false);
  };

  const handleAnswer = (questionId: string, userAnswer: string, isCorrect: boolean) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, userAnswer, isCorrect },
    }));
  };

  const submitTest = () => {
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const score = Object.values(answers).filter((a) => a.isCorrect).length;
  const percentage = Math.round((score / questions.length) * 100) || 0;

  if (loading) return <LoadingOverlay text="Đang tải bài kiểm tra..." />;
  if (!deck || !deck.cards) return null;

  return (
    <div className="min-h-screen bg-kem/30 dark:bg-night-page text-vutru dark:text-night-text flex flex-col animate-fade-in">
      {/* Unified Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-night-surface border-b border-gray-200 dark:border-night-border shadow-xs sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <BackButton to={`/flashcards/${id}`} size={20} />
          <div className="h-6 w-px bg-gray-200 dark:bg-night-border mx-1" />
          <div>
            <h1 className="font-heading font-bold text-base sm:text-lg text-vutru dark:text-night-text leading-tight truncate max-w-xs sm:max-w-md">
              Kiểm tra: {deck.title}
            </h1>
            <p className="text-[11px] text-vutruNhat dark:text-night-muted">
              {isConfiguring ? 'Thiết lập cấu hình bài thi' : `${questions.length} câu hỏi tổng cộng`}
            </p>
          </div>
        </div>

        {!isConfiguring && isSubmitted && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="text-right">
              <div className="text-[11px] font-bold text-vutruNhat dark:text-night-muted uppercase">Điểm số</div>
              <div className="font-heading text-2xl sm:text-3xl font-extrabold text-cam leading-none">{percentage}%</div>
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-night-border" />
            <div className="flex gap-3 text-xs font-bold">
              <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={18} />
                <span className="text-[11px] mt-0.5">{score} Đúng</span>
              </div>
              <div className="flex flex-col items-center text-red-600 dark:text-red-400">
                <XCircle size={18} />
                <span className="text-[11px] mt-0.5">{questions.length - score} Sai</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col py-8 px-4 overflow-y-auto max-w-4xl mx-auto w-full">
        {isConfiguring ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white dark:bg-night-surface rounded-3xl shadow-soft border border-gray-100 dark:border-night-border w-full max-w-xl p-6 sm:p-8 animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-camNhat/50 dark:bg-cam/20 text-camDam dark:text-cam flex items-center justify-center">
                  <SlidersHorizontal size={24} />
                </div>
                <div>
                  <h2 className="font-heading text-2xl font-bold text-vutru dark:text-night-text">
                    Thiết lập bài kiểm tra
                  </h2>
                  <p className="text-xs text-vutruNhat dark:text-night-muted">
                    Tùy chỉnh số lượng và dạng câu hỏi để kiểm tra kiến thức của bạn
                  </p>
                </div>
              </div>

              {/* Question Count Selector */}
              <div className="mb-6 pt-4 border-t border-gray-100 dark:border-night-border">
                <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-3">
                  Số lượng câu hỏi
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {[5, 10, 15, 20, deck.cards?.length || 0].map((count) => {
                    const total = deck.cards?.length || 0;
                    if (count > total && count !== total) return null;
                    const isAll = count === total;
                    const isSelected = questionCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-cam text-white shadow-soft font-extrabold'
                            : 'bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text hover:bg-gray-200'
                        }`}
                      >
                        {isAll ? `Tất cả (${count})` : `${count} câu`}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="range"
                  min={1}
                  max={deck.cards?.length || 10}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-cam"
                />
                <div className="flex justify-between text-[11px] text-vutruNhat dark:text-night-muted mt-1">
                  <span>1 câu</span>
                  <span className="font-bold text-cam">Đang chọn: {questionCount} câu</span>
                  <span>{deck.cards?.length || 0} câu</span>
                </div>
              </div>

              {/* Question Formats Checkbox */}
              <div className="mb-8">
                <label className="block text-xs font-bold uppercase tracking-wider text-vutru dark:text-night-text mb-3">
                  Dạng câu hỏi kiểm tra
                </label>
                <div className="space-y-2.5">
                  <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-night-elevated/60 border border-gray-100 dark:border-night-border cursor-pointer hover:border-cam/40 transition-colors">
                    <span className="text-xs sm:text-sm font-semibold text-vutru dark:text-night-text flex items-center gap-2">
                      <CheckSquare size={16} className="text-cam shrink-0" aria-hidden="true" />
                      <span>Trắc nghiệm 4 lựa chọn (Multiple Choice)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enableMultipleChoice}
                      onChange={(e) => setEnableMultipleChoice(e.target.checked)}
                      className="w-4 h-4 rounded text-cam accent-cam focus:ring-cam"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-night-elevated/60 border border-gray-100 dark:border-night-border cursor-pointer hover:border-cam/40 transition-colors">
                    <span className="text-xs sm:text-sm font-semibold text-vutru dark:text-night-text flex items-center gap-2">
                      <Scale size={16} className="text-cam shrink-0" aria-hidden="true" />
                      <span>Câu hỏi Đúng / Sai (True / False)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enableTrueFalse}
                      onChange={(e) => setEnableTrueFalse(e.target.checked)}
                      className="w-4 h-4 rounded text-cam accent-cam focus:ring-cam"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-night-elevated/60 border border-gray-100 dark:border-night-border cursor-pointer hover:border-cam/40 transition-colors">
                    <span className="text-xs sm:text-sm font-semibold text-vutru dark:text-night-text flex items-center gap-2">
                      <Keyboard size={16} className="text-cam shrink-0" aria-hidden="true" />
                      <span>Tự gõ đáp án (Typing Recall)</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={enableTyping}
                      onChange={(e) => setEnableTyping(e.target.checked)}
                      className="w-4 h-4 rounded text-cam accent-cam focus:ring-cam"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={generateTest}
                className="w-full btn btn-chinh py-3.5 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-soft hover:shadow-bouncy"
              >
                <Sparkles size={18} /> Bắt đầu làm bài
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {/* Score Summary Card after Submit */}
            {isSubmitted && (
              <div className="mb-8 p-6 sm:p-8 bg-white dark:bg-night-surface rounded-3xl shadow-soft border border-gray-100 dark:border-night-border text-center animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text border border-gray-200 dark:border-night-border flex items-center justify-center mx-auto mb-4">
                  <Trophy size={32} />
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text mb-2">
                  {percentage >= 80 ? 'Xuất sắc! Bạn đã làm rất tốt!' : percentage >= 50 ? 'Kết quả khá tốt! Cần luyện thêm một chút!' : 'Hãy tiếp tục ôn luyện để tiến bộ hơn nhé!'}
                </h2>
                <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted mb-6">
                  Bạn đã trả lời đúng <strong className="text-cam font-bold">{score}</strong> trên tổng số <strong className="text-vutru dark:text-night-text font-bold">{questions.length}</strong> câu hỏi ({percentage}%).
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <button
                    onClick={() => setIsConfiguring(true)}
                    className="btn btn-chinh px-6 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-soft"
                  >
                    <RotateCcw size={15} /> Làm bài kiểm tra khác
                  </button>
                  <button
                    onClick={() => navigate(`/flashcards/${id}`)}
                    className="btn btn-phu px-6 py-2.5 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft size={15} /> Về bộ thẻ
                  </button>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-6 mb-8">
              {questions.map((q, index) => {
                const answer = answers[q.id];

                return (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-night-surface rounded-3xl p-6 sm:p-7 shadow-soft border border-gray-100 dark:border-night-border transition-all"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-bold text-xs uppercase tracking-wider text-vutruNhat dark:text-night-muted">
                        Câu {index + 1} / {questions.length}
                      </span>
                      {isSubmitted && (
                        answer?.isCorrect ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full text-xs">
                            <CheckCircle size={14} /> Chính xác
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/30 px-3 py-1 rounded-full text-xs">
                            <XCircle size={14} /> Chưa đúng
                          </div>
                        )
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-heading text-xl sm:text-2xl font-bold text-vutru dark:text-night-text">
                            {q.term}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => speakText(q.term, e)}
                            className="p-1.5 text-vutruNhat hover:text-cam dark:hover:text-night-text hover:bg-camNhat/40 dark:hover:bg-night-elevated rounded-lg transition-colors"
                            title="Nghe phát âm"
                          >
                            <Volume2 size={18} />
                          </button>
                        </div>
                      </div>

                      {q.imageUrl && (
                        <img
                          src={q.imageUrl}
                          alt="card visual"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-gray-200 dark:border-night-border shrink-0"
                        />
                      )}
                    </div>

                    {/* Multiple Choice */}
                    {q.type === 'MULTIPLE_CHOICE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options?.map((opt, optIdx) => {
                          const optionLetter = String.fromCharCode(65 + optIdx);
                          const isSelected = answer?.userAnswer === opt;

                          let bgClass = 'bg-gray-50 dark:bg-night-elevated/60 hover:bg-gray-100 dark:hover:bg-night-elevated border-gray-200 dark:border-night-border text-vutru dark:text-night-text';

                          if (isSelected && !isSubmitted) {
                            bgClass = 'bg-camNhat/40 border-cam text-camDam dark:bg-cam/20 dark:border-cam dark:text-cam font-bold shadow-soft';
                          } else if (isSubmitted) {
                            if (opt === q.correctAnswer) {
                              bgClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                            } else if (isSelected) {
                              bgClass = 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300 font-bold';
                            }
                          }

                          return (
                            <button
                              key={opt}
                              disabled={isSubmitted}
                              onClick={() => handleAnswer(q.id, opt, opt === q.correctAnswer)}
                              className={`p-4 rounded-2xl text-left transition-all border flex items-center gap-3 text-xs sm:text-sm font-medium ${bgClass}`}
                            >
                              <span className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-night-border text-vutru dark:text-night-text text-xs font-bold flex items-center justify-center shrink-0">
                                {optionLetter}
                              </span>
                              <span className="flex-1 leading-snug break-words">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* True/False */}
                    {q.type === 'TRUE_FALSE' && (
                      <div>
                        <div className="bg-gray-50 dark:bg-night-elevated/60 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-night-border mb-4">
                          <p className="text-[11px] text-vutruNhat dark:text-night-muted uppercase tracking-wider font-bold mb-1">
                            Định nghĩa hiển thị:
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-vutru dark:text-night-text">
                            {q.options![0]}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          {['True', 'False'].map((opt) => {
                            const isSelected = answer?.userAnswer === opt;
                            const isCorrectOpt = opt === q.options![1];

                            let bgClass = 'bg-gray-50 dark:bg-night-elevated/60 hover:bg-gray-100 dark:hover:bg-night-elevated border-gray-200 dark:border-night-border text-vutru dark:text-night-text';
                            if (isSelected && !isSubmitted) {
                              bgClass = 'bg-camNhat/40 border-cam text-camDam dark:bg-cam/20 dark:border-cam dark:text-cam font-bold shadow-soft';
                            } else if (isSubmitted) {
                              if (isCorrectOpt) {
                                bgClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                              } else if (isSelected) {
                                bgClass = 'bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-300 font-bold';
                              }
                            }

                            return (
                              <button
                                key={opt}
                                disabled={isSubmitted}
                                onClick={() => handleAnswer(q.id, opt, isCorrectOpt)}
                                className={`flex-1 p-3.5 rounded-2xl text-center font-bold text-sm transition-all border flex items-center justify-center gap-2 ${bgClass}`}
                              >
                                {opt === 'True' ? (
                                  <>
                                    <Check size={16} className="text-emerald-500" />
                                    <span>Đúng</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={16} className="text-red-500" />
                                    <span>Sai</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Typing */}
                    {q.type === 'TYPING' && (
                      <div>
                        <input
                          type="text"
                          placeholder="Gõ đáp án chính xác..."
                          disabled={isSubmitted}
                          value={answer?.userAnswer || ''}
                          onChange={(e) =>
                            handleAnswer(
                              q.id,
                              e.target.value,
                              e.target.value.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
                            )
                          }
                          className={`w-full p-4 rounded-2xl border text-sm text-vutru dark:text-night-text bg-gray-50 dark:bg-night-elevated focus:outline-none transition-all ${
                            isSubmitted && answer?.isCorrect
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                              : isSubmitted && !answer?.isCorrect
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                              : 'border-gray-200 dark:border-night-border focus:border-cam focus:bg-white dark:focus:bg-night-surface'
                          }`}
                        />
                        {isSubmitted && !answer?.isCorrect && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                              Đáp án chính xác:
                            </span>
                            <span className="text-sm text-vutru dark:text-night-text font-bold">
                              {q.correctAnswer}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Bottom Bar */}
            <div className="flex justify-end gap-3 pb-8">
              {!isSubmitted ? (
                <button
                  onClick={submitTest}
                  disabled={Object.keys(answers).length === 0}
                  className="btn btn-chinh px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-soft hover:shadow-bouncy disabled:opacity-50"
                >
                  Nộp bài kiểm tra ({Object.keys(answers).length}/{questions.length})
                </button>
              ) : (
                <button
                  onClick={() => setIsConfiguring(true)}
                  className="btn btn-chinh px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-soft hover:shadow-bouncy"
                >
                  Tạo bài kiểm tra mới
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardTestMode;
