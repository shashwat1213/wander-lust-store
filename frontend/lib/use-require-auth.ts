'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

/**
 * Client-side convenience guard: redirects unauthenticated users to /login.
 * NOTE: this is UX only — the API enforces auth/authorization server-side.
 */
export function useRequireAuth(redirectTo = '/login') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const current =
        typeof window !== 'undefined'
          ? window.location.pathname
          : '';
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(current)}`);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
