import React from 'react';
import Pagination from './Pagination';
import Select from './Select';

export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalElements: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

export const PageSizeSelector: React.FC<{
  value: number;
  onChange: (size: number) => void;
  options: number[];
}> = ({ value, onChange, options }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Số dòng / trang:</span>
      <Select
        value={String(value)}
        onChange={(v) => onChange(Number(v))}
        options={options.map((opt) => ({ value: String(opt), label: String(opt) }))}
        className="py-1.5 px-3 bg-gray-50 dark:bg-night-surface border border-gray-200 dark:border-night-border focus:border-cam rounded-lg outline-none text-sm text-gray-700 dark:text-white cursor-pointer transition-colors"
      />
    </div>
  );
};

export const ResultSummary: React.FC<{
  currentPage: number;
  pageSize: number;
  totalElements: number;
}> = ({ currentPage, pageSize, totalElements }) => {
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);
  
  if (totalElements === 0) return null;

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
      Hiển thị <span className="font-semibold text-gray-800 dark:text-gray-200">{start}–{end}</span> trong <span className="font-semibold text-gray-800 dark:text-gray-200">{totalElements}</span>
    </div>
  );
};

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalElements,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t border-gray-100 dark:border-night-border">
      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
        <PageSizeSelector value={pageSize} onChange={onPageSizeChange} options={pageSizeOptions} />
        <ResultSummary currentPage={currentPage} pageSize={pageSize} totalElements={totalElements} />
      </div>
      
      <div className="w-full sm:w-auto flex justify-center sm:justify-end">
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={onPageChange} 
          hideSummary 
          hideBorder 
        />
      </div>
    </div>
  );
};
