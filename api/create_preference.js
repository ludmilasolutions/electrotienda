// api/create_preference.js
import { MercadoPagoConfig, Preference } from 'mercadopago';

/* 1)  CONFIGURAR SDK -------------------------------------------------- */
const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN   //  ►  tu ACCESS_TOKEN real
});

/* 2)  HANDLER SERVERLESS --------------------------------------------- */
export default async function handler(req, res) {

  /* ───────────────── Validar método ───────────────── */
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  /* ───────────────── Parsear body ─────────────────── */
  let data = req.body;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); }
    catch { return res.status(400).json({ error: 'JSON inválido' }); }
  }

  const { items = [], payer_email = '' } = data;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'items vacío' });
  }

  /* ───────────────── Armar preferencia ───────────── */
  const BASE = process.env.BASE_URL || `https://${req.headers.host}`;   // ej. https://tudominio.vercel.app

  // Normalizamos los ítems
  const fixedItems = items.map(it => ({
    title       : String(it.title ?? 'Producto'),
    quantity    : Number(it.quantity ?? 1),
    unit_price  : Number(it.unit_price ?? 0),
    currency_id : it.currency_id || 'ARS',
    picture_url : it.picture_url?.startsWith('http')
                   ? it.picture_url
                   : `${BASE}/${it.picture_url || ''}`
  }));

  const prefBody = {
    items : fixedItems,
    payer : { email: payer_email },
    back_urls : {
      success : `${BASE}/success.html`,
      failure : `${BASE}/error.html`,
      pending : `${BASE}/pending.html`
    },
    auto_return : 'approved'
  };

  try {
    /* ───── Crear preferencia con SDK v2 ───── */
    const prefClient = new Preference(mp);
    const pref = await prefClient.create({ body: prefBody });

    // En modo test usar sandbox_init_point, en prod init_point
    const url = pref.sandbox_init_point || pref.init_point;
    return res.status(200).json({ init_point: url });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err?.message || err
    });
  }
}


