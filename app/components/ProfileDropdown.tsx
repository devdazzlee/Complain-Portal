'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export default function ProfileDropdown() {
  const { currentUser, logout } = useApp();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userInitials = currentUser?.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none p-2"
        style={{ minWidth: '44px', minHeight: '44px' }}
      >
        <div className="relative">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-semibold cursor-pointer transition-transform hover:scale-105" style={{ backgroundColor: '#2AB3EE', fontSize: '1.25rem' }}>
            {userInitials}
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2" style={{ backgroundColor: '#009200', borderColor: '#1F2022' }}></div>
        </div>
        <svg className="w-6 h-6 transition-transform" style={{ color: '#E6E6E6', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg shadow-xl z-50 border" style={{ backgroundColor: '#2A2B30', borderColor: '#E6E6E6', borderWidth: '2px' }}>
          <div className="py-2">
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E6E6E6', borderWidth: '0 0 1px 0' }}>
              <p className="font-semibold" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{currentUser?.name}</p>
              <p className="mt-1" style={{ color: '#E6E6E6', opacity: 0.7, fontSize: '1rem' }}>{currentUser?.email}</p>
            </div>
            
            <button
              onClick={() => {
                router.push('/customer/profile');
                setIsOpen(false);
              }}
              className="w-full text-left px-5 py-3 transition-colors flex items-center gap-3"
              style={{ color: '#E6E6E6', fontSize: '1.125rem', minHeight: '52px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1F2022';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </button>

            <button
              onClick={() => {
                router.push('/customer/settings');
                setIsOpen(false);
              }}
              className="w-full text-left px-5 py-3 transition-colors flex items-center gap-3"
              style={{ color: '#E6E6E6', fontSize: '1.125rem', minHeight: '52px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1F2022';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>

            <div className="border-t my-1" style={{ borderColor: '#E6E6E6', borderWidth: '1px 0 0 0' }}></div>

            <button
              onClick={handleLogout}
              className="w-full text-left px-5 py-3 transition-colors flex items-center gap-3"
              style={{ color: '#FF3F3F', fontSize: '1.125rem', minHeight: '52px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1F2022';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

