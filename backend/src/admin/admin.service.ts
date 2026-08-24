import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Aggregated metrics for the admin dashboard: catalog counts, customer
   * count, order counts by status, low-stock products and total revenue
   * from non-cancelled/refunded orders.
   */
  async getDashboard() {
    const [
      productCount,
      categoryCount,
      customerCount,
      orderCount,
      revenueAgg,
      lowStock,
      recentOrders,
    ] = await this.prisma.$transaction([
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.order.count(),
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.REFUNDED],
          },
        },
      }),
      this.prisma.product.findMany({
        where: { trackQuantity: true, stock: { lte: 5 } },
        orderBy: { stock: 'asc' },
        take: 10,
        select: { id: true, name: true, sku: true, stock: true },
      }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const ordersByStatusRaw = await this.prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const ordersByStatus = ordersByStatusRaw.reduce<Record<string, number>>(
      (acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      },
      {},
    );

    return {
      counts: {
        products: productCount,
        categories: categoryCount,
        customers: customerCount,
        orders: orderCount,
      },
      ordersByStatus,
      revenue: Number(revenueAgg._sum.totalAmount ?? 0),
      lowStock,
      recentOrders,
    };
  }
}
