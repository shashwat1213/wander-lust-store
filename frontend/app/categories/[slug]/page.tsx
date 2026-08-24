import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CategoryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  let category: Category;
  try {
    category = await api.categoryBySlug(params.slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let products: Product[] = [];
  try {
    const res = await api.listProducts({
      categorySlug: params.slug,
      limit: 24,
    });
    products = res.data;
  } catch {
    products = [];
  }

  return (
    <div className="container-page py-10">
      <nav className="mb-4 text-sm text-brand-500">
        <Link href="/categories" className="hover:text-brand-700">
          Categories
        </Link>
        {' / '}
        <span className="text-brand-700">{category.name}</span>
      </nav>

      <h1 className="text-3xl font-bold text-brand-900">{category.name}</h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-brand-500">{category.description}</p>
      )}

      {category.children && category.children.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="btn-secondary"
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState
            title="No products in this category yet"
            description="Check back soon."
          />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
