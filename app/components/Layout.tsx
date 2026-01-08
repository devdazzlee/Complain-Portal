'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { useNotifications } from '../../lib/hooks';
import Logo from './Logo';
import ProfileDropdown from './ProfileDropdown';
import SearchModal from './SearchModal';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role?: 'provider' | 'admin';
}

export default function Layout({ children, role = 'provider' }: LayoutProps) {
  const { currentUser } = useApp();
  const { data: notifications = [] } = useNotifications();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Calculate unread count from real API data
  // Handle different API response formats: is_read (boolean), isRead (boolean), or read (number 0/1)
  const unreadCount = notifications.filter((n: any) => {
    const isRead = n.is_read !== undefined ? n.is_read : 
                   n.isRead !== undefined ? n.isRead : 
                   n.read !== undefined ? n.read === 1 : 
                   false;
    return !isRead || isRead === 0 || isRead === false;
  }).length;

  if (!currentUser) return <>{children}</>;

  const dashboardPath = role === 'provider' ? '/provider/dashboard' : '/admin/dashboard';
  const notificationsPath = role === 'provider' ? '/provider/notifications' : '/admin/notifications';

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#1F2022', color: '#E6E6E6' }}>
      {/* Sidebar */}
      <Sidebar role={role} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full md:ml-[280px] md:w-[calc(100%-280px)] overflow-x-hidden">
        {/* Header */}
        <header style={{ backgroundColor: '#2A2B30' }} className="px-4 md:px-5 py-4 shrink-0 sticky top-0 z-30">
          <div className="flex items-center justify-end w-full">
            {/* Hamburger Button - Mobile Only */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex md:hidden items-center justify-center p-2 rounded-lg transition-colors shrink-0 mr-auto"
              style={{
                backgroundColor: 'transparent',
                color: '#E6E6E6',
                minWidth: '44px',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2AB3EE'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2 md:gap-3">
              <Link href={notificationsPath} className="relative flex items-center justify-center transition-colors shrink-0 hidden md:flex" style={{ width: '44px', height: '44px', color: '#E6E6E6' }} onMouseEnter={(e) => e.currentTarget.style.color = '#2AB3EE'} onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}>
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold" style={{ backgroundColor: '#FF3F3F', fontSize: '0.875rem' }}>
                    {unreadCount > 9 ? '9' : unreadCount}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="relative flex items-center justify-center transition-colors shrink-0 hidden md:flex" 
                style={{  height: '44px', color: '#E6E6E6' }} 
                onMouseEnter={(e) => e.currentTarget.style.color = '#2AB3EE'} 
                onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}
                title="Search complaints"
              >
                <svg 
                  className="w-6 h-6 md:w-7 md:h-7" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ display: 'block' }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    style={{ stroke: 'currentColor' }}
                  />
                </svg>
              </button>
              <ProfileDropdown 
                role={role}
                notificationsPath={notificationsPath}
                unreadCount={unreadCount}
                onSearchClick={() => setIsSearchOpen(true)}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-5 py-4 md:py-8 overflow-auto overflow-x-hidden">
          {children}
        </main>

        {/* Footer */}
        <footer style={{ backgroundColor: '#2A2B30', borderTopColor: '#E6E6E6' }} className="border-t px-4 py-4 md:py-6 shrink-0">
          <div className="flex flex-wrap gap-4 md:gap-6 lg:gap-8 justify-center md:justify-start text-base md:text-lg" style={{ color: '#E6E6E6' }}>
            <Link href="/provider/help" className="transition-colors font-medium" style={{ color: '#E6E6E6' }} onMouseEnter={(e) => e.currentTarget.style.color = '#2AB3EE'} onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}>Help</Link>
            <Link href="/provider/help" className="transition-colors font-medium" style={{ color: '#E6E6E6' }} onMouseEnter={(e) => e.currentTarget.style.color = '#2AB3EE'} onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}>Support</Link>
            <Link href="/provider/privacy" className="transition-colors font-medium" style={{ color: '#E6E6E6' }} onMouseEnter={(e) => e.currentTarget.style.color = '#2AB3EE'} onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}>Privacy Policy</Link>
          </div>
        </footer>

        {/* Search Modal */}
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>
    </div>
  );
}
