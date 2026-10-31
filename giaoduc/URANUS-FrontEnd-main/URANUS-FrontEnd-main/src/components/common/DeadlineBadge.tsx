import React from 'react';
import { Clock, Flame, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { formatDeadlineDetailed, DetailedDeadlineInfo } from '../../utils/dateUtils';

export interface DeadlineBadgeProps {
  deadline?: string | null;
  className?: string;
  variant?: 'pill' | 'compact' | 'card-box';
  prefix?: string;
  showIcon?: boolean;
}

export const DeadlineBadge: React.FC<DeadlineBadgeProps> = ({
  deadline,
  className = '',
  variant = 'pill',
  prefix = '',
  showIcon = true,
}) => {
  const info: DetailedDeadlineInfo = formatDeadlineDetailed(deadline);

  if (!deadline) {
    return null;
  }

  const renderIcon = (size = 12) => {
    if (!showIcon) return null;
    if (info.isOverdue) return <AlertCircle size={size} strokeWidth={2.5} className="shrink-0 text-rose-500" />;
    if (info.isToday) return <Flame size={size} strokeWidth={2.5} className="shrink-0 text-cam" />;
    if (info.isTomorrow || info.isUrgent) return <Clock size={size} strokeWidth={2} className="shrink-0 text-amber-600 dark:text-amber-400" />;
    return <Calendar size={size} strokeWidth={2} className="shrink-0 text-blue-500" />;
  };

  // 1. Compact variant for table cells or minimal spaces
  if (variant === 'compact') {
    return (
      <span
        title={`Hạn nộp: ${info.fullDateTime}`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums shrink-0 ${info.badgeClass} ${className}`}
      >
        {renderIcon(11)}
        <span>{prefix ? `${prefix} ` : ''}{info.label}</span>
      </span>
    );
  }

  // 2. Card box alert variant (for card bodies / stream widgets)
  if (variant === 'card-box') {
    return (
      <div
        title={`Hạn nộp chi tiết: ${info.fullDateTime}`}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums shrink-0 ${info.badgeClass} ${className}`}
      >
        {renderIcon(13)}
        <span>{prefix ? `${prefix} ` : ''}{info.label}</span>
      </div>
    );
  }

  // 3. Default Pill variant
  return (
    <span
      title={`Hạn nộp: ${info.fullDateTime}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tabular-nums shrink-0 transition-all ${info.badgeClass} ${className}`}
    >
      {renderIcon(12)}
      <span>{prefix ? `${prefix} ` : ''}{info.label}</span>
    </span>
  );
};

export default DeadlineBadge;
