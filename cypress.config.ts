import { defineConfig } from "cypress";
import { PrismaClient } from '@prisma/client';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    env: {
      apiUrl: process.env.E2E_API_URL || 'http://localhost:3000',
    },
    setupNodeEvents(on) {
      const prisma = new PrismaClient();
      on('task', {
        async promoteUser(email: string) {
          await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
          return null;
        },
        async getOrder(id: number) {
          return prisma.order.findUnique({ where: { id } });
        },
        async createProduct(data: {
          name: string;
          slug: string;
          priceCents: number;
          stock?: number;
        }) {
          return prisma.product.create({ data });
        },
      });
    },
  },
});
