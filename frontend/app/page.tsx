import Link from 'next/link';
import { api } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

async function safeFetch<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [productsRes, categories] = await Promise.all([
    safeFetch(() => api.listProducts({ limit: 8, sort: 'newest' }), {
      data: [] as Product[],
      meta: { total: 0, page: 1, limit: 8, totalPages: 1 },
    }),
    safeFetch(() => api.categoryTree(), [] as Category[]),
  ]);

  const products = productsRes.data;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-500 text-white">
        <div className="container-page grid gap-8 py-20 md:grid-cols-2 md:items-center md:py-28">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Gear up for your next adventure
            </h1>
            <p className="mt-4 max-w-md text-lg text-brand-50/90">
              Thoughtfully chosen outdoor and travel essentials, ready to ship.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn bg-white text-brand-700 hover:bg-brand-50">
                Shop all products
              </Link>
              <Link
                href="/categories"
                className="btn border border-white/40 text-white hover:bg-white/10"
              >
                Browse categories
              </Link>
            </div>
          </div>
          <div className="hidden justify-end md:flex">
            <div className="grid grid-cols-2 gap-4">
              {['🏔️', '🎒', '⛺', '🧭'].map((emoji) => (
                <div
                  key={emoji}
                  className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 text-5xl backdrop-blur"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-page py-14">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-brand-900">
              Shop by category
            </h2>
            <Link
              href="/categories"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="card flex items-center justify-center px-4 py-8 text-center font-medium text-brand-800 transition-colors hover:bg-brand-50"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="container-page py-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-brand-900">New arrivals</h2>
          <Link
            href="/products"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all →
          </Link>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products yet"
            description="Once the catalog is populated, new arrivals will appear here."
            action={
              <Link href="/products" className="btn-primary">
                Browse the shop
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
