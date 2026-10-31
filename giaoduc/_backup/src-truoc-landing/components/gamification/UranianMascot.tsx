import React, { useEffect, useState } from 'react';
import { gamificationApi } from '../../services/featureApi';
import { getCurrentSeason } from '../../utils/seasonEvents';
import { getSkinInfo, resolveUranianSkin } from '../../utils/mascotSkins';
import UranianFigure from './UranianFigure';
import './UranianMascot.css';

export interface UranianStats {
  totalXp: number;
  currentStreak: number;
  uranianLevel: number;
  uranianHealth: number;
  uranianMood: string;
  uranianTitle: string;
}

interface UranianMascotProps {
  compact?: boolean;
  onStatsLoaded?: (stats: UranianStats) => void;
}

const UranianMascot: React.FC<UranianMascotProps> = ({ compact, onStatsLoaded }) => {
  const [stats, setStats] = useState<UranianStats | null>(null);
  const season = getCurrentSeason();

  useEffect(() => {
    gamificationApi.getStats()
      .then((res) => {
        const s: UranianStats = {
          totalXp: res.data.totalXp,
          currentStreak: res.data.currentStreak,
          uranianLevel: res.data.uranianLevel ?? 1,
          uranianHealth: res.data.uranianHealth ?? 100,
          uranianMood: res.data.uranianMood ?? 'NORMAL',
          uranianTitle: res.data.uranianTitle ?? 'Mầm non Điểm Sáng',
        };
        setStats(s);
        onStatsLoaded?.(s);
      })
      .catch(() => {});
  }, [onStatsLoaded]);

  if (!stats) {
    return (
      <div className={`uranian-card ${compact ? 'uranian-card--compact' : ''} animate-pulse`}>
        <div className="h-24 bg-gray-100 dark:bg-night-elevated rounded-2xl" />
      </div>
    );
  }

  const mood = stats.uranianMood;
  const xpInLevel = stats.totalXp % 100;
  const skin = resolveUranianSkin(season.id, stats.currentStreak);
  const skinInfo = getSkinInfo(skin);

  return (
    <div className={`uranian-card ${compact ? 'uranian-card--compact' : ''}`}>
      <div className="flex items-center gap-4">
        <div
          className={`uranian-avatar uranian-avatar--${mood.toLowerCase()} uranian-avatar--skin-${skin}`}
          aria-hidden
        >
          <UranianFigure mood={mood} skin={skin} className="uranian-avatar__figure" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-vutru font-heading">Uranian</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cam/15 text-cam">
              Lv.{stats.uranianLevel}
            </span>
            {!compact && (
              <span className="uranian-skin-badge" title={skinInfo.unlockHint}>
                {skinInfo.label}
              </span>
            )}
          </div>
          <p className="text-xs text-vutruNhat truncate">{stats.uranianTitle}</p>

          {!compact && (
            <>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-vutruNhat mb-1">
                    <span>Sức khỏe</span>
                    <span>{stats.uranianHealth}%</span>
                  </div>
                  <div className="uranian-bar">
                    <div
                      className={`uranian-bar__fill uranian-bar__fill--health ${stats.uranianHealth <= 50 ? 'uranian-bar__fill--low' : ''}`}
                      style={{ width: `${stats.uranianHealth}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-vutruNhat mb-1">
                    <span>XP level</span>
                    <span>{xpInLevel}/100</span>
                  </div>
                  <div className="uranian-bar">
                    <div className="uranian-bar__fill uranian-bar__fill--xp" style={{ width: `${xpInLevel}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-vutruNhat mt-2 leading-snug">
                {skin === 'ice-moon' && 'Ice Moon unlocked — streak 7+ ngày!'}
                {skin === 'halloween' && 'Pumpkin Moon — Happy Halloween!'}
                {skin === 'christmas' && 'Snow Moon — Giáng sinh an lành!'}
                {skin === 'classic' && mood === 'SLEEPING' && 'Uranian đang ngủ... Học hôm nay để đánh thức cậu ấy!'}
                {skin === 'classic' && mood === 'HUNGRY' && 'Uranian đói kiến thức! Làm 1 bài quiz nhé.'}
                {skin === 'classic' && mood === 'EXCITED' && `Chuỗi ${stats.currentStreak} ngày — Uranian siêu năng lượng!`}
                {skin === 'classic' && mood === 'HAPPY' && 'Uranian rất vui vì bạn học đều!'}
                {skin === 'classic' && mood === 'NORMAL' && 'Streak 7 ngày để mở skin Ice Moon'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UranianMascot;
