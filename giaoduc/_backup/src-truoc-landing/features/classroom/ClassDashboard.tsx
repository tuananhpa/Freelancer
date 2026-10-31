import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import classService, { Classroom } from '../../services/class.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import CreateClassModal from './CreateClassModal';
import JoinClassModal from './JoinClassModal';
import DeadlineBadge from '../../components/common/DeadlineBadge';
import {
  Search,
  BookOpen,
  Users,
  Calendar,
  Clock,
  Video,
  Copy,
  LayoutGrid,
  List,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Plus,
  KeyRound,
  X,
  Layers,
  School,
} from 'lucide-react';
import {
  SUBJECTS,
  SUBJECT_ORDER,
  GRADES,
  GRADE_ORDER,
  detectSubject,
  detectGrade,
  groupClassesBySubjectAndGrade,
  type SubjectKey,
  type GradeKey,
  type SubjectGroup,
} from '../../utils/classTaxonomy';
import { getDefaultCoverForSubject } from '../../utils/classThemes';
import UserAvatar from '../../components/common/UserAvatar';

import PageHeader from '../../components/ui/PageHeader';
// ── Skeleton Loading ──────────────────────────────────────────────────────────
const ClassSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="bg-white dark:bg-night-surface rounded-2xl overflow-hidden shadow-xs border border-gray-100 dark:border-night-border animate-pulse flex flex-col"
      >
        <div className="h-36 bg-gray-200 dark:bg-night-elevated w-full" />
        <div className="p-5 space-y-4 flex-1">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 dark:bg-night-elevated rounded w-28" />
            <div className="h-4 bg-gray-100 dark:bg-night-elevated rounded w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-100 dark:bg-night-elevated rounded w-full" />
            <div className="h-4 bg-gray-100 dark:bg-night-elevated rounded w-2/3" />
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-night-border flex justify-between items-center">
            <div className="h-4 bg-gray-200 dark:bg-night-elevated rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-night-elevated rounded w-16" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState: React.FC<{
  onJoinClick: () => void;
  onCreateClick?: () => void;
  isTeacher?: boolean;
  isAdmin?: boolean;
  isTeachingAssistant?: boolean;
}> = ({ onJoinClick, onCreateClick, isTeacher, isAdmin, isTeachingAssistant }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-white dark:bg-night-surface rounded-3xl border border-dashed border-gray-200 dark:border-night-border p-8 shadow-xs">
    <div className="w-16 h-16 rounded-2xl bg-cam/10 dark:bg-cam/20 flex items-center justify-center mb-4 text-cam">
      <School size={30} strokeWidth={1.75} />
    </div>
    <h2 className="font-heading text-lg sm:text-xl font-bold text-vutru dark:text-night-text mb-1.5">
      Chưa tham gia lớp học nào
    </h2>
    <p className="text-vutruNhat dark:text-night-muted text-xs sm:text-sm max-w-md leading-relaxed mb-6 font-body">
      {isTeachingAssistant
        ? 'Bạn chưa tham gia trợ giảng lớp học nào. Nhập mã lớp để bắt đầu.'
        : isTeacher
        ? 'Bạn chưa có lớp học nào trong học kỳ này. Nhập mã để tham gia lớp đồng giảng dạy.'
        : 'Bạn chưa được phân bổ lớp học nào. Nhập mã lớp từ giáo viên bộ môn để bắt đầu theo dõi bài giảng và làm bài tập.'}
    </p>
    <div className="flex items-center gap-3 flex-wrap justify-center font-body">
      {isAdmin && onCreateClick && (
        <button
          onClick={onCreateClick}
          className="btn btn-chinh px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95"
        >
          <Plus size={16} strokeWidth={2} /> Tạo lớp học mới
        </button>
      )}
      <button
        onClick={onJoinClick}
        className="btn btn-phu px-5 py-2.5 text-xs font-bold flex items-center gap-2 active:scale-95"
      >
        <KeyRound size={15} strokeWidth={2} /> Tham gia bằng mã lớp
      </button>
    </div>
  </div>
);

