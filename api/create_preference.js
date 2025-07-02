// api/create_preference.js  –  función serverless ESM
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// Vercel handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items = [], payer_email } = req.body ?? {};

    // Construir preferencia
    const preferenceClient = new Preference(mp);
    const pref = await preferenceClient.create({
      items,
      payer: { email: payer_email },
      back_urls: {
        success: `${process.env.BASE_URL}/success.html`,
        failure: `${process.env.BASE_URL}/error.html`,
        pending: `${process.env.BASE_URL}/pending.html`
      },
      auto_return: 'approved'
    });

    // En v2 la URL de pago está en pref.sandbox_init_point (test)
    const init_point = pref.sandbox_init_point || pref.init_point;
    return res.status(200).json({ init_point });
  } catch (err) {
    console.error('MP-error', err);
    return res.status(500).json({ error: 'No se pudo crear la preferencia', detail: err.message });
  }
}


