import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    product: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('generates a slug from the name and persists the category', async () => {
      prisma.category.findUnique.mockResolvedValue(null); // slug is free
      prisma.category.create.mockImplementation(({ data }: any) => ({
        id: 'c1',
        ...data,
      }));

      const result = await service.create({ name: "Men's Shoes!" });

      const createArg = prisma.category.create.mock.calls[0][0];
      expect(createArg.data.slug).toBe('mens-shoes');
      expect(result).toMatchObject({ id: 'c1', name: "Men's Shoes!" });
    });

    it('appends a numeric suffix when the slug already exists', async () => {
      prisma.category.findUnique
        .mockResolvedValueOnce({ id: 'other' }) // "shoes" taken
        .mockResolvedValueOnce(null); // "shoes-2" free
      prisma.category.create.mockImplementation(({ data }: any) => data);

      const result = await service.create({ name: 'Shoes' });

      expect(result.slug).toBe('shoes-2');
    });

    it('validates that the parent category exists', async () => {
      // slug lookup returns null (free), parent lookup returns null (missing)
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Sneakers', parentId: 'missing' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.category.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('rejects making a category its own parent', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });

      await expect(
        service.update('c1', { parentId: 'c1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remove', () => {
    it('refuses to delete a category with subcategories', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.category.count.mockResolvedValue(2); // children
      prisma.product.count.mockResolvedValue(0);

      await expect(service.remove('c1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.category.delete).not.toHaveBeenCalled();
    });

    it('refuses to delete a category that still has products', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.category.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(5);

      await expect(service.remove('c1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('deletes an empty category', async () => {
      prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
      prisma.category.count.mockResolvedValue(0);
      prisma.product.count.mockResolvedValue(0);
      prisma.category.delete.mockResolvedValue({ id: 'c1' });

      const result = await service.remove('c1');

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'c1' },
      });
      expect(result).toEqual({ id: 'c1', deleted: true });
    });
  });

  describe('findBySlug', () => {
    it('throws when the slug does not resolve', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
