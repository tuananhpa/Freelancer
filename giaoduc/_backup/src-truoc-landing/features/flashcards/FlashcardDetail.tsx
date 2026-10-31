import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  BrainCircuit,
  FileSignature,
  Gamepad2,
  Share2,
  Bookmark,
  Copy,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Star,
  Volume2,
  Pencil,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { flashcardApi } from '../../services/flashcardApi';
import { getSpeakableText } from '../../utils/speech';
import { FlashcardDeck, Flashcard } from '../../types/flashcard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import CardFlip from './CardFlip';
import FlashcardShareModal from './components/FlashcardShareModal';
import BackButton from '../../components/ui/BackButton';
import UserAvatar from '../../components/common/UserAvatar';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

const FlashcardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [deck, setDeck] = useState<FlashcardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [suggestedDecks, setSuggestedDecks] = useState<FlashcardDeck[]>([]);

  const [previewIndex, setPreviewIndex] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isPromptingAccessCode, setIsPromptingAccessCode] = useState(false);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    if (id) {
      fetchDeckData();
    }
  }, [id, user?.id]);

  const fetchDeckData = async (code?: string) => {
    try {
      setLoading(true);
      setAccessError('');
      const res = await flashcardApi.getDeckById(id!, code);
      setDeck(res.data);
      setIsPromptingAccessCode(false);

      // Track view asynchronously
      flashcardApi.incrementViewCount(id!).catch(() => {});

      if (user) {
        const favRes = await flashcardApi.isFavorited(id!);
        setIsFavorited(favRes.data?.favorited || false);
      }

      const suggestedRes = await flashcardApi.getSuggestedDecks(id!);
      setSuggestedDecks(suggestedRes.data || []);
    } catch (err: any) {
      if (
        err.response?.data?.errorCode === 'ACCESS_CODE_REQUIRED' ||
        err.response?.data?.errorCode === 'INVALID_ACCESS_CODE'
      ) {
        setIsPromptingAccessCode(true);
        if (code) {
          setAccessError('Mã truy cập không chính xác. Vui lòng thử lại.');
        }
      } else {
        toast.error('Không thể tải bộ thẻ ghi nhớ');
        navigate('/flashcards');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu bộ thẻ');
      return;
    }
    try {
      const res = await flashcardApi.toggleFavorite(id!);
      const newIsFavorited = res.data.favorited;
      setIsFavorited(newIsFavorited);
      setDeck((prev) =>
        prev
          ? {
              ...prev,
              savesCount: Math.max(0, (prev.savesCount || 0) + (newIsFavorited ? 1 : -1)),
            }
          : null
      );
      toast.success(newIsFavorited ? 'Đã lưu bộ thẻ' : 'Đã bỏ lưu');
    } catch {
      toast.error('Có lỗi xảy ra khi lưu bộ thẻ');
    }
  };

  const handleDuplicate = () => {
    navigate('/flashcards/create', { state: { duplicateData: deck } });
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
    flashcardApi.incrementShareCount(id!).catch(() => {});
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }
    if (isRating) return;

    try {
      setIsRating(true);
      await flashcardApi.rateDeck(id!, rating);

      setDeck((prev) => {
        if (!prev) return prev;
        const oldMyRating = prev.myRating;
        const oldAvg = prev.averageRating || 0;
        const oldCount = prev.ratingCount || 0;

        let newCount = oldCount;
        let newAvg = oldAvg;

        if (oldMyRating) {
          newAvg = oldCount > 0 ? (oldAvg * oldCount - oldMyRating + rating) / oldCount : rating;
        } else {
          newCount += 1;
          newAvg = (oldAvg * oldCount + rating) / newCount;
        }

        return {
          ...prev,
          myRating: rating,
          ratingCount: newCount,
          averageRating: newAvg,
        };
      });
      toast.success('Cảm ơn bạn đã gửi đánh giá!');
    } catch {
      toast.error('Không thể gửi đánh giá lúc này');
    } finally {
      setIsRating(false);
    }
  };

  const handleCardFeedback = async (knew: boolean) => {
    const card = deck?.cards?.[previewIndex];
    if (!card?.id || !user || cardBusy) return;

    try {
      setCardBusy(true);
      await flashcardApi.updateProgress(card.id, knew);
      const total = deck?.cards?.length || 0;
      if (previewIndex < total - 1) {
        setPreviewIndex((p) => p + 1);
      } else {
        toast.success(knew ? 'Bạn đã ôn xong bộ thẻ này!' : 'Đã ghi nhận — hãy ôn lại lần sau nhé!');
      }
    } catch {
      toast.error('Không thể cập nhật tiến độ thẻ');
    } finally {
      setCardBusy(false);
    }
  };

  const speakText = (text: string) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(getSpeakableText(text));
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return <LoadingOverlay text="Đang tải thông tin bộ thẻ ghi nhớ..." />;
  }

  if (isPromptingAccessCode) {
    return (
      <div className="max-w-md mx-auto p-6 mt-16 bg-white dark:bg-night-surface rounded-3xl shadow-soft border border-gray-100 dark:border-night-border text-center animate-fade-in">
        <div className="w-16 h-16 bg-cam/10 dark:bg-cam/20 text-cam rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock size={30} />
        </div>
        <h2 className="font-heading text-xl font-bold text-vutru dark:text-night-text mb-1.5">
          Bộ thẻ được bảo vệ
        </h2>
        <p className="text-xs text-vutruNhat dark:text-night-muted mb-6">
          Vui lòng nhập mã truy cập do giáo viên cung cấp để xem nội dung bộ thẻ này.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchDeckData(accessCode);
          }}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              placeholder="Nhập mã truy cập..."
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-night-border focus:border-cam focus:ring-1 focus:ring-cam outline-none text-center font-bold tracking-widest bg-gray-50 dark:bg-night-elevated text-vutru dark:text-night-text uppercase text-sm"
              autoFocus
            />
            {accessError && <p className="text-red-500 text-xs mt-2 text-center">{accessError}</p>}
          </div>
          <button
            type="submit"
            disabled={!accessCode.trim()}
            className="btn btn-chinh w-full py-3 justify-center text-sm font-bold shadow-soft"
          >
            Mở khóa bộ thẻ
          </button>
        </form>
        <button
          onClick={() => navigate('/flashcards')}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-night-muted dark:hover:text-night-text mt-6 inline-flex items-center gap-1 font-medium"
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  if (!deck) return null;

  const currentPreviewCard = deck.cards && deck.cards.length > 0 ? deck.cards[previewIndex] : null;
  const isOwner = user?.id === deck.ownerId || user?.role === 'ADMIN';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24 space-y-8 animate-fade-in">
      {/* ── 1. Header Section ── */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-2 border-b border-gray-100 dark:border-night-border/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BackButton to="/flashcards" />
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cam/10 dark:bg-cam/20 text-cam">
              Flashcard
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-bold text-vutru dark:text-night-text leading-tight">
            {deck.title}
          </h1>

          {/* Interactive Rating Bar */}
          <div
            className="flex items-center gap-1.5 group/rating cursor-pointer pt-1"
            onMouseLeave={() => setHoverRating(0)}
          >
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  onClick={() => handleRate(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  className={`transition-colors ${
                    (hoverRating || deck.myRating || 0) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-vutru dark:text-night-text ml-1">
              {deck.averageRating ? deck.averageRating.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-vutruNhat dark:text-night-muted">
              ({deck.ratingCount || 0} đánh giá)
            </span>
          </div>

          {/* Metadata Chips */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-vutruNhat dark:text-night-muted font-medium pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {new Date(deck.createdAt || '').toLocaleDateString('vi-VN')}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye size={14} /> {deck.viewsCount || 0} lượt xem
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark size={14} /> {deck.savesCount || 0} lượt lưu
            </span>
            <span className="flex items-center gap-1.5">
              <Share2 size={14} /> {deck.sharesCount || 0} chia sẻ
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleToggleFavorite}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-bold transition-all shadow-sm ${
              isFavorited
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-200 dark:border-amber-800'
                : 'bg-white dark:bg-night-surface border-gray-200 dark:border-night-border text-vutru dark:text-night-text hover:bg-gray-50 dark:hover:bg-night-elevated'
            }`}
          >
            <Bookmark
              size={15}
              className={isFavorited ? 'fill-amber-500 text-amber-500' : 'text-gray-500 dark:text-night-muted'}
            />
            <span>{isFavorited ? 'Đã lưu' : 'Lưu bộ thẻ'}</span>
          </button>

          {isOwner && (
            <Link
              to={`/flashcards/${id}/edit`}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-full hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text font-bold text-xs shadow-sm transition-colors"
            >
              <Pencil size={14} />
              <span>Chỉnh sửa</span>
            </Link>
          )}

          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-full hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text font-bold text-xs shadow-sm transition-colors"
          >
            <Copy size={14} />
            <span>Nhân bản</span>
          </button>

          <button
            onClick={handleShare}
            className="p-2.5 bg-white dark:bg-night-surface border border-gray-200 dark:border-night-border rounded-full hover:bg-gray-50 dark:hover:bg-night-elevated text-vutru dark:text-night-text shadow-sm transition-colors"
            title="Chia sẻ bộ thẻ"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* ── 2. 4 Learning Modes Action Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mode 1: Study */}
        <button
          onClick={() => navigate(`/flashcards/${id}/study`)}
          className="group relative bg-white dark:bg-night-surface border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl p-4 sm:p-5 flex flex-col items-start text-left shadow-soft hover:shadow-bouncy hover:-translate-y-1 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookOpen size={20} />
          </div>
          <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Thẻ ghi nhớ
          </h3>
          <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5">
            Lật thẻ & ôn tập ghi nhớ
          </p>
        </button>

        {/* Mode 2: Learn */}
        <button
          onClick={() => navigate(`/flashcards/${id}/learn`)}
          className="group relative bg-white dark:bg-night-surface border-2 border-purple-100 dark:border-purple-900/30 hover:border-purple-400 dark:hover:border-purple-500 rounded-2xl p-4 sm:p-5 flex flex-col items-start text-left shadow-soft hover:shadow-bouncy hover:-translate-y-1 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BrainCircuit size={20} />
          </div>
          <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            Chế độ Học
          </h3>
          <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5">
            Ôn luyện thông minh ngắt quãng
          </p>
        </button>

        {/* Mode 3: Test */}
        <button
          onClick={() => navigate(`/flashcards/${id}/test`)}
          className="group relative bg-white dark:bg-night-surface border-2 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-2xl p-4 sm:p-5 flex flex-col items-start text-left shadow-soft hover:shadow-bouncy hover:-translate-y-1 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileSignature size={20} />
          </div>
          <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Kiểm tra
          </h3>
          <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5">
            Làm bài trắc nghiệm tính điểm
          </p>
        </button>

        {/* Mode 4: Match Game */}
        <button
          onClick={() => navigate(`/flashcards/${id}/match`)}
          className="group relative bg-white dark:bg-night-surface border-2 border-orange-100 dark:border-orange-900/30 hover:border-cam dark:hover:border-cam rounded-2xl p-4 sm:p-5 flex flex-col items-start text-left shadow-soft hover:shadow-bouncy hover:-translate-y-1 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-cam/10 dark:bg-cam/20 text-cam flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Gamepad2 size={20} />
          </div>
          <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors">
            Ghép thẻ
          </h3>
          <p className="text-xs text-vutruNhat dark:text-night-muted mt-0.5">
            Trò chơi nối từ tính thời gian
          </p>
        </button>
      </div>

      {/* ── 3. Flashcard Flip Interactive Previewer ── */}
      <div className="space-y-4">
        <div className="relative">
          {currentPreviewCard ? (
            <CardFlip
              key={currentPreviewCard.id}
              frontContent={currentPreviewCard.frontContent}
              backContent={currentPreviewCard.backContent}
              imageUrl={currentPreviewCard.imageUrl}
              onKnow={user ? () => { void handleCardFeedback(true); } : undefined}
              onReview={user ? () => { void handleCardFeedback(false); } : undefined}
              className="w-full max-w-4xl mx-auto min-h-[360px] sm:min-h-[420px]"
            />
          ) : (
            <div className="max-w-4xl mx-auto h-[360px] flex flex-col items-center justify-center text-vutruNhat dark:text-night-muted bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border shadow-soft">
              <BookOpen size={36} className="text-gray-300 dark:text-night-muted mb-2" />
              <p className="font-medium text-sm">Chưa có thẻ ghi nhớ nào trong học phần này</p>
            </div>
          )}
        </div>

        {/* Player Controls Toolbar */}
        {deck.cards && deck.cards.length > 0 && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border rounded-full px-6 py-2.5 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-2 w-1/3">
              {currentPreviewCard && (
                <button
                  onClick={() => speakText(currentPreviewCard.frontContent)}
                  className="p-2 rounded-full text-vutruNhat dark:text-night-muted hover:text-cam hover:bg-cam/10 transition-colors"
                  title="Phát âm từ vựng"
                >
                  <Volume2 size={18} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 w-1/3">
              <button
                onClick={() => setPreviewIndex((p) => Math.max(0, p - 1))}
                disabled={previewIndex === 0}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-night-elevated disabled:opacity-30 transition-colors text-vutru dark:text-night-text"
                title="Thẻ trước"
              >
                <ChevronLeft size={22} />
              </button>
              <span className="font-heading font-bold text-xs sm:text-sm text-vutru dark:text-night-text whitespace-nowrap">
                {previewIndex + 1} / {deck.cards.length}
              </span>
              <button
                onClick={() => setPreviewIndex((p) => Math.min((deck.cards?.length || 1) - 1, p + 1))}
                disabled={previewIndex === (deck.cards.length || 1) - 1}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-night-elevated disabled:opacity-30 transition-colors text-vutru dark:text-night-text"
                title="Thẻ tiếp theo"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="flex justify-end w-1/3">
              <button
                onClick={() => navigate(`/flashcards/${id}/study`)}
                className="p-2 text-vutruNhat dark:text-night-muted hover:text-cam dark:hover:text-cam transition-colors"
                title="Bắt đầu học toàn màn hình"
              >
                <Maximize2 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Author Info Bar */}
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-night-border/60">
          <div className="flex items-center gap-3">
            <UserAvatar
              fullName={deck.ownerName || 'Điểm Sáng Teacher'}
              avatarUrl={deck.ownerAvatar}
              size="md"
            />
            <div>
              <div className="text-[11px] font-bold text-vutruNhat uppercase tracking-wider">
                Tạo bởi
              </div>
              <div className="font-heading font-bold text-vutru dark:text-night-text text-base">
                {deck.ownerName || 'Giáo viên Điểm Sáng'}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/flashcards/${id}/study`)}
            className="btn btn-chinh px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-soft"
          >
            Học ngay <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* ── 4. Deck Description ── */}
      {deck.description && (
        <div className="bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
          <h3 className="font-heading text-sm font-bold text-vutru dark:text-night-text mb-1">
            Mô tả học phần
          </h3>
          <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted whitespace-pre-wrap leading-relaxed">
            {deck.description}
          </p>
        </div>
      )}

      {/* ── 5. Terms in this Deck (Danh sách thuật ngữ) ── */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-xl font-bold text-vutru dark:text-night-text">
            Thuật ngữ trong học phần ({deck.cards?.length || 0})
          </h2>
          <span className="text-xs text-vutruNhat dark:text-night-muted font-medium">
            Nhấn vào biểu tượng loa để nghe phát âm
          </span>
        </div>

        <div className="space-y-3">
          {deck.cards?.map((card, idx) => (
            <div
              key={card.id || idx}
              className="bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border rounded-2xl p-4 sm:p-5 shadow-soft hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Front Content */}
              <div className="flex-1 md:border-r border-gray-100 dark:border-night-border pb-2 md:pb-0 md:pr-6">
                <span className="text-[10px] font-bold text-vutruNhat uppercase tracking-wider block mb-1">
                  Mặt trước #{idx + 1}
                </span>
                <div className="text-vutru dark:text-night-text font-bold text-base sm:text-lg break-words">
                  {card.frontContent}
                </div>
              </div>

              {/* Back Content & Image */}
              <div className="flex-1 flex items-start sm:items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt={card.frontContent}
                      className="w-14 h-14 object-cover rounded-xl border border-gray-200 dark:border-night-border shrink-0 shadow-2xs"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-vutruNhat uppercase tracking-wider block mb-1">
                      Định nghĩa / Giải nghĩa
                    </span>
                    <div className="text-vutru dark:text-night-text text-sm sm:text-base break-words">
                      {card.backContent}
                    </div>
                  </div>
                </div>

                {/* Pronunciation Audio Button */}
                <button
                  type="button"
                  onClick={() => speakText(card.frontContent)}
                  className="p-2.5 rounded-xl text-vutruNhat dark:text-night-muted hover:text-cam hover:bg-cam/10 dark:hover:bg-cam/20 transition-colors shrink-0"
                  title="Phát âm thanh"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Suggested Decks Section ── */}
      {suggestedDecks.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-night-border/80">
          <h2 className="font-heading text-xl font-bold text-vutru dark:text-night-text">
            Các bộ thẻ liên quan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestedDecks.map((sDeck) => (
              <div
                key={sDeck.id}
                onClick={() => navigate(`/flashcards/${sDeck.id}`)}
                className="bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border rounded-2xl p-5 hover:shadow-bouncy hover:-translate-y-1 cursor-pointer transition-all shadow-soft space-y-3"
              >
                <h3 className="font-heading font-bold text-vutru dark:text-night-text line-clamp-2 text-base">
                  {sDeck.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-vutruNhat dark:text-night-muted font-medium">
                  <span className="flex items-center gap-1">
                    <BookOpen size={13} /> {sDeck.cards?.length || 0} thẻ
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={13} /> {sDeck.viewsCount || 0} lượt xem
                  </span>
                </div>
                {sDeck.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sDeck.tags
                      .split(',')
                      .slice(0, 3)
                      .map((t, i) => (
                        <span
                          key={i}
                          className="text-[11px] font-semibold bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted px-2 py-0.5 rounded-md"
                        >
                          #{t.trim()}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Share Modal ── */}
      <FlashcardShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        deckTitle={deck.title}
        deckUrl={`${window.location.origin}/flashcards/${deck.id}`}
      />
    </div>
  );
};

export default FlashcardDetail;
