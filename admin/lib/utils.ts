export function formatPrice(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number.isFinite(n) ? n : 0);
}

export function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as T;
  } catch {
    return null;
  }
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
