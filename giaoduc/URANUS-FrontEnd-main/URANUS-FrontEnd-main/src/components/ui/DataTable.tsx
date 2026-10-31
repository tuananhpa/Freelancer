import React from 'react';

interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  className?: string;
  emptyMessage?: string;
}

function Table<T>({ 
  columns, 
  data, 
  onRowClick, 
  className = '',
  emptyMessage = 'Không có dữ liệu'
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto bg-white dark:bg-night-surface rounded-2xl shadow-sm border border-gray-100 dark:border-night-border ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-kem/50 dark:bg-night-elevated border-b border-gray-100 dark:border-night-border">
            {columns.map((col) => (
              <th 
                key={col.key} 
                className={`py-4 px-6 font-bold text-sm text-vutruNhat uppercase tracking-wider ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-night-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 px-6 text-center text-gray-500 dark:text-night-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr 
                key={i} 
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-night-elevated' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`py-4 px-6 text-vutru text-sm ${col.className || ''}`}>
                    {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
