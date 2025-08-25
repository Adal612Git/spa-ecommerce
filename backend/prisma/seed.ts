import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash('changeme', 10);
  await prisma.user.upsert({
    where: { email: 'admin@spa-ecommerce.local' },
    update: {},
    create: { email: 'admin@spa-ecommerce.local', name: 'Admin', role: Role.ADMIN, passwordHash: adminHash },
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

  console.log('Seeded admin + demo users');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
