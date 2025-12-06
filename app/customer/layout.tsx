'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, currentUser } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (currentUser && currentUser.role !== 'customer') {
      // Redirect to appropriate portal based on role
      if (currentUser.role === 'provider') {
        router.push('/provider/dashboard');
      } else if (currentUser.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthenticated, currentUser, router]);

  if (!isAuthenticated || (currentUser && currentUser.role !== 'customer')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

