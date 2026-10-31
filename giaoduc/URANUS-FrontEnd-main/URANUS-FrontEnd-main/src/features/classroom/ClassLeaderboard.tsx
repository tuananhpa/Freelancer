import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import GamificationDashboardPanels from '../../components/gamification/GamificationDashboardPanels';

const ClassLeaderboard: React.FC = () => {
  const { classroom, isTeacher } = useOutletContext<{ classroom: any; isTeacher: boolean }>();
  const [enabled, setEnabled] = useState(classroom?.leaderboardEnabled ?? true);
  const [loadingToggle, setLoadingToggle] = useState(false);

  const toggleLeaderboard = async () => {
    try {
      setLoadingToggle(true);
      const next = !enabled;
      await api.put(`/classes/${classroom.id}/settings/leaderboard`, { enabled: next });
      setEnabled(next);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingToggle(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {isTeacher && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-night-surface rounded-2xl border border-gray-100 dark:border-night-border shadow-2xs">
          <div>
            <h3 className="font-heading text-sm font-bold text-vutru dark:text-night-text">
              Cài đặt hiển thị Bảng xếp hạng & Mốc thưởng lớp học
            </h3>
            <p className="text-xs text-vutruNhat dark:text-night-muted">
              Cho phép học sinh trong lớp theo dõi thứ hạng, thời gian học và nhận thưởng mốc chuỗi
            </p>
          </div>
          <button
            type="button"
            disabled={loadingToggle}
            onClick={toggleLeaderboard}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
              enabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-100 dark:bg-night-elevated text-gray-600 dark:text-night-muted'
            }`}
          >
            {enabled ? '✓ Đang bật công khai' : '✕ Đang tạm ẩn'}
          </button>
        </div>
      )}

      {!enabled && !isTeacher ? (
        <div className="text-center py-16 bg-white dark:bg-night-surface rounded-3xl border border-gray-100 dark:border-night-border text-vutruNhat dark:text-night-muted shadow-soft">
          Giáo viên chưa kích hoạt bảng xếp hạng cho lớp học này.
        </div>
      ) : (
        <GamificationDashboardPanels classroomId={classroom?.id} />
      )}
    </div>
  );
};

export default ClassLeaderboard;
