'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '@/lib/use-require-auth';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { EmptyState, ErrorState, Spinner } from '@/components/ui';
import { OrderStatusBadge } from '@/components/order-status-badge';

export default function OrdersPage() {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    api
      .myOrders()
      .then((data) => active && setOrders(data))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated || (!orders && !error)) {
    return (
      <div className="container-page flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <nav className="mb-4 text-sm text-brand-500">
        <Link href="/account" className="hover:text-brand-700">
          My account
        </Link>
        {' / '}
        <span className="text-brand-700">Orders</span>
      </nav>
      <h1 className="mb-6 text-3xl font-bold text-brand-900">My orders</h1>

      {error ? (
        <ErrorState message="We couldn’t load your orders. Please try again." />
      ) : orders && orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you place an order, it will show up here."
          action={
            <Link href="/products" className="btn-primary">
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders?.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-brand-50"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-brand-700">
                    #{order.id.slice(0, 8)}
                  </span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="mt-1 text-sm text-brand-500">
                  {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                  {order.items.length} item
                  {order.items.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className="text-lg font-semibold text-brand-800">
                {formatPrice(order.totalAmount)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
