import { OrderStatus } from '@prisma/client';

/**
 * Allowed order status transitions. Terminal states have no outgoing edges.
 * Used to enforce a valid lifecycle on admin status updates.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** Tax rate applied to the order subtotal (10%). */
export const TAX_RATE = 0.1;

/** Flat shipping fee; free above the threshold. */
export const SHIPPING_FLAT = 10;
export const FREE_SHIPPING_THRESHOLD = 100;

export interface PricedItem {
  price: number;
  quantity: number;
}

export interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Computes order totals from priced line items. Pure function — no DB access —
 * so the money math is deterministic and unit-testable.
 */
export function calculateTotals(
  items: PricedItem[],
  discountAmount = 0,
): OrderTotals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const taxAmount = round2(subtotal * TAX_RATE);
  const shippingAmount =
    subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FLAT;
  const discount = round2(Math.min(discountAmount, subtotal));
  const totalAmount = round2(
    subtotal + taxAmount + shippingAmount - discount,
  );
  return {
    subtotal,
    taxAmount,
    shippingAmount,
    discountAmount: discount,
    totalAmount,
  };
}
