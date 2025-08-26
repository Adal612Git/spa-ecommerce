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
    create: { email: 'alice@example.com', name: 'Alice', role: Role.CUSTOMER, passwordHash: demoHash },
  });
  await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { email: 'bob@example.com', name: 'Bob', role: Role.CUSTOMER, passwordHash: demoHash },
  });

  const products = [
    {
      name: 'Taza de café',
      slug: 'taza-de-cafe',
      description: 'Taza cerámica para café o té.',
      priceCents: 1299,
      stock: 50,
      status: 'ACTIVE',
    },
    {
      name: 'Playera básica',
      slug: 'playera-basica',
      description: 'Playera de algodón 100%.',
      priceCents: 1999,
      stock: 100,
      status: 'ACTIVE',
    },
    {
      name: 'Gorra deportiva',
      slug: 'gorra-deportiva',
      description: 'Gorra ajustable para exterior.',
      priceCents: 1599,
      stock: 40,
      status: 'ACTIVE',
    },
    {
      name: 'Sudadera con capucha',
      slug: 'sudadera-con-capucha',
      description: 'Sudadera cómoda para clima frío.',
      priceCents: 3499,
      stock: 25,
      status: 'ACTIVE',
    },
    {
      name: 'Zapatos deportivos',
      slug: 'zapatos-deportivos',
      description: 'Calzado ligero para correr.',
      priceCents: 5999,
      stock: 30,
      status: 'ACTIVE',
    },
    {
      name: 'Mochila escolar',
      slug: 'mochila-escolar',
      description: 'Mochila resistente con varios compartimentos.',
      priceCents: 2799,
      stock: 60,
      status: 'ACTIVE',
    },
    {
      name: 'Cuaderno de notas',
      slug: 'cuaderno-de-notas',
      description: 'Cuaderno con 100 hojas rayadas.',
      priceCents: 499,
      stock: 200,
      status: 'ACTIVE',
    },
    {
      name: 'Bolígrafo azul',
      slug: 'boligrafo-azul',
      description: 'Bolígrafo de tinta azul de gel.',
      priceCents: 199,
      stock: 500,
      status: 'ACTIVE',
    },
    {
      name: 'Audífonos inalámbricos',
      slug: 'audifonos-inalambricos',
      description: 'Audífonos Bluetooth con cancelación de ruido.',
      priceCents: 8999,
      stock: 15,
      status: 'ACTIVE',
    },
    {
      name: 'Smartwatch',
      slug: 'smartwatch',
      description: 'Reloj inteligente con monitor de ritmo cardíaco.',
      priceCents: 12999,
      stock: 10,
      status: 'INACTIVE',
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
