import React from 'react';

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="w-full">
      <table
        ref={ref}
        className={`w-full text-left border-collapse ${className}`}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

export const Thead = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <thead
      ref={ref}
      className={`sticky top-0 z-10 bg-gray-50 dark:bg-night-elevated shadow-sm ${className}`}
      {...props}
    />
  )
);
Thead.displayName = 'Thead';

export const Tbody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = '', ...props }, ref) => (
    <tbody
      ref={ref}
      className={`divide-y divide-gray-50 dark:divide-night-border ${className}`}
      {...props}
    />
  )
);
Tbody.displayName = 'Tbody';

export const Tr = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`transition-colors hover:bg-gray-50 dark:hover:bg-night-elevated/50 ${className}`}
      {...props}
    />
  )
);
Tr.displayName = 'Tr';

export const Th = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <th
      ref={ref}
      className={`p-3 font-semibold text-sm text-gray-600 dark:text-night-muted border-b border-gray-200 dark:border-night-border ${className}`}
      {...props}
    />
  )
);
Th.displayName = 'Th';

export const Td = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`p-3 text-sm text-gray-800 dark:text-gray-200 ${className}`}
      {...props}
    />
  )
);
Td.displayName = 'Td';
