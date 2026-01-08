'use client';

import React, { useState, useEffect } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  itemLabel?: string; // Optional label for items (default: "complaints")
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  itemLabel = 'complaints',
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (isMobile) {
      // On mobile, show only 2 pages: current and next (or previous if on last page)
      if (currentPage === totalPages && totalPages > 1) {
        // On last page, show previous and current
        pages.push(totalPages - 1);
        pages.push(totalPages);
      } else if (currentPage === 1) {
        // On first page, show current and next
        pages.push(1);
        if (totalPages > 1) {
          pages.push(2);
        }
      } else {
        // In middle, show current and next
        pages.push(currentPage);
        if (currentPage < totalPages) {
          pages.push(currentPage + 1);
        }
      }
    } else {
      // Desktop: show more pages
      const maxVisible = 5;
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 4; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          for (let i = totalPages - 3; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('...');
          pages.push(totalPages);
        }
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t" style={{ borderColor: '#2A2B30' }}>
      <div className="text-xs sm:text-sm md:text-base whitespace-nowrap hidden sm:block" style={{ color: '#E6E6E6', opacity: 0.7 }}>
        Showing {startItem} to {endItem} of {totalItems} {itemLabel}
      </div>

      <div className="flex items-center gap-2 sm:gap-2 md:gap-3 w-full sm:w-auto justify-center sm:justify-start flex-nowrap overflow-x-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] sm:min-h-[40px] md:min-h-[44px] min-w-[36px] sm:min-w-[40px] md:min-w-[44px] shrink-0 flex-shrink-0"
          style={{
            backgroundColor: currentPage === 1 ? '#2A2B30' : '#2AB3EE',
            color: '#E6E6E6',
          }}
          onMouseEnter={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.backgroundColor = '#1F8FD0';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== 1) {
              e.currentTarget.style.backgroundColor = '#2AB3EE';
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-1 sm:px-2 py-2 text-xs sm:text-sm md:text-base whitespace-nowrap hidden sm:inline-block shrink-0"
                  style={{ color: '#E6E6E6', opacity: 0.5 }}
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className="px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-colors min-h-[36px] sm:min-h-[40px] md:min-h-[44px] min-w-[36px] sm:min-w-[40px] md:min-w-[44px] whitespace-nowrap shrink-0 flex-shrink-0"
                style={{
                  backgroundColor: isActive ? '#2AB3EE' : '#2A2B30',
                  color: '#E6E6E6',
                  border: isActive ? '2px solid #2AB3EE' : '2px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#1F2022';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#2A2B30';
                  }
                }}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 sm:px-3 md:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm md:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] sm:min-h-[40px] md:min-h-[44px] min-w-[36px] sm:min-w-[40px] md:min-w-[44px] shrink-0 flex-shrink-0"
          style={{
            backgroundColor: currentPage === totalPages ? '#2A2B30' : '#2AB3EE',
            color: '#E6E6E6',
          }}
          onMouseEnter={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.backgroundColor = '#1F8FD0';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== totalPages) {
              e.currentTarget.style.backgroundColor = '#2AB3EE';
            }
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

