import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../../services/featureApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import StudentActivityHeatmap from '../../components/gamification/StudentActivityHeatmap';

import PageHeader from '../../components/ui/PageHeader';
import { TrendingUp } from 'lucide-react';
const ProgressReportPage = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getProgressReport().then((res) => setReport(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingOverlay text="Đang tải báo cáo..." />;
  if (!report) return <div className="p-10 text-center text-red-500">Không tải được báo cáo.</div>;

  const s = report.summary;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-8">
      <PageHeader icon={TrendingUp} title="Báo cáo tiến độ" subtitle="Tổng hợp kết quả học tập của bạn" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="XP" value={s.totalXp ?? 0} />
        <Stat label="Streak" value={`${s.currentStreak ?? s.learningStreakDays ?? 0} ngày`} />
        <Stat label="Bài học" value={s.completedLessons} />
        <Stat label="ĐTB đề thi" value={`${s.averageExamScore}%`} />
      </div>

      {/* 90-Day Activity Heatmap */}
      <StudentActivityHeatmap className="w-full" />

      {s.badges?.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-3 text-vutru dark:text-night-text">Huy hiệu 🏅</h2>
          <div className="flex flex-wrap gap-2">
            {s.badges.map((b: string) => (
              <span key={b} className="px-3 py-1 bg-cam/15 text-camDam rounded-full text-sm font-bold">{b}</span>
            ))}
          </div>
        </div>
      )}

      {report.examHistory?.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-4 text-vutru dark:text-night-text">Điểm thi gần đây</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report.examHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="examTitle" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="scorePercent" stroke="#F97316" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {report.recentActivities?.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-vutru dark:text-night-text">Hoạt động gần đây</h2>
            <span className="text-xs text-vutruNhat dark:text-night-muted">Ghi nhận tiến độ & điểm XP</span>
          </div>
          <ul className="divide-y divide-gray-100 dark:divide-night-border text-sm">
            {report.recentActivities.map((a: any, i: number) => {
              const formatType = (t: string) => {
                switch (t) {
                  case 'DAILY_LOGIN': return 'Đăng nhập hàng ngày';
                  case 'STUDY_FLASHCARD': return 'Học thẻ ghi nhớ Flashcard';
                  case 'TAKE_EXAM': return 'Hoàn thành bài kiểm tra';
                  case 'COMPLETE_ASSIGNMENT': return 'Hoàn thành bài tập';
                  case 'STREAK_BONUS': return 'Thưởng duy trì chuỗi Streak';
                  case 'MILESTONE_CLAIM': return 'Nhận thưởng mốc thành tích';
                  default: return t?.replace(/_/g, ' ') || 'Hoạt động học tập';
                }
              };

              const formatTime = (dateStr?: string) => {
                if (!dateStr) return '';
                try {
                  const d = new Date(dateStr);
                  if (isNaN(d.getTime())) return dateStr;
                  const now = new Date();
                  const isToday = d.toDateString() === now.toDateString();
                  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  if (isToday) return `Hôm nay, ${time}`;
                  return `${time} • ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
                } catch {
                  return dateStr;
                }
              };

              return (
                <li key={i} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-vutru dark:text-night-text text-xs sm:text-sm truncate">
                      {formatType(a.activityType)}
                    </p>
                    <p className="text-[11px] text-vutruNhat dark:text-night-muted mt-0.5">
                      {formatTime(a.activityDate)}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-cam bg-camNhat/30 dark:bg-cam/15 px-2 py-0.5 rounded-lg shrink-0">
                    +{a.xpEarned} XP
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Link to="/dashboard" className="text-cam font-semibold hover:underline inline-block">← Về Dashboard</Link>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="card text-center">
    <p className="text-xs text-vutruNhat uppercase font-bold">{label}</p>
    <p className="text-2xl font-black text-camDam mt-1">{value}</p>
  </div>
);

export default ProgressReportPage;
