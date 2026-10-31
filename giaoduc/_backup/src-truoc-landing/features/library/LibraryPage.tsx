import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { resourceApi, ContentResource, ResourceType } from '../../services/resourceApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UploadResourceModal, { GRADE_OPTIONS, SUBJECT_OPTIONS, getSubjectLabel, getGradeLabel } from './UploadResourceModal';
import Pagination from '../../components/ui/Pagination';
import Select from '../../components/ui/Select';
import { 
  Plus, Search, Video, FileText, Music, Presentation, 
  ClipboardList, Heart, Bookmark, Eye, Sparkles, Filter, 
  BookOpen, Layers, UserCheck
} from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';
import { Library } from 'lucide-react';
type SidebarTab = 'ALL' | 'EXAM' | 'DOCUMENT' | 'VIDEO' | 'SLIDE' | 'AUDIO' | 'MY_UPLOADS' | 'MY_BOOKMARKS';

const LibraryPage: React.FC = () => {
  const { user, isTeacher, isAdmin, isTeachingAssistant, isOffice } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isTeacherOrStaff = isTeacher || isAdmin || isTeachingAssistant || isOffice || 
    ['TEACHER', 'TEACHING_ASSISTANT', 'ADMIN', 'OFFICE', 'STAFF', 'ROLE_TEACHER', 'ROLE_ADMIN', 'ROLE_TEACHING_ASSISTANT', 'ROLE_OFFICE', 'ROLE_STAFF'].includes(user?.role || '');

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<SidebarTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states
  const [resources, setResources] = useState<ContentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(0);
  }, [selectedGrade, selectedSubject, activeTab, searchQuery]);

  useEffect(() => {
    loadResources(currentPage);
  }, [selectedGrade, selectedSubject, activeTab, searchQuery, currentPage]);

  const loadResources = async (page: number) => {
    setLoading(true);
    try {
      if (activeTab === 'MY_BOOKMARKS') {
        const res = await resourceApi.getMyBookmarks(page, 15);
        const data = res.data;
        const list = data?.content || (Array.isArray(data) ? data : []);
        setResources(list);
        setTotalPages(data?.totalPages || (list.length > 0 ? 1 : 0));
        setTotalElements(data?.totalElements || list.length);
      } else if (activeTab === 'MY_UPLOADS') {
        const res = await resourceApi.getMyUploads(page, 15);
        const data = res.data;
        const list = data?.content || (Array.isArray(data) ? data : []);
        setResources(list);
        setTotalPages(data?.totalPages || (list.length > 0 ? 1 : 0));
        setTotalElements(data?.totalElements || list.length);
      } else {
        const resourceType = ['EXAM', 'DOCUMENT', 'VIDEO', 'SLIDE', 'AUDIO'].includes(activeTab) ? activeTab : undefined;
        const res = await resourceApi.getResources({
          resourceType,
          grade: selectedGrade !== 'ALL' ? selectedGrade : undefined,
          subject: selectedSubject !== 'ALL' ? selectedSubject : undefined,
          search: searchQuery.trim() || undefined,
          page,
          size: 15,
        });
        const data = res.data;
        const list = data?.content || (Array.isArray(data) ? data : []);
        setResources(list);
        setTotalPages(data?.totalPages || (list.length > 0 ? 1 : 0));
        setTotalElements(data?.totalElements || list.length);
      }
    } catch {
      toast.error('Không thể tải danh sách tài liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, resId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thích tài liệu');
      return;
    }
    try {
      const res = await resourceApi.toggleLike(resId);
      const isLiked = res.data.liked;
      setResources((prev) =>
        prev.map((item) =>
          item.id === resId
            ? {
                ...item,
                isLiked,
                likeCount: item.likeCount + (isLiked ? 1 : -1),
              }
            : item
        )
      );
    } catch {
      toast.error('Không thể thực hiện thao tác');
    }
  };

  const handleToggleBookmark = async (e: React.MouseEvent, resId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.warning('Vui lòng đăng nhập để lưu tài liệu');
      return;
    }
    try {
      const res = await resourceApi.toggleBookmark(resId);
      const isBookmarked = res.data.bookmarked;
      setResources((prev) =>
        prev.map((item) =>
          item.id === resId
            ? {
                ...item,
                isBookmarked,
                bookmarkCount: item.bookmarkCount + (isBookmarked ? 1 : -1),
              }
            : item
        )
      );
      if (isBookmarked) {
        toast.success('Đã lưu tài liệu vào kho của bạn!');
      } else {
        toast.info('Đã bỏ lưu tài liệu');
      }
    } catch {
      toast.error('Không thể thực hiện thao tác');
    }
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'VIDEO':
        return <Video size={20} className="text-rose-500" />;
      case 'AUDIO':
        return <Music size={20} className="text-emerald-500" />;
      case 'SLIDE':
        return <Presentation size={20} className="text-purple-500" />;
      case 'EXAM':
        return <ClipboardList size={20} className="text-amber-500" />;
      default:
        return <FileText size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <PageHeader
        icon={Library}
        title="Kho học liệu"
        subtitle="Tài liệu, đề thi, video và file nghe dùng chung cho các lớp học."
      />
      {/* ══════════════════════════════════════════════════════════════════
          TOP HORIZONTAL BAR: Grade Level Pills & Search / Subject Filters
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-4 sm:p-5 shadow-soft space-y-4">
        {/* Grade Scrollable Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Layers size={14} className="text-cam" /> Khối:
          </span>

          <button
            type="button"
            onClick={() => setSelectedGrade('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedGrade === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-cam shadow-2xs'
                : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
            }`}
          >
            Tất cả
          </button>

          {GRADE_OPTIONS.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setSelectedGrade(g.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedGrade === g.value
                  ? 'bg-slate-900 text-white dark:bg-cam shadow-2xs'
                  : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Search Input & Subject Select */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-gray-100 dark:border-night-border">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu, giáo viên, chủ đề bài học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs text-vutru dark:text-night-text focus:ring-2 focus:ring-cam outline-none"
            />
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-gray-400 shrink-0" />
            <Select
              value={selectedSubject}
              onChange={(v) => setSelectedSubject(v)}
              className="w-full sm:w-48 px-3 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated text-xs text-vutru dark:text-night-text font-medium focus:ring-2 focus:ring-cam outline-none"
              options={[{ value: 'ALL', label: 'Tất cả môn học' }, ...SUBJECT_OPTIONS]}
            />
          </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════════
          MAIN BODY: Left Sidebar Navigation & Right Content Card Grid
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Sidebar Navigation (3 cols) ── */}
        <div className="lg:col-span-3 space-y-3">
          {/* Upload CTA Button (Teachers / Staff) */}
          {isTeacherOrStaff && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cam to-orange-500 hover:from-camDam hover:to-orange-600 text-white font-bold text-xs sm:text-sm shadow-soft hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Plus size={18} /> Đóng góp nội dung
            </button>
          )}

          <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border p-3 shadow-soft space-y-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'ALL'
                  ? 'bg-cam/10 text-cam font-extrabold'
                  : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
              }`}
            >
              <BookOpen size={16} /> Tất cả tài liệu
            </button>

            <button
              onClick={() => setActiveTab('EXAM')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'EXAM'
                  ? 'bg-cam/10 text-cam font-extrabold'
                  : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
              }`}
            >
              <ClipboardList size={16} className="text-amber-500" /> Bài tập, Đề thi
            </button>

            <button
              onClick={() => setActiveTab('DOCUMENT')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'DOCUMENT'
                  ? 'bg-cam/10 text-cam font-extrabold'
                  : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
              }`}
            >
              <FileText size={16} className="text-blue-500" /> Tài liệu tham khảo
            </button>

            <button
              onClick={() => setActiveTab('VIDEO')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'VIDEO'
                  ? 'bg-cam/10 text-cam font-extrabold'
                  : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
              }`}
            >
              <Video size={16} className="text-rose-500" /> Bài giảng Video
            </button>

            <button
              onClick={() => setActiveTab('SLIDE')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'SLIDE'
                  ? 'bg-cam/10 text-cam font-extrabold'
                  : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
              }`}
            >
              <Presentation size={16} className="text-purple-500" /> Slide Powerpoint
            </button>

            <button
              onClick={() => setActiveTab('AUDIO')}
              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                activeTab === 'AUDIO'
                  ? 'bg-cam/10 text-cam font-extrabold'
                  : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
              }`}
            >
              <Music size={16} className="text-emerald-500" /> File nghe & Đề kèm
            </button>

            <div className="pt-2 border-t border-gray-100 dark:border-night-border mt-2 space-y-1">
              {/* Teacher personal uploads */}
              {isTeacherOrStaff && (
                <button
                  onClick={() => setActiveTab('MY_UPLOADS')}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                    activeTab === 'MY_UPLOADS'
                      ? 'bg-cam/10 text-cam font-extrabold'
                      : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
                  }`}
                >
                  <UserCheck size={16} className="text-sky-500" /> Nội dung bạn đăng
                </button>
              )}

              {/* Bookmarked resources (Both Students & Teachers) */}
              <button
                onClick={() => setActiveTab('MY_BOOKMARKS')}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2.5 transition-all ${
                  activeTab === 'MY_BOOKMARKS'
                    ? 'bg-cam/10 text-cam font-extrabold'
                    : 'text-vutruNhat dark:text-night-muted hover:bg-gray-50 dark:hover:bg-night-elevated hover:text-vutru'
                }`}
              >
                <Bookmark size={16} className="text-amber-500" /> Nội dung đã lưu
              </button>
            </div>
          </div>
        </div>


        {/* ── Right Content Area (9 cols) ── */}
        <div className="lg:col-span-9 space-y-4">
          {/* Header Title & Count */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-bold text-vutru dark:text-night-text flex items-center gap-2">
              <span>
                {activeTab === 'MY_BOOKMARKS' ? 'Nội dung bạn đã lưu' :
                 activeTab === 'MY_UPLOADS' ? 'Nội dung do bạn đăng tải' :
                 activeTab === 'VIDEO' ? 'Bài giảng Video' :
                 activeTab === 'AUDIO' ? 'File nghe & Đề thi đi kèm' :
                 activeTab === 'SLIDE' ? 'Slide Powerpoint' :
                 activeTab === 'EXAM' ? 'Bài tập, Đề thi' :
                 activeTab === 'DOCUMENT' ? 'Tài liệu tham khảo' : 'Kho học liệu toàn diện'}
              </span>
              <span className="text-xs text-vutruNhat dark:text-night-muted font-normal">
                ({totalElements} nội dung)
              </span>
            </h2>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-20 text-center text-gray-400">
              <div className="w-8 h-8 border-3 border-cam border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-medium">Đang tải dữ liệu...</p>
            </div>
          ) : resources.length === 0 ? (
            /* EMPTY RESOURCE STATE */
            <div className="p-12 text-center bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border">
              <Sparkles size={40} className="mx-auto text-cam mb-2" />
              <p className="text-sm font-bold text-vutru dark:text-night-text mb-1">Chưa có học liệu phù hợp</p>
              <p className="text-xs text-vutruNhat dark:text-night-muted mb-4">
                Thử chọn khối lớp khác hoặc tìm kiếm với từ khóa khác
              </p>
              {isTeacherOrStaff && (
                <button onClick={() => setUploadModalOpen(true)} className="btn btn-chinh text-xs">
                  + Đóng góp tài liệu đầu tiên
                </button>
              )}
            </div>
          ) : (
            /* RESOURCE CARDS GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resources.map((res) => (
                <Link
                  key={res.id}
                  to={`/library/resources/${res.id}`}
                  className="block p-4 sm:p-5 rounded-2xl bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border shadow-soft hover:shadow-md hover:border-cam/40 transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top: Icon + Title */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-night-elevated flex items-center justify-center shrink-0 shadow-2xs">
                        {getResourceTypeIcon(res.resourceType)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-bold text-vutru dark:text-night-text line-clamp-2 group-hover:text-cam transition-colors leading-snug">
                          {res.title}
                        </h3>
                        <p className="text-[11px] font-semibold text-cam mt-0.5">
                          {getGradeLabel(res.grade)} · {getSubjectLabel(res.subject)}
                        </p>
                      </div>
                    </div>

                    {/* Author / Teacher Name */}
                    <div className="flex items-center gap-1.5 text-xs text-vutruNhat dark:text-night-muted pt-1">
                      <span className="text-[11px]">👤 Người soạn:</span>
                      <span className="font-semibold text-vutru dark:text-night-text truncate">{res.authorName}</span>
                    </div>
                  </div>

                  {/* Bottom: Stats & Action Buttons */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 dark:border-night-border text-xs text-vutruNhat dark:text-night-muted">
                    <div className="flex items-center gap-2.5 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Eye size={12} /> {res.viewCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart size={12} className={res.isLiked ? 'fill-rose-500' : ''} /> {res.likeCount}
                      </span>
                    </div>

                    {/* Bookmark / Like quick buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleLike(e, res.id)}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors ${
                          res.isLiked ? 'text-rose-500' : 'text-gray-400'
                        }`}
                        title="Thích"
                      >
                        <Heart size={14} className={res.isLiked ? 'fill-rose-500' : ''} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleToggleBookmark(e, res.id)}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-night-elevated transition-colors ${
                          res.isBookmarked ? 'text-cam' : 'text-gray-400'
                        }`}
                        title={res.isBookmarked ? 'Bỏ lưu' : 'Lưu tài liệu'}
                      >
                        <Bookmark size={14} className={res.isBookmarked ? 'fill-cam' : ''} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Upload Resource Modal */}
      <UploadResourceModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => loadResources(0)}
      />
    </div>
  );
};

export default LibraryPage;
