/**
 *  ╔═════════════════════════════════════════════════════════════════════╗
 *  ║  create_preference – Función serverless para Vercel (ESM)          ║
 *  ║  SDK Mercado Pago v2                                               ║
 *  ║  · En PREVIEW/LOCAL  →  sandbox_init_point                         ║
 *  ║  · En PRODUCTION     →  init_point                                 ║
 *  ╚═════════════════════════════════════════════════════════════════════╝
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';

/* ──────────────────────────────────────────────────────
 *  1)  CONFIGURAR SDK CON TU ACCESS_TOKEN
 *      Usa SIEMPRE una variable de entorno:
 *      MP_ACCESS_TOKEN=APP_USR-…
 * ────────────────────────────────────────────────────── */
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

/*  CORS: define qué dominio puede llamar a tu API            */
const ALLOWED_ORIGIN = process.env.ALLOW_ORIGIN || '*';   // p. ej. https://electrotienda.vercel.app

export default async function handler (req, res) {

  /* ───────  CORS pre-flight  ─────── */
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ───────  Sólo aceptamos POST  ─────── */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  /* ───────  Parsear body JSON  ─────── */
  let data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { items = [], payer_email = '' } = data || {};

  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'items vacío' });
  }

  /* ───────  Contruir preferencia  ─────── */
  const BASE = process.env.BASE_URL || `https://${req.headers.host}`;

  const fixedItems = items.map(i => ({
    title       : String(i.title ?? 'Producto'),
    quantity    : Number(i.quantity ?? 1),
    unit_price  : Number(i.unit_price ?? 0),
    currency_id : i.currency_id || 'ARS',
    picture_url : (i.picture_url?.startsWith('http') ? i.picture_url
                                                     : `${BASE}/${i.picture_url || ''}`)
  }));

  const prefClient = new Preference(mp);

  try {
    const pref = await prefClient.create({
      body: {
        items: fixedItems,
        payer: { email: payer_email },
        back_urls: {
          success : `${BASE}/success.html`,
          failure : `${BASE}/error.html`,
          pending : `${BASE}/pending.html`
        },
        auto_return: 'approved'
      }
    });

    /*  Si Vercel despliega como
        ─ Preview (o local)    → NODE_ENV !== 'production'  → sandbox_init_point
        ─ Production           → NODE_ENV === 'production' → init_point           */
    const url = process.env.NODE_ENV === 'production'
                ? pref.init_point
                : pref.sandbox_init_point || pref.init_point;

    return res.status(200).json({ init_point: url });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err?.message ?? err
    });
  }
}



