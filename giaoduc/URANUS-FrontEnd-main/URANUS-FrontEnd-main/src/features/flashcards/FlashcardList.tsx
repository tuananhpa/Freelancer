import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { flashcardApi } from '../../services/flashcardApi';
import { FlashcardDeck } from '../../types/flashcard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/ui/Pagination';
import ShareModal from '../../components/common/ShareModal';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ContentCard from '../../components/common/ContentCard';
import {
  Search,
  Plus,
  GalleryVerticalEnd,
  Folder,
  Users,
  Star,
  StarHalf,
  Bookmark,
  Pencil,
  Trash2,
  X,
  Lock,
  ArrowRight,
  Share2,
} from 'lucide-react';

const SUBJECT_FILTERS = [
  'Tiếng Anh',
  'Toán',
  'Vật Lý',
  'Hóa Học',
  'Sinh Học',
  'Ngữ Văn',
  'KHTN',
];

const FlashcardList: React.FC = () => {
  const { user, isTeacher, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'mine' | 'favorites'>('all');
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [shareDeck, setShareDeck] = useState<FlashcardDeck | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync bookmark list for favorite heart / bookmark states
  const refreshFavoriteIds = useCallback(async () => {
    try {
      const favRes = await flashcardApi.getFavoriteDecks(0, 100, undefined, 'FLASHCARD');
      const ids = new Set((favRes.data?.content || []).map((d: FlashcardDeck) => d.id));
      setFavoriteIds(ids);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    refreshFavoriteIds();
  }, [refreshFavoriteIds]);

  const fetchDecks = useCallback(
    async (page: number, query: string = '', subject: string = '', currentTab: 'all' | 'mine' | 'favorites') => {
      setLoading(true);
      try {
        const searchQuery = subject ? (query ? `${query} ${subject}` : subject) : query;
        let res: any;

        if (currentTab === 'mine') {
          res = await flashcardApi.getMyDecks(page, 9, searchQuery || undefined, null, 'FLASHCARD');
        } else if (currentTab === 'favorites') {
          res = await flashcardApi.getFavoriteDecks(page, 9, searchQuery || undefined, 'FLASHCARD');
        } else {
          res = await flashcardApi.getPublicDecks(page, 9, searchQuery || undefined, null, 'FLASHCARD');
        }

        setDecks(res.data?.content || []);
        setTotalPages(res.data?.totalPages || 0);
      } catch (err) {
        console.error('Failed to fetch flashcard decks', err);
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
        fetchDecks(currentPage, search, selectedSubject, tab);
      }
    }, 300);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [currentPage, search, selectedSubject, tab, fetchDecks]);

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
        setDecks((prev) => prev.filter((d) => d.id !== deckId));
      }
      toast.success(isFav ? 'Đã lưu bộ thẻ ghi nhớ' : 'Đã bỏ lưu bộ thẻ ghi nhớ');
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
      toast.success('Đã xóa bộ thẻ ghi nhớ thành công');
    } catch {
      toast.error('Không thể xóa bộ thẻ. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSubject('');
    setCurrentPage(0);
  };

  const hasActiveFilters = Boolean(search || selectedSubject);

  const renderDeckCard = (deck: FlashcardDeck) => {
    const isFav = favoriteIds.has(deck.id);
    const tags = deck.tags
      ? deck.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : deck.subject
      ? [deck.subject]
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
      { icon: <GalleryVerticalEnd size={13} />, label: `${deck.cards?.length ?? 0} thẻ` },
      { icon: <Users size={13} />, label: `${(deck.learnerCount ?? 0).toLocaleString()} học viên` },
      ...(deck.folderName
        ? [{ icon: <Folder size={13} />, label: deck.folderName, colorClass: 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted' }]
        : []),
    ];

    const isOwner = user?.id === deck.ownerId || isTeacher || user?.role === 'ADMIN';

    return (
      <ContentCard
        key={deck.id}
        title={deck.title}
        description={deck.description || undefined}
        imageUrl={deck.imageUrl || undefined}
        coverIcon={<GalleryVerticalEnd size={26} />}
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
                to={`/flashcards/${deck.id}`}
                className="btn btn-chinh flex-1 py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                Học thẻ ghi nhớ <ArrowRight size={14} />
              </Link>
            )}

            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShareDeck(deck);
                  }}
                  title="Chia sẻ bộ thẻ"
                  className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shrink-0"
                >
                  <Share2 size={14} />
                </button>
                <Link
                  to={`/flashcards/${deck.id}/edit`}
                  className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shrink-0"
                  title="Chỉnh sửa bộ thẻ"
                >
                  <Pencil size={14} />
                </Link>
                <button
                  type="button"
                  onClick={(e) => confirmDeleteDeck(deck.id, e)}
                  className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shrink-0"
                  title="Xóa bộ thẻ"
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
              <GalleryVerticalEnd size={22} />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text">
                Bộ thẻ ghi nhớ Flashcard
              </h1>
              <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted mt-0.5">
                {isTeacher
                  ? 'Quản lý, biên soạn và phân phối các bộ Flashcard ghi nhớ kiến thức cho học viên'
                  : 'Ghi nhớ nhanh các định nghĩa, công thức và kiến thức quan trọng qua phương pháp lặp lại ngắt quãng'}
              </p>
            </div>
          </div>
        </div>

        {/* Nut tao bo the: chi GV/Admin, khop voi rang buoc role cua route /flashcards/create */}
        {(isTeacher || isAdmin) && (
          <div className="shrink-0">
            <Link
              to="/flashcards/create"
              className="btn btn-chinh px-4 py-2.5 text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-bouncy"
            >
              <Plus size={18} />
              Tạo bộ thẻ mới
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
              Tất cả bộ thẻ
            </button>

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
              placeholder="Tìm kiếm bộ thẻ theo tên hoặc mô tả..."
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

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-1 border-t border-gray-100 dark:border-night-border/60">
          <button
            onClick={() => {
              setSelectedSubject('');
              setCurrentPage(0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              !selectedSubject
                ? 'bg-cam text-white shadow-sm'
                : 'bg-gray-100/80 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:bg-gray-200/70 dark:hover:bg-night-border'
            }`}
          >
            Tất cả môn học
          </button>
          {SUBJECT_FILTERS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setSelectedSubject(selectedSubject === tag ? '' : tag);
                setCurrentPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === tag
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
      {loading && <LoadingOverlay text="Đang tải danh sách thẻ ghi nhớ..." />}

      <div className={loading && decks.length === 0 ? 'min-h-[50vh]' : ''}>
        {decks.length === 0 && !loading ? (
          <div className="text-center py-20 bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border shadow-soft">
            <div className="w-16 h-16 bg-cam/10 dark:bg-cam/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cam">
              {tab === 'favorites' ? <Bookmark size={30} /> : <GalleryVerticalEnd size={30} />}
            </div>
            <h3 className="font-heading text-lg font-bold text-vutru dark:text-night-text mb-1">
              {tab === 'favorites'
                ? 'Bạn chưa lưu bộ thẻ ghi nhớ nào'
                : tab === 'mine'
                ? 'Bạn chưa tạo bộ thẻ ghi nhớ nào'
                : 'Không tìm thấy bộ thẻ phù hợp'}
            </h3>
            <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted max-w-sm mx-auto mb-5">
              {tab === 'favorites'
                ? 'Hãy khám phá các bộ thẻ công khai và nhấn biểu tượng bookmark để lưu lại học bất cứ lúc nào.'
                : tab === 'mine'
                ? 'Bắt đầu biên soạn bộ Flashcard đầu tiên để ghi nhớ công thức, từ vựng và khái niệm nhanh chóng.'
                : hasActiveFilters
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn môn học hiện tại để xem thêm kết quả.'
                : 'Hiện tại chưa có bộ thẻ ghi nhớ nào trong danh mục này. Vui lòng quay lại sau.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="btn btn-phu text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <X size={14} /> Xóa bộ lọc tìm kiếm
              </button>
            ) : tab === 'mine' && (isTeacher || isAdmin) ? (
              <Link
                to="/flashcards/create"
                className="btn btn-chinh text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <Plus size={14} /> Tạo bộ thẻ ghi nhớ mới
              </Link>
            ) : (
              <button
                onClick={() => {
                  setTab('all');
                  clearFilters();
                }}
                className="btn btn-chinh text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                Khám phá tất cả bộ thẻ
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

      {/* ── 5. Share Modal ── */}
      {shareDeck && (
        <ShareModal
          resourceType="DECK"
          resourceId={shareDeck.id}
          resourceTitle={shareDeck.title}
          onClose={() => setShareDeck(null)}
          onCloned={() => {
            setShareDeck(null);
            fetchDecks(currentPage, search, selectedSubject, tab);
          }}
        />
      )}

      {/* ── 6. Confirm Delete Dialog ── */}
      <ConfirmDialog
        isOpen={Boolean(deckToDelete)}
        onClose={() => setDeckToDelete(null)}
        onConfirm={handleDeleteDeck}
        title="Xác nhận xóa bộ thẻ ghi nhớ"
        message="Bạn có chắc chắn muốn xóa bộ thẻ này không? Toàn bộ các thẻ ghi nhớ và tiến độ ôn tập liên quan sẽ bị xóa vĩnh viễn."
        confirmText="Xóa vĩnh viễn"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FlashcardList;
