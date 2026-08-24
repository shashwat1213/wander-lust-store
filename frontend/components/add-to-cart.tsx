'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

export function AddToCart({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.trackQuantity && product.stock <= 0;
  const max = product.trackQuantity ? product.stock : 99;

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (outOfStock) {
    return (
      <button className="btn-secondary w-full sm:w-auto" disabled>
        Out of stock
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex items-center rounded-lg border border-brand-200">
        <button
          className="px-3 py-2 text-brand-600 hover:bg-brand-50 disabled:opacity-40"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-10 text-center text-sm font-medium">{qty}</span>
        <button
          className="px-3 py-2 text-brand-600 hover:bg-brand-50 disabled:opacity-40"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={qty >= max}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <button className="btn-primary w-full sm:w-auto" onClick={handleAdd}>
        {added ? 'Added ✓' : 'Add to cart'}
      </button>
      {added && (
        <Link href="/cart" className="btn-ghost">
          View cart →
        </Link>
      )}
    </div>
  );
}
