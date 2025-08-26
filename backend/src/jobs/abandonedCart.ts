import cron from 'node-cron';
// eslint-disable-next-line import/no-unresolved
import { sendMail } from '../utils/mailer.js';

export function startAbandonedCartJob() {
  // Runs every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    // This is a placeholder implementation. In a real app you would query the DB
    // for carts that haven't been checked out and send a reminder email.
    await sendMail({
      to: 'demo@example.com',
      subject: 'Recordatorio de carrito',
      text: 'Tienes productos esperando en tu carrito.',
    });
  });
}
