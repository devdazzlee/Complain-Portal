'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './context/AppContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, currentUser } = useApp();

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/provider/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, currentUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
