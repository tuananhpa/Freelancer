import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import ContentCard from '../../components/common/ContentCard';
import Table from '../../components/ui/DataTable';
import {
  Search,
  Plus,
  ClipboardList,
  Timer,
  HelpCircle,
  Folder,
  BarChart2,
  Copy,
  Edit2,
  EyeOff,
  Send,
  Trash2,
  Share2,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  XCircle,
  Calendar,
  Lock,
  Layers,
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  examCode?: string;
  durationMinutes: number;
  isPublished: boolean;
  visibility?: 'PUBLIC' | 'HIDDEN' | 'CLASSROOM';
  accessCode?: string;
  questionCount: number;
  createdAt: string;
  folderId?: string | null;
  folderName?: string | null;
  subject?: string;
  grade?: string;
  isFavorited?: boolean;
  teacherName?: string;
  teacherAvatar?: string;
  teacherId?: string;
  accessLevel?: 'FULL' | 'PREVIEW';
  locked?: boolean;
  previewRank?: number;
  unlockHint?: string;
}

interface ExamHistory {
  resultId: string;
  examId: string;
  examTitle: string;
  examCode?: string;
  teacherName: string;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string;
  timeTakenSeconds: number;
  pendingTeacherReview?: boolean;
}

const BatchAssignExamModal = React.lazy(() => import('./BatchAssignExamModal'));

// ── Skeleton Loader ──
const ExamCardSkeleton = () => (
  <div className="bg-white dark:bg-night-surface rounded-3xl overflow-hidden border border-gray-100 dark:border-night-border shadow-soft animate-pulse flex flex-col">
    <div className="h-40 bg-gray-100 dark:bg-night-elevated" />
    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-night-border rounded-lg w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-night-border/60 rounded-lg w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-16 bg-gray-100 dark:bg-night-border rounded-full" />
        <div className="h-6 w-20 bg-gray-100 dark:bg-night-border rounded-full" />
      </div>
      <div className="h-9 bg-gray-200/80 dark:bg-night-elevated rounded-xl w-full" />
    </div>
  </div>
);