// ── Helper format deadline ───────────────────────────────────────────────────
function formatDeadline(deadlineStr?: string | null): { label: string; isUrgent: boolean } {
  if (!deadlineStr) return { label: '', isUrgent: false };
  const dl = new Date(deadlineStr);
  const now = new Date();
  const diffMs = dl.getTime() - now.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffH / 24);
  if (diffD > 1) return { label: `Còn ${diffD} ngày`, isUrgent: false };
  if (diffD === 1) return { label: 'Hạn chót ngày mai', isUrgent: true };
  if (diffH > 0) return { label: `Còn ${diffH} giờ`, isUrgent: true };
  if (diffMs > 0) return { label: 'Sắp hết hạn', isUrgent: true };
  return { label: 'Đã quá hạn', isUrgent: true };
}

// ── Smart Class Card (Google Classroom Style Thick Cover Banner) ───────────────
interface ClassCardProps {
  cls: Classroom;
  isTeacher: boolean;
  currentUserId?: string;
  onClick: () => void;
}

const ClassCard: React.FC<ClassCardProps> = ({ cls, isTeacher, currentUserId, onClick }) => {
  const toast = useToast();
  const subjectKey = detectSubject(cls);
  const subjectMeta = SUBJECTS[subjectKey];
  const grade = detectGrade(cls);
  const gradeMeta = GRADES[grade];
  const SubjectIcon = subjectMeta.icon;
  const isMineTeacher = cls.teacherId === currentUserId;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cls.inviteCode);
    toast.success('Đã sao chép mã lớp học thành công!');
  };

  const handleMeetingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cls.meetingLink) window.open(cls.meetingLink, '_blank');
  };

  const deadlineInfo = formatDeadline(cls.nearestDeadline);
  const coverUrl = cls.thumbnail || getDefaultCoverForSubject(subjectKey);

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border shadow-xs hover:border-cam/40 dark:hover:border-cam/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer group font-body"
    >
      {/* ── Google Classroom Style Thick Cover Banner (h-36 / h-40) ── */}
      <div className="relative">
        <div
          className="h-36 sm:h-40 w-full relative bg-cover bg-center overflow-hidden flex flex-col justify-between p-4"
          style={{ backgroundImage: `url(${coverUrl})` }}
        >
          {/* Luminous Gradient Overlay (Lightened so bright photos stay vibrant) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-black/10 pointer-events-none" />

          {/* Top Badges on Banner */}
          <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Subject Pill */}
              <span className="px-2.5 py-0.5 rounded-lg font-bold text-[11px] bg-black/45 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xs">
                <SubjectIcon size={12} strokeWidth={2.5} className="shrink-0 text-amber-300" />
                {subjectMeta.name}
              </span>

              {/* Grade Pill */}
              {grade !== 'OTHER' && (
                <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold backdrop-blur-md ${gradeMeta.badgeClass}`}>
                  {gradeMeta.label}
                </span>
              )}
            </div>

            {cls.room && (
              <span className="text-white/90 font-medium text-[11px] bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
                Phòng {cls.room}
              </span>
            )}
          </div>

          {/* Class Name & Section on Banner */}
          <div className="relative z-10 pr-14">
            <h3 className="font-heading font-bold text-white text-base sm:text-lg leading-snug line-clamp-2 drop-shadow-md group-hover:text-amber-200 transition-colors">
              {cls.name}
            </h3>
            <div className="flex items-center gap-2 text-white/90 text-[11px] font-medium mt-1 drop-shadow-xs">
              {cls.section ? (
                <span className="flex items-center gap-1">
                  <Calendar size={11} strokeWidth={1.5} /> {cls.section}
                </span>
              ) : (
                <span>Lớp học phần • Điểm Sáng</span>
              )}
            </div>
          </div>
        </div>

        {/* Floating Teacher Avatar - placed outside banner's overflow-hidden container */}
        <div className="absolute -bottom-5 right-4 z-20">
          <UserAvatar
            fullName={cls.teacherName || 'Giáo viên'}
            avatarUrl={cls.teacherAvatar}
            size="md"
            className="w-11 h-11 sm:w-12 sm:h-12 ring-3 ring-white dark:ring-night-surface shadow-md font-bold text-sm"
          />
        </div>
      </div>

      {/* ── Card Body (Below Cover Banner) ── */}
      <div className="pt-6 p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Teacher & Role Info */}
          <div className="flex items-center justify-between text-xs mb-2 pr-12">
            <span className="font-bold text-vutru dark:text-slate-200 truncate">
              GV: {cls.teacherName || 'Chưa phân công'}
            </span>
            {isMineTeacher && (
              <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                Phụ trách
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-vutruNhat dark:text-night-muted text-xs line-clamp-2 leading-relaxed mb-4">
            {cls.description || <span className="italic opacity-60">Chưa có thông tin mô tả học phần.</span>}
          </p>
        </div>

        {/* Academic Status Alert Box */}
        <div className="pt-3 border-t border-gray-100 dark:border-night-border/80 mt-auto space-y-2">
          {/* Status Box for Students vs Teachers */}
          {cls.pendingCount != null && cls.pendingCount > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 rounded-xl px-3 py-2 text-xs text-amber-900 dark:text-amber-200 font-semibold shadow-2xs">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-cam animate-pulse shrink-0" />
                <span className="truncate">
                  {isMineTeacher || isTeacher
                    ? `${cls.pendingCount} bài tập/đề thi đang mở`
                    : `${cls.pendingCount} bài tập/đề thi cần làm`}
                </span>
              </span>
              {cls.nearestDeadline && (
                <DeadlineBadge deadline={cls.nearestDeadline} variant="pill" className="self-start sm:self-auto shrink-0" />
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 rounded-xl px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
                <span>{isMineTeacher ? 'Không có bài tập sắp đến hạn' : 'Đã hoàn thành các bài tập'}</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Hoàn tất</span>
            </div>
          )}

          {/* Teacher Invite Code Quick Copy */}
          {isMineTeacher && (
            <div className="flex items-center justify-between text-xs text-vutruNhat dark:text-night-muted pt-1">
              <span>
                Mã mời:{' '}
                <strong className="font-mono text-vutru dark:text-slate-200 font-bold bg-gray-100 dark:bg-night-elevated px-1.5 py-0.5 rounded">
                  {cls.inviteCode}
                </strong>
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Sao chép mã lớp"
                className="text-cam hover:text-camDam font-bold flex items-center gap-1 text-[11px] active:scale-95 transition-transform"
              >
                <Copy size={11} strokeWidth={2} /> Sao chép
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-gray-50/70 dark:bg-night-elevated/40 border-t border-gray-100 dark:border-night-border flex items-center justify-between text-xs">
        <span className="text-vutruNhat dark:text-slate-400 font-medium flex items-center gap-1.5">
          <Users size={13} strokeWidth={1.75} className="text-vutruNhat" />
          {cls.memberCount ?? 0} học viên
        </span>

        <div className="flex items-center gap-2">
          {cls.meetingLink && (
            <button
              type="button"
              onClick={handleMeetingClick}
              title="Vào phòng học trực tuyến"
              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors border border-emerald-200/60 dark:border-emerald-800/40"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <Video size={12} strokeWidth={2} /> Phòng học
            </button>
          )}
          <span className="font-bold text-cam dark:text-cam group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
            Vào lớp <ArrowRight size={13} strokeWidth={2} />
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Compact Table / List Row View ─────────────────────────────────────────────
interface ClassListRowProps {
  cls: Classroom;
  isTeacher: boolean;
  currentUserId?: string;
  onClick: () => void;
}

const ClassListRow: React.FC<ClassListRowProps> = ({ cls, isTeacher, currentUserId, onClick }) => {
  const toast = useToast();
  const subjectMeta = SUBJECTS[detectSubject(cls)];
  const grade = detectGrade(cls);
  const gradeMeta = GRADES[grade];
  const SubjectIcon = subjectMeta.icon;
  const isMineTeacher = cls.teacherId === currentUserId;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cls.inviteCode);
    toast.success('Đã sao chép mã lớp học thành công!');
  };

  const handleMeetingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cls.meetingLink) window.open(cls.meetingLink, '_blank');
  };

  return (
    <div
      onClick={onClick}
      className="p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border hover:border-cam/40 dark:hover:border-cam/40 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group font-body"
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className={`p-2.5 rounded-xl ${subjectMeta.chip} shrink-0`}>
          <SubjectIcon size={20} className={subjectMeta.text} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.2 rounded-md font-bold text-[10px] ${subjectMeta.badgeClass}`}>
              {subjectMeta.short}
            </span>
            {grade !== 'OTHER' && (
              <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold ${gradeMeta.badgeClass}`}>
                {gradeMeta.label}
              </span>
            )}
            {cls.room && (
              <span className="text-[10px] text-vutruNhat dark:text-night-muted">Phòng {cls.room}</span>
            )}
          </div>
          <h3 className="font-heading font-bold text-vutru dark:text-night-text text-sm sm:text-base truncate group-hover:text-cam transition-colors">
            {cls.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-vutruNhat dark:text-night-muted mt-0.5">
            <span>GV: {cls.teacherName || 'Chưa phân công'}</span>
            {cls.section && <span>• {cls.section}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 flex-wrap justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100 dark:border-night-border">
        <div className="text-xs text-vutruNhat dark:text-night-muted flex items-center gap-1.5">
          <Users size={13} strokeWidth={1.75} />
          <span>{cls.memberCount ?? 0} học viên</span>
        </div>

        {!isMineTeacher && cls.pendingCount != null && cls.pendingCount > 0 ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cam animate-pulse" />
              {cls.pendingCount} bài chưa nộp
            </span>
            {cls.nearestDeadline && (
              <DeadlineBadge deadline={cls.nearestDeadline} variant="compact" />
            )}
          </div>
        ) : isMineTeacher ? (
          <button
            type="button"
            onClick={handleCopyCode}
            className="text-xs font-mono font-bold text-cam hover:text-camDam flex items-center gap-1 bg-cam/10 px-2.5 py-1 rounded-lg"
          >
            <Copy size={11} strokeWidth={2} /> {cls.inviteCode}
          </button>
        ) : null}

        {cls.meetingLink && (
          <button
            type="button"
            onClick={handleMeetingClick}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
          >
            <Video size={12} strokeWidth={2} /> Phòng học
          </button>
        )}

        <button
          type="button"
          onClick={onClick}
          className="btn btn-chinh px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 shadow-xs"
        >
          <span>Vào lớp</span>
          <ArrowRight size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

// ── Grade Section ────────────────────────────────────────────────────────────
interface GradeSectionProps {
  label: string;
  gradeKey: GradeKey;
  count: number;
  viewMode: 'grid' | 'list';
  children: React.ReactNode;
}

const GradeSection: React.FC<GradeSectionProps> = ({ label, gradeKey, count, viewMode, children }) => {
  const gradeMeta = GRADES[gradeKey];
  return (
    <section className="mb-8 last:mb-0 font-body">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <GraduationCap size={16} className="text-slate-500 dark:text-night-muted" strokeWidth={2} />
          <h3 className="text-xs font-bold uppercase tracking-wider font-heading">{label}</h3>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.2 rounded-full ${
            gradeMeta ? gradeMeta.badgeClass : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count} lớp
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-night-border" />
      </div>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
      ) : (
        <div className="space-y-3">{children}</div>
      )}
    </section>
  );
};

// ── Subject Block ────────────────────────────────────────────────────────────
interface SubjectBlockProps {
  group: SubjectGroup<Classroom>;
  viewMode: 'grid' | 'list';
  renderCard: (cls: Classroom) => React.ReactNode;
}

const SubjectBlock: React.FC<SubjectBlockProps> = ({ group, viewMode, renderCard }) => {
  const Icon = group.subject.icon;
  return (
    <section className="mb-10 last:mb-0 font-body">
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-gray-200 dark:border-night-border">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${group.subject.chip}`}>
            <Icon size={18} className={group.subject.text} strokeWidth={2} />
          </div>
          <div>
            <h2 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text">
              {group.subject.name}
            </h2>
            <p className="text-xs text-vutruNhat dark:text-night-muted">
              {group.total} lớp học đang mở
            </p>
          </div>
        </div>
      </div>
      {group.grades.map((g) => (
        <GradeSection key={g.grade} gradeKey={g.grade} label={g.label} count={g.classes.length} viewMode={viewMode}>
          {g.classes.map(renderCard)}
        </GradeSection>
      ))}
    </section>
  );
};

