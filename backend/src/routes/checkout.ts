import express from 'express';

interface CheckoutItem {
  title: string;
  quantity: number;
  unit_price: number;
}

const checkoutRouter = express.Router();

checkoutRouter.post('/create-order', async (req, res) => {
  try {
    const items = req.body as CheckoutItem[];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided' });
    }

    const mp = await import('mercadopago');

    let preferenceId: string;
    let initPoint: string;

    if ('preferences' in mp) {
      (mp as any).configure?.({ access_token: process.env.MP_ACCESS_TOKEN ?? '' });
      const preference = await (mp as any).preferences.create({
        items,
        back_urls: {
          success: 'http://localhost:9000/success',
          failure: 'http://localhost:9000/failure',
          pending: 'http://localhost:9000/pending',
        },
      });
      preferenceId = preference.body?.id ?? preference.id;
      initPoint = preference.body?.init_point ?? preference.init_point;
    } else {
      const client = new (mp as any).MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN ?? '',
      });
      const preferenceClient = new (mp as any).Preference(client);
      const preference = await preferenceClient.create({
        body: {
          items,
          back_urls: {
            success: 'http://localhost:9000/success',
            failure: 'http://localhost:9000/failure',
            pending: 'http://localhost:9000/pending',
          },
        },
      });
      preferenceId = preference.id;
      initPoint = preference.init_point;
    }

    return res.json({ success: true, preferenceId, init_point: initPoint });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error creando orden' });
  }
});

export default checkoutRouter;
