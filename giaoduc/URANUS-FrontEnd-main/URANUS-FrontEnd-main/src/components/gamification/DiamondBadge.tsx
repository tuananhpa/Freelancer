import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gamificationApi } from '../../services/featureApi';
import { useAuth } from '../../context/AuthContext';

export interface DiamondBadgeProps {
  className?: string;
  showDetailsOnHover?: boolean;
}

// Global shared state across all DiamondBadge instances to guarantee 100% sync
let globalDiamondState = {
  diamonds: 0,
  streak: 0,
  level: 1,
  loaded: false,
};

export const updateGlobalDiamonds = (diamonds: number, streak?: number, level?: number) => {
  globalDiamondState = {
    diamonds,
    streak: streak ?? globalDiamondState.streak,
    level: level ?? globalDiamondState.level,
    loaded: true,
  };
  window.dispatchEvent(new CustomEvent('uranus_diamonds_updated', { detail: globalDiamondState }));
};

export const DiamondBadge: React.FC<DiamondBadgeProps> = ({
  className = '',
}) => {
  const { user } = useAuth();
  const [diamonds, setDiamonds] = useState<number>(globalDiamondState.diamonds);
  const [streak, setStreak] = useState<number>(globalDiamondState.streak);
  const [level, setLevel] = useState<number>(globalDiamondState.level);
  const [loading, setLoading] = useState<boolean>(!globalDiamondState.loaded);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setDiamonds(e.detail.diamonds);
        if (e.detail.streak !== undefined) setStreak(e.detail.streak);
        if (e.detail.level !== undefined) setLevel(e.detail.level);
        setLoading(false);
      }
    };

    window.addEventListener('uranus_diamonds_updated', handleUpdate);
    return () => window.removeEventListener('uranus_diamonds_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    gamificationApi.getStats()
      .then((res) => {
        if (!isMounted || !res.data) return;
        const d = res.data.diamonds ?? Math.max(0, Math.floor((res.data.totalXp || 0) / 5) + ((res.data.currentStreak || 0) * 10));
        const s = res.data.currentStreak || 0;
        const lvl = res.data.uranianLevel || Math.max(1, Math.floor((res.data.totalXp || 0) / 100) + 1);
        updateGlobalDiamonds(d, s, lvl);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (!user) return null;

  return (
    <Link
      to="/progress"
      title={`Bạn đang có ${diamonds.toLocaleString()} Kim cương • Cấp ${level} • Chuỗi ${streak} ngày`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50/80 dark:bg-cyan-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200/70 dark:border-cyan-800/50 hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors ${className}`}
    >
      <span className="text-xs shrink-0">💎</span>
      <span className="font-heading font-bold tabular-nums">
        {loading ? '...' : diamonds.toLocaleString()}
      </span>
    </Link>
  );
};

export default DiamondBadge;
