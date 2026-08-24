import Link from 'next/link';
import { api, type ProductQuery } from '@/lib/api';
import type { Category, Paginated, Product } from '@/lib/types';
import { ProductCard } from '@/components/product-card';
import { ProductFilters } from '@/components/product-filters';
import { EmptyState, ErrorState } from '@/components/ui';

export const dynamic = 'force-dynamic';

interface SearchParams {
  search?: string;
  categoryId?: string;
  sort?: ProductQuery['sort'];
  page?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page) || 1;
  const query: ProductQuery = {
    search: searchParams.search,
    categoryId: searchParams.categoryId,
    sort: searchParams.sort,
    page,
    limit: 12,
  };

  let result: Paginated<Product> | null = null;
  let categories: Category[] = [];
  let error = false;
  try {
    [result, categories] = await Promise.all([
      api.listProducts(query),
      api.listCategories(),
    ]);
  } catch {
    error = true;
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">Shop</h1>

      <ProductFilters
        categories={categories}
        current={{
          search: searchParams.search,
          categoryId: searchParams.categoryId,
          sort: searchParams.sort,
        }}
      />

      {error ? (
        <ErrorState message="We couldn’t load products. Please make sure the API is running and try again." />
      ) : !result || result.data.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or filters."
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-brand-500">
            {result.meta.total} product{result.meta.total === 1 ? '' : 's'}
          </p>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {result.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            searchParams={searchParams}
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: SearchParams;
}) {
  if (totalPages <= 1) return null;
  const build = (p: number) => {
    const usp = new URLSearchParams();
    if (searchParams.search) usp.set('search', searchParams.search);
    if (searchParams.categoryId) usp.set('categoryId', searchParams.categoryId);
    if (searchParams.sort) usp.set('sort', searchParams.sort);
    usp.set('page', String(p));
    return `/products?${usp.toString()}`;
  };
  return (
    <nav className="mt-10 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={build(page - 1)} className="btn-secondary">
          ← Prev
        </Link>
      )}
      <span className="px-3 text-sm text-brand-600">
        Page {page} of {totalPages}
      </span>
      {page < totalPages && (
        <Link href={build(page + 1)} className="btn-secondary">
          Next →
        </Link>
      )}
    </nav>
  );
}
