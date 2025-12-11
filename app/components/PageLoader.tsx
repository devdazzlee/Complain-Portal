'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '../context/LoadingContext';

function PageLoaderContent() {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const { isLoading: isDataLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsPageLoading(true);
    
    // Hide loader after a short delay to allow page to render
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  const isLoading = isPageLoading || isDataLoading;

  if (!isLoading) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(31, 32, 34, 0.9)'
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <svg 
          className="w-12 h-12 animate-spin" 
          fill="none" 
          viewBox="0 0 24 24"
          style={{ color: '#2AB3EE' }}
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
}

export default function PageLoader() {
  return (
    <Suspense fallback={null}>
      <PageLoaderContent />
    </Suspense>
  );
}

