import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, padding = 'md', hoverable = false, ...props }, ref) => {
    
    const baseClasses = 'bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden transition-all duration-300';
    
    const hoverClasses = hoverable ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : '';
    
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
