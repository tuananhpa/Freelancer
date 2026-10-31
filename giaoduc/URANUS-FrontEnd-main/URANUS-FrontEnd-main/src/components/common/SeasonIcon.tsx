import React from 'react';
import {
  Backpack,
  Flame,
  Ghost,
  Gift,
  Languages,
  Orbit,
  Sun,
  Target,
  TreePine,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import type { SeasonTheme } from '../../utils/seasonEvents';

const ICONS: Record<SeasonTheme, LucideIcon> = {
  halloween: Ghost,
  christmas: TreePine,
  tet: Gift,
  'english-week': Languages,
  'ielts-vstep': Target,
  summer: Sun,
  midterm: FileText,
  finals: Flame,
  'back-to-school': Backpack,
  default: Orbit,
};

interface SeasonIconProps {
  seasonId: SeasonTheme;
  className?: string;
}

const SeasonIcon: React.FC<SeasonIconProps> = ({ seasonId, className = 'w-5 h-5' }) => {
  const Icon = ICONS[seasonId] ?? Orbit;
  return <Icon className={className} aria-hidden />;
};

export default SeasonIcon;
