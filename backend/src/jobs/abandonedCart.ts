import cron from 'node-cron';
import type { PrismaClient } from '@prisma/client';
// eslint-disable-next-line import/no-unresolved
import { sendMail } from '../utils/mailer.js';

export function startAbandonedCartJob(prisma: PrismaClient) {
  // Runs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pending = await prisma.order.findMany({
      where: { status: 'PENDING', updatedAt: { lt: cutoff } },
      include: { user: true },
    });
    await Promise.all(
      pending
        .filter((o) => o.user?.email)
        .map((o) =>
          sendMail({
            to: o.user!.email!,
            subject: 'Recordatorio de carrito',
            text: `Tienes un pedido pendiente (#${o.id}) en nuestra tienda.`,
          }),
        ),
    );
  });
}
