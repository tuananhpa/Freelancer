import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, id, ...props }, ref) => {
    
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const errorId = error && inputId ? `${inputId}-error` : undefined;

    return (
      <div className="w-full font-body">
        {label && (
          <label htmlFor={inputId} className="block text-xs sm:text-sm font-bold text-vutru dark:text-night-text mb-1.5 sm:mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none text-vutruNhat dark:text-night-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={errorId}
            className={`w-full bg-white dark:bg-night-surface rounded-2xl border-2 px-4 sm:px-5 py-3 sm:py-3.5 focus:outline-none focus-visible:ring-4 transition-all font-medium text-vutru dark:text-night-text placeholder:text-vutruNhat/60 dark:placeholder:text-night-muted ${
              icon ? 'pl-11' : ''
            } ${
              error 
                ? 'border-rose-400 dark:border-rose-600 focus:border-rose-500 focus:ring-rose-500/10' 
                : 'border-gray-100 dark:border-night-border focus:border-cam dark:focus:border-cam focus:ring-cam/15'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} role="alert" aria-live="polite" className="mt-1.5 text-xs sm:text-sm text-rose-500 dark:text-rose-400 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
