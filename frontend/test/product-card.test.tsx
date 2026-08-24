import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/lib/types';

const base: Product = {
  id: 'p1',
  name: '4-Season Tent',
  slug: '4-season-tent',
  description: null,
  shortDescription: null,
  price: '60.00',
  compareAtPrice: null,
  sku: 'TENT-4S',
  stock: 5,
  trackQuantity: true,
  categoryId: 'c1',
  category: {
    id: 'c1',
    name: 'Camping Gear',
    slug: 'camping-gear',
    description: null,
    imageUrl: null,
    parentId: null,
  },
  images: [],
  variants: [],
  createdAt: '',
  updatedAt: '',
};

describe('ProductCard', () => {
  it('renders the product name, category and price, linking to the detail page', () => {
    render(<ProductCard product={base} />);
    expect(screen.getByText('4-Season Tent')).toBeInTheDocument();
    expect(screen.getByText('Camping Gear')).toBeInTheDocument();
    expect(screen.getByText('$60.00')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/products/4-season-tent',
    );
  });

  it('shows a Sale badge and struck-through compare-at price when on sale', () => {
    render(
      <ProductCard product={{ ...base, compareAtPrice: '80.00' }} />,
    );
    expect(screen.getByText('Sale')).toBeInTheDocument();
    expect(screen.getByText('$80.00')).toBeInTheDocument();
  });

  it('marks a tracked product with zero stock as sold out', () => {
    render(<ProductCard product={{ ...base, stock: 0 }} />);
    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });
});
