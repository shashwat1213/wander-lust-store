'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DashboardData } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .dashboard()
      .then((d) => active && setData(d))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-600">
        Could not load the dashboard. Is the API running?
      </p>
    );
  }
  if (!data) {
    return <p className="text-sm text-slate-400">Loading…</p>;
  }

  const cards = [
    { label: 'Products', value: data.counts.products },
    { label: 'Categories', value: data.counts.categories },
    { label: 'Customers', value: data.counts.customers },
    { label: 'Orders', value: data.counts.orders },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-semibold text-slate-900">Revenue</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {formatPrice(data.revenue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Excludes cancelled &amp; refunded orders.
          </p>
          <h3 className="mt-5 text-sm font-semibold text-slate-700">
            Orders by status
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {Object.entries(data.ordersByStatus).length === 0 && (
              <li className="text-slate-400">No orders yet.</li>
            )}
            {Object.entries(data.ordersByStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between">
                <span className="text-slate-500">{status}</span>
                <span className="font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Low stock</h2>
          {data.lowStock.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">
              All tracked products are well stocked.
            </p>
          ) : (
            <table className="mt-3 w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="th">Product</th>
                  <th className="th">SKU</th>
                  <th className="th text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="td">{p.name}</td>
                    <td className="td font-mono text-xs">{p.sku}</td>
                    <td className="td text-right">
                      <span
                        className={
                          'font-semibold ' +
                          (p.stock === 0 ? 'text-red-600' : 'text-amber-600')
                        }
                      >
                        {p.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
