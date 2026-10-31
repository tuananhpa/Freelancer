import { SeasonTheme } from './seasonEvents';

export type UranianSkin = 'classic' | 'ice-moon' | 'halloween' | 'christmas';

export interface SkinInfo {
  id: UranianSkin;
  label: string;
  unlockHint: string;
}

const SKIN_META: Record<UranianSkin, SkinInfo> = {
  classic: { id: 'classic', label: 'Classic Planet', unlockHint: 'Mặc định' },
  'ice-moon': { id: 'ice-moon', label: 'Ice Moon', unlockHint: 'Streak 7+ ngày' },
  halloween: { id: 'halloween', label: 'Pumpkin Moon', unlockHint: 'Mùa Halloween' },
  christmas: { id: 'christmas', label: 'Snow Moon', unlockHint: 'Mùa Giáng sinh' },
};

/** Seasonal skins override; Ice Moon when streak >= 7. */
export function resolveUranianSkin(seasonId: SeasonTheme, streak: number): UranianSkin {
  if (seasonId === 'halloween') return 'halloween';
  if (seasonId === 'christmas') return 'christmas';
  if (streak >= 7) return 'ice-moon';
  return 'classic';
}

export function getSkinInfo(skin: UranianSkin): SkinInfo {
  return SKIN_META[skin];
}
