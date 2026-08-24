import { describe, expect, it } from 'vitest';
import { formatPrice, decodeJwt, cn } from '@/lib/utils';

describe('formatPrice', () => {
  it('formats decimal strings from the API as USD', () => {
    expect(formatPrice('132.00')).toBe('$132.00');
    expect(formatPrice('45.5')).toBe('$45.50');
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('falls back to $0.00 for invalid input', () => {
    expect(formatPrice('not-a-number')).toBe('$0.00');
  });
});

describe('decodeJwt', () => {
  it('decodes a JWT payload', () => {
    // header.payload.signature — payload = {"sub":"u1","role":"ADMIN"}
    const payload = Buffer.from(
      JSON.stringify({ sub: 'u1', role: 'ADMIN' }),
    ).toString('base64url');
    const token = `h.${payload}.s`;
    expect(decodeJwt(token)).toEqual({ sub: 'u1', role: 'ADMIN' });
  });

  it('returns null for malformed tokens', () => {
    expect(decodeJwt('garbage')).toBeNull();
  });
});

describe('cn', () => {
  it('joins truthy class names and drops falsy ones', () => {
    expect(cn('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });
});
