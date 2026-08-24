import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

const customer: AuthUser = {
  id: 'u1',
  email: 'c@test.dev',
  firstName: 'C',
  lastName: 'One',
  role: Role.CUSTOMER,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const admin: AuthUser = { ...customer, id: 'admin1', role: Role.ADMIN };

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  /** Builds a tx client whose methods mirror the ones the service uses. */
  function makeTx() {
    return {
      product: { update: jest.fn(), updateMany: jest.fn() },
      shippingAddress: {
        create: jest.fn().mockResolvedValue({ id: 'addr1' }),
      },
      order: {
        create: jest.fn().mockResolvedValue({ id: 'o1' }),
        update: jest.fn().mockResolvedValue({ id: 'o1', status: 'CANCELLED' }),
      },
      orderItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
  }

  beforeEach(async () => {
    prisma = {
      product: { findMany: jest.fn() },
      order: { findMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(OrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dtoBase = {
      shippingAddress: {
        street: '1 Main',
        city: 'Town',
        state: 'ST',
        postalCode: '12345',
        country: 'US',
      },
    };

    it('prices items from the DB (ignoring any client price) and decrements stock', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Tent',
          sku: 'TN-1',
          price: 50,
          stock: 10,
          trackQuantity: true,
          variants: [],
        },
      ]);
      const tx = makeTx();
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      await service.create('u1', {
        ...dtoBase,
        items: [{ productId: 'p1', quantity: 2 }],
      } as any);

      // Stock decremented by ordered quantity.
      expect(tx.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: { decrement: 2 } },
      });
      // Order created with server-side pricing: subtotal 100 -> free shipping.
      const orderArg = tx.order.create.mock.calls[0][0];
      expect(orderArg.data.subtotal).toBe(100);
      expect(orderArg.data.shippingAmount).toBe(0);
      expect(orderArg.data.items.create[0]).toMatchObject({
        productId: 'p1',
        name: 'Tent',
        sku: 'TN-1',
        quantity: 2,
        price: 50,
        totalPrice: 100,
      });
    });

    it('rejects an order referencing a non-existent product', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.create('u1', {
          ...dtoBase,
          items: [{ productId: 'ghost', quantity: 1 }],
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to oversell inside the transaction', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Tent',
          sku: 'TN-1',
          price: 50,
          stock: 1,
          trackQuantity: true,
          variants: [],
        },
      ]);
      const tx = makeTx();
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      await expect(
        service.create('u1', {
          ...dtoBase,
          items: [{ productId: 'p1', quantity: 5 }],
        } as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(tx.order.create).not.toHaveBeenCalled();
    });

    it('applies variant price adjustment and uses the variant SKU', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Shirt',
          sku: 'SH-1',
          price: 20,
          stock: 10,
          trackQuantity: true,
          variants: [{ id: 'v1', sku: 'SH-1-L', priceAdjustment: 5 }],
        },
      ]);
      const tx = makeTx();
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      await service.create('u1', {
        ...dtoBase,
        items: [{ productId: 'p1', variantId: 'v1', quantity: 1 }],
      } as any);

      const orderArg = tx.order.create.mock.calls[0][0];
      expect(orderArg.data.items.create[0]).toMatchObject({
        price: 25,
        sku: 'SH-1-L',
        variantId: 'v1',
      });
    });
  });

  describe('findOne (ownership)', () => {
    it('lets a customer read their own order', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', userId: 'u1' });
      await expect(service.findOne('o1', customer)).resolves.toMatchObject({
        id: 'o1',
      });
    });

    it("forbids a customer from reading someone else's order", async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', userId: 'other' });
      await expect(service.findOne('o1', customer)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lets an admin read any order', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'o1', userId: 'other' });
      await expect(service.findOne('o1', admin)).resolves.toMatchObject({
        id: 'o1',
      });
    });

    it('throws NotFound for a missing order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nope', admin)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('rejects an invalid transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PENDING,
      });

      await expect(
        service.updateStatus('o1', OrderStatus.SHIPPED),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('restocks items when cancelling', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.PENDING,
      });
      const tx = makeTx();
      tx.orderItem.findMany.mockResolvedValue([
        { productId: 'p1', quantity: 3 },
      ]);
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      await service.updateStatus('o1', OrderStatus.CANCELLED);

      expect(tx.product.updateMany).toHaveBeenCalledWith({
        where: { id: 'p1', trackQuantity: true },
        data: { stock: { increment: 3 } },
      });
    });
  });
});
