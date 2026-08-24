import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { slugify } from '../common/utils/slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' } },
  variants: true,
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    await this.ensureCategoryExists(dto.categoryId);
    await this.ensureSkuUnique(dto.sku);
    const slug = await this.resolveUniqueSlug(dto.slug ?? dto.name);

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        sku: dto.sku,
        stock: dto.stock ?? 0,
        trackQuantity: dto.trackQuantity ?? true,
        categoryId: dto.categoryId,
        images: dto.images?.length
          ? {
              create: dto.images.map((img, index) => ({
                url: img.url,
                altText: img.altText,
                position: img.position ?? index,
              })),
            }
          : undefined,
      },
      include: productInclude,
    });
  }

  async findAll(query: QueryProductsDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const where: Prisma.ProductWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.categorySlug) {
      where.category = { slug: query.categorySlug };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: this.buildOrderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: productInclude,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);

    if (dto.categoryId) {
      await this.ensureCategoryExists(dto.categoryId);
    }
    if (dto.sku) {
      await this.ensureSkuUnique(dto.sku, id);
    }

    const data: Prisma.ProductUpdateInput = {
      name: dto.name,
      description: dto.description,
      shortDescription: dto.shortDescription,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice,
      sku: dto.sku,
      stock: dto.stock,
      trackQuantity: dto.trackQuantity,
    };

    if (dto.slug !== undefined || dto.name !== undefined) {
      const source = dto.slug ?? dto.name;
      if (source) {
        data.slug = await this.resolveUniqueSlug(source, id);
      }
    }

    if (dto.categoryId) {
      data.category = { connect: { id: dto.categoryId } };
    }

    // Replace the image set when images are provided.
    if (dto.images) {
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      data.images = {
        create: dto.images.map((img, index) => ({
          url: img.url,
          altText: img.altText,
          position: img.position ?? index,
        })),
      };
    }

    return this.prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const orderItemCount = await this.prisma.orderItem.count({
      where: { productId: id },
    });
    if (orderItemCount > 0) {
      throw new ConflictException(
        'Cannot delete a product that appears in existing orders',
      );
    }

    // Clean up dependent rows that have no historical value.
    await this.prisma.$transaction([
      this.prisma.productImage.deleteMany({ where: { productId: id } }),
      this.prisma.productVariant.deleteMany({ where: { productId: id } }),
      this.prisma.wishlistItem.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);

    return { id, deleted: true };
  }

  /**
   * Atomically decrements stock for a tracked product, refusing to oversell.
   * Used by the order flow. Returns the updated stock level.
   */
  async decrementStock(id: string, quantity: number, tx?: Prisma.TransactionClient) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }
    const client = tx ?? this.prisma;
    const product = await client.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    if (product.trackQuantity && product.stock < quantity) {
      throw new ConflictException(
        `Insufficient stock for "${product.name}" (have ${product.stock}, need ${quantity})`,
      );
    }
    if (!product.trackQuantity) {
      return product.stock;
    }
    const updated = await client.product.update({
      where: { id },
      data: { stock: { decrement: quantity } },
    });
    return updated.stock;
  }

  private buildOrderBy(
    sort?: QueryProductsDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'price_asc':
        return { price: 'asc' };
      case 'price_desc':
        return { price: 'desc' };
      case 'name_asc':
        return { name: 'asc' };
      case 'name_desc':
        return { name: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Product ${id} not found`);
    }
  }

  private async ensureCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new BadRequestException(`Category ${categoryId} does not exist`);
    }
  }

  private async ensureSkuUnique(sku: string, ignoreId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { sku },
      select: { id: true },
    });
    if (existing && existing.id !== ignoreId) {
      throw new ConflictException(`SKU "${sku}" is already in use`);
    }
  }

  private async resolveUniqueSlug(
    source: string,
    ignoreId?: string,
  ): Promise<string> {
    const base = slugify(source);
    if (!base) {
      throw new BadRequestException('Product name produces an empty slug');
    }
    let candidate = base;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.product.findUnique({
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
