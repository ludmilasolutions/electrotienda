// api/create_preference.js
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const BASE = process.env.BASE_URL;                        // ← ya no será “undefined”

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { items = [], payer_email } = req.body ?? {};

    /** Aseguramos URLs absolutas **/
    const fixedItems = items.map(it => ({
      ...it,
      picture_url: it.picture_url?.startsWith('http')
        ? it.picture_url
        : `${BASE}/${it.picture_url}`                 // ej. https://…/images/…
    }));

    const preferenceClient = new Preference(mp);
    const pref = await preferenceClient.create({
      items: fixedItems,
      payer: { email: payer_email },
      back_urls: {
        success: `${BASE}/success.html`,
        failure: `${BASE}/error.html`,
        pending: `${BASE}/pending.html`
      },
      auto_return: 'approved'
    });

    return res.status(200).json({ init_point: pref.init_point });
  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({ error: 'No se pudo crear la preferencia' });
  }
}

