'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
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

function UserManagementContent() {
  const { users, updateUserById } = useApp();
  const searchParams = useSearchParams();
  const [roleFilter, setRoleFilter] = useState<'All' | 'provider' | 'admin'>('All');

  // Read role from URL query parameter on mount
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'provider' || roleParam === 'admin' || roleParam === 'All') {
      setRoleFilter(roleParam);
    }
  }, [searchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'provider' as 'provider' | 'admin' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (roleFilter !== 'All') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, roleFilter, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, searchQuery]);

  const handleEdit = (user: typeof users[0]) => {
    setEditingUser(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSave = () => {
    if (!editingUser) return;
    
    updateUserById(editingUser, editForm);
    setToast({ message: 'User updated successfully', type: 'success' });
    setEditingUser(null);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: 'provider' });
  };

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
                        <label className="block mb-2 text-base font-semibold" style={{ color: '#E6E6E6' }}>Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-[#2A2B30] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base px-4 py-3 rounded-lg focus:border-[#2AB3EE] focus:ring-0 outline-none"
                        />
                      </div>
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
                        <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value as 'provider' | 'admin' })}>
                          <SelectTrigger className="w-full bg-[#2A2B30] border-2 border-[#E6E6E6] text-[#E6E6E6] text-base px-4 py-3 rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                            <SelectItem value="provider" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Provider</SelectItem>
                            <SelectItem value="admin" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 rounded-lg font-semibold text-base"
                          style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6', minHeight: '48px' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1F8FD0'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2AB3EE'}
                        >
                          Save
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

