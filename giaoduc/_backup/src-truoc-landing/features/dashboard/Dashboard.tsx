import { getApiErrorMessage } from '../../services/api';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import classService, { Classroom } from '../../services/class.service';
import { gamificationApi } from '../../services/featureApi';
import DeadlineBadge from '../../components/common/DeadlineBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Clock,
  Target,
  Users,
  Layers,
  GraduationCap,
  ClipboardList,
  FileText,
  PenTool,
  BookOpen,
  Volume2,
  Palette,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import SeasonBanner from '../../components/gamification/SeasonBanner';
import UranianMascot from '../../components/gamification/UranianMascot';
import ConfettiBurst from '../../components/gamification/ConfettiBurst';
import StudentActivityHeatmap from '../../components/gamification/StudentActivityHeatmap';
import GamificationDashboardPanels from '../../components/gamification/GamificationDashboardPanels';
import { sounds, isSoundEnabled, setSoundEnabled } from '../../utils/soundEffects';
import { getCurrentSeason, getSeasonDashboardClass } from '../../utils/seasonEvents';
import { useTheme } from '../../context/ThemeContext';
import { colorThemeTokens, tokenToCss } from '../../utils/colorThemes';
import { compareClassesByUrgency } from '../../utils/classTaxonomy';
import LoadingOverlay from '../../components/ui/LoadingOverlay';

