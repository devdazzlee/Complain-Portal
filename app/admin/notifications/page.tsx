'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/Layout';
import { notificationService } from '../../../lib/services';
import { complaintService } from '../../../lib/services';
import { Notification } from '../../types';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';
import { useNotificationsStore } from '../../../lib/stores/notificationsStore';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const {
    notifications: cachedNotifications,
    setNotifications,
    removeNotification,
    isStale,
  } = useNotificationsStore();

  const [notifications, setNotificationsLocal] = useState<Notification[]>(cachedNotifications);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const itemsPerPage = 10;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch notifications from API (only if stale or search query changed)
  const fetchNotifications = useCallback(async () => {
    // If searching, always fetch from API
    if (debouncedSearchQuery.trim()) {
      try {
        setLoading(true);
        setError(null);
        const response = await notificationService.getAll(debouncedSearchQuery.trim());
        
        // Map API response to Notification interface
        const apiNotifications = response?.complaints || response?.notifications || response?.data || response || [];
        const notificationsList = Array.isArray(apiNotifications) ? apiNotifications : [];
        
        const mappedNotifications: Notification[] = notificationsList.map((n: Record<string, unknown>) => {
          const title = String(n.title || '');
          const body = String(n.body || n.message || '');
          const fullText = `${title} ${body}`.toLowerCase();
          
          const isComplaintRelated = /complaint|complaints/.test(fullText);
          
          return {
            id: String(n.id || n.notification_id || Date.now()),
            message: body || title,
            complaintId: n.complaint_id ? String(n.complaint_id) : (isComplaintRelated ? 'related' : undefined),
            date: n.created_at 
              ? new Date(String(n.created_at)).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
            isRead: Boolean(n.is_read || n.read_at || false),
            type: (n.type as 'email' | 'sms' | 'in-app') || 'in-app',
          };
        });
        
        setNotificationsLocal(mappedNotifications);
        setLoading(false);
        return;
      } catch (err: unknown) {
        console.error('Error fetching notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
        setLoading(false);
        return;
      }
    }

    // If not searching and cache is fresh, use cache
    if (!isStale() && cachedNotifications.length > 0) {
      setNotificationsLocal(cachedNotifications);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await notificationService.getAll();
      
      // Map API response to Notification interface
      // API response structure: { status: true, message: "...", complaints: [...] }
      const apiNotifications = response?.complaints || response?.notifications || response?.data || response || [];
      const notificationsList = Array.isArray(apiNotifications) ? apiNotifications : [];
      
      const mappedNotifications: Notification[] = notificationsList.map((n: Record<string, unknown>) => {
        const title = String(n.title || '');
        const body = String(n.body || n.message || '');
        const fullText = `${title} ${body}`.toLowerCase();
        
        // Check if notification is complaint-related
        const isComplaintRelated = /complaint|complaints/.test(fullText);
        
        return {
          id: String(n.id || n.notification_id || Date.now()),
          message: body || title,
          complaintId: n.complaint_id ? String(n.complaint_id) : (isComplaintRelated ? 'related' : undefined),
          date: n.created_at 
            ? new Date(String(n.created_at)).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
          isRead: Boolean(n.is_read || n.read_at || false),
          type: (n.type as 'email' | 'sms' | 'in-app') || 'in-app',
        };
      });
      
      setNotificationsLocal(mappedNotifications);
      setNotifications(mappedNotifications); // Update Zustand store
    } catch (err: unknown) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isStale, cachedNotifications.length, setNotifications, debouncedSearchQuery]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    // Update local state immediately for better UX
    setNotificationsLocal(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    
    // If API supports mark as read, call it
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      try {
        await notificationService.markAsRead(numericId);
      } catch (err) {
        console.error('Error marking notification as read:', err);
        // Revert on error
        setNotificationsLocal((prev: Notification[]) => 
          prev.map(n => n.id === id ? { ...n, isRead: false } : n)
        );
      }
    }
  };

  const handleDelete = async (id: string) => {
    const numericId = parseInt(id);
    if (isNaN(numericId)) {
      // If ID is not numeric, just remove from local state
      setNotificationsLocal(prev => prev.filter(n => n.id !== id));
      removeNotification(id);
      return;
    }

    try {
      await notificationService.delete(numericId);
      setNotificationsLocal(prev => prev.filter(n => n.id !== id));
      removeNotification(id); // Update Zustand store
    } catch (err: unknown) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  const handleView = async (notification: Notification) => {
    await handleMarkAsRead(notification.id);
    
    if (notification.complaintId) {
      // If complaintId is 'related', navigate to complaints list
      if (notification.complaintId === 'related') {
        router.push('/admin/dashboard');
        return;
      }
      
      // Try to fetch complaint by ID
      try {
        const complaint = await complaintService.getById(notification.complaintId);
        if (complaint?.complaint) {
          router.push(`/admin/complaints/${complaint.complaint.id}`);
        } else {
          // If complaint not found, navigate to complaints list
          router.push('/admin/dashboard');
        }
      } catch (err) {
        console.error('Error fetching complaint:', err);
        // Navigate to complaints list if fetch fails
        router.push('/admin/dashboard');
      }
    } else {
      // Navigate to dashboard for non-complaint notifications
      router.push('/admin/dashboard');
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const newCount = unreadNotifications.length;
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = notifications.slice(startIndex, endIndex);

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

        {/* Search Input */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search notifications by title..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full px-4 py-3 rounded-lg text-base md:text-lg"
            style={{ 
              backgroundColor: '#1F2022', 
              border: '2px solid #E6E6E6', 
              color: '#E6E6E6',
              minHeight: '52px'
            }}
            onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
            onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
          />
        </div>

        {error && (
          <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#2A2B30', borderLeft: '4px solid #FF3F3F' }}>
            <p style={{ color: '#E6E6E6' }}>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader />
          </div>
        ) : (
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
                  <button
                    onClick={() => handleDelete(notification.id)}
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
        )}

        {/* Pagination */}
        {!loading && notifications.length > 0 && (
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



