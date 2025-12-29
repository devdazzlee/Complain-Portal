'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import Loader from '../../components/Loader';
import { authService } from '../../../lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      
      // Check if request was successful
      if (response?.result || response?.success || response?.message) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(response?.message || 'Failed to send reset instructions. Please try again.');
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // Show user-friendly error message
      if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Failed to send reset instructions. Please check your email/username and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(to bottom right, #2AB3EE, #2AB3EE)' }}>
      <div className="rounded-lg shadow-2xl w-full max-w-md p-8" style={{ backgroundColor: '#2A2B30' }}>
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>Client Complaint Portal</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#009200' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: '#E6E6E6' }}>Email Sent!</h2>
              <p style={{ color: '#E6E6E6', fontSize: '1rem' }}>
                We've sent password reset instructions to your email address.
              </p>
              <p style={{ color: '#E6E6E6', fontSize: '0.875rem', marginTop: '0.75rem', opacity: 0.8 }}>
                Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-2 text-center" style={{ color: '#E6E6E6' }}>Forgot Password?</h1>
            <p className="text-center mb-4" style={{ color: '#E6E6E6', opacity: 0.8, fontSize: '1rem' }}>
              Enter your email or username and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  className="px-5 py-4 rounded-lg"
                  style={{
                    backgroundColor: '#FF3F3F',
                    borderColor: '#FF3F3F',
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    color: '#FFFFFF',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                  }}
                >
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block mb-2" style={{ color: '#E6E6E6', fontSize: '1rem', fontWeight: 500 }}>
                  Email or Username
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or username"
                  required
                  className="w-full rounded-lg outline-none transition placeholder:opacity-50"
                  style={{ 
                    backgroundColor: '#1F2022', 
                    borderColor: error ? '#FF3F3F' : '#E6E6E6', 
                    borderWidth: '2px', 
                    borderStyle: 'solid', 
                    color: '#E6E6E6',
                    fontSize: '1rem',
                    padding: '12px 16px',
                    minHeight: '48px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
                  onBlur={(e) => e.target.style.borderColor = error ? '#FF3F3F' : '#E6E6E6'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{ 
                  backgroundColor: loading ? '#2A2B30' : '#2AB3EE', 
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  padding: '12px 24px',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#1F8FD0')}
                onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#2AB3EE')}
              >
                {loading ? (
                  <>
                    <Loader size="sm" color="#FFFFFF" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/login" className="font-semibold transition-colors" style={{ color: '#2AB3EE', fontSize: '1rem' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

