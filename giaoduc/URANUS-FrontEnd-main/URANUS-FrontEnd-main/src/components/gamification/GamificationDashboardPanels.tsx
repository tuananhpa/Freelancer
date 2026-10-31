import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Award, Flame, Sparkles, Clock, Lock, Check, ChevronRight, Zap, Snowflake, Users, Filter, Star, Crown, ShieldAlert } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import Select from '../ui/Select';
import { gamificationApi } from '../../services/featureApi';
import classService, { Classroom } from '../../services/class.service';
import api, { getApiErrorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { sounds, isSoundEnabled } from '../../utils/soundEffects';
import ConfettiBurst from './ConfettiBurst';
import { updateGlobalDiamonds } from './DiamondBadge';

export interface MilestoneItem {
  id: string;
  target: number;
  type: 'STREAK' | 'LEVEL';
  title: string;
  diamonds: number;
  freezeCount?: number;
  badgeName: string;
  badgeColor: string;
  frameName?: string;
  frameGradient?: string;
}

export interface StudentRankItem {
  id: string;
  rank: number;
  userId?: string;
  fullName: string;
  username?: string;
  avatarUrl?: string | null;
  level: number;
  studyMinutes: number;
  xp: number;
  isCurrentUser?: boolean;
}

const STREAK_MILESTONES: MilestoneItem[] = [
  { id: 'streak-3', target: 3, type: 'STREAK', title: 'Mốc 3 ngày', diamonds: 20, badgeName: 'Khởi Động Đồng', badgeColor: 'bg-amber-700 text-white' },
  { id: 'streak-7', target: 7, type: 'STREAK', title: 'Mốc 7 ngày', diamonds: 50, badgeName: 'Chăm Chỉ Bạc', badgeColor: 'bg-slate-400 text-white' },
  { id: 'streak-14', target: 14, type: 'STREAK', title: 'Mốc 14 ngày', diamonds: 100, badgeName: 'Bền Bỉ Vàng', badgeColor: 'bg-yellow-500 text-white' },
  { id: 'streak-30', target: 30, type: 'STREAK', title: 'Mốc 30 ngày', diamonds: 200, freezeCount: 1, badgeName: 'Chuyên Cần Lục Bảo', badgeColor: 'bg-emerald-500 text-white', frameName: 'Khung Sao Băng', frameGradient: 'from-amber-400 to-orange-500' },
  { id: 'streak-60', target: 60, type: 'STREAK', title: 'Mốc 60 ngày', diamonds: 350, freezeCount: 1, badgeName: 'Bất Diệt Thạch Anh', badgeColor: 'bg-purple-500 text-white' },
  { id: 'streak-90', target: 90, type: 'STREAK', title: 'Mốc 90 ngày', diamonds: 500, freezeCount: 1, badgeName: 'Tinh Anh Hồng Ngọc', badgeColor: 'bg-rose-500 text-white', frameName: 'Khung Solar Điểm Sáng', frameGradient: 'from-orange-500 via-rose-500 to-purple-600' },
  { id: 'streak-120', target: 120, type: 'STREAK', title: 'Mốc 120 ngày', diamonds: 700, freezeCount: 2, badgeName: 'Học Bá Kim Cương', badgeColor: 'bg-cyan-500 text-white' },
  { id: 'streak-180', target: 180, type: 'STREAK', title: 'Mốc 180 ngày', diamonds: 1000, freezeCount: 2, badgeName: 'Uranian Master', badgeColor: 'bg-indigo-600 text-white', frameName: 'Khung Thiên Hà Galaxy', frameGradient: 'from-blue-600 via-indigo-600 to-purple-800' },
  { id: 'streak-270', target: 270, type: 'STREAK', title: 'Mốc 270 ngày', diamonds: 1500, freezeCount: 2, badgeName: 'Cosmic Star', badgeColor: 'bg-fuchsia-600 text-white', frameName: 'Khung Tinh Vân Nebula', frameGradient: 'from-fuchsia-500 to-pink-600' },
  { id: 'streak-365', target: 365, type: 'STREAK', title: 'Mốc 365 ngày', diamonds: 3000, freezeCount: 3, badgeName: 'Thần Thoại Vĩ Đại', badgeColor: 'bg-amber-600 text-white', frameName: 'Khung Huyền Thoại Hoàng Kim', frameGradient: 'from-yellow-300 via-amber-500 to-yellow-600' },
];

const LEVEL_MILESTONES: MilestoneItem[] = [
  { id: 'level-5', target: 5, type: 'LEVEL', title: 'Mốc Cấp 5', diamonds: 30, badgeName: 'Tân Binh Xuất Sắc', badgeColor: 'bg-blue-500 text-white' },
  { id: 'level-10', target: 10, type: 'LEVEL', title: 'Mốc Cấp 10', diamonds: 80, badgeName: 'Tập Sự Ưu Tú', badgeColor: 'bg-emerald-500 text-white', frameName: 'Khung Điểm Sáng Lam', frameGradient: 'from-cyan-400 to-blue-600' },
  { id: 'level-20', target: 20, type: 'LEVEL', title: 'Mốc Cấp 20', diamonds: 200, badgeName: 'Thám Hiểm Không Gian', badgeColor: 'bg-purple-500 text-white' },
  { id: 'level-30', target: 30, type: 'LEVEL', title: 'Mốc Cấp 30', diamonds: 400, freezeCount: 1, badgeName: 'Thủ Lĩnh Tri Thức', badgeColor: 'bg-amber-500 text-white', frameName: 'Khung Thái Dương', frameGradient: 'from-amber-400 to-red-500' },
  { id: 'level-50', target: 50, type: 'LEVEL', title: 'Mốc Cấp 50', diamonds: 800, freezeCount: 2, badgeName: 'Đại Sư Điểm Sáng', badgeColor: 'bg-indigo-600 text-white' },
  { id: 'level-100', target: 100, type: 'LEVEL', title: 'Mốc Cấp 100', diamonds: 2000, freezeCount: 5, badgeName: 'Tối Thượng Vũ Trụ', badgeColor: 'bg-rose-600 text-white', frameName: 'Khung Vô Cực Vũ Trụ', frameGradient: 'from-violet-600 via-pink-500 to-amber-400' },
];

interface GamificationDashboardPanelsProps {
  classroomId?: string;
  className?: string;
}

export const GamificationDashboardPanels: React.FC<GamificationDashboardPanelsProps> = ({
  classroomId,
  className = '',
}) => {
  const { user, isTeacher: authIsTeacher, isAdmin: _isAdmin, isTeachingAssistant, isOffice } = useAuth();
  const isTeacherOrAdmin = authIsTeacher || _isAdmin || isTeachingAssistant || isOffice || user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'TEACHING_ASSISTANT';

  // Milestone Tab: 'STREAK' | 'LEVEL'
  const [milestoneTab, setMilestoneTab] = useState<'STREAK' | 'LEVEL'>('STREAK');

  // Leaderboard Tabs
  const [timeframe, setTimeframe] = useState<'WEEK' | 'MONTH'>('WEEK');
  const [metric, setMetric] = useState<'XP' | 'TIME'>('TIME');

  // Teacher / Admin class selection
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classroomId || 'ALL');

  // Gamification & Leaderboard State
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<StudentRankItem[]>([]);
  const [claimedMilestones, setClaimedMilestones] = useState<Record<string, boolean>>({});

  // Load user-scoped claimed milestones
  useEffect(() => {
    if (!user?.id) return;
    try {
      const saved = localStorage.getItem(`uranus_claimed_milestones_${user.id}`);
      setClaimedMilestones(saved ? JSON.parse(saved) : {});
    } catch {
      setClaimedMilestones({});
    }
  }, [user?.id]);

  const [showConfetti, setShowConfetti] = useState(false);

  // Fetch Classes for Teacher / Admin
  useEffect(() => {
    if (isTeacherOrAdmin) {
      classService.getMyClasses().then((res) => {
        const list = Array.isArray(res) ? res : res?.content || (res as any)?.data?.content || (res as any)?.data || [];
        setClasses(list);
      }).catch(console.error);
    }
  }, [isTeacherOrAdmin]);

  // Fetch Leaderboard & Gamification
  useEffect(() => {
    fetchData();
  }, [selectedClassId, timeframe, metric, user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gamificationRes] = await Promise.all([
        gamificationApi.getStats().catch(() => ({ data: null })),
      ]);

      const gData = gamificationRes?.data || null;
      setUserStats(gData);

      // Fetch classroom leaderboard if a specific class is selected, or global real data
      let rankList: StudentRankItem[] = [];

      if (selectedClassId !== 'ALL') {
        try {
          const res = await api.get(`/v1/classrooms/${selectedClassId}/leaderboard`);
          const entries = res.data || [];
          rankList = entries.map((e: any, idx: number) => ({
            id: e.studentId || `student-${idx}`,
            rank: e.rank || idx + 1,
            fullName: e.studentName || 'Học viên',
            username: e.username || `@${(e.studentName || '').toLowerCase().replace(/\s+/g, '')}`,
            avatarUrl: e.avatarUrl,
            level: Math.max(1, Math.floor((e.averageScore || 0) * 1.5)),
            studyMinutes: Math.round((e.completedCount || 0) * 45 + (e.averageScore || 0) * 10),
            xp: Math.round((e.completedCount || 0) * 120 + (e.averageScore || 0) * 50),
            isCurrentUser: e.studentId === user?.id,
          }));
        } catch {
          rankList = [];
        }
      } else {
        try {
          const res = await gamificationApi.getLeaderboard(timeframe, metric);
          const entries = res.data || [];
          rankList = entries.map((e: any) => ({
            id: e.userId,
            rank: e.rank,
            fullName: e.fullName,
            username: e.username,
            avatarUrl: e.avatarUrl,
            level: e.level,
            studyMinutes: e.studyMinutes,
            xp: e.totalXp,
            isCurrentUser: e.userId === user?.id,
          }));
        } catch {
          rankList = [];
        }
      }

      setLeaderboard(rankList);
    } catch (err) {
      console.error('Failed to load leaderboard & milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Claim Reward Handler
  const handleClaim = (milestone: MilestoneItem) => {
    if (!user?.id) return;
    if (isSoundEnabled()) sounds.levelUp();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);

    const updated = { ...claimedMilestones, [milestone.id]: true };
    setClaimedMilestones(updated);
    try {
      localStorage.setItem(`uranus_claimed_milestones_${user.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Immediately calculate updated diamond count and broadcast to DiamondBadges
    const currentBaseDiamonds = userStats?.diamonds ?? Math.max(0, Math.floor((userStats?.totalXp || 0) / 5) + ((userStats?.currentStreak || 0) * 10));
    const nextDiamonds = currentBaseDiamonds + milestone.diamonds;
    updateGlobalDiamonds(nextDiamonds, userStats?.currentStreak, userStats?.uranianLevel);
  };

  // Compute Current User Row
  const currentUserEntry = useMemo(() => {
    const found = leaderboard.find((r) => r.isCurrentUser);
    if (found) return found;
    return {
      id: user?.id || 'me',
      rank: 0,
      fullName: user?.fullName || 'Bạn',
      username: (user as any)?.username ? `@${(user as any).username}` : '',
      avatarUrl: user?.avatarUrl,
      level: userStats?.uranianLevel || 1,
      studyMinutes: 0,
      xp: userStats?.totalXp || 0,
      isCurrentUser: true,
    };
  }, [leaderboard, user, userStats]);

  // Format study minutes to "Xg Yp" or "0p"
  const formatTime = (minutes: number) => {
    if (!minutes || minutes <= 0) return '0p';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}p`;
    if (m === 0) return `${h}g`;
    return `${h}g ${m}p`;
  };

  const currentStreak = userStats?.currentStreak ?? userStats?.learningStreakDays ?? 0;
  const currentLevel = userStats?.uranianLevel ?? 1;

  const currentMilestones = milestoneTab === 'STREAK' ? STREAK_MILESTONES : LEVEL_MILESTONES;

  return (
    <div className={`space-y-6 ${className}`}>
      <ConfettiBurst active={showConfetti} />

      {/* ── Teacher / Admin Classroom Switcher Toolbar ── */}
      {isTeacherOrAdmin && classes.length > 0 && (
        <div className="bg-white dark:bg-night-surface p-4 rounded-2xl border border-gray-100 dark:border-night-border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cam/15 text-camDam dark:text-cam flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <div>
              <h4 className="font-heading text-sm font-bold text-vutru dark:text-night-text">
                Theo dõi xếp hạng & thành tích học viên
              </h4>
              <p className="text-xs text-vutruNhat dark:text-night-muted">
                Lọc dữ liệu theo từng lớp học bạn phụ trách hoặc toàn trường
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-vutruNhat dark:text-night-muted shrink-0">
              Lớp học:
            </span>
            <Select
              value={selectedClassId}
              onChange={(v) => setSelectedClassId(v)}
              className="w-full sm:w-64 bg-gray-50 dark:bg-night-elevated border border-gray-200 dark:border-night-border text-vutru dark:text-night-text text-xs rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-cam outline-none"
              options={[
                { value: 'ALL', label: 'Toàn bộ học viên (Tổng hợp)' },
                ...classes.map((cls) => ({ value: cls.id, label: `${cls.name} ${cls.section ? `(${cls.section})` : ''}` })),
              ]}
            />
          </div>
        </div>
      )}

      {/* ── Side-by-Side 2 Cards Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ══════════════════════════════════════════════════════════════════
            CARD 1: MỐC THƯỞNG (Milestone Rewards)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border shadow-soft p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-cam flex items-center justify-center text-xs font-black">
                🎖️
              </div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text">
                Mốc thưởng
              </h3>
            </div>
            <p className="text-xs text-vutruNhat dark:text-night-muted mb-4">
              Đạt mốc theo chuỗi và theo level để nhận thêm kim cương thưởng
            </p>

            {/* Toggle Tabs: Theo chuỗi / Theo level */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMilestoneTab('STREAK')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  milestoneTab === 'STREAK'
                    ? 'bg-slate-900 text-white dark:bg-cam dark:text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
              >
                <Flame size={13} className={milestoneTab === 'STREAK' ? 'text-amber-400' : ''} />
                Theo chuỗi
              </button>

              <button
                type="button"
                onClick={() => setMilestoneTab('LEVEL')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  milestoneTab === 'LEVEL'
                    ? 'bg-slate-900 text-white dark:bg-cam dark:text-white shadow-2xs'
                    : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
                }`}
              >
                <Sparkles size={13} className={milestoneTab === 'LEVEL' ? 'text-purple-400' : ''} />
                Theo level
              </button>
            </div>

            {/* Milestone Items List */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {currentMilestones.map((item) => {
                const isClaimed = !!claimedMilestones[item.id];
                const currentVal = milestoneTab === 'STREAK' ? currentStreak : currentLevel;
                const isEligible = currentVal >= item.target;
                const remaining = Math.max(0, item.target - currentVal);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isEligible && !isClaimed
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-cam/40 shadow-xs'
                        : isClaimed
                        ? 'bg-gray-50/60 dark:bg-night-elevated/30 border-gray-100 dark:border-night-border opacity-85'
                        : 'bg-white dark:bg-night-surface border-gray-100 dark:border-night-border'
                    }`}
                  >
                    {/* Left: Lock/Unlocked Icon & Title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isClaimed
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : isEligible
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-cam'
                            : 'bg-gray-100 dark:bg-night-elevated text-gray-400 dark:text-night-muted'
                        }`}
                      >
                        {isClaimed ? (
                          <Check size={16} />
                        ) : isEligible ? (
                          <Award size={18} />
                        ) : (
                          <Lock size={15} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-heading text-xs sm:text-sm font-bold text-vutru dark:text-night-text truncate">
                          {item.title}
                        </h4>

                        {/* Reward Diamonds Only */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/30">
                            💎 +{item.diamonds}
                          </span>
                        </div>

                        {/* Remaining progress hint */}
                        {!isClaimed && !isEligible && (
                          <p className="text-[10px] text-vutruNhat dark:text-night-muted mt-1">
                            {milestoneTab === 'STREAK'
                              ? `Còn ${remaining} ngày`
                              : `Cần thêm ${remaining} cấp`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Action / Status Button */}
                    <div className="shrink-0">
                      {isClaimed ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                          Đã nhận
                        </span>
                      ) : isEligible ? (
                        <button
                          type="button"
                          onClick={() => handleClaim(item)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-cam hover:bg-camDam shadow-2xs hover:shadow-soft transition-all active:scale-95"
                        >
                          Nhận thưởng
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 dark:text-night-muted bg-gray-50 dark:bg-night-elevated border border-gray-100 dark:border-night-border cursor-not-allowed"
                        >
                          Chưa mở
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════════════════════════════
            CARD 2: BẢNG XẾP HẠNG (Leaderboard)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border shadow-soft p-5 sm:p-6 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 rounded-full bg-yellow-100 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center text-xs font-black">
                🏆
              </div>
              <h3 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text">
                Bảng xếp hạng
              </h3>
            </div>
            <div className="flex items-center justify-between text-xs text-vutruNhat dark:text-night-muted mb-4">
              <span>Xem bạn đang đứng thứ mấy so với các bạn khác</span>
              <span className="font-semibold text-vutru dark:text-night-text hidden sm:inline">
                {timeframe === 'WEEK' ? 'Tuần này' : 'Tháng này'}
              </span>
            </div>

            {/* Filter Pills Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
              {/* Range Filters */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTimeframe('WEEK')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    timeframe === 'WEEK'
                      ? 'bg-slate-900 text-white dark:bg-cam dark:text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  Tuần này
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe('MONTH')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    timeframe === 'MONTH'
                      ? 'bg-slate-900 text-white dark:bg-cam dark:text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  Tháng này
                </button>
              </div>

              {/* Metric Filters */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setMetric('XP')}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    metric === 'XP'
                      ? 'bg-slate-900 text-white dark:bg-cam dark:text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  <Sparkles size={11} /> XP
                </button>
                <button
                  type="button"
                  onClick={() => setMetric('TIME')}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                    metric === 'TIME'
                      ? 'bg-slate-900 text-white dark:bg-cam dark:text-white shadow-2xs'
                      : 'bg-gray-100 dark:bg-night-elevated text-vutruNhat dark:text-night-muted hover:text-vutru'
                  }`}
                >
                  <Clock size={11} /> Thời gian học
                </button>
              </div>
            </div>

            {/* ── Pinned Current User Row ── */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/90 dark:bg-night-elevated/70 border border-gray-200/80 dark:border-night-border mb-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                {/* Rank Badge */}
                <div className="w-12 text-center shrink-0">
                  <span className="text-[11px] font-bold text-vutruNhat dark:text-night-muted block leading-tight">
                    {currentUserEntry.rank > 0 ? `#${currentUserEntry.rank}` : 'Chưa'}
                  </span>
                  {currentUserEntry.rank === 0 && (
                    <span className="text-[9px] text-vutruNhat dark:text-night-muted block leading-tight">
                      xếp hạng
                    </span>
                  )}
                </div>

                {/* Avatar & Info */}
                <div className="relative">
                  <UserAvatar
                    fullName={currentUserEntry.fullName}
                    avatarUrl={currentUserEntry.avatarUrl}
                    size="md"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-emerald-500 text-white shadow-2xs">
                    Lv.{currentUserEntry.level}
                  </span>
                </div>

                <div className="min-w-0 flex items-center gap-2 truncate">
                  <span className="font-heading text-xs sm:text-sm font-bold text-vutru dark:text-night-text truncate">
                    {currentUserEntry.fullName}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-slate-900 text-white dark:bg-cam shrink-0">
                    YOU
                  </span>
                </div>
              </div>

              {/* Metric Result */}
              <div className="text-right shrink-0">
                <span className="font-heading text-xs sm:text-sm font-extrabold text-vutru dark:text-night-text flex items-center gap-1 justify-end">
                  {metric === 'TIME' ? (
                    <>
                      <Clock size={13} className="text-cam shrink-0" />
                      {formatTime(currentUserEntry.studyMinutes)}
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} className="text-amber-500 shrink-0" />
                      {currentUserEntry.xp} XP
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* ── Ranking List ── */}
            <div className="space-y-1 max-h-[530px] overflow-y-auto pr-1">
              {leaderboard.length === 0 ? (
                <div className="text-center py-16 text-vutruNhat dark:text-night-muted text-xs font-medium">
                  Chưa có dữ liệu xếp hạng học viên.
                </div>
              ) : (
                leaderboard.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;

                  return (
                    <div
                      key={item.id}
                      className={`px-3 py-2.5 rounded-xl transition-colors flex items-center justify-between gap-3 ${
                        item.isCurrentUser
                          ? 'bg-camNhat/20 dark:bg-cam/10 border border-cam/25'
                          : 'hover:bg-gray-50 dark:hover:bg-night-elevated border border-transparent'
                      }`}
                    >
                      {/* Rank & Student Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank badge */}
                        <div className="w-8 text-center shrink-0">
                          {isTop1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-black shadow-2xs">
                              #1
                            </span>
                          ) : isTop2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-black shadow-2xs">
                              #2
                            </span>
                          ) : isTop3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-600 text-white inline-flex items-center justify-center text-xs font-black shadow-2xs">
                              #3
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-vutruNhat dark:text-night-muted">
                              #{item.rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="relative">
                          <UserAvatar
                            fullName={item.fullName}
                            avatarUrl={item.avatarUrl}
                            size="sm"
                          />
                          <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full text-[7px] font-extrabold bg-emerald-500 text-white shadow-2xs">
                            Lv.{item.level}
                          </span>
                        </div>

                        {/* Name / Username */}
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-vutru dark:text-night-text truncate">
                            {item.fullName || item.username}
                          </p>
                        </div>
                      </div>

                      {/* Metric value */}
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-vutru dark:text-night-text flex items-center gap-1 justify-end tabular-nums">
                          {metric === 'TIME' ? (
                            <>
                              <Clock size={12} className="text-vutruNhat dark:text-night-muted shrink-0" />
                              {formatTime(item.studyMinutes)}
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} className="text-cam shrink-0" />
                              {item.xp.toLocaleString()} XP
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GamificationDashboardPanels;
