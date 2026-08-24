import { OrderStatus } from '@prisma/client';
import {
  calculateTotals,
  canTransition,
  TAX_RATE,
} from './order-pricing';

describe('order-pricing', () => {
  describe('calculateTotals', () => {
    it('sums line items, applies tax and flat shipping under the threshold', () => {
      const totals = calculateTotals([
        { price: 20, quantity: 2 }, // 40
        { price: 5, quantity: 1 }, // 5
      ]);
      expect(totals.subtotal).toBe(45);
      expect(totals.taxAmount).toBe(45 * TAX_RATE); // 4.5
      expect(totals.shippingAmount).toBe(10);
      expect(totals.discountAmount).toBe(0);
      expect(totals.totalAmount).toBe(59.5);
    });

    it('gives free shipping at or above the threshold', () => {
      const totals = calculateTotals([{ price: 100, quantity: 1 }]);
      expect(totals.subtotal).toBe(100);
      expect(totals.shippingAmount).toBe(0);
      expect(totals.totalAmount).toBe(110);
    });

    it('caps discount at the subtotal and rounds to cents', () => {
      const totals = calculateTotals([{ price: 33.333, quantity: 3 }], 500);
      // subtotal rounds to 100.00 -> free shipping, discount capped at subtotal
      expect(totals.subtotal).toBe(100);
      expect(totals.discountAmount).toBe(100);
      expect(totals.totalAmount).toBe(totals.taxAmount); // 100 + tax - 100
    });

    it('handles an empty cart with zero shipping', () => {
      const totals = calculateTotals([]);
      expect(totals.subtotal).toBe(0);
      expect(totals.shippingAmount).toBe(0);
      expect(totals.totalAmount).toBe(0);
    });
  });

  describe('canTransition', () => {
    it('allows valid forward transitions', () => {
      expect(canTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED)).toBe(
        true,
      );
      expect(
        canTransition(OrderStatus.PROCESSING, OrderStatus.SHIPPED),
      ).toBe(true);
      expect(
        canTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED),
      ).toBe(true);
    });

    it('rejects invalid or backward transitions', () => {
      expect(canTransition(OrderStatus.PENDING, OrderStatus.SHIPPED)).toBe(
        false,
      );
      expect(
        canTransition(OrderStatus.DELIVERED, OrderStatus.PENDING),
      ).toBe(false);
    });

    it('treats CANCELLED and REFUNDED as terminal', () => {
      expect(
        canTransition(OrderStatus.CANCELLED, OrderStatus.CONFIRMED),
      ).toBe(false);
      expect(
        canTransition(OrderStatus.REFUNDED, OrderStatus.PROCESSING),
      ).toBe(false);
    });

    it('rejects a no-op transition to the same status', () => {
      expect(canTransition(OrderStatus.PENDING, OrderStatus.PENDING)).toBe(
        false,
      );
    });
  });
});
