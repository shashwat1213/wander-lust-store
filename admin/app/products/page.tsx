'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

const EMPTY = {
  name: '',
  price: '',
  sku: '',
  stock: '',
  categoryId: '',
  imageUrl: '',
  shortDescription: '',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const [p, c] = await Promise.all([
        api.listProducts(),
        api.listCategories(),
      ]);
      setProducts(p.data);
      setCategories(c);
    } catch {
      setError('Failed to load products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field: keyof typeof EMPTY) {
    return (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createProduct({
        name: form.name,
        price: parseFloat(form.price),
        sku: form.sku,
        stock: form.stock ? parseInt(form.stock, 10) : 0,
        categoryId: form.categoryId,
        shortDescription: form.shortDescription || undefined,
        images: form.imageUrl ? [{ url: form.imageUrl }] : undefined,
      });
      setForm({ ...EMPTY });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create product.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not delete product.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm((v) => !v)}
          disabled={categories.length === 0}
        >
          {showForm ? 'Close' : '+ New product'}
        </button>
      </div>

      {categories.length === 0 && !loading && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Create a category first before adding products.
        </p>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4 p-6">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name} onChange={update('name')} required />
            </div>
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={form.categoryId}
                onChange={update('categoryId')}
                required
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Price (USD)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={update('price')}
                required
              />
            </div>
            <div>
              <label className="label">SKU</label>
              <input className="input" value={form.sku} onChange={update('sku')} required />
            </div>
            <div>
              <label className="label">Stock</label>
              <input
                className="input"
                type="number"
                min="0"
                value={form.stock}
                onChange={update('stock')}
              />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input
                className="input"
                type="url"
                value={form.imageUrl}
                onChange={update('imageUrl')}
                placeholder="https://…"
              />
            </div>
          </div>
          <div>
            <label className="label">Short description</label>
            <input
              className="input"
              value={form.shortDescription}
              onChange={update('shortDescription')}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Create product'}
          </button>
        </form>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <p className="p-6 text-sm text-slate-400">Loading…</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No products yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="th">Name</th>
                <th className="th">SKU</th>
                <th className="th">Category</th>
                <th className="th text-right">Price</th>
                <th className="th text-right">Stock</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="td font-medium">{p.name}</td>
                  <td className="td font-mono text-xs">{p.sku}</td>
                  <td className="td">{p.category?.name ?? '—'}</td>
                  <td className="td text-right">{formatPrice(p.price)}</td>
                  <td className="td text-right">{p.stock}</td>
                  <td className="td text-right">
                    <button
                      className="text-sm text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(p.id, p.name)}
                    >
                      Delete
                    </button>
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
