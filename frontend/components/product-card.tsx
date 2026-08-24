import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from './ui';

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0];
  const price = parseFloat(product.price);
  const compareAt = product.compareAtPrice
    ? parseFloat(product.compareAtPrice)
    : null;
  const onSale = compareAt !== null && compareAt > price;
  const outOfStock = product.trackQuantity && product.stock <= 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-sand-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.url}
            alt={image.altText ?? product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-300">
            <span className="text-sm">No image</span>
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {onSale && <Badge tone="danger">Sale</Badge>}
          {outOfStock && <Badge tone="neutral">Sold out</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-brand-400">
            {product.category.name}
          </span>
        )}
        <h3 className="mt-1 line-clamp-2 font-medium text-brand-900 group-hover:text-brand-600">
          {product.name}
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="text-lg font-semibold text-brand-800">
            {formatPrice(price)}
          </span>
          {onSale && (
            <span className="text-sm text-brand-400 line-through">
              {formatPrice(compareAt!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
