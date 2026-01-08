'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

interface ProfileDropdownProps {
  role?: 'provider' | 'admin';
  notificationsPath?: string;
  unreadCount?: number;
  onSearchClick?: () => void;
}

export default function ProfileDropdown({ role = 'provider', notificationsPath, unreadCount, onSearchClick }: ProfileDropdownProps) {
  // unreadCount prop is available but not displayed in mobile dropdown (removed per user request)
  void unreadCount; // Mark as intentionally unused
  const profilePath = role === 'admin' ? '/admin/profile' : '/provider/profile';
  const settingsPath = role === 'admin' ? '/admin/settings' : '/provider/settings';
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
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none shrink-0"
        style={{ height: '44px', padding: 0, alignItems: 'center' }}
      >
        <div className="relative shrink-0">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center font-semibold cursor-pointer transition-transform hover:scale-105 shrink-0" style={{ backgroundColor: '#2AB3EE', fontSize: '1.25rem' }}>
            {userInitials}
          </div>
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 shrink-0" style={{ backgroundColor: '#009200', borderColor: '#1F2022' }}></div>
        </div>
        <svg className="w-6 h-6 transition-transform shrink-0" style={{ color: '#E6E6E6', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-64 rounded-lg shadow-xl z-50 border overflow-hidden max-w-[calc(100vw-2rem)]" 
          style={{ 
            backgroundColor: '#2A2B30', 
            borderColor: '#E6E6E6', 
            borderWidth: '2px'
          }}
        >
          <div className="py-2">
            <div className="px-5 py-4 border-b overflow-hidden" style={{ borderColor: '#E6E6E6', borderWidth: '0 0 1px 0' }}>
              <p className="font-semibold truncate" style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>{currentUser?.name}</p>
              <p className="mt-1 truncate" style={{ color: '#E6E6E6', opacity: 0.7, fontSize: '1rem' }}>{currentUser?.email}</p>
            </div>
            
            {/* Mobile-only: Search and Notifications */}
            <div className="md:hidden">
              {onSearchClick && (
                <button
                  onClick={() => {
                    onSearchClick();
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              )}
              {notificationsPath && (
                <Link
                  href={notificationsPath}
                  onClick={() => setIsOpen(false)}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Notifications
                </Link>
              )}
              <div className="border-t my-1" style={{ borderColor: '#E6E6E6', borderWidth: '1px 0 0 0' }}></div>
            </div>
            
            <button
              onClick={() => {
                router.push(profilePath);
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
                router.push(settingsPath);
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

