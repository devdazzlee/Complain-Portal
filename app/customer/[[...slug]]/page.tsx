'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';

export default function CustomerRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useApp();

  useEffect(() => {
    // Extract the path after /customer
    const pathAfterCustomer = pathname.replace('/customer', '');
    
    // Determine the redirect path based on user role
    if (currentUser?.role === 'admin') {
      // If admin, redirect to admin equivalent
      if (pathAfterCustomer === '/dashboard' || pathAfterCustomer === '') {
        router.replace('/admin/dashboard');
      } else {
        router.replace(`/admin${pathAfterCustomer}`);
      }
    } else {
      // Default to provider routes (since customer role was merged into provider)
      if (pathAfterCustomer === '/dashboard' || pathAfterCustomer === '') {
        router.replace('/provider/dashboard');
      } else {
        router.replace(`/provider${pathAfterCustomer}`);
      }
    }
  }, [pathname, router, currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}

