'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Category } from '@/lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', description: '', parentId: '' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setCategories(await api.listCategories());
    } catch {
      setError('Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.createCategory({
        name: form.name,
        description: form.description || undefined,
        parentId: form.parentId || undefined,
      });
      setForm({ name: '', description: '', parentId: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(
        err instanceof ApiError ? err.message : 'Could not delete category.',
      );
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Categories</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={handleCreate} className="card space-y-4 p-6 lg:col-span-1">
          <h2 className="font-semibold text-slate-900">New category</h2>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="label">Parent (optional)</label>
            <select
              className="input"
              value={form.parentId}
              onChange={(e) =>
                setForm((f) => ({ ...f, parentId: e.target.value }))
              }
            >
              <option value="">None (top-level)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? 'Saving…' : 'Create category'}
          </button>
        </form>

        <div className="card overflow-x-auto lg:col-span-2">
          {loading ? (
            <p className="p-6 text-sm text-slate-400">Loading…</p>
          ) : categories.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No categories yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="th">Name</th>
                  <th className="th">Slug</th>
                  <th className="th text-right">Products</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="td font-medium">{c.name}</td>
                    <td className="td font-mono text-xs">{c.slug}</td>
                    <td className="td text-right">
                      {c._count?.products ?? 0}
                    </td>
                    <td className="td text-right">
                      <button
                        className="text-sm text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(c.id, c.name)}
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
    </div>
  );
}
