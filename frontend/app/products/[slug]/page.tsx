import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { api, ApiError } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { AddToCart } from '@/components/add-to-cart';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await api.productBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug).catch(() => null);
  if (!product) return { title: 'Product not found — Wander Lust Store' };
  return {
    title: `${product.name} — Wander Lust Store`,
    description: product.shortDescription ?? product.description ?? undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const price = parseFloat(product.price);
  const compareAt = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const onSale = compareAt !== null && compareAt > price;
  const image = product.images?.[0];

  return (
    <div className="container-page py-10">
      <nav className="mb-6 text-sm text-brand-500">
        <Link href="/products" className="hover:text-brand-700">
          Shop
        </Link>
        {product.category && (
          <>
            {' / '}
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-brand-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
        {' / '}
        <span className="text-brand-700">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="card aspect-square overflow-hidden bg-sand-100">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.url}
                alt={image.altText ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-300">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.slice(0, 4).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.url}
                  alt={img.altText ?? product.name}
                  className="aspect-square w-full rounded-lg border border-brand-100 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <span className="text-sm font-medium uppercase tracking-wide text-brand-400">
              {product.category.name}
            </span>
          )}
          <h1 className="mt-1 text-3xl font-bold text-brand-900">
            {product.name}
          </h1>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold text-brand-800">
              {formatPrice(price)}
            </span>
            {onSale && (
              <>
                <span className="text-lg text-brand-400 line-through">
                  {formatPrice(compareAt!)}
                </span>
                <Badge tone="danger">Sale</Badge>
              </>
            )}
          </div>

          <div className="mt-3">
            {product.trackQuantity ? (
              product.stock > 0 ? (
                <Badge tone="success">
                  In stock{product.stock <= 5 ? ` — only ${product.stock} left` : ''}
                </Badge>
              ) : (
                <Badge tone="neutral">Out of stock</Badge>
              )
            ) : (
              <Badge tone="success">Available</Badge>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-5 text-brand-700">{product.shortDescription}</p>
          )}
          {product.description && (
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-brand-600">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <AddToCart product={product} />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-brand-100 pt-6 text-sm">
            <div>
              <dt className="text-brand-400">SKU</dt>
              <dd className="font-medium text-brand-700">{product.sku}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
