import React from 'react';

export interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxHeight?: string; // Optional: e.g. 'calc(100vh-280px)' for scrolling
}

export const TableContainer = React.forwardRef<HTMLDivElement, TableContainerProps>(
  ({ children, className = '', maxHeight, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-xl border border-gray-100 dark:border-night-border bg-white dark:bg-night-surface shadow-sm relative flex flex-col min-h-0 overflow-hidden ${className}`}
      {...props}
    >
      <div 
        className="flex-1 w-full overflow-x-auto overflow-y-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </div>
  )
);
TableContainer.displayName = 'TableContainer';
