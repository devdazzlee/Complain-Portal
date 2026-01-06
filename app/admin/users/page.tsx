'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import { userManagementService } from '../../../lib/services';
import { User } from '../../types';
import { useUserManagementStore } from '../../../lib/stores/userManagementStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Toast from '../../components/Toast';
import Loader from '../../components/Loader';
import Pagination from '../../components/Pagination';

interface Role {
  id: number;
  name: string;
}

// Extended User interface with roleId for API mapping
interface UserWithRoleId extends User {
  roleId?: number;
}

function UserManagementContent() {
  const searchParams = useSearchParams();
  const [roleFilter, setRoleFilter] = useState<'All' | 'provider' | 'admin'>('All');
  
  // Zustand store
  const {
    roles,
    users,
    setRoles,
    setUsers,
    isRolesStale,
    isUsersStale,
  } = useUserManagementStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ email: '', role: 'provider' as 'provider' | 'admin', roleId: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState(false);
  const itemsPerPage = 10;

  // Read role from URL query parameter on mount
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'provider' || roleParam === 'admin' || roleParam === 'All') {
      setRoleFilter(roleParam);
    }
  }, [searchParams]);

  // Fetch roles - API returns { "1": "employee", "2": "supervisor", "3": "provider", "4": "admin" }
  const fetchRoles = useCallback(async () => {
    // Skip if roles are cached and fresh
    if (!isRolesStale() && roles.length > 0) {
      return;
    }
    
    try {
      const response = await userManagementService.getAllRoles();
      const rolesObj = response?.roles || {};
      
      // Convert object to array format: { "1": "employee" } -> [{ id: 1, name: "employee" }]
      const rolesArray = Object.entries(rolesObj).map(([id, name]) => ({
        id: Number(id),
        name: String(name),
      }));
      
      setRoles(rolesArray);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  }, [isRolesStale, roles.length, setRoles]);

  // Fetch users from API
  const fetchUsers = useCallback(async (nameFilter?: string, skipLoading = false) => {
    // Skip if users are cached and fresh (only for non-filtered requests)
    if (!nameFilter && !isUsersStale() && users.length > 0 && !skipLoading) {
      setLoading(false);
      return;
    }
    
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);
      const response = await userManagementService.getAllUsers(nameFilter);
      
      // Map API response to User interface
      // API response structure: { status: true, users: [...] }
      const apiUsers = response?.users || response?.data || response || [];
      const usersList = Array.isArray(apiUsers) ? apiUsers : [];
      
      // Get current roles from store for mapping
      const storeState = useUserManagementStore.getState();
      const currentRoles = storeState.roles;
      
      // Map users - roles should already be loaded
      const mappedUsers: UserWithRoleId[] = usersList.map((u: Record<string, unknown>) => {
        // Get role_id from user data (e.g., role_id: 1)
        const roleId = u.role_id ? Number(u.role_id) : null;
        const role = u.role as Record<string, unknown> | undefined;
        
        // Try to get role name from nested role object first, then from roles state
        let roleName = '';
        if (role?.name) {
          roleName = String(role.name).toLowerCase();
        } else if (roleId && currentRoles.length > 0) {
          // Use roles from store if available
          const foundRole = currentRoles.find(r => r.id === roleId);
          roleName = foundRole ? foundRole.name.toLowerCase() : '';
        }
        
        // Map role name to our User interface role (admin or provider)
        // Only show admin and provider in UI, others default to provider
        const userRole = roleName === 'admin' ? 'admin' : 'provider';
        
        return {
          id: String(u.id || u.user_id || Date.now()),
          email: String(u.email || ''),
          password: '', // Not returned by API
          name: String(u.full_name || u.first_name || u.name || u.username || '').trim() || 
                String(u.username || ''),
          role: userRole,
          phone: u.contact_number_1 ? String(u.contact_number_1) : undefined,
          roleId: roleId || undefined, // Store role_id for API updates
        };
      });
      
      setUsers(mappedUsers);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, [isUsersStale, users.length, setUsers]);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data on mount - fetch roles first, then users (only if stale)
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      const promises: Promise<void>[] = [];
      
      // Fetch roles if stale
      if (isRolesStale() || roles.length === 0) {
        promises.push(fetchRoles());
      }
      
      // Fetch users if stale
      if (isUsersStale() || users.length === 0) {
        promises.push(fetchUsers());
      }
      
      // If no promises, data is fresh
      if (promises.length === 0) {
        setLoading(false);
        setIsInitialLoad(false);
        return;
      }
      
      await Promise.all(promises);
      if (isMounted) {
        setIsInitialLoad(false);
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [fetchRoles, fetchUsers, isRolesStale, isUsersStale, roles.length, users.length]);

  // Debounced search (only after initial load)
  useEffect(() => {
    // Skip on initial load to prevent duplicate calls
    if (isInitialLoad) return;

    // Clear previous timer
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    const timer = setTimeout(() => {
      // Skip loading state for search to prevent flickering
      // Only fetch if search query has changed
      if (searchQuery.trim()) {
        fetchUsers(searchQuery.trim(), true);
      }
      // Don't refetch when search is cleared - keep existing data
    }, 500);

    searchDebounceTimerRef.current = timer;

    return () => {
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current);
        searchDebounceTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isInitialLoad]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filter by role (client-side since API doesn't support role filter)
    if (roleFilter !== 'All') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchQuery]);

  const handleEdit = (user: UserWithRoleId) => {
    setEditingUser(user.id);
    // Use roleId directly from user, or find by role name as fallback
    const roleId = user.roleId || roles.find(r => r.name.toLowerCase() === user.role.toLowerCase())?.id || 0;
    const role = roles.find(r => r.id === roleId);
    setEditForm({ 
      email: user.email, 
      role: role?.name.toLowerCase() === 'admin' ? 'admin' : 'provider',
      roleId: roleId,
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    
    try {
      setUpdating(true);
      const userId = parseInt(editingUser);
      if (isNaN(userId)) {
        setToast({ message: 'Invalid user ID', type: 'error' });
        return;
      }

      // Use roleId directly from editForm
      if (!editForm.roleId || editForm.roleId === 0) {
        setToast({ message: 'Please select a valid role', type: 'error' });
        return;
      }

      // Based on Postman API example, update-list-user only accepts: user_id, email, role_id
      // Name field is not supported by this endpoint
      await userManagementService.updateUser(userId, {
        email: editForm.email || null,
        role_id: editForm.roleId,
      });

      // Refresh users list (force refresh by clearing cache)
      useUserManagementStore.setState({ lastFetchedUsers: null });
      await fetchUsers(searchQuery.trim() || undefined, true);
      
    setToast({ message: 'User updated successfully', type: 'success' });
    setEditingUser(null);
    setTimeout(() => setToast(null), 3000);
    } catch (err: unknown) {
      console.error('Error updating user:', err);
      setToast({ 
        message: err instanceof Error ? err.message : 'Failed to update user', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({ email: '', role: 'provider', roleId: 0 });
  };

  if (loading) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="max-w-7xl mx-auto">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
          User Management
        </h1>

        {error && (
          <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: '#2A2B30', borderLeft: '4px solid #FF3F3F' }}>
            <p style={{ color: '#E6E6E6' }}>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-lg p-4 md:p-6 mb-4 md:mb-6" style={{ backgroundColor: '#2A2B30' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0 outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-base md:text-lg font-semibold" style={{ color: '#E6E6E6' }}>Filter by Role</label>
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as 'All' | 'provider' | 'admin')}>
                <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base md:text-lg px-4 md:px-5 py-3 md:py-4 min-h-[52px] md:min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                  <SelectItem value="All" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">All Roles</SelectItem>
                  <SelectItem value="provider" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Providers</SelectItem>
                  <SelectItem value="admin" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="rounded-lg p-4 md:p-6" style={{ backgroundColor: '#2A2B30' }}>
          <div className="mb-4">
            <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#E6E6E6' }}>
              Users ({filteredUsers.length})
            </h2>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg md:text-xl" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                No users found
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 md:space-y-4">
                {paginatedUsers.map(user => (
                <div
                  key={user.id}
                  className="rounded-lg p-5 md:p-6 lg:p-7 transition-all duration-200"
                  style={{ 
                    backgroundColor: '#1F2022', 
                    border: '1px solid rgba(230, 230, 230, 0.1)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#2A2B30';
                    e.currentTarget.style.borderColor = 'rgba(42, 179, 238, 0.3)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1F2022';
                    e.currentTarget.style.borderColor = 'rgba(230, 230, 230, 0.1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {editingUser === user.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block mb-2 text-base font-semibold" style={{ color: '#E6E6E6' }}>Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full bg-[#2A2B30] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base px-4 py-3 rounded-lg focus:border-[#2AB3EE] focus:ring-0 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-base font-semibold" style={{ color: '#E6E6E6' }}>Role</label>
                        <Select 
                          value={String(editForm.roleId)} 
                          onValueChange={(value) => {
                            const roleId = Number(value);
                            const role = roles.find(r => r.id === roleId);
                            setEditForm({ 
                              ...editForm, 
                              role: role?.name.toLowerCase() === 'admin' ? 'admin' : 'provider',
                              roleId: roleId,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full bg-[#2A2B30] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base px-4 py-3 rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                            {roles.map((role) => (
                              <SelectItem 
                                key={role.id} 
                                value={String(role.id)} 
                                className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]"
                              >
                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSave}
                          disabled={updating}
                          className="px-4 py-2 rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6', minHeight: '48px' }}
                          onMouseEnter={(e) => {
                            if (!updating) {
                              e.currentTarget.style.backgroundColor = '#1F8FD0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!updating) {
                              e.currentTarget.style.backgroundColor = '#2AB3EE';
                            }
                          }}
                        >
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 rounded-lg font-semibold text-base"
                          style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6', minHeight: '48px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F2022'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2A2B30'}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
                      <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0">
                        <div
                          className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center font-bold text-xl md:text-2xl shrink-0 shadow-lg"
                          style={{ 
                            backgroundColor: user.role === 'admin' ? '#FF3F3F' : '#2AB3EE', 
                            color: '#FFFFFF',
                            boxShadow: user.role === 'admin' 
                              ? '0 4px 12px rgba(255, 63, 63, 0.3)' 
                              : '0 4px 12px rgba(42, 179, 238, 0.3)'
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 md:gap-3 mb-1.5">
                            <h3 className="text-lg md:text-xl lg:text-2xl font-bold truncate" style={{ color: '#E6E6E6' }}>
                              {user.name}
                            </h3>
                            <span
                              className="px-2.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-semibold capitalize shrink-0"
                              style={{
                                backgroundColor: user.role === 'admin' ? '#FF3F3F' : '#2AB3EE',
                                color: '#FFFFFF',
                                fontSize: '0.75rem',
                                lineHeight: '1.2'
                              }}
                            >
                              {user.role}
                            </span>
                          </div>
                          <p className="text-sm md:text-base truncate" style={{ color: '#E6E6E6', opacity: 0.8 }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-5 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap transition-all duration-200 shrink-0"
                        style={{ 
                          backgroundColor: '#2AB3EE', 
                          color: '#FFFFFF', 
                          minHeight: '44px',
                          minWidth: '120px',
                          boxShadow: '0 2px 8px rgba(42, 179, 238, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1F8FD0';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(42, 179, 238, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2AB3EE';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(42, 179, 238, 0.2)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        Edit User
                      </button>
                    </div>
                  )}
                </div>
              ))}
              </div>
              {filteredUsers.length > itemsPerPage && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredUsers.length}
                  itemLabel="users"
                />
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-screen">
          <Loader size="lg" color="#2AB3EE" />
        </div>
      </Layout>
    }>
      <UserManagementContent />
    </Suspense>
  );
}

