import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      category: { findUnique: jest.fn() },
      orderItem: { count: jest.fn() },
      productImage: { deleteMany: jest.fn() },
      productVariant: { deleteMany: jest.fn() },
      wishlistItem: { deleteMany: jest.fn() },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('validates category, enforces unique SKU/slug and creates the product', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'cat1' }); // category exists
      prisma.product.findUnique
        .mockResolvedValueOnce(null) // sku unique
        .mockResolvedValueOnce(null); // slug free
      prisma.product.create.mockImplementation(({ data }: any) => ({
        id: 'p1',
        ...data,
      }));

      const result = await service.create({
        name: 'Trail Backpack',
        price: 89.99,
        sku: 'TB-001',
        categoryId: 'cat1',
      });

      const createArg = prisma.product.create.mock.calls[0][0];
      expect(createArg.data.slug).toBe('trail-backpack');
      expect(createArg.data.stock).toBe(0);
      expect(createArg.data.trackQuantity).toBe(true);
      expect(result).toMatchObject({ id: 'p1', sku: 'TB-001' });
    });

    it('rejects creation when the category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'X',
          price: 1,
          sku: 'X1',
          categoryId: 'missing',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate SKU', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'cat1' });
      prisma.product.findUnique.mockResolvedValueOnce({ id: 'existing' }); // sku taken

      await expect(
        service.create({
          name: 'X',
          price: 1,
          sku: 'DUP',
          categoryId: 'cat1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('persists nested images with positions', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'cat1' });
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockImplementation(({ data }: any) => data);

      await service.create({
        name: 'Tent',
        price: 199,
        sku: 'TN-1',
        categoryId: 'cat1',
        images: [
          { url: 'https://cdn.test/a.jpg' },
          { url: 'https://cdn.test/b.jpg', position: 5 },
        ],
      });

      const createArg = prisma.product.create.mock.calls[0][0];
      expect(createArg.data.images.create).toEqual([
        { url: 'https://cdn.test/a.jpg', altText: undefined, position: 0 },
        { url: 'https://cdn.test/b.jpg', altText: undefined, position: 5 },
      ]);
    });
  });

  describe('findAll', () => {
    it('paginates and returns meta', async () => {
      prisma.$transaction.mockResolvedValue([42, [{ id: 'p1' }]]);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.meta).toEqual({
        total: 42,
        page: 2,
        limit: 20,
        totalPages: 3,
      });
      expect(result.data).toEqual([{ id: 'p1' }]);
    });
  });

  describe('decrementStock', () => {
    it('decrements stock for a tracked product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Tent',
        stock: 10,
        trackQuantity: true,
      });
      prisma.product.update.mockResolvedValue({ stock: 7 });

      const remaining = await service.decrementStock('p1', 3);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { stock: { decrement: 3 } },
      });
      expect(remaining).toBe(7);
    });

    it('refuses to oversell a tracked product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Tent',
        stock: 2,
        trackQuantity: true,
      });

      await expect(service.decrementStock('p1', 5)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('skips stock changes when quantity is not tracked', async () => {
      prisma.product.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Digital',
        stock: 0,
        trackQuantity: false,
      });

      const remaining = await service.decrementStock('p1', 100);

      expect(remaining).toBe(0);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('refuses to delete a product referenced by orders', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.orderItem.count.mockResolvedValue(3);

      await expect(service.remove('p1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('deletes an unreferenced product and its dependents', async () => {
      prisma.product.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.orderItem.count.mockResolvedValue(0);
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.remove('p1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({ id: 'p1', deleted: true });
    });
  });

  describe('findOne', () => {
    it('throws NotFound for a missing product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
