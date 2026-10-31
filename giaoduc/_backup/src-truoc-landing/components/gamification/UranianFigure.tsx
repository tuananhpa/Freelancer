import React from 'react';
import type { UranianSkin } from '../../utils/mascotSkins';

type Mood = 'EXCITED' | 'HAPPY' | 'NORMAL' | 'HUNGRY' | 'SLEEPING' | string;

interface UranianFigureProps {
  mood: Mood;
  skin: UranianSkin;
  className?: string;
}

const SKIN_PALETTE: Record<UranianSkin, { body: string; glow: string; ring: string; accent: string }> = {
  classic: { body: '#7C5CFF', glow: '#B8A6FF', ring: '#FF8A5C', accent: '#FFE566' },
  'ice-moon': { body: '#38BDF8', glow: '#BAE6FD', ring: '#E0F2FE', accent: '#F0F9FF' },
  halloween: { body: '#EA580C', glow: '#FDBA74', ring: '#FBBF24', accent: '#22C55E' },
  christmas: { body: '#DC2626', glow: '#FCA5A5', ring: '#16A34A', accent: '#FEF3C7' },
};

/** Friendly planet mascot — mood changes face expression. */
const UranianFigure: React.FC<UranianFigureProps> = ({ mood, skin, className }) => {
  const palette = SKIN_PALETTE[skin] || SKIN_PALETTE.classic;
  const eyesOpen = mood !== 'SLEEPING';
  const mouth =
    mood === 'EXCITED' || mood === 'HAPPY'
      ? 'smile'
      : mood === 'HUNGRY'
        ? 'frown'
        : mood === 'SLEEPING'
          ? 'sleep'
          : 'neutral';

  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      role="img"
    >
      <defs>
        <radialGradient id={`uranian-body-${skin}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={palette.glow} />
          <stop offset="55%" stopColor={palette.body} />
          <stop offset="100%" stopColor={palette.body} stopOpacity="0.92" />
        </radialGradient>
      </defs>

      {/* Orbit ring */}
      <ellipse
        cx="60"
        cy="62"
        rx="52"
        ry="18"
        stroke={palette.ring}
        strokeWidth="3"
        strokeOpacity="0.55"
        transform="rotate(-18 60 62)"
      />
      <circle cx="102" cy="48" r="5" fill={palette.accent} opacity="0.9">
        <animate attributeName="cy" values="48;52;48" dur="2.4s" repeatCount="indefinite" />
      </circle>

      {/* Planet body */}
      <circle cx="58" cy="58" r="36" fill={`url(#uranian-body-${skin})`} />
      <ellipse cx="46" cy="46" rx="14" ry="9" fill="#fff" opacity="0.22" />

      {/* Craters */}
      <circle cx="72" cy="70" r="6" fill="#000" opacity="0.12" />
      <circle cx="40" cy="68" r="4" fill="#000" opacity="0.1" />

      {/* Face */}
      {eyesOpen ? (
        <>
          <ellipse cx="46" cy="54" rx="4.2" ry={mood === 'EXCITED' ? 5.2 : 4.5} fill="#1B1F36" />
          <ellipse cx="70" cy="54" rx="4.2" ry={mood === 'EXCITED' ? 5.2 : 4.5} fill="#1B1F36" />
          <circle cx="47.5" cy="52.5" r="1.3" fill="#fff" />
          <circle cx="71.5" cy="52.5" r="1.3" fill="#fff" />
        </>
      ) : (
        <>
          <path d="M40 54 Q46 50 52 54" stroke="#1B1F36" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M64 54 Q70 50 76 54" stroke="#1B1F36" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <text x="78" y="42" fontSize="12" fill={palette.accent} opacity="0.9">
            z
          </text>
        </>
      )}

      {mouth === 'smile' && (
        <path d="M48 68 Q58 78 68 68" stroke="#1B1F36" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      )}
      {mouth === 'neutral' && (
        <path d="M50 70 H66" stroke="#1B1F36" strokeWidth="2.6" strokeLinecap="round" />
      )}
      {mouth === 'frown' && (
        <path d="M48 74 Q58 66 68 74" stroke="#1B1F36" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      )}
      {mouth === 'sleep' && (
        <ellipse cx="58" cy="70" rx="5" ry="3.5" fill="#1B1F36" opacity="0.85" />
      )}

      {/* Cheek blush when happy/excited */}
      {(mood === 'HAPPY' || mood === 'EXCITED') && (
        <>
          <ellipse cx="38" cy="62" rx="4" ry="2.5" fill="#FF8A9B" opacity="0.55" />
          <ellipse cx="78" cy="62" rx="4" ry="2.5" fill="#FF8A9B" opacity="0.55" />
        </>
      )}

      {/* Antenna spark when excited */}
      {mood === 'EXCITED' && (
        <g>
          <circle cx="58" cy="16" r="4" fill={palette.accent} />
          <path d="M58 20 V24" stroke={palette.accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};

export default UranianFigure;
