'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';
import { Alert, Spinner } from '@/components/ui';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      router.push('/account');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'An account with this email already exists.'
          : 'Registration failed. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-brand-900">Create your account</h1>
        <p className="mt-1 text-sm text-brand-500">
          Join Wander Lust and start your next adventure.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="firstName">
                First name
              </label>
              <input
                id="firstName"
                className="input"
                value={form.firstName}
                onChange={update('firstName')}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="lastName">
                Last name
              </label>
              <input
                id="lastName"
                className="input"
                value={form.lastName}
                onChange={update('lastName')}
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={form.email}
              onChange={update('email')}
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
              value={form.password}
              onChange={update('password')}
              required
              autoComplete="new-password"
              minLength={8}
            />
            <p className="mt-1 text-xs text-brand-400">
              At least 8 characters.
            </p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <Spinner className="text-white" /> : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
