// api/create_preference.js
import { MercadoPagoConfig, Preference } from 'mercadopago';

/* ╔═══════════════  1)  SDK  ═══════════════╗ */
const mp = new MercadoPagoConfig({
  accessToken : process.env.MP_ACCESS_TOKEN      // ← token de PRODUCCIÓN
});

/* ­Opcional: forzar sandbox con una env var */
const USE_SANDBOX   = process.env.USE_SANDBOX === 'true';   // "true" o "false"
const ALLOWED_ORIGIN= process.env.ALLOW_ORIGIN || '*';      // CORS p/ frontend

/* ╔═══════════════  2)  HANDLER  ══════════════╗ */
export default async function handler (req, res) {

  /* ─────────────  CORS  ───────────── */
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();   // pre-flight

  /* ───────────  Sólo POST  ─────────── */
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ error:'Método no permitido' });
  }

  /* ───────────  Parseo body  ────────── */
  let data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { items = [], payer_email = '' } = data;
  if (!Array.isArray(items) || !items.length)
    return res.status(400).json({ error:'items vacío' });

  /* ───────────  Armar preferencia  ─────────── */
  const BASE = process.env.BASE_URL || `https://${req.headers.host}`;

  const prefClient = new Preference(mp);
  try {
    const pref = await prefClient.create({
      body:{
        items: items.map(i => ({
          title      : i.title      ?? 'Producto',
          quantity   : Number(i.quantity ?? 1),
          unit_price : Number(i.unit_price ?? 0),
          currency_id: i.currency_id || 'ARS',
          picture_url: i.picture_url?.startsWith('http')
                         ? i.picture_url
                         : `${BASE}/${i.picture_url || ''}`
        })),
        payer : { email: payer_email },
        back_urls:{
          success : `${BASE}/success.html`,
          failure : `${BASE}/error.html`,
          pending : `${BASE}/pending.html`
        },
        auto_return:'approved'
      }
    });

    /* ═══ Elegir URL de pago según entorno ═══ */
    const init_point = USE_SANDBOX
      ? pref.sandbox_init_point          // fuerza sandbox
      : (pref.init_point ?? pref.sandbox_init_point); // producción > sandbox

    return res.status(200).json({ init_point });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err?.message || String(err)
    });
  }
}


  return res.status(200).json({ init_point: pref.sandbox_init_point || pref.init_point });
}



