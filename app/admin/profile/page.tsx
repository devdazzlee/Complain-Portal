'use client';

import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { authService } from '../../../lib/auth';

export default function AdminProfilePage() {
  const { currentUser, updateUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
  });

  // Fetch current user data on mount - ONLY from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setFetching(true);
        const response = await authService.getCurrentUser();
        // API returns: { user: { id, first_name, last_name, email, dob, contact_number_1, ... } }
        const userData = response?.user;
        
        if (!userData) {
          throw new Error('User data not found in API response');
        }
        
        // Parse name into first_name and last_name - ONLY from API
        const fullName = userData.first_name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Get phone from contact_number_1 - ONLY from API
        const phone = userData.contact_number_1 || '';
        
        // Get DOB - API returns format "1996-02-21" - ONLY from API
        const dob = userData.dob || '';
        
        setFormData({
          firstName: firstName,
          lastName: lastName || userData.last_name || '',
          email: userData.email || '',
          phone: phone,
          dateOfBirth: dob,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setToast({ message: 'Failed to load profile data', type: 'error' });
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare API payload
      const payload: {
        first_name?: string;
        last_name?: string | null;
        email?: string | null;
        phone?: string;
        dob?: string | null;
      } = {
        first_name: formData.firstName,
        last_name: formData.lastName || null,
        email: formData.email || null,
        phone: formData.phone,
        dob: formData.dateOfBirth || null,
      };

      const response = await authService.updateProfile(payload);
      
      // Update context with new user data
      if (currentUser) {
        updateUser({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
        });
      }
      
      setToast({ message: response?.message || 'Profile updated successfully!', type: 'success' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update profile';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Layout role="admin">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout role="admin">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#E6E6E6]">My Profile</h1>

        <div className="rounded-lg p-6 md:p-8 bg-[#2A2B30]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* First Name */}
            <div className="w-full">
              <label 
                htmlFor="firstName"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg outline-none block focus:border-[#2AB3EE] transition-colors"
              />
            </div>

            {/* Last Name */}
            <div className="w-full">
              <label 
                htmlFor="lastName"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg outline-none block focus:border-[#2AB3EE] transition-colors"
              />
            </div>

            {/* Email Address */}
            <div className="w-full">
              <label 
                htmlFor="email"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg outline-none block focus:border-[#2AB3EE] transition-colors"
              />
            </div>

            {/* Phone Number */}
            <div className="w-full">
              <label 
                htmlFor="phone"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
                className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg outline-none block focus:border-[#2AB3EE] transition-colors placeholder:opacity-50"
              />
            </div>

            {/* Date of Birth */}
            <div className="w-full">
              <label 
                htmlFor="dateOfBirth"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                Date of Birth
              </label>
              <div className="relative w-full" style={{ minHeight: '56px' }}>
                <input
                  type="text"
                  value={formData.dateOfBirth ? (() => {
                    try {
                      const date = new Date(formData.dateOfBirth + 'T00:00:00');
                      if (!isNaN(date.getTime())) {
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${month}/${day}/${year}`;
                      }
                    } catch {
                      // Invalid date
                    }
                    return formData.dateOfBirth;
                  })() : ''}
                  readOnly
                  placeholder="MM/DD/YYYY"
                  className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 pr-14 min-h-[56px] rounded-lg outline-none block focus:border-[#2AB3EE] transition-colors cursor-pointer"
                  onClick={() => {
                    if (dateInputRef.current) {
                      try {
                        if (typeof dateInputRef.current.showPicker === 'function') {
                          dateInputRef.current.showPicker();
                        } else {
                          dateInputRef.current.click();
                        }
                      } catch {
                        dateInputRef.current.click();
                      }
                    }
                  }}
                  style={{ height: '56px' }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{ 
                    right: '16px',
                    top: '16px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 20
                  }}
                >
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ color: '#FFFFFF' }}
                  >
                    <path 
                      d="M8 7V3M16 7V3M7 11H17M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" 
                      stroke="#FFFFFF" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="absolute cursor-pointer opacity-0"
                  style={{ 
                    colorScheme: 'dark',
                    right: '12px',
                    top: '12px',
                    width: '32px',
                    height: '32px',
                    zIndex: 30
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="w-full pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full rounded-lg font-semibold text-lg px-7 py-4 min-h-[60px] border-none flex items-center justify-center gap-3 transition-colors ${
                  loading 
                    ? 'bg-[#2A2B30] text-white cursor-not-allowed opacity-50' 
                    : 'bg-[#2AB3EE] text-white cursor-pointer hover:bg-[#1F8FD0]'
                }`}
              >
                {loading ? (
                  <>
                    <Loader size="sm" color="#FFFFFF" />
                    Updating Profile...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </Layout>
  );
}