const ExamList: React.FC = () => {
  const { user, isTeacher } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [exams, setExams] = useState<Exam[]>([]);
  const [historyExams, setHistoryExams] = useState<ExamHistory[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedExamForAssign, setSelectedExamForAssign] = useState<{ id: string; title: string } | null>(null);

  // Cho phep mo thang mot tab qua URL, vi du /exams?view=history tu dashboard
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view');
  const [viewType, setViewType] = useState<'all' | 'my' | 'favorite' | 'history'>(
    initialView === 'history' || initialView === 'my' || initialView === 'favorite' || initialView === 'all'
      ? initialView
      : isTeacher ? 'my' : 'all'
  );
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinMenu, setShowJoinMenu] = useState(false);
  const joinMenuRef = useRef<HTMLDivElement>(null);

  const [historyStatus, setHistoryStatus] = useState<string>('');
  const [historyFromDate, setHistoryFromDate] = useState<string>('');
  const [historyToDate, setHistoryToDate] = useState<string>('');

  useEffect(() => {
    api
      .get('/exams/subjects')
      .then((res) => setAvailableTags(res.data || []))
      .catch(console.error);
  }, []);

  // Click outside to close join menu popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (joinMenuRef.current && !joinMenuRef.current.contains(event.target as Node)) {
        setShowJoinMenu(false);
      }
    };
    if (showJoinMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showJoinMenu]);

  const fetchExams = useCallback(
    async (
      page: number,
      query: string = '',
      subject: string = '',
      grade: string = '',
      view: string = 'all',
      hStatus: string = '',
      hFrom: string = '',
      hTo: string = '',
      isCurrentCheck?: () => boolean
    ) => {
      try {
        setLoading(true);
        let endpoint = `/exams/public`;
        let params: any = {
          page,
          size: 9,
          search: query || undefined,
          subject: subject || undefined,
          grade: grade || undefined,
        };

        if (view === 'my') endpoint = `/exams/teacher`;
        if (view === 'favorite') endpoint = `/exams/favorites`;

        if (view === 'history') {
          endpoint = `/exams/history`;
          params = {
            page,
            size: 10,
            search: query || undefined,
            status: hStatus || undefined,
            fromDate: hFrom || undefined,
            toDate: hTo || undefined,
          };
        }

        const examRes = await api.get(endpoint, { params });

        if (isCurrentCheck && !isCurrentCheck()) return;

        if (view === 'history') {
          setHistoryExams(examRes.data.content || []);
          setExams([]);
        } else {
          setExams(examRes.data.content || []);
          setHistoryExams([]);
        }
        setTotalPages(examRes.data.totalPages || 0);
      } catch (err) {
        if (isCurrentCheck && !isCurrentCheck()) return;
        console.error('Error fetching exams', err);
      } finally {
        if (!isCurrentCheck || isCurrentCheck()) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    let isCurrent = true;
    const timer = setTimeout(() => {
      fetchExams(
        currentPage,
        search,
        subjectFilter,
        gradeFilter,
        viewType,
        historyStatus,
        historyFromDate,
        historyToDate,
        () => isCurrent
      );
    }, 300);
    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [
    currentPage,
    search,
    subjectFilter,
    gradeFilter,
    viewType,
    historyStatus,
    historyFromDate,
    historyToDate,
    fetchExams,
  ]);

  const toggleFavorite = async (id: string) => {
    try {
      const res = await api.post(`/exams/${id}/favorite`);
      const isFav = res.data.favorited;
      if (viewType === 'favorite' && !isFav) {
        fetchExams(currentPage, search, subjectFilter, gradeFilter, viewType);
      } else {
        setExams(exams.map((e) => (e.id === id ? { ...e, isFavorited: isFav } : e)));
      }
    } catch {
      toast.error('Lỗi khi cập nhật yêu thích');
    }
  };

  const togglePublish = async (id: string) => {
    try {
      await api.patch(`/exams/${id}/publish`);
      toast.success('Đã cập nhật trạng thái đề thi');
      fetchExams(currentPage, search, subjectFilter, gradeFilter, viewType);
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const deleteExam = async (id: string) => {
    const confirmed = await toast.confirm('Bạn có chắc chắn muốn xóa đề thi này? Toàn bộ kết quả thi liên quan có thể bị ảnh hưởng.', {
      title: 'Xác nhận xóa đề thi',
      confirmLabel: 'Xóa vĩnh viễn',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/exams/${id}`);
      fetchExams(currentPage, search, subjectFilter, gradeFilter, viewType);
      toast.success('Đã xóa đề thi thành công');
    } catch {
      toast.error('Lỗi khi xóa đề thi');
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setIsJoining(true);
    try {
      const res = await api.get(`/exams/code/${joinCode.trim().toUpperCase()}`);
      toast.success('Tìm thấy đề thi!');
      setShowJoinMenu(false);
      navigate(`/exams/take/${res.data.id}`);
    } catch (err: any) {
      if (!err.response?.data?.errorCode) {
        toast.error('Không tìm thấy đề thi với mã này.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSubjectFilter('');
    setGradeFilter('');
    setHistoryStatus('');
    setHistoryFromDate('');
    setHistoryToDate('');
    setCurrentPage(0);
  };

  const hasActiveFilters = search || subjectFilter || gradeFilter || historyStatus || historyFromDate || historyToDate;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cam/10 dark:bg-cam/20 flex items-center justify-center text-cam">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-vutru dark:text-night-text">
                Ngân hàng đề thi
              </h1>
              <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted mt-0.5">
                {isTeacher
                  ? 'Quản lý, tạo mới và phân phối các bài kiểm tra trắc nghiệm cho học viên'
                  : 'Luyện tập các đề thi thử, kiểm tra trực tuyến và theo dõi tiến độ điểm số'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {isTeacher ? (
            <button
              onClick={() => navigate('/exams/create')}
              className="btn btn-chinh px-4 py-2.5 text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-bouncy"
            >
              <Plus size={18} />
              Tạo đề thi mới
            </button>
          ) : (
            <div className="relative" ref={joinMenuRef}>
              <button
                onClick={() => setShowJoinMenu(!showJoinMenu)}
                className="btn btn-chinh px-4 py-2.5 text-sm font-bold flex items-center gap-2 shadow-soft hover:shadow-bouncy"
              >
                <Sparkles size={16} />
                Vào thi bằng mã
              </button>

              {showJoinMenu && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border shadow-2xl rounded-2xl p-4 z-50 animate-fade-in text-left">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-vutru dark:text-night-text">Nhập mã đề thi</h3>
                    <button
                      onClick={() => setShowJoinMenu(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-night-text"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-vutruNhat dark:text-night-muted mb-3">
                    Nhập mã đề do giáo viên cung cấp để bắt đầu làm bài ngay.
                  </p>
                  <form onSubmit={handleJoinByCode} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="VD: EXAM102"
                      className="input-field flex-1 text-sm font-bold uppercase tracking-wider py-2"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      maxLength={15}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="btn btn-chinh py-2 px-4 text-sm font-bold"
                      disabled={!joinCode.trim() || isJoining}
                    >
                      {isJoining ? '...' : 'Vào thi'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Navigation Tabs & Search Controls ── */}
      <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Role Tabs */}
          <div className="flex items-center p-1 bg-gray-100/80 dark:bg-night-elevated rounded-xl gap-1 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => {
                setViewType('all');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                viewType === 'all'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
              }`}
            >
              Tất cả đề thi
            </button>

            {isTeacher && (
              <button
                onClick={() => {
                  setViewType('my');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  viewType === 'my'
                    ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                }`}
              >
                Đề thi của tôi
              </button>
            )}

            <button
              onClick={() => {
                setViewType('favorite');
                setCurrentPage(0);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                viewType === 'favorite'
                  ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                  : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
              }`}
            >
              Đã lưu
            </button>

            {!isTeacher && (
              <button
                onClick={() => {
                  setViewType('history');
                  setCurrentPage(0);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  viewType === 'history'
                    ? 'bg-white dark:bg-night-surface text-cam shadow-sm'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                }`}
              >
                Lịch sử làm bài
              </button>
            )}
          </div>

          {/* Search & Select Filters */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-1 md:max-w-xl justify-end">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-night-muted" size={16} />
              <input
                type="text"
                placeholder={viewType === 'history' ? 'Tìm bài đã thi...' : 'Tìm kiếm theo tên đề thi...'}
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

            {viewType !== 'history' ? (
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={gradeFilter}
                  onChange={(v) => {
                    setGradeFilter(v);
                    setCurrentPage(0);
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs font-medium text-vutru dark:text-night-text focus:border-cam focus:ring-1 focus:ring-cam transition-all"
                  options={[
                    { value: '', label: 'Khối lớp' },
                    { value: 'Lớp 6', label: 'Lớp 6' },
                    { value: 'Lớp 7', label: 'Lớp 7' },
                    { value: 'Lớp 8', label: 'Lớp 8' },
                    { value: 'Lớp 9', label: 'Lớp 9' },
                    { value: 'Lớp 10', label: 'Lớp 10' },
                    { value: 'Lớp 11', label: 'Lớp 11' },
                    { value: 'Lớp 12', label: 'Lớp 12' },
                    { value: 'Đại học', label: 'Đại học' },
                  ]}
                />

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="p-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50 dark:bg-night-elevated text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors"
                    title="Xóa bộ lọc"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <Select
                  value={historyStatus}
                  onChange={(v) => {
                    setHistoryStatus(v);
                    setCurrentPage(0);
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs font-medium text-vutru dark:text-night-text"
                  options={[
                    { value: '', label: 'Tất cả kết quả' },
                    { value: 'passed', label: 'Đạt' },
                    { value: 'failed', label: 'Chưa đạt' },
                  ]}
                />

                <input
                  type="date"
                  value={historyFromDate}
                  onChange={(e) => {
                    setHistoryFromDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs text-vutru dark:text-night-text"
                  title="Từ ngày"
                />

                <input
                  type="date"
                  value={historyToDate}
                  onChange={(e) => {
                    setHistoryToDate(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs text-vutru dark:text-night-text"
                  title="Đến ngày"
                />
              </div>
            )}
          </div>
        </div>

        {/* Subject Pills Horizontal Bar (Only for non-history tabs) */}
        {viewType !== 'history' && (
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pt-1 border-t border-gray-100 dark:border-night-border/60">
            <button
              onClick={() => {
                setSubjectFilter('');
                setCurrentPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                !subjectFilter
                  ? 'bg-cam text-white shadow-sm'
                  : 'bg-gray-100/80 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:bg-gray-200/70 dark:hover:bg-night-border'
              }`}
            >
              Tất cả môn
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSubjectFilter(tag);
                  setCurrentPage(0);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  subjectFilter === tag
                    ? 'bg-cam text-white shadow-sm'
                    : 'bg-gray-100/80 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text hover:bg-gray-200/70 dark:hover:bg-night-border'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Content Section (Cards / Table / Skeletons) ── */}
      <div>
        {loading && <LoadingOverlay text="Đang tải danh sách đề thi..." />}

        {(viewType === 'history' ? historyExams.length === 0 : exams.length === 0) && !loading ? (
          <div className="text-center py-20 bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border shadow-soft">
            <div className="w-16 h-16 bg-cam/10 dark:bg-cam/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cam">
              <ClipboardList size={30} />
            </div>
            <h3 className="font-heading text-lg font-bold text-vutru dark:text-night-text mb-1">
              {viewType === 'history' ? 'Chưa có lịch sử làm bài' : 'Không tìm thấy đề thi phù hợp'}
            </h3>
            <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted max-w-sm mx-auto mb-5">
              {viewType === 'history'
                ? 'Bạn chưa hoàn thành bài thi nào. Hãy khám phá danh sách đề thi và bắt đầu làm bài ngay.'
                : hasActiveFilters
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc hiện tại để xem thêm kết quả.'
                : isTeacher
                ? 'Bắt đầu tạo bài kiểm tra đầu tiên để giao bài và đánh giá kết quả học tập của học viên.'
                : 'Hiện chưa có đề thi nào trong danh mục này. Vui lòng quay lại sau.'}
            </p>
            {hasActiveFilters ? (
              <button onClick={clearFilters} className="btn btn-phu text-xs py-2 px-4 inline-flex items-center gap-1.5">
                <X size={14} /> Xóa bộ lọc tìm kiếm
              </button>
            ) : isTeacher && viewType !== 'history' ? (
              <Link to="/exams/create" className="btn btn-chinh text-xs py-2 px-4 inline-flex items-center gap-1.5">
                <Plus size={14} /> Tạo đề thi mới
              </Link>
            ) : (
              <button onClick={() => setViewType('all')} className="btn btn-chinh text-xs py-2 px-4 inline-flex items-center gap-1.5">
                Khám phá tất cả đề thi
              </button>
            )}
          </div>
        ) : viewType === 'history' ? (
          <div className="bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <Table
                columns={[
                  {
                    key: 'examTitle',
                    header: 'Đề thi',
                    render: (row: ExamHistory) => (
                      <div className="font-bold text-vutru dark:text-night-text hover:text-cam transition-colors">
                        {row.examTitle}
                        {row.examCode && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted font-mono">
                            {row.examCode}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'teacherName',
                    header: 'Giáo viên',
                    render: (row: ExamHistory) => (
                      <span className="text-xs text-vutruNhat dark:text-night-muted">{row.teacherName || 'Chưa rõ'}</span>
                    ),
                  },
                  {
                    key: 'startedAt',
                    header: 'Thời gian nộp bài',
                    render: (row: ExamHistory) => {
                      const dateStr = row.submittedAt || row.startedAt;
                      if (!dateStr) return <span className="text-xs text-vutruNhat dark:text-night-muted">Đang làm</span>;
                      try {
                        const d = new Date(dateStr);
                        return (
                          <span className="text-xs text-vutruNhat dark:text-night-muted">
                            {isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN')}
                          </span>
                        );
                      } catch {
                        return <span className="text-xs text-vutruNhat dark:text-night-muted">{dateStr}</span>;
                      }
                    },
                  },
                  {
                    key: 'timeTakenSeconds',
                    header: 'Thời lượng',
                    render: (row: ExamHistory) => {
                      const sec = Number(row.timeTakenSeconds) || 0;
                      const m = Math.floor(sec / 60);
                      const s = sec % 60;
                      return (
                        <span className="text-xs font-medium text-vutru dark:text-night-text">
                          {m}p {s}s
                        </span>
                      );
                    },
                  },
                  {
                    key: 'score',
                    header: 'Điểm số',
                    render: (row: ExamHistory) => {
                      if (row.pendingTeacherReview) {
                        return <span className="text-xs text-gray-400 dark:text-night-muted italic">—</span>;
                      }
                      const total = row.totalScore != null ? Number(row.totalScore).toFixed(1) : '0.0';
                      const max = row.maxScore != null ? Number(row.maxScore) : 10;
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-cam text-sm">{total}</span>
                          <span className="text-xs text-gray-400">/{max}</span>
                        </div>
                      );
                    },
                  },
                  {
                    key: 'isPassed',
                    header: 'Trạng thái',
                    render: (row: ExamHistory) =>
                      row.pendingTeacherReview ? (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          Chờ chấm
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${
                            row.isPassed
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}
                        >
                          {row.isPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {row.isPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      ),
                  },
                ]}
                data={historyExams}
                onRowClick={(row) => navigate(`/exams/results/${row.resultId}`)}
                emptyMessage="Bạn chưa có lịch sử làm bài nào."
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const tags = [];
              if (exam.subject) tags.push(exam.subject);
              if (exam.grade) tags.push(exam.grade);

              const chips = [
                { icon: <Timer size={13} />, label: `${exam.durationMinutes} phút` },
                { icon: <HelpCircle size={13} />, label: `${exam.questionCount} câu` },
                ...(exam.folderName
                  ? [{ icon: <Folder size={13} />, label: exam.folderName, colorClass: 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted' }]
                  : []),
                ...(isTeacher && viewType === 'my' && exam.examCode
                  ? [{ icon: <span />, label: `Mã: ${exam.examCode}`, colorClass: 'bg-cam/10 text-camDam dark:text-cam font-bold' }]
                  : []),
              ];

              return (
                <ContentCard
                  key={exam.id}
                  title={exam.title}
                  coverIcon={<ClipboardList size={26} />}
                  owner={exam.teacherName ? { name: exam.teacherName, avatar: exam.teacherAvatar } : undefined}
                  tags={tags.length > 0 ? tags : undefined}
                  chips={chips}
                  locked={!!exam.locked && viewType === 'all'}
                  unlockHint={exam.unlockHint}
                  onUnlockClick={() => navigate('/classes')}
                  topLeftBadge={
                    exam.accessLevel === 'PREVIEW' && !exam.locked ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        Xem thử
                      </span>
                    ) : exam.visibility === 'PUBLIC' ? (
                      <span className="text-[10px] font-bold bg-cam text-white px-2.5 py-0.5 rounded-full shadow-xs">
                        Công khai
                      </span>
                    ) : exam.visibility === 'CLASSROOM' ? (
                      <span className="text-[10px] font-bold bg-indigo-600 dark:bg-indigo-500 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                        Lớp học
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-600 dark:bg-slate-700 text-white px-2.5 py-0.5 rounded-full shadow-xs">
                        Riêng tư
                      </span>
                    )
                  }
                  statusBadge={
                    (isTeacher && viewType === 'my') || user?.role === 'ADMIN' ? (
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          exam.isPublished
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-night-elevated dark:text-night-muted'
                        }`}
                      >
                        {exam.isPublished ? 'Đã phát hành' : 'Bản nháp'}
                      </span>
                    ) : undefined
                  }
                  isFavorited={exam.isFavorited}
                  onToggleFavorite={() => toggleFavorite(exam.id)}
                  actions={
                    (isTeacher && viewType === 'my') || user?.role === 'ADMIN' ? (
                      <div className="flex items-center gap-2 w-full">
                        <Link
                          to={`/exams/${exam.id}/edit`}
                          className="btn btn-phu flex-1 py-1.5 text-xs flex justify-center items-center gap-1.5 font-bold"
                        >
                          <Edit2 size={13} /> Sửa
                        </Link>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedExamForAssign({ id: exam.id, title: exam.title });
                              setAssignModalOpen(true);
                            }}
                            title="Giao đề cho lớp"
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors shrink-0"
                          >
                            <Share2 size={14} />
                          </button>
                          {exam.isPublished && (
                            <>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/exams/take/${exam.id}`);
                                  toast.success('Đã sao chép link đề thi!');
                                }}
                                title="Sao chép link làm bài"
                                className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
                              >
                                <Copy size={14} />
                              </button>
                              <Link
                                to={`/exams/${exam.id}/analytics`}
                                title="Báo cáo kết quả"
                                className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center hover:bg-purple-100 transition-colors shrink-0"
                              >
                                <BarChart2 size={14} />
                              </Link>
                            </>
                          )}
                          <button
                            onClick={() => togglePublish(exam.id)}
                            title={exam.isPublished ? 'Gỡ xuống bản nháp' : 'Phát hành đề thi'}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                              exam.isPublished
                                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100'
                            }`}
                          >
                            {exam.isPublished ? <EyeOff size={14} /> : <Send size={14} />}
                          </button>
                          <button
                            onClick={() => deleteExam(exam.id)}
                            title="Xóa đề thi"
                            className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ) : exam.locked ? (
                      <button
                        type="button"
                        onClick={() => navigate('/classes')}
                        className="btn btn-phu w-full py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5"
                      >
                        <Lock size={14} /> Đăng ký lớp để mở khóa
                      </button>
                    ) : (
                      <Link
                        to={`/exams/take/${exam.id}`}
                        className="btn btn-chinh w-full py-2 text-xs font-bold text-center flex items-center justify-center gap-1.5"
                      >
                        Bắt đầu làm bài <ArrowRight size={14} />
                      </Link>
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. Pagination ── */}
      {!loading && (viewType === 'history' ? historyExams.length > 0 : exams.length > 0) && (
        <div className="mt-8">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* ── 5. Batch Assign Exam Modal ── */}
      {assignModalOpen && selectedExamForAssign && (
        <React.Suspense fallback={null}>
          <BatchAssignExamModal
            isOpen={assignModalOpen}
            onClose={() => setAssignModalOpen(false)}
            examId={selectedExamForAssign.id}
            examTitle={selectedExamForAssign.title}
            onSuccess={() => {
              fetchExams(currentPage, search, subjectFilter, gradeFilter, viewType);
            }}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default ExamList;
