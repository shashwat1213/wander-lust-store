import Link from 'next/link';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';
import { EmptyState, ErrorState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function CategoriesPage() {
  let categories: Category[] = [];
  let error = false;
  try {
    categories = await api.categoryTree();
  } catch {
    error = true;
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">Categories</h1>

      {error ? (
        <ErrorState message="We couldn’t load categories. Please try again." />
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="card p-6">
              <Link
                href={`/categories/${cat.slug}`}
                className="text-lg font-semibold text-brand-900 hover:text-brand-600"
              >
                {cat.name}
              </Link>
              {cat.description && (
                <p className="mt-1 text-sm text-brand-500">{cat.description}</p>
              )}
              {cat.children && cat.children.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {cat.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/categories/${child.slug}`}
                        className="text-sm text-brand-600 hover:text-brand-800"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
