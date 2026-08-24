'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRequireAuth } from '@/lib/use-require-auth';
import { Spinner } from '@/components/ui';

export default function AccountPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const { user, isAdmin, logout } = useAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-bold text-brand-900">My account</h1>
      <p className="mt-1 text-brand-500">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/account/orders" className="card p-6 hover:bg-brand-50">
          <h2 className="font-semibold text-brand-900">My orders</h2>
          <p className="mt-1 text-sm text-brand-500">
            View order history and status.
          </p>
        </Link>
        <Link href="/products" className="card p-6 hover:bg-brand-50">
          <h2 className="font-semibold text-brand-900">Continue shopping</h2>
          <p className="mt-1 text-sm text-brand-500">Browse the catalog.</p>
        </Link>
        {isAdmin && (
          <a
            href="http://localhost:3200"
            className="card p-6 hover:bg-brand-50"
          >
            <h2 className="font-semibold text-brand-900">Admin panel</h2>
            <p className="mt-1 text-sm text-brand-500">
              Manage products, categories &amp; orders.
            </p>
          </a>
        )}
      </div>

      <button onClick={logout} className="btn-secondary mt-8">
        Sign out
      </button>
    </div>
  );
}
