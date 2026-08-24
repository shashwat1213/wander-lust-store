import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);

    if (dto.parentId) {
      await this.ensureExists(dto.parentId);
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
      },
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true, children: true } } },
    });
  }

  /** Root categories with their immediate children (for navigation menus). */
  findTree() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: { children: { orderBy: { name: 'asc' } } },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) {
      throw new NotFoundException(`Category "${slug}" not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.ensureExists(id);

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('A category cannot be its own parent');
      }
      await this.ensureExists(dto.parentId);
    }

    const data: Prisma.CategoryUpdateInput = {
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
    };

    if (dto.slug !== undefined || dto.name !== undefined) {
      const source = dto.slug ?? dto.name;
      if (source) {
        data.slug = await this.resolveUniqueSlug(source, id);
      }
    }

    if (dto.parentId !== undefined) {
      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
    }

    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const [childCount, productCount] = await Promise.all([
      this.prisma.category.count({ where: { parentId: id } }),
      this.prisma.product.count({ where: { categoryId: id } }),
    ]);

    if (childCount > 0) {
      throw new ConflictException(
        'Cannot delete a category that has subcategories',
      );
    }
    if (productCount > 0) {
      throw new ConflictException(
        'Cannot delete a category that still has products',
      );
    }

    await this.prisma.category.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }

  /**
   * Generates a slug and appends a numeric suffix until it is unique.
   * `ignoreId` lets an update keep its own slug.
   */
  private async resolveUniqueSlug(
    source: string,
    ignoreId?: string,
  ): Promise<string> {
    const base = slugify(source);
    if (!base) {
      throw new BadRequestException('Category name produces an empty slug');
    }

    let candidate = base;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === ignoreId) {
        return candidate;
      }
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }
}
