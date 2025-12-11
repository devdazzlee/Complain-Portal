'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import Pagination from '../../components/Pagination';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const { notifications, markNotificationAsRead, deleteNotification, getComplaintById } = useApp();
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const newCount = unreadNotifications.length;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

  const handleView = (notification: typeof notifications[0]) => {
    markNotificationAsRead(notification.id);
    if (notification.complaintId) {
      // Find complaint by complaintId - getComplaintById handles both id and complaintId
      const complaint = getComplaintById(notification.complaintId);
      if (complaint) {
        // Use the complaint's id (not complaintId) for the route
        router.push(`/admin/complaints/${complaint.id}`);
      }
    }
  };

  return (
    <Layout role="admin">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: '#E6E6E6' }}>Notifications</h1>
          {newCount > 0 && (
            <span className="text-lg md:text-xl" style={{ color: '#E6E6E6', opacity: 0.8 }}>{newCount} New Notifications</span>
          )}
        </div>

        <h2 className="text-2xl font-semibold mb-6" style={{ color: '#E6E6E6' }}>Recent Notifications</h2>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="rounded-lg p-12 text-center" style={{ backgroundColor: '#2A2B30' }}>
              <p style={{ color: '#E6E6E6', fontSize: '1.25rem' }}>No notifications yet</p>
            </div>
          ) : (
            paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                  !notification.isRead ? 'border-l-4' : ''
                }`}
                style={{ 
                  backgroundColor: '#2A2B30',
                  borderLeftColor: !notification.isRead ? '#2AB3EE' : 'transparent',
                  borderLeftWidth: !notification.isRead ? '4px' : '0'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2022'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2A2B30'}
              >
                <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full mt-2 shrink-0" style={{ backgroundColor: '#2AB3EE' }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="break-words text-base md:text-lg" style={{ color: '#E6E6E6', lineHeight: '1.6' }}>{notification.message}</p>
                    <p className="text-sm md:text-base" style={{ color: '#E6E6E6', marginTop: '8px', opacity: 0.7 }}>{notification.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  {notification.complaintId ? (
                    <button
                      onClick={() => handleView(notification)}
                      className="text-white rounded-lg flex items-center justify-center gap-2 transition-colors whitespace-nowrap text-sm md:text-base px-4 md:px-5 py-2.5 md:py-3"
                      style={{ 
                        backgroundColor: '#2A2B30',
                        minHeight: '44px',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: '#E6E6E6'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1F2022';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2A2B30';
                      }}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">View</span>
                    </button>
                  ) : null}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="transition-colors p-2 md:p-3 shrink-0"
                    style={{ color: '#E6E6E6', minWidth: '40px', minHeight: '40px' }}
                    title="Delete notification"
                    onMouseEnter={(e) => e.currentTarget.style.color = '#FF3F3F'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#E6E6E6'}
                  >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {notifications.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={notifications.length}
            itemLabel="notifications"
          />
        )}
      </div>
    </Layout>
  );
}


