import React from 'react';
import { LucideIcon, FolderOpen } from 'lucide-react';
import Button from './Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-night-surface rounded-3xl border-2 border-dashed border-gray-200 dark:border-night-border ${className}`}>
      <div className="w-16 h-16 bg-cam/10 dark:bg-cam/20 rounded-full flex items-center justify-center mb-4 text-camDam dark:text-cam">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-vutru mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 dark:text-night-muted mb-6 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
