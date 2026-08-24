export type Role = 'ADMIN' | 'CUSTOMER';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  _count?: { products: number; children: number };
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  compareAtPrice: string | null;
  sku: string;
  stock: number;
  trackQuantity: boolean;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  createdAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: string;
  totalPrice: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  totalAmount: string;
  items: OrderItem[];
  createdAt: string;
  user?: { id: string; email: string; firstName: string; lastName: string };
}

export interface DashboardData {
  counts: {
    products: number;
    categories: number;
    customers: number;
    orders: number;
  };
  ordersByStatus: Record<string, number>;
  revenue: number;
  lowStock: { id: string; name: string; sku: string; stock: number }[];
  recentOrders: Order[];
}
