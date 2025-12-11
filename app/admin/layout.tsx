'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, currentUser } = useApp();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for localStorage to load
    const checkAuth = () => {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        setIsChecking(false);
        if (!isAuthenticated || (currentUser && currentUser.role !== 'admin')) {
          if (currentUser && currentUser.role === 'provider') {
            router.push('/provider/dashboard');
          } else {
            router.push('/login');
          }
        }
      } else {
        setIsChecking(false);
        if (!isAuthenticated) {
          router.push('/login');
        } else if (currentUser && currentUser.role !== 'admin') {
          if (currentUser.role === 'provider') {
            router.push('/provider/dashboard');
          } else {
            router.push('/login');
          }
        }
      }
    };

    // Small delay to ensure localStorage is read
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, currentUser, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (currentUser && currentUser.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

