'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { formatPrice } from '@/lib/utils';
import { EmptyState } from '@/components/ui';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, count } = useCart();

  if (count === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="mb-6 text-3xl font-bold text-brand-900">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Browse the shop and add some gear."
          action={
            <Link href="/products" className="btn-primary">
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">Your cart</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <div key={item.productId} className="card flex gap-4 p-4">
              <Link
                href={`/products/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-sand-100"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-brand-300">
                    No image
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium text-brand-900 hover:text-brand-600"
                >
                  {item.name}
                </Link>
                <span className="text-sm text-brand-500">
                  {formatPrice(item.price)} each
                </span>

                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-brand-200">
                    <button
                      className="px-2.5 py-1.5 text-brand-600 hover:bg-brand-50"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      className="px-2.5 py-1.5 text-brand-600 hover:bg-brand-50 disabled:opacity-40"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.maxStock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="text-sm text-red-600 hover:text-red-700"
                    onClick={() => removeItem(item.productId)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="text-right font-semibold text-brand-800">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="text-lg font-semibold text-brand-900">
              Order summary
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-500">Subtotal</dt>
                <dd className="font-medium">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-500">Shipping &amp; tax</dt>
                <dd className="text-brand-400">Calculated at checkout</dd>
              </div>
            </dl>
            <Link href="/checkout" className="btn-primary mt-6 w-full">
              Proceed to checkout
            </Link>
            <Link
              href="/products"
              className="mt-3 block text-center text-sm text-brand-600 hover:text-brand-700"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
