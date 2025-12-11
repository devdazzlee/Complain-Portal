'use client';

import React, { useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { useApp } from '../../context/AppContext';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';

export default function ProfilePage() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState(() => ({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: '',
    address: '',
    dateOfBirth: '',
  }));

  // Update form when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.name, currentUser?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setToast({ message: 'Profile updated successfully!', type: 'success' });
  };

  return (
    <Layout role="provider">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#E6E6E6]">My Profile</h1>

        <div className="rounded-lg p-6 md:p-8 bg-[#2A2B30]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Full Name */}
            <div className="w-full">
              <label 
                htmlFor="name"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
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

            {/* Address */}
            <div className="w-full">
              <label 
                htmlFor="address"
                className="block mb-3 text-[#E6E6E6] text-lg font-medium"
              >
                Address
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter your address"
                rows={3}
                className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[100px] rounded-lg outline-none resize-none block font-inherit focus:border-[#2AB3EE] transition-colors placeholder:opacity-50"
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
