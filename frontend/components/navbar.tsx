'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-sand-50/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-brand-700">
              Wander<span className="text-brand-400">Lust</span>
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="/products"
              className="text-sm font-medium text-brand-700 hover:text-brand-900"
            >
              Shop
            </Link>
            <Link
              href="/categories"
              className="text-sm font-medium text-brand-700 hover:text-brand-900"
            >
              Categories
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-brand-700 hover:bg-brand-50"
            aria-label="Cart"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="btn-ghost"
                aria-haspopup="menu"
                aria-expanded={open}
              >
                {user?.email.split('@')[0]}
                <ChevronDown />
              </button>
              {open && (
                <div
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-brand-100 bg-white shadow-lg"
                  role="menu"
                  onMouseLeave={() => setOpen(false)}
                >
                  <Link
                    href="/account"
                    className="block px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-4 py-2.5 text-sm text-brand-700 hover:bg-brand-50"
                  >
                    My Orders
                  </Link>
                  {isAdmin && (
                    <a
                      href="http://localhost:3200"
                      className="block px-4 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                    >
                      Admin Panel
                    </a>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
