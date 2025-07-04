// api/create_preference.js
import { MercadoPagoConfig, Preference } from 'mercadopago';

/* 1)  SDK -------------------------------------------------------------- */
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const ALLOWED_ORIGIN = process.env.ALLOW_ORIGIN || '*';   // ej. https://ludmilasolutions.github.io

/* 2)  Handler ---------------------------------------------------------- */
export default async function handler(req, res) {
  /* ────────  CORS  ──────── */
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pre-flight
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ────────  Sólo POST  ──────── */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  /* ────────  Parseo body  ──────── */
  let data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { items = [], payer_email = '' } = data;
  if (!items.length) return res.status(400).json({ error: 'items vacío' });

  /* ────────  Preferencia  ──────── */
  const BASE = process.env.BASE_URL || `https://${req.headers.host}`;
  const prefClient = new Preference(mp);

  const pref = await prefClient.create({
    body: {
      items: items.map(i => ({
        title       : i.title ?? 'Producto',
        quantity    : Number(i.quantity ?? 1),
        unit_price  : Number(i.unit_price ?? 0),
        currency_id : i.currency_id || 'ARS',
        picture_url : i.picture_url?.startsWith('http')
                      ? i.picture_url
                      : `${BASE}/${i.picture_url || ''}`
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

  return res.status(200).json({ init_point: pref.sandbox_init_point || pref.init_point });
}



