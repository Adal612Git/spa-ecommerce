import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('changeme', 10);
  await prisma.user.upsert({
    where: { email: 'admin@spa-ecommerce.local' },
    update: {},
    create: {
      email: 'admin@spa-ecommerce.local',
      name: 'Admin',
      role: Role.ADMIN,
      passwordHash: adminHash,
    },
  });

  const demoHash = await bcrypt.hash('demo1234', 10);
  await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice', role: Role.USER, passwordHash: demoHash },
  });
  await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob', role: Role.USER, passwordHash: demoHash },
  });

  const products = [
    {
      name: 'Taza de café',
      slug: 'taza-de-cafe',
      description: 'Taza cerámica para café o té.',
      price_cents: 1299,
      stock: 50,
      image_url: 'https://picsum.photos/seed/mug/300/300',
    },
    {
      name: 'Playera básica',
      slug: 'playera-basica',
      description: 'Playera de algodón 100%.',
      price_cents: 1999,
      stock: 100,
      image_url: 'https://picsum.photos/seed/shirt/300/300',
    },
    {
      name: 'Gorra deportiva',
      slug: 'gorra-deportiva',
      description: 'Gorra ajustable para exterior.',
      price_cents: 1599,
      stock: 40,
      image_url: 'https://picsum.photos/seed/cap/300/300',
    },
    {
      name: 'Sudadera con capucha',
      slug: 'sudadera-con-capucha',
      description: 'Sudadera cómoda para clima frío.',
      price_cents: 3499,
      stock: 25,
      image_url: 'https://picsum.photos/seed/hoodie/300/300',
    },
    {
      name: 'Zapatos deportivos',
      slug: 'zapatos-deportivos',
      description: 'Calzado ligero para correr.',
      price_cents: 5999,
      stock: 30,
      image_url: 'https://picsum.photos/seed/shoes/300/300',
    },
    {
      name: 'Mochila escolar',
      slug: 'mochila-escolar',
      description: 'Mochila resistente con varios compartimentos.',
      price_cents: 2799,
      stock: 60,
      image_url: 'https://picsum.photos/seed/backpack/300/300',
    },
    {
      name: 'Cuaderno de notas',
      slug: 'cuaderno-de-notas',
      description: 'Cuaderno con 100 hojas rayadas.',
      price_cents: 499,
      stock: 200,
      image_url: 'https://picsum.photos/seed/notebook/300/300',
    },
    {
      name: 'Bolígrafo azul',
      slug: 'boligrafo-azul',
      description: 'Bolígrafo de tinta azul de gel.',
      price_cents: 199,
      stock: 500,
      image_url: 'https://picsum.photos/seed/pen/300/300',
    },
    {
      name: 'Audífonos inalámbricos',
      slug: 'audifonos-inalambricos',
      description: 'Audífonos Bluetooth con cancelación de ruido.',
      price_cents: 8999,
      stock: 15,
      image_url: 'https://picsum.photos/seed/headphones/300/300',
    },
    {
      name: 'Smartwatch',
      slug: 'smartwatch',
      description: 'Reloj inteligente con monitor de ritmo cardíaco.',
      price_cents: 12999,
      stock: 10,
      image_url: 'https://picsum.photos/seed/watch/300/300',
      is_active: false,
    },
  ];

  await prisma.product.createMany({ data: products });

  console.log('Seeded admin, demo users and products');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
