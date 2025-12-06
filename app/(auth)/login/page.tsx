'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Link from 'next/link';
import Logo from '../../components/Logo';
import Loader from '../../components/Loader';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useApp();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(email, password);
    
    if (success) {
      router.push('/customer/dashboard');
    } else {
      setError('Invalid email or password');
    }
    
    setLoading(false);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-5 py-4 rounded-lg" style={{ backgroundColor: '#FF3F3F', borderColor: '#FF3F3F', borderWidth: '2px', borderStyle: 'solid', color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 500 }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
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
                minHeight: '56px',
                textDecoration: 'none',
                textDecorationLine: 'none',
                backgroundImage: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
              onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
            />
          </div>

          <div>
            <label htmlFor="password" className="block mb-3" style={{ color: '#E6E6E6', fontSize: '1.125rem', fontWeight: 500 }}>
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full rounded-lg outline-none transition placeholder:opacity-50"
                style={{ 
                  backgroundColor: '#1F2022', 
                  borderColor: '#E6E6E6', 
                  borderWidth: '2px', 
                  borderStyle: 'solid', 
                  color: '#E6E6E6',
                  fontSize: '1.125rem',
                  padding: '16px 45px 16px 20px',
                  minHeight: '56px',
                  textDecoration: 'none',
                  textDecorationLine: 'none',
                  backgroundImage: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2AB3EE'}
                onBlur={(e) => e.target.style.borderColor = '#E6E6E6'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                style={{ color: '#E6E6E6' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
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
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between" style={{ fontSize: '1.125rem' }}>
          <span style={{ color: '#E6E6E6' }}>Don't have account?</span>
          <Link href="/signup" className="font-semibold transition-colors" style={{ color: '#2AB3EE', fontSize: '1.125rem' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>
            Sign Up
          </Link>
        </div>

        <div className="mt-4 text-right">
          <Link href="/forgot-password" className="transition-colors font-medium" style={{ color: '#2AB3EE', fontSize: '1.125rem' }} onMouseEnter={(e) => e.currentTarget.style.color = '#1F8FD0'} onMouseLeave={(e) => e.currentTarget.style.color = '#2AB3EE'}>
            Forget Password
          </Link>
        </div>
      </div>
    </div>
  );
}

