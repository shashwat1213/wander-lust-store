import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn(),
      product: { count: jest.fn(), findMany: jest.fn() },
      category: { count: jest.fn() },
      user: { count: jest.fn() },
      order: {
        count: jest.fn(),
        aggregate: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(AdminService);
  });

  afterEach(() => jest.clearAllMocks());

  it('aggregates dashboard metrics into a stable shape', async () => {
    prisma.$transaction.mockResolvedValue([
      12, // products
      4, // categories
      30, // customers
      50, // orders
      { _sum: { totalAmount: 1234.5 } }, // revenue agg
      [{ id: 'p1', name: 'Tent', sku: 'TN-1', stock: 2 }], // low stock
      [{ id: 'o1' }], // recent orders
    ]);
    prisma.order.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { _all: 3 } },
      { status: 'DELIVERED', _count: { _all: 7 } },
    ]);

    const result = await service.getDashboard();

    expect(result.counts).toEqual({
      products: 12,
      categories: 4,
      customers: 30,
      orders: 50,
    });
    expect(result.ordersByStatus).toEqual({ PENDING: 3, DELIVERED: 7 });
    expect(result.revenue).toBe(1234.5);
    expect(result.lowStock).toHaveLength(1);
    expect(result.recentOrders).toHaveLength(1);
  });

  it('defaults revenue to 0 when there are no qualifying orders', async () => {
    prisma.$transaction.mockResolvedValue([
      0,
      0,
      0,
      0,
      { _sum: { totalAmount: null } },
      [],
      [],
    ]);
    prisma.order.groupBy.mockResolvedValue([]);

    const result = await service.getDashboard();

    expect(result.revenue).toBe(0);
    expect(result.ordersByStatus).toEqual({});
  });
});
