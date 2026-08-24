import type {
  AuthResponse,
  Category,
  DashboardData,
  Order,
  OrderStatus,
  Paginated,
  Product,
  User,
} from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

const TOKEN_KEY = 'wl_token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  // Next.js fetch cache hints for server components.
  cache?: RequestCache;
  revalidate?: number;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (opts.auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const next =
    opts.revalidate !== undefined ? { revalidate: opts.revalidate } : undefined;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: opts.cache,
      ...(next ? { next } : {}),
    });
  } catch (err) {
    throw new ApiError(0, 'Network error — is the API running?', err);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => undefined)
    : await res.text();

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray((payload as any).message)
          ? (payload as any).message.join(', ')
          : (payload as any).message
        : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, String(message), payload);
  }

  return payload as T;
}

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';
  page?: number;
  limit?: number;
}

function toQueryString(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      usp.set(key, String(value));
    }
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // ---- Auth ----
  register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    return request('/auth/register', { method: 'POST', body: data });
  },
  login(data: { email: string; password: string }): Promise<AuthResponse> {
    return request('/auth/login', { method: 'POST', body: data });
  },

  // ---- Categories ----
  listCategories(): Promise<Category[]> {
    return request('/categories', { revalidate: 60 });
  },
  categoryTree(): Promise<Category[]> {
    return request('/categories/tree', { revalidate: 60 });
  },
  categoryBySlug(slug: string): Promise<Category> {
    return request(`/categories/slug/${slug}`, { revalidate: 60 });
  },

  // ---- Products ----
  listProducts(query: ProductQuery = {}): Promise<Paginated<Product>> {
    return request(
      `/products${toQueryString(query as Record<string, unknown>)}`,
      { revalidate: 30 },
    );
  },
  productBySlug(slug: string): Promise<Product> {
    return request(`/products/slug/${slug}`, { revalidate: 30 });
  },
  productById(id: string): Promise<Product> {
    return request(`/products/${id}`, { revalidate: 30 });
  },

  // ---- Orders (authenticated) ----
  createOrder(body: unknown): Promise<Order> {
    return request('/orders', { method: 'POST', body, auth: true });
  },
  myOrders(): Promise<Order[]> {
    return request('/orders/mine', { auth: true, cache: 'no-store' });
  },
  orderById(id: string): Promise<Order> {
    return request(`/orders/${id}`, { auth: true, cache: 'no-store' });
  },
  cancelOrder(id: string): Promise<Order> {
    return request(`/orders/${id}/cancel`, { method: 'PATCH', auth: true });
  },

  // ---- Admin ----
  dashboard(): Promise<DashboardData> {
    return request('/admin/dashboard', { auth: true, cache: 'no-store' });
  },
  adminAllOrders(): Promise<Order[]> {
    return request('/orders', { auth: true, cache: 'no-store' });
  },
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
      auth: true,
    });
  },
  createProduct(body: unknown): Promise<Product> {
    return request('/products', { method: 'POST', body, auth: true });
  },
  updateProduct(id: string, body: unknown): Promise<Product> {
    return request(`/products/${id}`, { method: 'PATCH', body, auth: true });
  },
  deleteProduct(id: string): Promise<{ id: string; deleted: boolean }> {
    return request(`/products/${id}`, { method: 'DELETE', auth: true });
  },
  createCategory(body: unknown): Promise<Category> {
    return request('/categories', { method: 'POST', body, auth: true });
  },
  updateCategory(id: string, body: unknown): Promise<Category> {
    return request(`/categories/${id}`, { method: 'PATCH', body, auth: true });
  },
  deleteCategory(id: string): Promise<{ id: string; deleted: boolean }> {
    return request(`/categories/${id}`, { method: 'DELETE', auth: true });
  },
};

export { API_URL };
