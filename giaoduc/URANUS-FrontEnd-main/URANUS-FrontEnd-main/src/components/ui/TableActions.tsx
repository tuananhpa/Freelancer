import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TableActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'neutral';
}

export const TableAction: React.FC<TableActionProps> = ({ 
  icon: Icon, 
  label, 
  variant = 'neutral', 
  className = '', 
  ...props 
}) => {
  const variantStyles = {
    primary: 'text-cam hover:bg-cam/10 dark:hover:bg-cam/20',
    danger: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20',
    warning: 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/20',
    success: 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/20',
    neutral: 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-night-elevated',
  };

  return (
    <button
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${variantStyles[variant]} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      <Icon size={16} />
    </button>
  );
};

export const TableActions: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-end gap-1 ${className}`}>
      {children}
    </div>
  );
};
