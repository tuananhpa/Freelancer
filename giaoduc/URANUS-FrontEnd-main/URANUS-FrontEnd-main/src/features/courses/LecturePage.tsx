import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { courseApi, Course } from '../../services/courseApi';
import {
  SUBJECTS,
  SUBJECT_ORDER,
  detectSubject,
  detectGrade,
  groupClassesBySubjectAndGrade,
  type SubjectKey,
  type SubjectGroup,
} from '../../utils/classTaxonomy';
import { BookOpen, Search, LayoutGrid, GraduationCap, Plus, Pencil, PlayCircle, Layers } from 'lucide-react';

import PageHeader from '../../components/ui/PageHeader';
import { Presentation } from 'lucide-react';
/**
 * Trang "Bài giảng" — dùng lại dữ liệu Khóa học (`/courses`) của backend,
 * nhưng trình bày theo đúng cấu trúc của trang Lớp học: MÔN HỌC → KHỐI → danh sách.
 * Môn và khối được suy ra từ tiêu đề bài giảng (xem src/utils/classTaxonomy.ts),
 * ví dụ: "VẬT LÝ 12 — Dao động cơ" → môn Vật lý, khối 12.
 */

/** Ghép Course vào shape mà bộ phân loại môn/khối hiểu được. */
type LectureItem = Course & {
  /** Bắt buộc cho classTaxonomy — luôn bằng `title` */
  name: string;
  isMine: boolean;
};

const PAGE_SIZE = 50;
const MAX_PAGES = 6;

const BANNER_GRADIENTS = [
  'from-orange-500 to-rose-500',
  'from-violet-600 to-purple-500',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-pink-500 to-fuchsia-600',
  'from-amber-500 to-orange-600',
];

const getGradient = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return BANNER_GRADIENTS[Math.abs(hash) % BANNER_GRADIENTS.length];
};

/** Lấy hết các trang của một endpoint phân trang (chặn trên để tránh gọi vô hạn). */
async function fetchAllPages(
  loader: (page: number, size: number) => Promise<{ content?: Course[]; totalPages?: number }>
): Promise<Course[]> {
  const all: Course[] = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < MAX_PAGES) {
    const res = await loader(page, PAGE_SIZE);
    all.push(...(res?.content || []));
    totalPages = res?.totalPages ?? 1;
    page += 1;
  }
  return all;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
const LectureSkeleton = () => (
  <div className="bg-white dark:bg-night-surface rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-night-border animate-pulse">
    <div className="h-32 bg-gray-200 dark:bg-night-border" />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-gray-200 dark:bg-night-border rounded-lg w-3/4" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 dark:bg-night-border rounded-full w-20" />
        <div className="h-5 bg-gray-100 dark:bg-night-border rounded-full w-16" />
      </div>
      <div className="h-4 bg-gray-100 dark:bg-night-border rounded w-full" />
      <div className="h-4 bg-gray-100 dark:bg-night-border rounded w-2/3" />
    </div>
  </div>
);

// ── Lecture Card ──────────────────────────────────────────────────────────────
interface LectureCardProps {
  lecture: LectureItem;
  canEdit: boolean;
  onOpen: () => void;
  onEdit: () => void;
}

