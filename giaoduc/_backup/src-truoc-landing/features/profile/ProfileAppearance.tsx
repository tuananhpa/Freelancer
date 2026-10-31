import React from 'react';

import { Link } from 'react-router-dom';

import { Zap } from 'lucide-react';

import ThemeSelector from '../../components/common/ThemeSelector';

import SeasonIcon from '../../components/common/SeasonIcon';

import { getCurrentSeason, getWeekendWarrior } from '../../utils/seasonEvents';

import { colorThemeOptions } from '../../utils/colorThemes';



const ProfileAppearance = () => {

  const season = getCurrentSeason();

  const weekend = getWeekendWarrior();



  return (

    <div className="space-y-6">

      <div className="card">

        <h2 className="text-xl font-bold text-vutru mb-1">Giao diện & Theme</h2>

        <p className="text-sm text-vutruNhat">

          Chọn chế độ sáng/tối và 1 trong {colorThemeOptions.length} bảng màu của Điểm Sáng.

        </p>

      </div>



      <ThemeSelector />



      <div className={`card border-2 ${season.accentClass}`}>

        <h3 className="font-bold text-vutru mb-1">Season event hiện tại</h3>

        <p className="text-sm text-vutruNhat mb-4">

          Banner và mascot trên Dashboard tự đổi theo mùa. Hôm nay đang active:

        </p>

        <div className={`rounded-2xl p-5 bg-accent-soft border border-accent-soft ${season.accentClass}`}>

          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/70 dark:bg-night-elevated/80 text-accent mb-3">

            <SeasonIcon seasonId={season.id} className="w-5 h-5" />

          </span>

          <p className="font-extrabold text-lg text-vutru">{season.name}</p>

          <p className="text-sm text-vutruNhat mt-2">{season.tagline}</p>

          {season.bonus && (

            <span className="inline-block mt-3 text-xs font-bold px-2.5 py-1 rounded-full bg-white/60 dark:bg-night-surface/80 text-vutru">

              {season.bonus}

            </span>

          )}

        </div>

        {weekend.active && (

          <p className="mt-4 text-sm font-semibold text-camDam dark:text-cam inline-flex items-center gap-1.5">

            <Zap size={14} strokeWidth={2.5} />

            {weekend.label} — {weekend.tagline}

          </p>

        )}

        <Link

          to="/dashboard"

          className="inline-block mt-4 text-sm font-bold text-cam hover:text-camDam transition-colors"

        >

          ← Xem trên Dashboard

        </Link>

      </div>

    </div>

  );

};



export default ProfileAppearance;

