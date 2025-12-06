'use client';

import React, { useState } from 'react';
import Layout from '../../components/Layout';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '../../context/AppContext';

export default function SettingsPage() {
  const { updatePassword } = useApp();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    language: 'en',
    theme: 'dark',
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
    setToast({ message: 'Settings saved successfully!', type: 'success' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setChangingPassword(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const success = updatePassword(passwordForm.oldPassword, passwordForm.newPassword);
    
    setChangingPassword(false);
    if (success) {
      setToast({ message: 'Password changed successfully!', type: 'success' });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setToast({ message: 'Current password is incorrect', type: 'error' });
    }
  };

  return (
    <Layout role="customer">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#E6E6E6]">Settings</h1>

        <div className="rounded-lg p-6 md:p-8 bg-[#2A2B30]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-[#E6E6E6]">Notification Preferences</h2>
              
              <div className="flex flex-col gap-4">
                <label className="flex items-center cursor-pointer p-4 rounded-lg bg-[#1F2022] hover:bg-[#2A2B30] transition-colors relative">
                  <div className="flex flex-col flex-1">
                    <span className="text-[#E6E6E6] text-lg">Email</span>
                    <span className="text-[#E6E6E6] text-lg">Notifications</span>
                  </div>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                        settings.emailNotifications
                          ? 'bg-[#2AB3EE] border-[#2AB3EE]'
                          : 'bg-white border-[#E6E6E6]'
                      }`}
                      style={{ borderRadius: '4px' }}
                    >
                      {settings.emailNotifications && (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="#1F2022"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer p-4 rounded-lg bg-[#1F2022] hover:bg-[#2A2B30] transition-colors relative">
                  <div className="flex flex-col flex-1">
                    <span className="text-[#E6E6E6] text-lg">SMS</span>
                    <span className="text-[#E6E6E6] text-lg">Notifications</span>
                  </div>
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 border-2 flex items-center justify-center transition-all ${
                        settings.smsNotifications
                          ? 'bg-[#2AB3EE] border-[#2AB3EE]'
                          : 'bg-white border-[#E6E6E6]'
                      }`}
                      style={{ borderRadius: '4px' }}
                    >
                      {settings.smsNotifications && (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="#1F2022"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-6 text-[#E6E6E6]">Preferences</h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                    Language
                  </label>
                  <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
                    <SelectTrigger className="w-full bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] rounded-lg focus:border-[#2AB3EE] focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6]">
                      <SelectItem value="en" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">English</SelectItem>
                      <SelectItem value="es" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">Spanish</SelectItem>
                      <SelectItem value="fr" className="hover:bg-[#2A2B30] focus:bg-[#2A2B30]">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg font-semibold text-lg px-7 py-4 min-h-[60px] flex items-center justify-center gap-3 transition-colors ${
                loading 
                  ? 'bg-[#2A2B30] text-white cursor-not-allowed opacity-50' 
                  : 'bg-[#009200] text-white cursor-pointer hover:bg-[#007700]'
              }`}
            >
              {loading ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Saving Settings...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="rounded-lg p-6 md:p-8 bg-[#2A2B30] mt-6">
          <h2 className="text-2xl font-semibold mb-6 text-[#E6E6E6]">Change Password</h2>
          
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                Current Password
              </label>
              <input
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="Enter current password"
                className="w-full rounded-lg outline-none transition bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] focus:border-[#2AB3EE]"
                required
              />
            </div>

            <div>
              <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Enter new password (min 6 characters)"
                className="w-full rounded-lg outline-none transition bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] focus:border-[#2AB3EE]"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
                className="w-full rounded-lg outline-none transition bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 min-h-[56px] focus:border-[#2AB3EE]"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              className={`w-full rounded-lg font-semibold text-lg px-7 py-4 min-h-[60px] flex items-center justify-center gap-3 transition-colors ${
                changingPassword 
                  ? 'bg-[#2A2B30] text-white cursor-not-allowed opacity-50' 
                  : 'bg-[#2AB3EE] text-white cursor-pointer hover:bg-[#1F8FD0]'
              }`}
            >
              {changingPassword ? (
                <>
                  <Loader size="sm" color="#FFFFFF" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
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

