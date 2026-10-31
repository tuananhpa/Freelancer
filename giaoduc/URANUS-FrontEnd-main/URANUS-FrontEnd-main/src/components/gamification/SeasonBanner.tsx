import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import SeasonIcon from '../common/SeasonIcon';
import { getCurrentSeason, getSeasonDashboardClass, getWeekendWarrior } from '../../utils/seasonEvents';

const SeasonBanner: React.FC = () => {
  const season = getCurrentSeason();
  const weekend = getWeekendWarrior();
  const seasonClass = getSeasonDashboardClass(season);
  const cta = season.cta ?? (
    (season.id === 'midterm' || season.id === 'finals' || season.id === 'ielts-vstep')
      ? { label: 'Kho lỗi sai', to: '/mistake-vault' }
      : undefined
  );

  return (
    <div className={`season-banner mb-6 rounded-3xl border-2 p-5 relative overflow-hidden bg-accent-soft border-accent-soft ${season.accentClass} ${seasonClass}`}>
      <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/70 dark:bg-night-elevated/80 text-accent">
              <SeasonIcon seasonId={season.id} className="w-5 h-5" />
            </span>
            <h2 className="font-extrabold text-vutru font-heading">{season.name}</h2>
            {season.bonus && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/60 dark:bg-night-elevated/80 text-camDam dark:text-cam">
                {season.bonus}
              </span>
            )}
            {weekend.active && (
              <span className="weekend-warrior-chip inline-flex items-center gap-1" title={weekend.xpHint}>
                <Zap size={12} strokeWidth={2.5} />
                {weekend.label}
              </span>
            )}
          </div>
          <p className="text-sm text-vutruNhat max-w-xl">{season.tagline}</p>
          {weekend.active && (
            <p className="text-xs text-camDam dark:text-cam mt-1 font-semibold">{weekend.xpHint}</p>
          )}
        </div>
        {cta && (
          <Link
            to={cta.to}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-cam text-white font-bold text-sm shadow-bouncy shadow-cam/30 hover:brightness-110 transition-all"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </div>
  );
};

export default SeasonBanner;