// ── Main Page Component ───────────────────────────────────────────────────────
type TabKey = 'ALL' | SubjectKey;
type GradeFilterKey = 'ALL' | GradeKey;

const ClassDashboard: React.FC = () => {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [activeGrade, setActiveGrade] = useState<GradeFilterKey>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const navigate = useNavigate();
  const { user, isTeachingAssistant, isAdmin } = useAuth();

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'TEACHING_ASSISTANT' || user?.role === 'ADMIN';

  const fetchClasses = useCallback(async () => {
    try {
      const data = await classService.getMyClasses();
      const list = data?.content || data?.data?.content || [];
      setClasses(list);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Total pending assignments across all classes
  const totalPendingAssignments = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.pendingCount ?? 0), 0);
  }, [classes]);

  // Filter by search query, active subject tab, and active grade filter
  const filtered = useMemo(() => {
    return classes.filter((c) => {
      // 1. Search filter
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.teacherName?.toLowerCase().includes(q) ||
        c.section?.toLowerCase().includes(q) ||
        c.inviteCode?.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // 2. Grade filter
      if (activeGrade !== 'ALL') {
        const grade = detectGrade(c);
        if (grade !== activeGrade) return false;
      }

      return true;
    });
  }, [search, activeGrade, classes]);

  const groups = useMemo(() => groupClassesBySubjectAndGrade(filtered), [filtered]);
  const groupByKey = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.subject.key, g])) as Record<SubjectKey, SubjectGroup<Classroom>>,
    [groups]
  );

  const visibleSubjects = useMemo(
    () => SUBJECT_ORDER.filter((key) => key !== 'OTHER' || (groupByKey.OTHER?.total ?? 0) > 0),
    [groupByKey]
  );

  // Count classes per grade for grade chips
  const gradeCounts = useMemo(() => {
    const counts = { ALL: classes.length } as Record<GradeFilterKey, number>;
    for (const c of classes) {
      const g = detectGrade(c);
      counts[g] = (counts[g] || 0) + 1;
    }
    return counts;
  }, [classes]);

  const renderCard = useCallback(
    (cls: Classroom) => {
      if (viewMode === 'list') {
        return (
          <ClassListRow
            key={cls.id}
            cls={cls}
            isTeacher={isTeacher}
            currentUserId={user?.id}
            onClick={() => navigate(`/classes/${cls.id}`)}
          />
        );
      }
      return (
        <ClassCard
          key={cls.id}
          cls={cls}
          isTeacher={isTeacher}
          currentUserId={user?.id}
          onClick={() => navigate(`/classes/${cls.id}`)}
        />
      );
    },
    [viewMode, isTeacher, user?.id, navigate]
  );

  const activeGroup = activeTab === 'ALL' ? null : groupByKey[activeTab];
  const nonEmptyGroups = groups.filter((g) => g.total > 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 animate-fade-in space-y-6 font-body">
      {/* ── Academic Hub Banner ── */}
      <div className="bg-white dark:bg-night-surface rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-night-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-cam/10 text-camDam dark:bg-cam/20 dark:text-cam text-[11px] font-bold tracking-wide uppercase">
              Học kỳ I • Năm học 2026–2027
            </span>
          </div>
          <PageHeader
            icon={Layers}
            title="Lớp học của tôi"
            subtitle="Theo dõi tiến trình học vụ, bài tập về nhà và liên kết phòng học trực tuyến."
          />

          {/* Quick Academic KPIs */}
          {!loading && classes.length > 0 && (
            <div className="flex items-center gap-4 mt-3.5 flex-wrap text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-vutru dark:text-night-text bg-gray-50 dark:bg-night-elevated px-3 py-1.5 rounded-xl border border-gray-200/60 dark:border-night-border">
                <Layers size={13} className="text-cam" strokeWidth={2} />
                <strong className="text-cam font-bold">{classes.length}</strong> lớp học
              </span>

              {!isTeacher && totalPendingAssignments > 0 && (
                <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Clock size={13} className="text-amber-600 dark:text-amber-400" strokeWidth={2} />
                  <strong className="font-bold">{totalPendingAssignments}</strong> bài tập cần nộp
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsJoinModalOpen(true)}
            className="btn btn-chinh px-4.5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Nhập mã tham gia lớp học"
          >
            <KeyRound size={14} strokeWidth={2} />
            <span>{isTeacher ? 'Nhập mã' : 'Vào lớp bằng mã'}</span>
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-phu px-4.5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-soft active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Tạo lớp học</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Dual Filter System (Môn x Khối x Chế độ xem) ── */}
      {!loading && classes.length > 0 && (
        <div className="space-y-3 bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-2xs">
          {/* Row 1: Filter theo Môn học (Subject Segmented Tabs) */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 custom-scrollbar">
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-night-elevated rounded-2xl border border-gray-200 dark:border-night-border min-w-max">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-white dark:bg-night-surface text-cam font-bold shadow-xs border border-gray-200 dark:border-night-border'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                }`}
              >
                <LayoutGrid size={13} strokeWidth={2} />
                Tất cả môn
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    activeTab === 'ALL'
                      ? 'bg-camNhat text-camDam dark:bg-night-elevated dark:text-cam'
                      : 'bg-gray-200 dark:bg-night-border text-vutruNhat dark:text-night-muted'
                  }`}
                >
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
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      active
                        ? 'bg-white dark:bg-night-surface text-cam font-bold shadow-xs border border-gray-200 dark:border-night-border'
                        : count === 0
                        ? 'text-gray-400 dark:text-night-muted opacity-60 hover:opacity-100'
                        : 'text-vutruNhat dark:text-night-muted hover:text-vutru dark:hover:text-night-text'
                    }`}
                  >
                    <Icon size={13} strokeWidth={2} className={active ? 'text-cam' : 'text-gray-400'} />
                    <span>{meta.short}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        active
                          ? 'bg-camNhat text-camDam dark:bg-night-elevated dark:text-cam'
                          : 'bg-gray-200 dark:bg-night-border text-vutruNhat dark:text-night-muted'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* View Mode Switcher (Grid / List) */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-night-elevated rounded-xl border border-gray-200 dark:border-night-border shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-night-surface text-cam shadow-2xs'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
                title="Chế độ xem lưới"
              >
                <LayoutGrid size={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-night-surface text-cam shadow-2xs'
                    : 'text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
                title="Chế độ xem danh sách"
              >
                <List size={15} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Row 2: Filter theo Khối lớp (Grade Chips) & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-night-border">
            {/* Grade Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <span className="text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <GraduationCap size={13} strokeWidth={2} /> Khối:
              </span>

              <button
                type="button"
                onClick={() => setActiveGrade('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeGrade === 'ALL'
                    ? 'bg-vutru text-white dark:bg-white dark:text-night-surface shadow-2xs'
                    : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:bg-gray-200 dark:hover:bg-night-border'
                }`}
              >
                Tất cả ({gradeCounts.ALL})
              </button>

              {GRADE_ORDER.filter((gKey) => (gradeCounts[gKey] || 0) > 0 || activeGrade === gKey).map((gKey) => {
                const gMeta = GRADES[gKey];
                const count = gradeCounts[gKey] || 0;
                const isSelected = activeGrade === gKey;
                return (
                  <button
                    key={gKey}
                    type="button"
                    onClick={() => setActiveGrade(gKey)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                      isSelected
                        ? 'bg-cam text-white border-cam shadow-xs'
                        : `${gMeta.badgeClass} opacity-80 hover:opacity-100`
                    }`}
                  >
                    {gMeta.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search
                size={15}
                strokeWidth={2}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên lớp, môn, GV…"
                className="w-full pl-10 pr-8 py-2 rounded-xl border border-gray-200 dark:border-night-border bg-gray-50/50 dark:bg-night-surface text-xs focus:outline-none focus:border-cam focus:bg-white transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-night-text p-1"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Content Area ── */}
      {loading ? (
        <ClassSkeleton count={6} />
      ) : classes.length === 0 ? (
        <EmptyState
          isTeacher={isTeacher}
          isAdmin={isAdmin}
          isTeachingAssistant={isTeachingAssistant}
          onCreateClick={() => setIsCreateModalOpen(true)}
          onJoinClick={() => setIsJoinModalOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-8 shadow-xs font-body">
          <Search size={36} className="mx-auto mb-3 text-gray-300 dark:text-night-muted" strokeWidth={1.5} />
          <p className="font-heading font-bold text-vutru dark:text-night-text mb-1">
            Không tìm thấy lớp học phù hợp
          </p>
          <p className="text-xs text-vutruNhat dark:text-night-muted mb-4">
            Không có lớp nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.
          </p>
          <div className="flex items-center justify-center gap-2">
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="btn btn-phu text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5"
              >
                <X size={13} strokeWidth={2} /> Xóa tìm kiếm
              </button>
            )}
            {activeGrade !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveGrade('ALL')}
                className="btn btn-phu text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5"
              >
                Xóa lọc khối
              </button>
            )}
          </div>
        </div>
      ) : activeTab === 'ALL' ? (
        nonEmptyGroups.map((group) => (
          <SubjectBlock key={group.subject.key} group={group} viewMode={viewMode} renderCard={renderCard} />
        ))
      ) : activeGroup && activeGroup.total > 0 ? (
        <SubjectBlock group={activeGroup} viewMode={viewMode} renderCard={renderCard} />
      ) : (
        <div className="text-center py-16 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border p-8 shadow-xs font-body">
          <BookOpen size={36} className="mx-auto mb-3 text-gray-300 dark:text-night-muted" strokeWidth={1.5} />
          <p className="font-heading font-bold text-vutru dark:text-night-text mb-1">
            Chưa có lớp {SUBJECTS[activeTab as SubjectKey]?.short.toLowerCase()}
          </p>
          <p className="text-xs text-vutruNhat dark:text-night-muted">
            Chọn môn học khác hoặc chuyển về tab Tất cả môn.
          </p>
        </div>
      )}

      {/* ── Create Class Modal ── */}
      {isCreateModalOpen && (
        <CreateClassModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchClasses();
          }}
        />
      )}

      {/* ── Join Class Modal ── */}
      {isJoinModalOpen && (
        <JoinClassModal
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={() => {
            setIsJoinModalOpen(false);
            fetchClasses();
          }}
        />
      )}
    </div>
  );
};

export default ClassDashboard;
