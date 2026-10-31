import React from 'react';
import Button from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hideSummary?: boolean;
  hideBorder?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, hideSummary = false, hideBorder = false }) => {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex items-center justify-between ${hideBorder ? '' : 'mt-6 border-t border-gray-100 dark:border-night-border pt-4'}`}>
      {!hideSummary && (
        <>
          <div className="text-sm text-vutruNhat sm:hidden">
            Trang <span className="font-bold text-vutru">{currentPage + 1}</span> / <span className="font-bold text-vutru">{totalPages}</span>
          </div>
          <div className="hidden sm:block text-sm text-vutruNhat">
            Hiển thị trang <span className="font-bold text-vutru">{currentPage + 1}</span> của <span className="font-bold text-vutru">{totalPages}</span>
          </div>
        </>
      )}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="rounded-xl px-3 sm:px-4"
        >
          Trước
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {Array.from({ length: totalPages }, (_, i) => i).filter(p => {
            // Show first, last, current, and adjacent pages
            return p === 0 || p === totalPages - 1 || Math.abs(p - currentPage) <= 1;
          }).map((p, index, array) => (
            <React.Fragment key={p}>
              {index > 0 && array[index - 1] !== p - 1 && (
                <span className="px-2 text-gray-400">...</span>
              )}
              <button
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                  currentPage === p
                    ? 'bg-cam text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-night-elevated'
                }`}
              >
                {p + 1}
              </button>
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={currentPage >= totalPages - 1}
          className="rounded-xl px-3 sm:px-4"
        >
          Sau
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
