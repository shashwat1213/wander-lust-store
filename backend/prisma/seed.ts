/**
 * Seeds the database with an admin user, sample categories and products.
 * Safe to run repeatedly: it upserts by unique fields.
 *
 *   cd backend && npx ts-node prisma/seed.ts
 *
 * Admin credentials (change ADMIN_PASSWORD via env for anything non-local):
 *   email:    admin@wanderlust.dev
 *   password: value of ADMIN_PASSWORD env, or "changeme123" for local dev
 */
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'changeme123';
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wanderlust.dev' },
    update: { role: Role.ADMIN },
    create: {
      email: 'admin@wanderlust.dev',
      password: await bcrypt.hash(adminPassword, 10),
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
    },
  });
  console.log(`✔ admin user: ${admin.email}`);

  const categories = [
    { name: 'Tents & Shelters', description: 'Sleep under the stars.' },
    { name: 'Backpacks', description: 'Carry it all comfortably.' },
    { name: 'Footwear', description: 'Trail-ready boots and shoes.' },
    { name: 'Cooking', description: 'Fuel your adventure.' },
  ];

  const categoryIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: slugify(c.name) },
      update: { description: c.description },
      create: { name: c.name, slug: slugify(c.name), description: c.description },
    });
    categoryIds[c.name] = cat.id;
  }
  console.log(`✔ ${categories.length} categories`);

  const products = [
    { name: '4-Season Mountain Tent', category: 'Tents & Shelters', price: 349.99, compareAt: 399.99, sku: 'TENT-4S-01', stock: 15, img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4' },
    { name: 'Ultralight 2P Tent', category: 'Tents & Shelters', price: 219.0, sku: 'TENT-UL-2P', stock: 22, img: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d' },
    { name: '65L Trekking Backpack', category: 'Backpacks', price: 189.5, sku: 'BP-65L-01', stock: 30, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62' },
    { name: 'Daypack 24L', category: 'Backpacks', price: 79.0, compareAt: 99.0, sku: 'BP-24L-01', stock: 40, img: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3' },
    { name: 'Waterproof Hiking Boots', category: 'Footwear', price: 159.99, sku: 'FW-HB-01', stock: 3, img: 'https://images.unsplash.com/photo-1520639888713-7851133b1ed0' },
    { name: 'Trail Running Shoes', category: 'Footwear', price: 129.0, sku: 'FW-TR-01', stock: 18, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' },
    { name: 'Camp Stove Kit', category: 'Cooking', price: 64.95, sku: 'CK-STOVE-01', stock: 25, img: 'https://images.unsplash.com/photo-1526401485004-46910ecc8e51' },
    { name: 'Titanium Cookware Set', category: 'Cooking', price: 89.0, sku: 'CK-TI-01', stock: 12, img: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae' },
  ];

  for (const p of products) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: { price: p.price, stock: p.stock },
      create: {
        name: p.name,
        slug,
        shortDescription: `${p.name} — quality gear for your next trip.`,
        price: p.price,
        compareAtPrice: p.compareAt,
        sku: p.sku,
        stock: p.stock,
        categoryId: categoryIds[p.category],
        images: { create: [{ url: p.img, altText: p.name, position: 0 }] },
      },
    });
  }
  console.log(`✔ ${products.length} products`);
  console.log('\nSeed complete. Admin login:');
  console.log('  email:    admin@wanderlust.dev');
  console.log(`  password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
