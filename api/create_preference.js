// api/create_preference.js  (ESM – mercadopago@1.5.14)
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp   = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const BASE = process.env.BASE_URL;                       // p.ej. https://electrotienda.vercel.app

export default async function handler(req, res) {
  /* CORS pre-flight — opcional */
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido' });

  /* Parse seguro */
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); }
    catch { return res.status(400).json({ error: 'JSON inválido' }); }
  }

  const { items = [], payer_email = '' } = body;

  /* Normalizar items para MP-SDK v1.x */
  const fixedItems = items.map(it => ({
    title       : it.title,
    currency_id : 'ARS',                                   // ← obligatorio
    quantity    : Number(it.quantity)  || 1,
    unit_price  : Number(it.unit_price) * 1.0,             // 1.0 => float
    picture_url : it.picture_url?.startsWith('http')
                   ? it.picture_url
                   : `${BASE}/${it.picture_url}`
  }));

  try {
    const preferenceClient = new Preference(mp);
    const pref = await preferenceClient.create({
      items       : fixedItems,
      payer       : { email: payer_email },
      back_urls   : {
        success : `${BASE}/success.html`,
        failure : `${BASE}/error.html`,
        pending : `${BASE}/pending.html`
      },
      auto_return : 'approved'
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({
      init_point: pref.sandbox_init_point || pref.init_point
    });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err.message || err
    });
  }
}


