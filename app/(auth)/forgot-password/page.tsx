'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '../../components/Logo';
import Loader from '../../components/Loader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setLoading(false);
    setSuccess(true);
    
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(to bottom right, #2AB3EE, #2AB3EE)' }}>
      <div className="rounded-lg shadow-2xl w-full max-w-md p-8" style={{ backgroundColor: '#2A2B30' }}>
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <Logo size="lg" />
          </div>
          <p style={{ color: '#E6E6E6', fontSize: '1.25rem' }}>Client Complaint Portal</p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#009200' }}>
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: '#E6E6E6' }}>Email Sent!</h2>
              <p style={{ color: '#E6E6E6', fontSize: '1.125rem' }}>
                We've sent password reset instructions to your email address.
              </p>
              <p style={{ color: '#E6E6E6', fontSize: '1rem', marginTop: '1rem', opacity: 0.8 }}>
                Redirecting to login...
              </p>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: '#E6E6E6' }}>Forgot Password?</h1>
            <p className="text-center mb-6" style={{ color: '#E6E6E6', opacity: 0.8, fontSize: '1.125rem' }}>
              Enter your email address and we'll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg outline-none transition placeholder:opacity-50"
                  style={{ 
                    backgroundColor: '#1F2022', 
                    borderColor: '#E6E6E6', 
                    borderWidth: '2px', 
                    borderStyle: 'solid', 
                    color: '#E6E6E6',
                    fontSize: '1.125rem',
                    padding: '16px 20px',
                    minHeight: '56px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
                  onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                style={{ 
                  backgroundColor: loading ? '#2A2B30' : '#2AB3EE', 
                  color: '#FFFFFF',
                  fontSize: '1.125rem',
                  padding: '16px 28px',
                  minHeight: '56px'
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

            <div className="mt-6 text-center">
              <Link href="/login" className="font-semibold transition-colors" style={{ color: '#2AB3EE', fontSize: '1.125rem' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

