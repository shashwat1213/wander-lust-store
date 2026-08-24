'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

// Mirrors the backend order-pricing state machine.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-slate-200 text-slate-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api
      .listOrders()
      .then(setOrders)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(id: string, status: OrderStatus) {
    setBusyId(id);
    try {
      const updated = await api.updateOrderStatus(id, status);
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)),
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update status.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Orders</h1>

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">Could not load orders.</p>
        ) : orders.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No orders yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Order</th>
                <th className="th">Customer</th>
                <th className="th">Date</th>
                <th className="th text-right">Total</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-50">
                  <td className="td font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td className="td">
                    {o.user
                      ? `${o.user.firstName} ${o.user.lastName}`
                      : o.userId.slice(0, 8)}
                    {o.user && (
                      <div className="text-xs text-slate-400">
                        {o.user.email}
                      </div>
                    )}
                  </td>
                  <td className="td">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="td text-right font-medium">
                    {formatPrice(o.totalAmount)}
                  </td>
                  <td className="td">
                    <span
                      className={
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ' +
                        STATUS_TONE[o.status]
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex flex-wrap gap-1.5">
                      {TRANSITIONS[o.status].length === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        TRANSITIONS[o.status].map((next) => (
                          <button
                            key={next}
                            className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            disabled={busyId === o.id}
                            onClick={() => changeStatus(o.id, next)}
                          >
                            → {next}
                          </button>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
