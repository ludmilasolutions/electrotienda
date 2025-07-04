// /api/create_preference.js   (ESM + SDK v2)
import { MercadoPagoConfig, Preference } from 'mercadopago';

/* 1️⃣  Configurar SDK */
const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN        // <- ACCESS_TOKEN real
});

const ALLOWED_ORIGIN = process.env.ALLOW_ORIGIN || '*';   // CORS

/* 2️⃣  Función serverless */
export default async function handler(req, res) {
  /* ----- CORS ----- */
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // pre-flight
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ----- sólo POST ----- */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  /* ----- body ----- */
  let data = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { items = [], payer_email = '' } = data;
  if (!Array.isArray(items) || !items.length)
    return res.status(400).json({ error: 'items vacío' });

  const BASE = process.env.BASE_URL || `https://${req.headers.host}`;

  /* ----- crear preferencia ----- */
  try {
    const prefClient = new Preference(mp);
    const pref = await prefClient.create({
      body: {
        items: items.map(it => ({
          title       : String(it.title ?? 'Producto'),
          quantity    : Number(it.quantity ?? 1),
          unit_price  : Number(it.unit_price ?? 0),
          currency_id : it.currency_id || 'ARS',
          picture_url : it.picture_url?.startsWith('http')
                        ? it.picture_url
                        : `${BASE}/${it.picture_url || ''}`
        })),
        payer: { email: payer_email },
        back_urls: {
          success: `${BASE}/success.html`,
          failure: `${BASE}/error.html`,
          pending: `${BASE}/pending.html`
        },
        auto_return: 'approved'
      }
    });

    const url = pref.sandbox_init_point || pref.init_point; // test o prod
    return res.status(200).json({ init_point: url });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err?.message || err
    });
  }
}


