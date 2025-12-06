'use client';

import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: '#009200',
    error: '#FF3F3F',
    info: '#2AB3EE',
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div
        className="rounded-lg shadow-2xl p-5 flex items-center gap-4 min-w-[300px] max-w-md"
        style={{ backgroundColor: bgColor[type], color: '#FFFFFF' }}
      >
        <div className="flex-1">
          <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:opacity-80 transition-opacity"
          style={{ minWidth: '32px', minHeight: '32px' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

