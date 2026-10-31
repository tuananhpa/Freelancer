import React from 'react';

interface AlertProps {
  variant?: 'error' | 'success' | 'info' | 'warning';
  children: React.ReactNode;
  className?: string;
  icon?: boolean;
}

const Alert: React.FC<AlertProps> = ({ variant = 'info', children, className = '' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'error':
        return 'bg-red-50 dark:bg-red-500/15 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30';
      case 'success':
        return 'bg-green-50 dark:bg-emerald-500/15 text-green-700 dark:text-emerald-400 border-green-200 dark:border-emerald-500/30';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    }
  };

  return (
    <div className={`p-4 rounded-2xl border text-sm font-medium flex gap-3 items-start ${getStyles()} ${className}`}>
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
};

export default Alert;
