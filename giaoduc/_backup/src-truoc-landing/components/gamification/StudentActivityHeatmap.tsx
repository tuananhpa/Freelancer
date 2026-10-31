import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Flame, Activity, CheckCircle2, Snowflake, Award, BookOpen, PenTool, Sparkles, TrendingUp } from 'lucide-react';
import { gamificationApi } from '../../services/featureApi';
import classService from '../../services/class.service';
import { useAuth } from '../../context/AuthContext';

export interface ActivityDetail {
  id: string;
  type: 'EXAM' | 'ASSIGNMENT' | 'FLASHCARD' | 'ATTENDANCE' | 'LESSON' | 'STREAK_FREEZE' | 'OTHER';
  title: string;
  minutes?: number;
  score?: number;
  xp?: number;
  timestamp: string;
}

export interface DayActivityData {
  dateStr: string; // YYYY-MM-DD
  date: Date;
  count: number;
  minutes: number;
  hasAttendance: boolean;
  isFrozen: boolean;
  activities: ActivityDetail[];
}

const StudentActivityHeatmap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activityMap, setActivityMap] = useState<Record<string, DayActivityData>>({});
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchHeatmapData();
  }, [user?.id]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const [gamificationRes] = await Promise.all([
        gamificationApi.getStats().catch(() => ({ data: null })),
      ]);

      const gData = gamificationRes?.data || null;
      setStats(gData);

      // Build daily map for the last 90 days
      const map: Record<string, DayActivityData> = {};
      const today = new Date();

      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - (89 - i));
        const dateStr = d.toISOString().split('T')[0];

        map[dateStr] = {
          dateStr,
          date: d,
          count: 0,
          minutes: 0,
          hasAttendance: false,
          isFrozen: false,
          activities: [],
        };
      }

      // Populate with real backend activities if available
      if (gData?.recentActivities && Array.isArray(gData.recentActivities)) {
        gData.recentActivities.forEach((act: any) => {
          const actDate = act.activityDate ? act.activityDate.split('T')[0] : null;
          if (actDate && map[actDate]) {
            map[actDate].count += 1;
            const minutes = act.activityType === 'EXAM_COMPLETE' ? 30 : act.activityType === 'LESSON_COMPLETE' ? 20 : 15;
            map[actDate].minutes += minutes;

            let actTitle = 'Hoạt động học tập';
            let actType: ActivityDetail['type'] = 'OTHER';

            if (act.activityType === 'EXAM_COMPLETE') {
              actTitle = 'Làm bài kiểm tra / Đề thi';
              actType = 'EXAM';
            } else if (act.activityType === 'LESSON_COMPLETE') {
              actTitle = 'Hoạt động hoàn thành bài học';
              actType = 'LESSON';
            } else if (act.activityType === 'FLASHCARD_STUDY') {
              actTitle = 'Ôn tập thẻ ghi nhớ & từ vựng';
              actType = 'FLASHCARD';
            } else if (act.activityType === 'ATTENDANCE') {
              actTitle = 'Điểm danh lớp học';
              actType = 'ATTENDANCE';
              map[actDate].hasAttendance = true;
            }

            map[actDate].activities.push({
              id: `act-${Math.random()}`,
              type: actType,
              title: actTitle,
              minutes,
              xp: act.xpEarned || 10,
              timestamp: act.activityDate,
            });
          }
        });
      }

      setActivityMap(map);
    } catch (err) {
      console.error('Failed to load activity heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  // Generate 90-day grid aligned by weeks
  const { weeks, monthHeaders, totalDaysWithActivity, totalStudyMinutes } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the starting date (90 days ago)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 89);

    // Adjust startDate back to the previous Monday to align calendar grid (0=Sun, 1=Mon, ..., 6=Sat)
    const startDayOfWeek = startDate.getDay(); // 0 is Sun, 1 is Mon
    const daysToSubtract = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    const alignedStartDate = new Date(startDate);
    alignedStartDate.setDate(startDate.getDate() - daysToSubtract);

    const weekList: DayActivityData[][] = [];
    const currentWeek: DayActivityData[] = [];
    const monthHeaderList: { monthLabel: string; colIndex: number }[] = [];
    let lastMonth = -1;

    let totalActive = 0;
    let totalMins = 0;

    const iterDate = new Date(alignedStartDate);
    let col = 0;

    while (iterDate <= today || currentWeek.length > 0) {
      const dateStr = iterDate.toISOString().split('T')[0];
      const month = iterDate.getMonth();

      // Check if we entered a new month and this is early in the week
      if (month !== lastMonth && iterDate <= today) {
        monthHeaderList.push({
          monthLabel: `Tháng ${month + 1}`,
          colIndex: weekList.length,
        });
        lastMonth = month;
      }

      const dayData: DayActivityData = activityMap[dateStr] || {
        dateStr,
        date: new Date(iterDate),
        count: 0,
        minutes: 0,
        hasAttendance: false,
        isFrozen: false,
        activities: [],
      };

      if (activityMap[dateStr] && activityMap[dateStr].count > 0) {
        totalActive++;
        totalMins += activityMap[dateStr].minutes;
      }

      currentWeek.push(dayData);

      if (currentWeek.length === 7) {
        weekList.push([...currentWeek]);
        currentWeek.length = 0;
        col++;
      }

      iterDate.setDate(iterDate.getDate() + 1);

      // Stop once we pass today and finished the current week
      if (iterDate > today && currentWeek.length === 0) {
        break;
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          dateStr: '',
          date: new Date(),
          count: 0,
          minutes: 0,
          hasAttendance: false,
          isFrozen: false,
          activities: [],
        });
      }
      weekList.push(currentWeek);
    }

    return {
      weeks: weekList,
      monthHeaders: monthHeaderList,
      totalDaysWithActivity: totalActive,
      totalStudyMinutes: totalMins,
    };
  }, [activityMap]);

  // Selected Day Details
  const selectedDayData = useMemo(() => {
    return (
      activityMap[selectedDateStr] || {
        dateStr: selectedDateStr,
        date: new Date(selectedDateStr || Date.now()),
        count: 0,
        minutes: 0,
        hasAttendance: false,
        isFrozen: false,
        activities: [],
      }
    );
  }, [selectedDateStr, activityMap]);

  const isTodaySelected = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDateStr === todayStr;
  }, [selectedDateStr]);

  const formattedSelectedDate = useMemo(() => {
    try {
      const d = new Date(selectedDateStr);
      if (isNaN(d.getTime())) return '';
      const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = days[d.getDay()];
      return `${dayName}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  // Intensity color mapper
  const getCellColor = (count: number) => {
    if (count === 0) return 'bg-[#ebedf0] dark:bg-night-elevated hover:border-gray-400';
    if (count === 1) return 'bg-[#9be9a8] dark:bg-emerald-900/60 hover:brightness-95';
    if (count === 2) return 'bg-[#40c463] dark:bg-emerald-700 hover:brightness-95';
    if (count === 3) return 'bg-[#30a14e] dark:bg-emerald-600 hover:brightness-95';
    return 'bg-[#216e39] dark:bg-emerald-500 hover:brightness-95';
  };

  const formatHoursMinutes = (totalM: number) => {
    if (totalM <= 0) return '0p';
    const h = Math.floor(totalM / 60);
    const m = totalM % 60;
    if (h === 0) return `${m}p`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}p`;
  };

  return (
    <div className={`bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border shadow-soft p-5 sm:p-6 transition-all ${className}`}>
      {/* ── Card Header ── */}
      <div className="flex items-center gap-2 mb-1">
        <div className="text-vutru dark:text-night-text">
          <Calendar className="w-5 h-5 text-cam inline mr-2" />
          <h3 className="font-heading text-base sm:text-lg font-bold text-vutru dark:text-night-text inline">
            90 ngày gần nhất
          </h3>
        </div>
      </div>
      <p className="text-xs text-vutruNhat dark:text-night-muted mb-5">
        Bấm vào một ngày để xem chi tiết. Ô càng đậm = học càng nhiều.
      </p>

      {/* ── Main 3-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left: Heatmap Grid (Cols 1 - 6) */}
        <div className="lg:col-span-6 flex flex-col justify-between overflow-x-auto pb-2 select-none">
          <div>
            {/* Month Headers */}
            <div className="flex text-[11px] font-semibold text-vutruNhat dark:text-night-muted mb-2 pl-7 gap-6">
              {monthHeaders.map((mh, idx) => (
                <span key={idx} className="whitespace-nowrap">
                  {mh.monthLabel}
                </span>
              ))}
            </div>

            {/* Grid with Weekday Labels */}
            <div className="flex gap-2">
              {/* Row Labels (Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6) */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-vutruNhat dark:text-night-muted py-0.5 pr-1 shrink-0 h-[105px]">
                <span className="opacity-0">T2</span>
                <span>T3</span>
                <span className="opacity-0">T4</span>
                <span>T5</span>
                <span className="opacity-0">T6</span>
                <span>T7</span>
                <span className="opacity-0">CN</span>
              </div>

              {/* Matrix of Days */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                {weeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      if (!day.dateStr) {
                        return <div key={dIdx} className="w-3.5 h-3.5 rounded-xs opacity-0" />;
                      }

                      const isSelected = day.dateStr === selectedDateStr;
                      const todayStr = new Date().toISOString().split('T')[0];
                      const isToday = day.dateStr === todayStr;

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => setSelectedDateStr(day.dateStr)}
                          title={`${day.dateStr}: ${day.count} hoạt động (${day.minutes}p)`}
                          className={`w-3.5 h-3.5 rounded-xs transition-all relative shrink-0 ${getCellColor(day.count)} ${
                            isSelected
                              ? 'ring-2 ring-slate-800 dark:ring-white z-10 scale-110'
                              : isToday
                              ? 'ring-1.5 ring-cam z-10'
                              : ''
                          } ${day.hasAttendance ? 'border border-blue-500 shadow-2xs' : ''}`}
                        >
                          {day.isFrozen && (
                            <span className="absolute -top-1 -right-1 text-[8px]">❄️</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-4 text-[11px] text-vutruNhat dark:text-night-muted mt-4 pt-2 border-t border-gray-100 dark:border-night-border flex-wrap">
            <div className="flex items-center gap-1.5">
              <span>Ít</span>
              <div className="w-3 h-3 rounded-xs bg-[#ebedf0] dark:bg-night-elevated" />
              <div className="w-3 h-3 rounded-xs bg-[#9be9a8] dark:bg-emerald-900/60" />
              <div className="w-3 h-3 rounded-xs bg-[#40c463] dark:bg-emerald-700" />
              <div className="w-3 h-3 rounded-xs bg-[#30a14e] dark:bg-emerald-600" />
              <div className="w-3 h-3 rounded-xs bg-[#216e39] dark:bg-emerald-500" />
              <span>Nhiều</span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-3 h-3 rounded-xs border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 inline-block" />
              <span>Đã điểm danh</span>
            </div>

            <div className="flex items-center gap-1 font-medium">
              <span>❄️</span>
              <span>Đã dùng freeze</span>
            </div>
          </div>
        </div>

        {/* Center: Selected Day Detail (Cols 7 - 9) */}
        <div className="lg:col-span-3 bg-gray-50/70 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border rounded-2xl p-4 flex flex-col justify-between min-h-[170px]">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <h4 className="font-heading text-xs sm:text-sm font-bold text-vutru dark:text-night-text">
                {formattedSelectedDate}
              </h4>
            </div>

            <div className="flex items-center gap-2 mb-3">
              {isTodaySelected && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-cam border border-cam/30">
                  Hôm nay
                </span>
              )}
              <span className="text-xs text-vutruNhat dark:text-night-muted flex items-center gap-1">
                <Clock size={12} className="text-cam shrink-0" />
                <span>{selectedDayData.minutes}p</span>
              </span>
            </div>

            {selectedDayData.activities.length === 0 ? (
              <p className="text-xs text-vutruNhat dark:text-night-muted italic">
                Không có hoạt động nào ngày này
              </p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {selectedDayData.activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2 rounded-xl bg-white dark:bg-night-surface border border-gray-100 dark:border-night-border text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {act.type === 'EXAM' ? (
                        <PenTool size={13} className="text-purple-500 shrink-0" />
                      ) : act.type === 'ATTENDANCE' ? (
                        <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
                      ) : (
                        <BookOpen size={13} className="text-emerald-500 shrink-0" />
                      )}
                      <span className="font-medium text-vutru dark:text-night-text truncate">
                        {act.title}
                      </span>
                    </div>
                    {act.xp && (
                      <span className="text-[10px] font-bold text-cam shrink-0">
                        +{act.xp} XP
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: 90-Day Summary Box (Cols 10 - 12) */}
        <div className="lg:col-span-3 bg-gray-50/70 dark:bg-night-elevated/40 border border-gray-100 dark:border-night-border rounded-2xl p-4 flex flex-col justify-between min-h-[170px]">
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-vutruNhat dark:text-night-muted mb-3">
              TỔNG KẾT 90 NGÀY
            </h4>

            <div className="space-y-3">
              {/* Stat 1: Ngày có học */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-vutruNhat dark:text-night-muted leading-none">
                    Ngày có học
                  </p>
                  <p className="font-heading text-sm font-bold text-vutru dark:text-night-text mt-0.5">
                    {totalDaysWithActivity} / 90
                  </p>
                </div>
              </div>

              {/* Stat 2: Thời gian học */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-vutruNhat dark:text-night-muted leading-none">
                    Thời gian học
                  </p>
                  <p className="font-heading text-sm font-bold text-vutru dark:text-night-text mt-0.5">
                    {formatHoursMinutes(totalStudyMinutes)}
                  </p>
                </div>
              </div>

              {/* Stat 3: Chuỗi dài nhất */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-cam flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-vutruNhat dark:text-night-muted leading-none">
                    Chuỗi dài nhất
                  </p>
                  <p className="font-heading text-sm font-bold text-vutru dark:text-night-text mt-0.5">
                    {stats?.longestStreak ?? stats?.currentStreak ?? 0} ngày
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentActivityHeatmap;