const Dashboard: React.FC = () => {
  const { user, isTeacher, isTeachingAssistant, isAdmin: _isAdmin, isOffice } = useAuth();
  const isAdmin = _isAdmin || isOffice;
  const navigate = useNavigate();

  const [examCode, setExamCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [recentClasses, setRecentClasses] = useState<Classroom[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const season = getCurrentSeason();
  const seasonClass = getSeasonDashboardClass(season);
  const { colorTheme } = useTheme();
  const palette = colorThemeTokens[colorTheme];
  const chartPrimary = tokenToCss(palette.accent);
  const chartSecondary = tokenToCss(palette.accentSecondary);
  const chartTertiary = tokenToCss(palette.accentTertiary);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = isAdmin ? '/analytics/admin' : isTeacher ? '/analytics/teacher' : '/analytics/student';
        const [statsRes, classesRes] = await Promise.allSettled([
          api.get(endpoint),
          classService.getMyClasses(),
        ]);

        if (statsRes.status === 'fulfilled') {
          const statsVal = statsRes.value;
          setStats(statsVal?.data || statsVal || null);
        }
        if (classesRes.status === 'fulfilled') {
          const raw = classesRes.value;
          const classList = Array.isArray(raw)
            ? raw
            : raw?.content || raw?.data?.content || raw?.data || [];
          const sorted = [...classList].sort(compareClassesByUrgency);
          setRecentClasses(sorted);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchData();

    if (!isTeacher && !isAdmin) {
      gamificationApi
        .recordActivity('DAILY_LOGIN')
        .then((res) => {
          const streak = res.data?.currentStreak ?? 0;
          if (streak === 3 || streak === 7 || streak === 14 || streak === 30) {
            const key = `uranus_streak_celebrated_${streak}`;
            if (!sessionStorage.getItem(key)) {
              sessionStorage.setItem(key, '1');
              if (isSoundEnabled()) sounds.streak();
              setShowConfetti(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [isTeacher, isAdmin]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCode.trim()) return;
    setLoadingCode(true);
    setErrorMsg('');

    try {
      const res = await api.get(`/exams/code/${examCode.trim()}`);
      navigate(`/exams/take/${res.data.id}`);
    } catch (err: any) {
      setErrorMsg(getApiErrorMessage(err, 'Không tìm thấy mã đề thi này.'));
    } finally {
      setLoadingCode(false);
    }
  };

  if (loadingStats) {
    return <LoadingOverlay text="Đang đồng bộ dữ liệu tổng quan..." />;
  }

  const currentDateFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`space-y-6 pb-12 animate-fade-in ${seasonClass}`}>
      <ConfettiBurst active={showConfetti} onDone={() => setShowConfetti(false)} />

      {/* Seasonal Banner for students */}
      {!isTeacher && !isAdmin && <SeasonBanner />}

      {/* ── 1. Welcome & Greeting Hero Banner with Rich Visual Accents ── */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 dark:border-night-border bg-white dark:bg-night-surface shadow-soft transition-all">
        {/* Background decorative glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cam/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-tr from-blue-500/10 via-cam/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-vutruNhat dark:text-night-muted">
              <Calendar size={14} className="text-cam" />
              <span className="capitalize">{currentDateFormatted}</span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-camNhat/50 dark:bg-cam/20 text-camDam dark:text-cam font-bold text-[11px] shadow-2xs">
                {isAdmin ? 'Quản trị viên' : user?.role === 'TEACHING_ASSISTANT' ? 'Trợ giảng' : isTeacher ? 'Giáo viên' : 'Học viên'}
              </span>
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-vutru dark:text-night-text tracking-tight">
              Xin chào, <span className="text-cam">{user?.fullName || 'Người dùng Điểm Sáng'}</span>! 👋
            </h1>
            <p className="text-xs sm:text-sm text-vutruNhat dark:text-night-muted leading-relaxed">
              {isAdmin
                ? 'Hệ thống vận hành ổn định. Chúc bạn một ngày quản trị hiệu quả và suôn sẻ.'
                : isTeachingAssistant
                ? 'Chào mừng bạn quay lại làm việc. Cùng hỗ trợ học sinh học tập và nắm bắt kiến thức hiệu quả.'
                : isTeacher
                ? 'Chào mừng thầy/cô quay lại bục giảng số. Quản lý bài kiểm tra, sổ điểm và tài nguyên học liệu dễ dàng.'
                : 'Khám phá tri thức hôm nay cùng Điểm Sáng! Đặt mục tiêu học tập và duy trì chuỗi thành tích xuất sắc nhé.'}
            </p>

            {/* Quick Action Chips in Hero */}
            <div className="pt-2 flex items-center gap-2.5 flex-wrap">
              {isTeacher ? (
                <>
                  <Link
                    to="/exams/create"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cam text-white text-xs font-bold hover:bg-camDam shadow-sm shadow-cam/20 transition-all active:scale-95"
                  >
                    <Plus size={14} /> Soạn đề thi mới
                  </Link>
                  <Link
                    to="/library"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text text-xs font-bold hover:bg-gray-200 dark:hover:bg-night-border transition-all active:scale-95"
                  >
                    <BookOpen size={14} className="text-cam" /> Kho học liệu
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/library"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cam text-white text-xs font-bold hover:bg-camDam shadow-sm shadow-cam/20 transition-all active:scale-95"
                  >
                    <Sparkles size={14} /> Luyện đề & Học liệu
                  </Link>
                  <Link
                    to="/flashcards"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-night-elevated text-vutru dark:text-night-text text-xs font-bold hover:bg-gray-200 dark:hover:bg-night-border transition-all active:scale-95"
                  >
                    <Layers size={14} className="text-cam" /> Ôn tập Flashcard
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right Visual Element / Illustration / Gamification Cards */}
          <div className="flex items-center gap-3 shrink-0">
            {!isTeacher && !isAdmin && (
              <div className="hidden lg:flex items-center justify-center p-2">
                <UranianMascot compact />
              </div>
            )}
            {isTeacher && (
              <div className="hidden lg:flex items-center justify-center w-28 h-28 rounded-2xl bg-gradient-to-tr from-camNhat/50 via-purple-100/40 to-blue-100/50 dark:from-cam/10 dark:to-purple-900/20 border border-cam/20 text-cam">
                <div className="text-center p-3 space-y-1">
                  <GraduationCap size={36} className="mx-auto text-cam animate-bounce [animation-duration:3s]" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block text-vutru dark:text-night-text">Giảng dạy số</span>
                </div>
              </div>
            )}

            {/* Gamification badge for students */}
            {!isTeacher && !isAdmin && stats && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-2xl shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                    <Award size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Chuỗi ngày học</p>
                    <p className="font-heading text-base font-bold text-amber-900 dark:text-amber-200">
                      {stats.currentStreak ?? stats.learningStreakDays ?? 0} ngày liên tiếp
                    </p>
                  </div>
                </div>

                {(stats.totalXp ?? 0) > 0 && (
                  <div className="flex items-center gap-2.5 px-4 py-2.5 bg-camNhat/30 dark:bg-cam/15 border border-cam/30 rounded-2xl shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-cam text-white flex items-center justify-center font-bold shadow-xs">
                      <Zap size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-camDam dark:text-cam uppercase tracking-wider">Điểm XP</p>
                      <p className="font-heading text-base font-bold text-camDam dark:text-cam">
                        {stats.totalXp} XP
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. High-Impact Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {isAdmin && stats ? (
          <>
            <StatCard icon={<Users size={20} className="text-blue-600" />} title="Tổng thành viên" value={stats.totalUsers ?? (stats.totalStudents + stats.totalTeachers)} />
            <StatCard icon={<Target size={20} className="text-purple-600" />} title="Giáo viên phụ trách" value={stats.totalTeachers ?? 0} />
            <StatCard icon={<Layers size={20} className="text-emerald-600" />} title="Lớp học đang mở" value={stats.totalClasses ?? 0} />
            <StatCard icon={<GraduationCap size={20} className="text-cam" />} title="Khóa học trực tuyến" value={stats.totalCourses ?? 0} />
          </>
        ) : isTeacher && stats ? (
          <>
            <StatCard icon={<Layers size={20} className="text-blue-600" />} title={isTeachingAssistant ? "Lớp học trợ giảng" : "Lớp học đang dạy"} value={recentClasses.length} />
            <StatCard icon={<Users size={20} className="text-purple-600" />} title="Tổng số học viên" value={stats.totalStudents ?? 0} />
            <StatCard icon={<ClipboardList size={20} className="text-cam" />} title="Đề thi đã tạo" value={stats.totalExams ?? 0} />
            <StatCard icon={<BookOpen size={20} className="text-emerald-600" />} title="Bộ Flashcard" value={stats.totalDecks ?? 0} />
          </>
        ) : stats ? (
          <>
            <StatCard icon={<Target size={20} className="text-blue-600" />} title="Bài thi đã hoàn thành" value={stats.totalExamsTaken ?? 0} />
            <StatCard icon={<TrendingUp size={20} className="text-cam" />} title="Điểm trung bình" value={`${stats.averageExamScore ?? 0}%`} />
            <StatCard icon={<Award size={20} className="text-purple-600" />} title="Huy hiệu đạt được" value={stats.badges?.length || 0} />
            <StatCard icon={<GraduationCap size={20} className="text-emerald-600" />} title="Lớp học tham gia" value={recentClasses.length} />
          </>
        ) : null}
      </div>

      {/* ── 3. Main Workspace Grid (65% Left / 35% Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Core Workflows */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: My Classrooms Widget */}
          <div className="bg-white dark:bg-night-surface p-6 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text flex items-center gap-2">
                  <Layers size={18} className="text-cam" />
                  {isTeachingAssistant ? 'Lớp học bạn đang trợ giảng' : isTeacher ? 'Lớp học bạn đang giảng dạy' : 'Lớp học của bạn'}
                </h2>
                <p className="text-xs text-vutruNhat dark:text-night-muted">
                  Truy cập nhanh vào bài tập, đề thi và bảng điểm các lớp
                </p>
              </div>

              <Link
                to="/classes"
                className="text-xs font-bold text-cam hover:text-camDam flex items-center gap-1 transition-colors"
              >
                Xem tất cả ({recentClasses.length}) <ArrowRight size={13} />
              </Link>
            </div>

            {recentClasses.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-200 dark:border-night-border rounded-xl">
                <Layers size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-xs text-vutruNhat dark:text-night-muted font-medium">Bạn chưa tham gia lớp học nào.</p>
                <Link
                  to="/classes"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-cam hover:underline"
                >
                  <Plus size={13} /> Khám phá & Tham gia lớp ngay
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {recentClasses.slice(0, 4).map((cls) => {
                  const hasPending = cls.pendingCount != null && cls.pendingCount > 0;

                  return (
                    <Link
                      key={cls.id}
                      to={`/classes/${cls.id}/classwork`}
                      className="p-4 rounded-2xl border border-gray-100 dark:border-night-border bg-gray-50/50 dark:bg-night-elevated/40 hover:bg-white dark:hover:bg-night-surface hover:border-cam/40 hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Meta: Subject & Student Count */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-camNhat/50 text-camDam dark:bg-cam/20 dark:text-cam">
                            {cls.subject || 'Lớp học phần'}
                          </span>
                          <span className="text-[11px] font-medium text-vutruNhat dark:text-night-muted flex items-center gap-1">
                            <Users size={11} /> {cls.memberCount} học viên
                          </span>
                        </div>

                        {/* Class Name & Section */}
                        <h3 className="font-heading text-sm font-bold text-vutru dark:text-night-text group-hover:text-cam transition-colors line-clamp-1">
                          {cls.name}
                        </h3>
                        {cls.section && (
                          <p className="text-xs text-vutruNhat dark:text-night-muted line-clamp-1 mt-0.5 font-medium">
                            Phòng: {cls.section}
                          </p>
                        )}

                        {/* Detailed Pending Task & Deadline Box */}
                        {hasPending ? (
                          <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs">
                            {/* Task Title Row */}
                            <div className="flex items-center gap-1.5 text-amber-950 dark:text-amber-200 font-bold truncate">
                              <span className="w-2 h-2 rounded-full bg-cam animate-pulse shrink-0" />
                              <span className="truncate">
                                {cls.nearestTaskTitle
                                  ? `${cls.nearestTaskType === 'EXAM' ? '📝 Đề thi: ' : '📋 Bài tập: '}${cls.nearestTaskTitle}`
                                  : `${cls.pendingCount} bài chưa nộp`}
                              </span>
                            </div>

                            {/* Deadline & Count Row */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/30 text-[11px] gap-2 flex-wrap">
                              {cls.nearestDeadline ? (
                                <DeadlineBadge deadline={cls.nearestDeadline} variant="pill" />
                              ) : (
                                <span className="text-amber-800 dark:text-amber-300 font-medium">
                                  {cls.pendingCount} bài cần làm
                                </span>
                              )}
                              {cls.pendingCount && cls.pendingCount > 1 && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 font-bold text-[10px]">
                                  +{cls.pendingCount - 1} bài khác
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300 text-xs">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                              <span>Hoàn tất nhiệm vụ</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">0 bài tồn đọng</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Footer */}
                      <div className="pt-3 mt-3 border-t border-gray-100 dark:border-night-border/80 flex items-center justify-between text-xs">
                        {isTeacher ? (
                          <span className="text-vutruNhat dark:text-night-muted text-[11px]">
                            Mã mời: <strong className="font-mono text-vutru dark:text-slate-200">{cls.inviteCode}</strong>
                          </span>
                        ) : (
                          <span className="text-vutruNhat dark:text-night-muted text-[11px] truncate max-w-[130px]">
                            GV: {cls.teacherName || 'Phụ trách'}
                          </span>
                        )}
                        <span className="font-bold text-cam group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[11px] shrink-0">
                          Vào lớp <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Academic Analytics Chart */}
          <div className="bg-white dark:bg-night-surface p-6 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text">
                  {isAdmin
                    ? 'Thống kê người dùng mới theo tháng'
                    : isTeacher
                    ? 'Lượt đăng ký học phần theo tháng'
                    : 'Biểu đồ điểm số các bài kiểm tra gần nhất'}
                </h2>
                <p className="text-xs text-vutruNhat dark:text-night-muted">
                  {isAdmin
                    ? 'Số lượng tài khoản đăng ký mới trên hệ thống'
                    : isTeacher
                    ? 'Số lượng học viên tham gia học phần qua các tháng'
                    : 'Theo dõi sự tiến bộ và điểm số qua từng bài thi (Thang điểm 10)'}
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              {!isTeacher && !isAdmin ? (
                stats?.examHistory && stats.examHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...stats.examHistory].reverse().map((item: any) => ({
                        // Nhan truc hoanh la thoi diem thi, khong phai ten de: cung mot de
                        // thi nhieu lan thi moi cot deu mang nhan giong nhau, va ten de bi
                        // cat con 18 ky tu thi 'BIG TEST TU VUNG N...' khong phan biet duoc.
                        name: item.submittedAt
                          ? new Date(item.submittedAt).toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—',
                        examTitle: item.examTitle || 'Bài kiểm tra',
                        score: typeof item.scorePercent === 'number' ? item.scorePercent : 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-20" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                        tick={{ fontSize: 10, fill: '#6B7280' }}
                      />
                      <YAxis
                        domain={[0, 10]}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6B7280' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                        formatter={(value: any, _name: any, entry: any) => [
                          `${value} / 10 điểm`,
                          entry?.payload?.examTitle ?? 'Điểm số',
                        ]}
                        labelFormatter={(label: any) => `Lúc ${label}`}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#FFFFFF',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                          fontSize: '12px',
                        }}
                      />
                      {/* minPointSize: bai 0 diem van ve mot vach mong. Khong co no thi 5/8 cot
                          bien mat va nhin nhu bieu do thieu du lieu chu khong phai diem 0. */}
                      <Bar dataKey="score" fill={chartPrimary} radius={[6, 6, 0, 0]} barSize={36} minPointSize={2} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-vutruNhat dark:text-night-muted">
                    <Award size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-medium">Bạn chưa làm bài kiểm tra nào.</p>
                    <Link to="/exams" className="mt-2 text-xs font-bold text-cam hover:underline inline-flex items-center gap-1">
                      Làm bài kiểm tra ngay <ArrowRight size={12} />
                    </Link>
                  </div>
                )
              ) : (isTeacher || isAdmin) && (stats?.enrollmentsByMonth || stats?.newUsersByMonth) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.enrollmentsByMonth || stats.newUsersByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-20" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="count" fill={chartPrimary} radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-vutruNhat dark:text-night-muted">
                  <TrendingUp size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs font-medium">Chưa có đủ dữ liệu để tạo biểu đồ phân tích.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Recent Exam Attempts (Students) */}
          {!isTeacher && !isAdmin && (
            <div className="bg-white dark:bg-night-surface p-6 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text flex items-center gap-2">
                    <ClipboardList size={18} className="text-cam" />
                    Bài thi đã làm
                  </h2>
                  <p className="text-xs text-vutruNhat dark:text-night-muted">
                    Bấm vào một bài để xem lại đáp án và lời giải
                  </p>
                </div>
                <Link
                  to="/exams?view=history"
                  className="text-xs font-bold text-cam hover:underline flex items-center gap-1 shrink-0"
                >
                  Xem tất cả ({stats?.totalExamsTaken ?? 0}) <ArrowRight size={13} />
                </Link>
              </div>

              {stats?.examHistory && stats.examHistory.length > 0 ? (
                <ul className="divide-y divide-gray-100 dark:divide-night-border">
                  {stats.examHistory.map((item: any, index: number) => {
                    const score = typeof item.scorePercent === 'number' ? item.scorePercent : 0;
                    // Thang 10: >= 8 gioi, >= 5 dat, con lai chua dat
                    const tone =
                      score >= 8
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : score >= 5
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                        : 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300';

                    const row = (
                      <div className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-vutru dark:text-night-text line-clamp-1">
                            {item.examTitle || 'Bài kiểm tra'}
                          </p>
                          <p className="text-xs text-vutruNhat dark:text-night-muted">
                            {item.submittedAt
                              ? new Date(item.submittedAt).toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Chưa rõ thời gian'}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-lg px-2.5 py-1 text-sm font-extrabold ${tone}`}>
                          {score}
                          <span className="text-xs font-bold opacity-60">/10</span>
                        </span>
                      </div>
                    );

                    // Ket qua da bi xoa thi khong con gi de mo
                    return (
                      <li key={item.resultId ?? index}>
                        {item.resultId ? (
                          <Link
                            to={`/exams/results/${item.resultId}`}
                            className="block -mx-2 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-night-elevated transition-colors"
                          >
                            {row}
                          </Link>
                        ) : (
                          row
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-vutruNhat dark:text-night-muted">
                  <ClipboardList size={32} className="text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs font-medium">Bạn chưa làm bài thi nào.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Role-Based Quick Actions & Widgets */}
        <div className="space-y-6">
          {/* 1. Quick Exam Entry by Code (For Students) */}
          {!isTeacher && !isAdmin && (
            <div className="bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2 text-cam font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Phòng thi trực tuyến</span>
              </div>
              <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text mb-1">
                Vào thi nhanh bằng mã đề
              </h3>
              <p className="text-xs text-vutruNhat dark:text-night-muted mb-4">
                Nhập mã đề do giáo viên cung cấp để bắt đầu làm bài ngay lập tức.
              </p>

              <form onSubmit={handleJoinByCode} className="space-y-3">
                <input
                  type="text"
                  placeholder="VD: EXAM102"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border rounded-xl text-center uppercase font-mono font-bold tracking-widest text-sm focus:border-cam focus:outline-none focus:ring-2 focus:ring-cam/20 transition-all text-vutru dark:text-night-text"
                />
                <button
                  type="submit"
                  disabled={loadingCode || !examCode.trim()}
                  className="w-full btn btn-chinh text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
                >
                  {loadingCode ? 'Đang tìm...' : 'Bắt đầu làm bài thi'}
                  <ArrowRight size={14} />
                </button>
              </form>
              {errorMsg && <p className="text-rose-500 text-xs mt-2 font-semibold text-center">{errorMsg}</p>}
            </div>
          )}

          {/* 2. Teacher Quick Academic Command Center */}
          {isTeacher && (
            <div className="bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
              <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text mb-1 flex items-center gap-2">
                <ClipboardList size={16} className="text-cam" />
                Tác vụ học vụ nhanh
              </h3>
              <p className="text-xs text-vutruNhat dark:text-night-muted mb-4">
                Lối tắt tạo học liệu và quản lý lớp học
              </p>

              <div className="space-y-2">
                <Link
                  to="/exams/create"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 dark:hover:bg-night-border hover:border-cam/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                        Soạn đề thi mới
                      </div>
                      <div className="text-[10px] text-vutruNhat dark:text-night-muted">Đề trắc nghiệm & PDF</div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/classes"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 dark:hover:bg-night-border hover:border-cam/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-camDam dark:bg-orange-950/40 dark:text-cam flex items-center justify-center">
                      <PenTool size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                        Giao bài & Chấm điểm
                      </div>
                      <div className="text-[10px] text-vutruNhat dark:text-night-muted">Sổ điểm các lớp học</div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/flashcards/create"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 dark:hover:bg-night-border hover:border-cam/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center">
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                        Tạo bộ thẻ Flashcard
                      </div>
                      <div className="text-[10px] text-vutruNhat dark:text-night-muted">Thẻ ghi nhớ kiến thức</div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to="/vocabulary/create"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 dark:hover:bg-night-border hover:border-cam/40 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                        Tạo danh sách từ vựng
                      </div>
                      <div className="text-[10px] text-vutruNhat dark:text-night-muted">Bộ từ kèm phát âm</div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>
          )}

          {/* 3. Admin Operations Hub */}
          {isAdmin && (
            <div className="bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
              <h3 className="font-heading text-base font-bold text-vutru dark:text-night-text mb-1 flex items-center gap-2">
                <ShieldCheck size={16} className="text-cam" />
                Trung tâm Điều hành Quản trị
              </h3>
              <p className="text-xs text-vutruNhat dark:text-night-muted mb-4">
                Quản lý tài khoản, nhật ký hệ thống và vận hành
              </p>

              <div className="space-y-2">
                <Link
                  to="/admin/users"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 hover:border-cam/40 transition-all group"
                >
                  <span className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                    Quản lý người dùng & Phân quyền
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam" />
                </Link>

                <Link
                  to="/admin/audit-logs"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 hover:border-cam/40 transition-all group"
                >
                  <span className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                    Nhật ký kiểm toán hệ thống (Audit Logs)
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam" />
                </Link>

                <Link
                  to="/admin/students/import"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 hover:border-cam/40 transition-all group"
                >
                  <span className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                    Nhập danh sách học viên hàng loạt
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam" />
                </Link>

                <Link
                  to="/activities/manage"
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-night-elevated border border-gray-200/60 dark:border-night-border hover:bg-camNhat/30 hover:border-cam/40 transition-all group"
                >
                  <span className="text-xs font-bold text-vutru dark:text-night-text group-hover:text-cam">
                    Quản lý hoạt động & Sự kiện ngoại khóa
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:text-cam" />
                </Link>
              </div>
            </div>
          )}

          {/* 4. Mascot & Sound Switcher (For Students) */}
          {!isTeacher && !isAdmin && (
            <>
              <UranianMascot />
              <button
                type="button"
                onClick={() => {
                  const next = !soundOn;
                  setSoundOn(next);
                  setSoundEnabled(next);
                  if (next) sounds.tap();
                }}
                className="w-full text-left bg-white dark:bg-night-surface p-3.5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft flex items-center justify-between gap-3"
              >
                <span className="text-xs font-bold text-vutru dark:text-night-text inline-flex items-center gap-2">
                  <Volume2 size={15} className="text-cam" />
                  Hiệu ứng âm thanh học tập
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    soundOn
                      ? 'bg-emerald-500 text-white dark:bg-emerald-400 dark:text-night-page'
                      : 'bg-gray-200 text-gray-600 dark:bg-night-elevated dark:text-night-muted'
                  }`}
                >
                  {soundOn ? 'Đang Bật' : 'Đã Tắt'}
                </span>
              </button>
            </>
          )}

          {/* 5. General Quick Navigation Links */}
          <div className="bg-white dark:bg-night-surface p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft">
            <h3 className="font-heading text-xs font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider mb-3">
              Lối tắt hệ thống
            </h3>
            <div className="space-y-2">
              <QuickLink to="/exams" title="Kho Đề thi chung" icon={FileText} />
              <QuickLink to="/vocabulary" title="Kho Bộ từ vựng" icon={BookOpen} />
              <QuickLink to="/flashcards" title="Kho Thẻ ghi nhớ" icon={Layers} />
              <QuickLink to="/profile/appearance" title="Giao diện & Theme" icon={Palette} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. 90-Day Student Activity Heatmap (Student Only) ── */}
      {!isTeacher && !isAdmin && (
        <StudentActivityHeatmap className="w-full" />
      )}

      {/* ── 5. Gamification Milestones & Leaderboard (All Roles) ── */}
      <GamificationDashboardPanels className="w-full" />
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
  <div className="bg-white dark:bg-night-surface p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-night-border shadow-soft flex items-center gap-3.5 hover:border-cam/40 hover:shadow-soft transition-all">
    <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-night-elevated flex items-center justify-center shrink-0 border border-gray-100 dark:border-night-border">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold text-vutruNhat dark:text-night-muted uppercase tracking-wider truncate">{title}</p>
      <p className="font-heading text-xl sm:text-2xl font-bold text-vutru dark:text-night-text truncate mt-0.5">{value}</p>
    </div>
  </div>
);

const QuickLink: React.FC<{ to: string; title: string; icon?: React.ElementType }> = ({ to, title, icon: Icon }) => (
  <Link
    to={to}
    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 dark:bg-night-elevated border border-gray-200/50 dark:border-night-border/70 hover:bg-white dark:hover:bg-night-surface hover:border-cam/30 hover:shadow-2xs transition-all group text-xs"
  >
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-vutruNhat dark:text-night-muted group-hover:text-cam transition-colors" />}
      <span className="font-semibold text-vutru dark:text-night-text group-hover:text-cam transition-colors">{title}</span>
    </div>
    <ArrowRight size={12} className="text-gray-400 group-hover:text-cam group-hover:translate-x-0.5 transition-all" />
  </Link>
);

export default Dashboard;
