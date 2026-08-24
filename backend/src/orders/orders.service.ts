import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateTotals, canTransition } from './order-pricing';

const orderInclude = {
  items: { include: { product: true, variant: true } },
  shippingAddress: true,
  billingAddress: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates an order for the given user. Prices are resolved from the database
   * (never trusted from the client). Stock is validated and decremented, and
   * the whole operation runs in a single transaction so a failure rolls back.
   */
  async create(userId: string, dto: CreateOrderDto) {
    // Resolve products up front (outside tx) to build priced line items.
    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const lineItems = dto.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} does not exist`,
        );
      }

      let unitPrice = Number(product.price);
      let variant: (typeof product.variants)[number] | undefined;
      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new BadRequestException(
            `Variant ${item.variantId} is not valid for product ${product.id}`,
          );
        }
        unitPrice += Number(variant.priceAdjustment);
      }

      const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;
      return {
        product,
        variant,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totals = calculateTotals(
      lineItems.map((li) => ({ price: li.unitPrice, quantity: li.quantity })),
    );

    return this.prisma.$transaction(async (tx) => {
      // Decrement stock atomically, refusing to oversell tracked products.
      for (const li of lineItems) {
        if (li.product.trackQuantity) {
          if (li.product.stock < li.quantity) {
            throw new ConflictException(
              `Insufficient stock for "${li.product.name}" (have ${li.product.stock}, need ${li.quantity})`,
            );
          }
          await tx.product.update({
            where: { id: li.product.id },
            data: { stock: { decrement: li.quantity } },
          });
        }
      }

      const shipping = await tx.shippingAddress.create({
        data: { ...dto.shippingAddress },
      });
      const billing = dto.billingAddress
        ? await tx.shippingAddress.create({ data: { ...dto.billingAddress } })
        : shipping;

      return tx.order.create({
        data: {
          userId,
          status: OrderStatus.PENDING,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          shippingAmount: totals.shippingAmount,
          discountAmount: totals.discountAmount,
          totalAmount: totals.totalAmount,
          shippingAddressId: shipping.id,
          billingAddressId: billing.id,
          items: {
            create: lineItems.map((li) => ({
              productId: li.product.id,
              variantId: li.variant?.id,
              name: li.product.name,
              sku: li.variant?.sku ?? li.product.sku,
              quantity: li.quantity,
              price: li.unitPrice,
              totalPrice: li.totalPrice,
            })),
          },
        },
        include: orderInclude,
      });
    });
  }

  /** Orders belonging to the current user. */
  findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
  }

  /** All orders (admin). */
  findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
  }

  /**
   * Fetches one order, enforcing ownership: a customer may only read their own
   * orders; an admin may read any.
   */
  async findOne(id: string, user: AuthUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return order;
  }

  /** Admin-only status transition, validated against the lifecycle machine. */
  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }
    if (!canTransition(order.status, status)) {
      throw new BadRequestException(
        `Cannot change order status from ${order.status} to ${status}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Restock items when an order is cancelled or refunded.
      if (
        status === OrderStatus.CANCELLED ||
        status === OrderStatus.REFUNDED
      ) {
        const items = await tx.orderItem.findMany({ where: { orderId: id } });
        for (const item of items) {
          await tx.product.updateMany({
            where: { id: item.productId, trackQuantity: true },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: orderInclude,
      });
    });
  }

  /** Customer cancels their own order (only while still cancellable). */
  async cancelOwn(id: string, user: AuthUser) {
    const order = await this.findOne(id, user); // enforces ownership
    if (!canTransition(order.status, OrderStatus.CANCELLED)) {
      throw new BadRequestException(
        `An order with status ${order.status} can no longer be cancelled`,
      );
    }
    return this.updateStatus(id, OrderStatus.CANCELLED);
  }
}
