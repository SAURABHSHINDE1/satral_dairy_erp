import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  if (totalItems === 0) return null;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-secondary-100', className)}>
      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <span>
          Showing <span className="font-medium text-text-primary">{startItem}–{endItem}</span> of{' '}
          <span className="font-medium text-text-primary">{totalItems}</span> records
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>|</span>
            <span>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border border-secondary-200 rounded-md px-2 py-1 text-sm bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === 1
              ? 'text-secondary-300 cursor-not-allowed'
              : 'text-text-secondary hover:bg-secondary-100 hover:text-text-primary'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-3 py-1.5 text-sm text-text-secondary">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-text-secondary hover:bg-secondary-100 hover:text-text-primary'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'p-2 rounded-lg transition-colors',
            currentPage === totalPages
              ? 'text-secondary-300 cursor-not-allowed'
              : 'text-text-secondary hover:bg-secondary-100 hover:text-text-primary'
          )}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
