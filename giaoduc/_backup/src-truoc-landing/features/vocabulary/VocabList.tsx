import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { FlashcardDeck } from '../../types/flashcard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  BookText,
  Plus,
  Search,
  Users,
  Pencil,
  Trash2,
  Star,
  StarHalf,
  Bookmark,
  X,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import ContentCard from '../../components/common/ContentCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import './VocabStudy.css';

const POPULAR_VOCAB_TAGS = [
  'TOEIC',
  'IELTS',
  'TOEFL',
  'Giao tiếp',
  'Ngữ pháp',
  'Từ vựng',
  'Cơ bản',
  'Nâng cao',
];

const VocabList: React.FC = () => {
  const { isTeacher, isAdmin, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'mine' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch favorite IDs once on mount or when favorites change for bookmark state
  const refreshFavoriteIds = useCallback(async () => {
    try {
      const favRes = await flashcardApi.getFavoriteDecks(0, 100, undefined, 'VOCABULARY');
      const ids = new Set((favRes.data?.content || []).map((d: FlashcardDeck) => d.id));
      setFavoriteIds(ids);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshFavoriteIds();
  }, [refreshFavoriteIds]);

  const fetchData = useCallback(
    async (page: number, query: string = '', tag: string = '', currentTab: 'all' | 'mine' | 'favorites') => {
      setLoading(true);
      try {
        const searchQuery = tag ? (query ? `${query} ${tag}` : tag) : query;
        let res: any;

        if (currentTab === 'mine') {
          res = await flashcardApi.getMyDecks(page, 9, searchQuery || undefined, null, 'VOCABULARY');
        } else if (currentTab === 'favorites') {
          res = await flashcardApi.getFavoriteDecks(page, 9, searchQuery || undefined, 'VOCABULARY');
        } else {
          res = await flashcardApi.getPublicDecks(page, 9, searchQuery || undefined, null, 'VOCABULARY');
        }

        setDecks(res.data?.content || []);
        setTotalPages(res.data?.totalPages || 0);
      } catch (err) {
        console.error('Failed to fetch vocab decks', err);
        setDecks([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      if (isCurrent) {
        fetchData(currentPage, search, selectedTag, tab);
      }
    }, 300);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [currentPage, search, selectedTag, tab, fetchData]);

  const handleToggleFavorite = async (deckId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await flashcardApi.toggleFavorite(deckId);
      const isFav = res.data.favorited;
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (isFav) {
          next.add(deckId);
        } else {
          next.delete(deckId);
        }
        return next;
      });

      if (tab === 'favorites' && !isFav) {
        // If un-favoriting on favorites tab, remove from current list
        setDecks((prev) => prev.filter((d) => d.id !== deckId));
      }
      toast.success(isFav ? 'Đã lưu bộ từ vựng' : 'Đã bỏ lưu bộ từ vựng');
    } catch {
      toast.error('Lỗi khi cập nhật yêu thích');
    }
  };

  const confirmDeleteDeck = (deckId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeckToDelete(deckId);
  };

  const handleDeleteDeck = async () => {
    if (!deckToDelete) return;
    setIsDeleting(true);
    try {
      await flashcardApi.deleteDeck(deckToDelete);
      setDecks((prev) => prev.filter((d) => d.id !== deckToDelete));
      setDeckToDelete(null);
      toast.success('Đã xóa bộ từ vựng thành công');
    } catch {
      toast.error('Không thể xóa bộ từ vựng. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedTag('');
    setCurrentPage(0);
  };

  const hasActiveFilters = Boolean(search || selectedTag);

  const renderDeckCard = (deck: FlashcardDeck) => {
    const cardCount = deck.cards?.length ?? 0;
    const isFav = favoriteIds.has(deck.id);
    const learnerCount = deck.learnerCount ?? 0;
    const tags = deck.tags
      ? deck.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const chips = [
      ...(deck.averageRating !== undefined && deck.averageRating > 0
        ? [
            {
              icon: (
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const r = deck.averageRating || 0;
                    if (r >= star) return <Star key={star} size={12} className="fill-yellow-400 text-yellow-400" />;
                    if (r >= star - 0.5) return <StarHalf key={star} size={12} className="fill-yellow-400 text-yellow-400" />;
                    return <Star key={star} size={12} className="text-gray-300 dark:text-gray-600" />;
                  })}
                </span>
              ),
              label: Number(deck.averageRating).toFixed(1),
              colorClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
            },
          ]
        : []),
      { icon: <BookText size={13} />, label: `${cardCount} từ` },
      { icon: <Users size={13} />, label: `${learnerCount.toLocaleString()} học viên` },
    ];

    const isOwner = user?.id === deck.ownerId || isTeacher || user?.role === 'ADMIN';

    return (
      <ContentCard
        key={deck.id}
        title={deck.title}
        description={deck.description || undefined}
        imageUrl={deck.imageUrl || undefined}
        coverIcon={<BookText size={26} />}
        owner={deck.ownerName ? { name: deck.ownerName, avatar: deck.ownerAvatar } : undefined}
        tags={tags.length > 0 ? tags : undefined}
        chips={chips}
        locked={!!deck.locked && tab === 'all'}
        unlockHint={deck.unlockHint}
        onUnlockClick={() => navigate('/classes')}
        topLeftBadge={
          deck.accessLevel === 'PREVIEW' && !deck.locked ? (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2.5 py-0.5 rounded-full">
              Xem thử
            </span>
          ) : deck.visibility === 'PUBLIC' ? (
            <span className="text-[10px] font-bold bg-cam text-white px-2.5 py-0.5 rounded-full shadow-xs">
              Công khai
            </span>
          ) : deck.visibility === 'CLASSROOM' ? (
            <span className="text-[10px] font-bold bg-indigo-600 dark:bg-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
              Lớp học
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-slate-600 dark:bg-slate-700 text-white px-2.5 py-0.5 rounded-full shadow-xs">
              Riêng tư
            </span>
          )
        }
        isFavorited={isFav}
        onToggleFavorite={(e) => handleToggleFavorite(deck.id, e)}
        actions={
          <div className="flex items-center gap-2 w-full">
            {deck.locked && tab === 'all' ? (
              <button
                type="button"
                onClick={() => navigate('/classes')}
                className="btn btn-phu flex-1 py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <Lock size={14} /> Đăng ký lớp để mở khóa
              </button>
            ) : (
              <Link
                to={`/vocabulary/${deck.id}/study`}
                className="btn btn-chinh flex-1 py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                Học từ vựng <ArrowRight size={14} />
              </Link>
            )}

            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to={`/vocabulary/${deck.id}/edit`}
                  className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shrink-0"
                  title="Chỉnh sửa bộ từ vựng"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  type="button"
                  onClick={(e) => confirmDeleteDeck(deck.id, e)}
                  className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shrink-0"
                  title="Xóa bộ từ vựng"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        }
      />
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cam/10 dark:bg-cam/20 flex items-center justify-center text-cam">
              <BookText size={22} />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text">
                Bộ từ vựng tiếng Anh
              </h1>
              <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted mt-0.5">
                {isTeacher
                  ? 'Quản lý, biên soạn và phân phối các bộ từ vựng chuyên đề cho học viên'
                  : 'Học từ vựng tương tác qua ngữ cảnh, phiên âm chuẩn quốc tế và câu ví dụ sinh động'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isTeacher && (
          <div className="shrink-0">
            <Link
              to="/vocabulary/create"
              className="btn btn-chinh px-4 py-2.5 text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-bouncy"
            >
              <Plus size={18} />
              Tạo bộ từ vựng mới
            </Link>
          </div>
        )}
      </div>

      {/* ── 2. Navigation Tabs & Search Controls ── */}
      <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Role Tabs */}
          <div className="flex items-center p-1 bg-gray-100/80 dark:bg-night-elevated rounded-xl gap-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => {
                setTab('all');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                tab === 'all'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
              }`}
            >
              Tất cả bộ từ
            </button>

            {/* /vocabulary/create chi cho TEACHER/ADMIN, hoc sinh khong tao duoc bo tu
                nen tab nay luon rong voi ho - la ngo cut, cung ly do da an o FlashcardList. */}
            {(isTeacher || isAdmin) && (
              <button
                onClick={() => {
                  setTab('mine');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  tab === 'mine'
                    ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                }`}
              >
                Của tôi
              </button>
            )}

            <button
              onClick={() => {
                setTab('favorites');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                tab === 'favorites'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
              }`}
            >
              Đã lưu
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-night-muted" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm bộ từ vựng theo tên hoặc mô tả..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs sm:text-sm text-vutru dark:text-night-text focus:bg-white dark:focus:bg-night-surface focus:border-cam focus:ring-1 focus:ring-cam transition-all placeholder:text-gray-400 dark:placeholder:text-night-muted"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-night-text"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Popular Hashtag Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-1 border-t border-gray-100 dark:border-night-border/60">
          <button
            onClick={() => {
              setSelectedTag('');
              setCurrentPage(0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !selectedTag
                ? 'bg-cam text-white shadow-sm'
                : 'bg-gray-100/80 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:bg-gray-200/70 dark:hover:bg-night-border'
            }`}
          >
            Tất cả chủ đề
          </button>
          {POPULAR_VOCAB_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedTag(selectedTag === tag ? '' : tag);
                setCurrentPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? 'bg-cam text-white shadow-sm'
                  : 'bg-gray-100/80 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:bg-gray-200/70 dark:hover:bg-night-border'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Content Section (Cards / Empty State / LoadingOverlay) ── */}
      {loading && <LoadingOverlay text="Đang tải danh sách từ vựng..." />}

      <div className={loading && decks.length === 0 ? 'min-h-[50vh]' : ''}>
        {decks.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border shadow-soft">
            <div className="w-16 h-16 bg-cam/10 dark:bg-cam/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cam">
              {tab === 'favorites' ? <Bookmark size={30} /> : <BookText size={30} />}
            </div>
            <h3 className="font-heading text-lg font-bold text-vutru dark:text-night-text mb-1">
              {tab === 'favorites'
                ? 'Bạn chưa lưu bộ từ vựng nào'
                : tab === 'mine'
                ? 'Bạn chưa tạo bộ từ vựng nào'
                : 'Không tìm thấy bộ từ vựng phù hợp'}
            </h3>
            <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted max-w-sm mx-auto mb-5">
              {tab === 'favorites'
                ? 'Hãy khám phá các bộ từ vựng công khai và nhấn biểu tượng lưu để học lại bất cứ lúc nào.'
                : tab === 'mine'
                ? 'Bắt đầu biên soạn bộ từ vựng đầu tiên của bạn với định nghĩa, phiên âm và câu ví dụ.'
                : hasActiveFilters
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn chủ đề hiện tại để xem thêm kết quả.'
                : 'Hiện tại chưa có bộ từ vựng nào trong danh mục này. Vui lòng quay lại sau.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="btn btn-phu text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <X size={14} /> Xóa bộ lọc tìm kiếm
              </button>
            ) : tab === 'mine' && isTeacher ? (
              <Link
                to="/vocabulary/create"
                className="btn btn-chinh text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Tạo bộ từ vựng mới
              </Link>
            ) : (
              <button
                onClick={() => {
                  setTab('all');
                  clearFilters();
                }}
                className="btn btn-chinh text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                Khám phá tất cả bộ từ
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map(renderDeckCard)}
          </div>
        )}
      </div>

      {/* ── 4. Pagination ── */}
      {!loading && decks.length > 0 && totalPages > 1 && (
        <div className="mt-8">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* ── 5. Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(deckToDelete)}
        onClose={() => setDeckToDelete(null)}
        onConfirm={handleDeleteDeck}
        title="Xác nhận xóa bộ từ vựng"
        message="Bạn có chắc chắn muốn xóa bộ từ vựng này không? Toàn bộ danh sách từ vựng và tiến độ học liên quan sẽ bị xóa vĩnh viễn."
        confirmText="Xóa vĩnh viễn"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default VocabList;
