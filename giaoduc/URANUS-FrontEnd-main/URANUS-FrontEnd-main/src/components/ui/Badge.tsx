import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'neutral', icon, children, ...props }, ref) => {
    
    const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold';
    
    const variants = {
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      danger: 'bg-red-100 text-red-700',
      info: 'bg-blue-100 text-blue-700',
      neutral: 'bg-gray-100 text-vutruNhat',
      primary: 'theme-badge-primary',
    };

    return (
      <span
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        {...props}
      >
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
export default Badge;