const LectureCard: React.FC<LectureCardProps> = ({ lecture, canEdit, onOpen, onEdit }) => {
  const subjectMeta = SUBJECTS[detectSubject(lecture)];
  const grade = detectGrade(lecture);
  const SubjectIcon = subjectMeta.icon;
  const sectionCount = lecture.sections?.length ?? 0;
  const lessonCount = (lecture.sections || []).reduce((sum, s) => sum + (s.lessons?.length ?? 0), 0);
  const isDraft = lecture.status === 'DRAFT';

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-night-surface rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-night-border cursor-pointer group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Banner */}
      <div
        className={`relative h-32 bg-gradient-to-br ${lecture.thumbnailUrl ? '' : getGradient(lecture.id)} bg-cover bg-center shrink-0`}
        style={lecture.thumbnailUrl ? { backgroundImage: `url(${lecture.thumbnailUrl})` } : {}}
      >
        {lecture.thumbnailUrl && <div className="absolute inset-0 bg-black/30" />}

        <div className="absolute top-3 left-3 max-w-[60%] bg-white/90 dark:bg-black/45 backdrop-blur-sm text-vutru dark:text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10 shadow-sm">
          <SubjectIcon size={11} className="shrink-0" />
          <span className="truncate">{subjectMeta.name}</span>
        </div>

        {isDraft && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 text-[11px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
            Bản nháp
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <PlayCircle size={24} className="text-camDam" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-vutru text-base leading-snug line-clamp-2 group-hover:text-camDam transition-colors mb-2">
          {lecture.title}
        </h3>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {grade !== 'OTHER' && (
            <span className="px-2.5 py-0.5 rounded-full bg-cam/10 text-cam text-xs font-bold border border-cam/20 flex items-center gap-1">
              <GraduationCap size={10} /> Khối {grade}
            </span>
          )}
          {sectionCount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-gray-300 text-xs font-medium flex items-center gap-1">
              <Layers size={10} /> {sectionCount} chương · {lessonCount} bài
            </span>
          )}
          {lecture.isMine && (
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              Của tôi
            </span>
          )}
        </div>

        <p className="text-vutruNhat text-sm line-clamp-2 leading-relaxed flex-1 min-h-[40px]">
          {lecture.description || <span className="italic opacity-60">Chưa có mô tả.</span>}
        </p>

        {canEdit && lecture.isMine && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-night-border flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex items-center gap-1.5 text-xs font-bold text-vutruNhat hover:text-cam px-2.5 py-1.5 rounded-lg hover:bg-cam/10 transition-colors"
            >
              <Pencil size={13} /> Sửa bài giảng
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Khối section ──────────────────────────────────────────────────────────────
const GradeSection: React.FC<{ label: string; count: number; children: React.ReactNode }> = ({ label, count, children }) => (
  <section className="mb-8 last:mb-0">
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cam/10 border border-cam/20">
        <GraduationCap size={15} className="text-cam" />
        <h3 className="text-sm font-extrabold tracking-wide text-camDam dark:text-cam">{label}</h3>
      </div>
      <span className="text-xs font-semibold text-vutruNhat">{count} bài giảng</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-night-border" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
  </section>
);

// ── Subject block ─────────────────────────────────────────────────────────────
const SubjectBlock: React.FC<{
  group: SubjectGroup<LectureItem>;
  renderCard: (lecture: LectureItem) => React.ReactNode;
}> = ({ group, renderCard }) => {
  const Icon = group.subject.icon;
  return (
    <section className="mb-12 last:mb-0">
      <div className={`rounded-2xl bg-gradient-to-r ${group.subject.gradient} px-5 py-4 mb-6 flex items-center gap-3 shadow-sm`}>
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Icon size={20} className="text-white" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-wide truncate">{group.subject.name}</h2>
          <p className="text-white/80 text-xs font-medium">{group.total} bài giảng</p>
        </div>
      </div>
      {group.grades.map((g) => (
        <GradeSection key={g.grade} label={g.label} count={g.classes.length}>
          {g.classes.map(renderCard)}
        </GradeSection>
      ))}
    </section>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
type TabKey = 'ALL' | SubjectKey;

const LecturePage: React.FC = () => {
  const navigate = useNavigate();
  const { isTeacher, isAdmin } = useAuth();
  const canManage = isTeacher || isAdmin;

  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [onlyMine, setOnlyMine] = useState(false);

  const fetchLectures = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [published, mine] = await Promise.all([
        fetchAllPages((p, s) => courseApi.getAllPublished(p, s)).catch(() => [] as Course[]),
        canManage
          ? fetchAllPages((p, s) => courseApi.getTeacherCourses(p, s)).catch(() => [] as Course[])
          : Promise.resolve([] as Course[]),
      ]);

      const mineIds = new Set(mine.map((c) => c.id));
      // Bài giảng của giáo viên ghi đè bản public để thấy được cả bản nháp
      const merged = new Map<string, Course>();
      published.forEach((c) => merged.set(c.id, c));
      mine.forEach((c) => merged.set(c.id, c));

      setLectures(
        Array.from(merged.values()).map((c) => ({
          ...c,
          name: c.title,
          isMine: mineIds.has(c.id),
        }))
      );
    } catch (err) {
      console.error('Error fetching lectures:', err);
      setError('Không tải được danh sách bài giảng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => { fetchLectures(); }, [fetchLectures]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lectures.filter((l) => {
      if (onlyMine && !l.isMine) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q)
      );
    });
  }, [lectures, search, onlyMine]);

  const groups = useMemo(() => groupClassesBySubjectAndGrade(filtered), [filtered]);
  const groupByKey = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.subject.key, g])) as Record<SubjectKey, SubjectGroup<LectureItem>>,
    [groups]
  );
  const visibleSubjects = useMemo(
    () => SUBJECT_ORDER.filter((key) => key !== 'OTHER' || (groupByKey.OTHER?.total ?? 0) > 0),
    [groupByKey]
  );

  const renderCard = useCallback((lecture: LectureItem) => (
    <LectureCard
      key={lecture.id}
      lecture={lecture}
      canEdit={canManage}
      onOpen={() => navigate(`/courses/${lecture.id}`)}
      onEdit={() => navigate(`/courses/${lecture.id}/edit`)}
    />
  ), [canManage, navigate]);

  const activeGroup = activeTab === 'ALL' ? null : groupByKey[activeTab];
  const nonEmptyGroups = groups.filter((g) => g.total > 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <PageHeader
          className="flex-1 min-w-0"
          icon={Presentation}
          title="Bài giảng"
          subtitle={!loading ? `${filtered.length} bài giảng ${search ? 'tìm thấy' : 'khả dụng'} · chia theo môn học và khối` : undefined}
        />

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm bài giảng..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-white dark:bg-night-elevated text-sm focus:outline-none focus:border-cam transition-colors"
            />
          </div>
          {canManage && (
            <button
              onClick={() => navigate('/courses/create')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cam text-white text-sm font-bold shadow-cam hover:bg-camDam transition-colors shrink-0"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Tạo bài giảng</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bộ lọc của tôi (giáo viên / admin) ── */}
      {canManage && !loading && lectures.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setOnlyMine(false)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!onlyMine ? 'bg-vutru text-white border-vutru dark:bg-night-elevated dark:border-night-border' : 'bg-white dark:bg-night-surface text-vutruNhat border-gray-200 dark:border-night-border hover:border-cam/50'}`}
          >
            Tất cả bài giảng
          </button>
          <button
            onClick={() => setOnlyMine(true)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${onlyMine ? 'bg-vutru text-white border-vutru dark:bg-night-elevated dark:border-night-border' : 'bg-white dark:bg-night-surface text-vutruNhat border-gray-200 dark:border-night-border hover:border-cam/50'}`}
          >
            Bài giảng của tôi
          </button>
        </div>
      )}

      {/* ── Tabs môn học ── */}
      {!loading && lectures.length > 0 && (
        <div className="mb-8 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max pb-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                activeTab === 'ALL'
                  ? 'bg-cam text-white border-cam shadow-cam'
                  : 'bg-white dark:bg-night-surface text-vutru border-gray-200 dark:border-night-border hover:border-cam/50'
              }`}
            >
              <LayoutGrid size={15} />
              Tất cả
              <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-extrabold ${activeTab === 'ALL' ? 'bg-white/25' : 'bg-gray-100 dark:bg-night-elevated'}`}>
                {filtered.length}
              </span>
            </button>

            {visibleSubjects.map((key) => {
              const meta = SUBJECTS[key];
              const Icon = meta.icon;
              const count = groupByKey[key]?.total ?? 0;
              const active = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    active
                      ? `bg-gradient-to-r ${meta.gradient} text-white border-transparent shadow-md`
                      : count === 0
                        ? 'bg-white/60 dark:bg-night-surface/60 text-vutruNhat border-gray-200 dark:border-night-border opacity-60 hover:opacity-100'
                        : 'bg-white dark:bg-night-surface text-vutru border-gray-200 dark:border-night-border hover:border-cam/50'
                  }`}
                >
                  <Icon size={15} className={active ? 'text-white' : meta.text} />
                  <span className="hidden sm:inline">{meta.name}</span>
                  <span className="sm:hidden">{meta.short}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[11px] font-extrabold ${active ? 'bg-white/25' : 'bg-gray-100 dark:bg-night-elevated'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Nội dung ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <LectureSkeleton key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="font-semibold text-lg text-vutru mb-2">{error}</p>
          <button onClick={fetchLectures} className="text-sm font-bold text-cam hover:underline">Thử lại</button>
        </div>
      ) : lectures.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <div className="w-28 h-28 rounded-3xl bg-cam/10 flex items-center justify-center mb-6 shadow-inner">
            <BookOpen size={52} className="text-cam" />
          </div>
          <h2 className="text-2xl font-bold text-vutru mb-2">Chưa có bài giảng nào</h2>
          <p className="text-vutruNhat max-w-sm leading-relaxed">
            {canManage
              ? 'Hãy tạo bài giảng đầu tiên và xuất bản để học sinh có thể xem.'
              : 'Bài giảng sẽ xuất hiện ở đây ngay khi giáo viên xuất bản.'}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-vutruNhat">
          <Search size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg text-vutru mb-1">Không tìm thấy kết quả</p>
          <p className="text-sm">Thử tìm bằng tên bài giảng hoặc mô tả.</p>
        </div>
      ) : activeTab === 'ALL' ? (
        nonEmptyGroups.map((group) => (
          <SubjectBlock key={group.subject.key} group={group} renderCard={renderCard} />
        ))
      ) : activeGroup && activeGroup.total > 0 ? (
        <SubjectBlock group={activeGroup} renderCard={renderCard} />
      ) : (
        <div className="text-center py-20 text-vutruNhat">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-semibold text-lg text-vutru mb-1">
            Chưa có bài giảng {SUBJECTS[activeTab as SubjectKey].name.toLowerCase()}
          </p>
          <p className="text-sm">Chọn môn khác hoặc xem tất cả bài giảng.</p>
        </div>
      )}
    </div>
  );
};

export default LecturePage;
