'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { AdminAuthProvider, useAdminAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/orders', label: 'Orders' },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <Gate>{children}</Gate>
    </AdminAuthProvider>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  return <Shell>{children}</Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-slate-850 bg-slate-900 text-slate-200 md:flex">
        <div className="border-b border-slate-800 px-6 py-5">
          <span className="text-lg font-bold">
            Wander<span className="text-indigo-400">Lust</span>
          </span>
          <p className="text-xs text-slate-400">Admin</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  'block rounded-md px-3 py-2 text-sm font-medium ' +
                  (active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-3">
          <p className="px-3 pb-2 text-xs text-slate-400">{admin?.email}</p>
          <button
            onClick={logout}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-300 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 md:hidden">
          <span className="font-bold">WanderLust Admin</span>
          <button onClick={logout} className="text-sm text-red-600">
            Sign out
          </button>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function LoginScreen() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? 'Invalid email or password.'
            : err.status === 403
              ? 'This account does not have admin access.'
              : err.message,
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-slate-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Restricted to administrator accounts.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
