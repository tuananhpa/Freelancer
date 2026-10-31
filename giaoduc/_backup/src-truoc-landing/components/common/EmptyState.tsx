import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  actionHref,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 md:p-14 text-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-night-border bg-white dark:bg-night-surface flex flex-col items-center justify-center transition-all ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-cam/10 dark:bg-cam/20 text-cam flex items-center justify-center mb-4 shadow-soft">
        <Icon size={32} />
      </div>

      <h3 className="text-lg md:text-xl font-bold font-heading text-vutru dark:text-night-text mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-xs md:text-sm text-vutruNhat dark:text-night-muted max-w-md mx-auto mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {actionText && actionHref && (
        <Link to={actionHref} className="btn btn-chinh text-sm font-bold inline-flex items-center gap-2">
          {actionText}
        </Link>
      )}

      {actionText && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-chinh text-sm font-bold inline-flex items-center gap-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
