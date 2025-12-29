'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Loader from '../../components/Loader';
import Toast from '../../components/Toast';
import { useApp } from '../../context/AppContext';
import { authService } from '../../../lib/auth';
import { settingsService } from '../../../lib/services';

export default function SettingsPage() {
  const { updateUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [settings, setSettings] = useState({
    emailNotifications: false,
    smsNotifications: false,
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setFetching(true);
        const response = await settingsService.get();
        
        // API returns: { status: true, setting: { email_notifications: true/false, sms_notifications: true/false } }
        const apiSettings = response?.setting || response?.data || response?.payload || response;
        
        setSettings({
          emailNotifications: apiSettings?.email_notifications === true || apiSettings?.email_notifications === 1,
          smsNotifications: apiSettings?.sms_notifications === true || apiSettings?.sms_notifications === 1,
        });
      } catch (err: unknown) {
        console.error('Error fetching settings:', err);
        // Keep default values if fetch fails
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    
    try {
      // Convert boolean to 0/1 for API
      const apiSettings = {
        email_notifications: settings.emailNotifications ? 1 : 0,
        sms_notifications: settings.smsNotifications ? 1 : 0,
      };
      
      const response = await settingsService.update(apiSettings);
      
      setToast({ 
        message: response?.message || 'Settings saved successfully!', 
        type: 'success' 
      });
    } catch (err: unknown) {
      console.error('Error saving settings:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (err as { message?: string })?.message || 
                          'Failed to save settings';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
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

    try {
      setChangingPassword(true);
      
      const response = await authService.updatePassword(
        passwordForm.oldPassword,
        passwordForm.newPassword
      );
      
      setToast({ 
        message: response?.message || 'Password changed successfully!', 
        type: 'success' 
      });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || 
                          (error as { message?: string })?.message || 
                          'Failed to change password. Please check your current password.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Layout role="provider">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-[#E6E6E6]">Settings</h1>

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" color="#2AB3EE" />
          </div>
        ) : (
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
        )}

        {/* Change Password Section */}
        <div className="rounded-lg p-6 md:p-8 bg-[#2A2B30] mt-6">
          <h2 className="text-2xl font-semibold mb-6 text-[#E6E6E6]">Change Password</h2>
          
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.oldPassword ? "text" : "password"}
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full rounded-lg outline-none transition bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 pr-12 min-h-[56px] focus:border-[#2AB3EE]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, oldPassword: !showPasswords.oldPassword })}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E6E6E6] hover:text-[#2AB3EE] transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {showPasswords.oldPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.newPassword ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full rounded-lg outline-none transition bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 pr-12 min-h-[56px] focus:border-[#2AB3EE]"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, newPassword: !showPasswords.newPassword })}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E6E6E6] hover:text-[#2AB3EE] transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {showPasswords.newPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-3 text-[#E6E6E6] text-lg font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  className="w-full rounded-lg outline-none transition bg-[#1F2022] border-2 border-[#E6E6E6] text-[#E6E6E6] text-lg px-5 py-4 pr-12 min-h-[56px] focus:border-[#2AB3EE]"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirmPassword: !showPasswords.confirmPassword })}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#E6E6E6] hover:text-[#2AB3EE] transition-colors"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {showPasswords.confirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
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

