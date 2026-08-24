'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api, ApiError } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Alert, ErrorState, Spinner } from '@/components/ui';
import { OrderStatusBadge } from '@/components/order-status-badge';

const CANCELLABLE = ['PENDING', 'CONFIRMED', 'PROCESSING'];

export default function OrderDetailPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const justPlaced = search.get('placed') === '1';

  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    api
      .orderById(params.id)
      .then((data) => active && setOrder(data))
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? 'Order not found.'
            : 'Could not load this order.',
        );
      })
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [isAuthenticated, params.id]);

  async function handleCancel() {
    if (!order) return;
    setCancelling(true);
    try {
      const updated = await api.cancelOrder(order.id);
      setOrder(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not cancel the order.',
      );
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading || !isAuthenticated || !loaded) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="container-page py-16">
        <ErrorState message={error} />
        <div className="mt-4">
          <Link href="/account/orders" className="btn-secondary">
            ← Back to orders
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="container-page py-10">
      <nav className="mb-4 text-sm text-brand-500">
        <Link href="/account/orders" className="hover:text-brand-700">
          My orders
        </Link>
        {' / '}
        <span className="text-brand-700">#{order.id.slice(0, 8)}</span>
      </nav>

      {justPlaced && (
        <div className="mb-6">
          <Alert tone="success">
            🎉 Thanks! Your order has been placed successfully.
          </Alert>
        </div>
      )}
      {error && (
        <div className="mb-6">
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-brand-500">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {order.items.map((item) => (
            <div key={item.id} className="card flex justify-between p-4">
              <div>
                <p className="font-medium text-brand-900">{item.name}</p>
                <p className="text-sm text-brand-500">
                  SKU {item.sku} · Qty {item.quantity} ×{' '}
                  {formatPrice(item.price)}
                </p>
              </div>
              <span className="font-semibold text-brand-800">
                {formatPrice(item.totalPrice)}
              </span>
            </div>
          ))}

          <div className="card p-5">
            <h2 className="mb-2 font-semibold text-brand-900">
              Shipping address
            </h2>
            <address className="text-sm not-italic text-brand-600">
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </address>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-brand-900">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={order.subtotal} />
              <Row label="Tax" value={order.taxAmount} />
              <Row label="Shipping" value={order.shippingAmount} />
              {parseFloat(order.discountAmount) > 0 && (
                <Row label="Discount" value={`-${order.discountAmount}`} />
              )}
              <div className="flex justify-between border-t border-brand-100 pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.totalAmount)}</dd>
              </div>
            </dl>

            {CANCELLABLE.includes(order.status) && (
              <button
                onClick={handleCancel}
                className="btn-danger mt-6 w-full"
                disabled={cancelling}
              >
                {cancelling ? <Spinner className="text-white" /> : 'Cancel order'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-brand-500">{label}</dt>
      <dd>{formatPrice(value)}</dd>
    </div>
  );
}
