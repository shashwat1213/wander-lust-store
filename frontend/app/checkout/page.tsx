'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError } from '@/lib/api';
import type { Address } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Alert, Spinner, EmptyState } from '@/components/ui';

const EMPTY_ADDRESS: Address = {
  street: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  phone: '',
};

export default function CheckoutPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const { items, subtotal, count, clear } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof Address) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setAddress((a) => ({ ...a, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const order = await api.createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        shippingAddress: {
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          phone: address.phone || undefined,
        },
      });
      clear();
      router.push(`/account/orders/${order.id}?placed=1`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not place your order. Please try again.');
      }
      setSubmitting(false);
    }
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Checkout</h1>
        <EmptyState
          title="Your cart is empty"
          description="Add items before checking out."
          action={
            <Link href="/products" className="btn-primary">
              Go to shop
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 text-lg font-semibold text-brand-900">
              Shipping address
            </h2>
            {error && (
              <div className="mb-4">
                <Alert>{error}</Alert>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="street">
                  Street address
                </label>
                <input
                  id="street"
                  className="input"
                  value={address.street}
                  onChange={update('street')}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    className="input"
                    value={address.city}
                    onChange={update('city')}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="state">
                    State / Province
                  </label>
                  <input
                    id="state"
                    className="input"
                    value={address.state}
                    onChange={update('state')}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="postalCode">
                    Postal code
                  </label>
                  <input
                    id="postalCode"
                    className="input"
                    value={address.postalCode}
                    onChange={update('postalCode')}
                    required
                  />
                </div>
                <div>
                  <label className="label" htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    className="input"
                    value={address.country}
                    onChange={update('country')}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="phone">
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  className="input"
                  value={address.phone}
                  onChange={update('phone')}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? <Spinner className="text-white" /> : 'Place order'}
          </button>
          <p className="text-center text-xs text-brand-400">
            Final totals (tax &amp; shipping) are calculated securely on the
            server.
          </p>
        </form>

        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-semibold text-brand-900">
              Your items
            </h2>
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.productId} className="flex justify-between text-sm">
                  <span className="text-brand-600">
                    {i.name} × {i.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-brand-100 pt-4 text-sm">
              <span className="text-brand-500">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
