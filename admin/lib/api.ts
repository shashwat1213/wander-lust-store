import type {
  Category,
  DashboardData,
  Order,
  OrderStatus,
  Paginated,
  Product,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'wl_admin_token';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
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
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });
  } catch (err) {
    throw new ApiError(0, 'Network error — is the API running?', err);
  }

  if (res.status === 204) return undefined as T;

  const payload = (res.headers.get('content-type') ?? '').includes('json')
    ? await res.json().catch(() => undefined)
    : await res.text();

  if (!res.ok) {
    const msg =
      payload && typeof payload === 'object' && 'message' in payload
        ? Array.isArray((payload as any).message)
          ? (payload as any).message.join(', ')
          : (payload as any).message
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), payload);
  }
  return payload as T;
}

export const api = {
  login(data: { email: string; password: string }): Promise<{ access_token: string }> {
    return request('/auth/login', { method: 'POST', body: data });
  },
  dashboard(): Promise<DashboardData> {
    return request('/admin/dashboard', { auth: true });
  },
  listProducts(page = 1): Promise<Paginated<Product>> {
    return request(`/products?page=${page}&limit=50`, { auth: true });
  },
  createProduct(body: unknown): Promise<Product> {
    return request('/products', { method: 'POST', body, auth: true });
  },
  updateProduct(id: string, body: unknown): Promise<Product> {
    return request(`/products/${id}`, { method: 'PATCH', body, auth: true });
  },
  deleteProduct(id: string): Promise<unknown> {
    return request(`/products/${id}`, { method: 'DELETE', auth: true });
  },
  listCategories(): Promise<Category[]> {
    return request('/categories', { auth: true });
  },
  createCategory(body: unknown): Promise<Category> {
    return request('/categories', { method: 'POST', body, auth: true });
  },
  deleteCategory(id: string): Promise<unknown> {
    return request(`/categories/${id}`, { method: 'DELETE', auth: true });
  },
  listOrders(): Promise<Order[]> {
    return request('/orders', { auth: true });
  },
  updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
      auth: true,
    });
  },
};
