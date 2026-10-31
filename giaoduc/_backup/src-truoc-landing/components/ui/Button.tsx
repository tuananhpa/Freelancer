import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', iconLeft, iconRight, isLoading, children, disabled, ...props }, ref) => {
    
    // Core structure with gap for icons
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cam/50';
    
    // Standard disabled styles applied to ALL buttons uniformly
    const disabledClasses = 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none disabled:shadow-none';
    
    const variants = {
      primary: 'btn-chinh',
      secondary: 'btn-phu',
      outline: 'btn-vien',
      ghost: 'bg-transparent text-vutruNhat hover:text-vutru hover:bg-gray-100 dark:hover:bg-night-border',
      danger: 'bg-red-500 text-white hover:bg-red-600 border-b-4 border-red-700 active:border-b-0 active:translate-y-1 shadow-[0_4px_0_rgba(0,0,0,0.1)]'
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full',
      md: 'px-6 py-2.5 text-base rounded-full',
      lg: 'px-8 py-3.5 text-lg rounded-full',
      icon: 'w-10 h-10 p-0 rounded-full flex items-center justify-center shrink-0'
    };

    const isActuallyDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${isLoading ? 'opacity-70 cursor-wait' : ''} ${className}`}
        disabled={isActuallyDisabled}
        {...props}
      >
        {!isLoading && iconLeft && <span className="flex items-center justify-center">{iconLeft}</span>}
        {isLoading && (
          <svg className="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
        {!isLoading && iconRight && <span className="flex items-center justify-center">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
