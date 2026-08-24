'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { Category } from '@/lib/types';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A–Z' },
  { value: 'name_desc', label: 'Name: Z–A' },
];

export function ProductFilters({
  categories,
  current,
}: {
  categories: Category[];
  current: { search?: string; categoryId?: string; sort?: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(current.search ?? '');

  function apply(next: Record<string, string | undefined>) {
    const usp = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) usp.set(key, value);
      else usp.delete(key);
    }
    usp.delete('page'); // reset pagination on filter change
    router.push(`/products?${usp.toString()}`);
  }

  return (
    <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <form
        className="flex flex-1 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ search: search.trim() || undefined });
        }}
      >
        <input
          className="input"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search products"
        />
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      <select
        className="input sm:w-52"
        value={current.categoryId ?? ''}
        onChange={(e) => apply({ categoryId: e.target.value || undefined })}
        aria-label="Filter by category"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        className="input sm:w-52"
        value={current.sort ?? 'newest'}
        onChange={(e) => apply({ sort: e.target.value })}
        aria-label="Sort products"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
