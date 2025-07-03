// api/create_preference.js   (ESM)
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const BASE = process.env.BASE_URL;

/* ───────────────  Handler  ─────────────── */
export default async function handler(req, res) {

  /* ----- CORS pre-flight (OPTIONS) ----- */
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido' });

  /* ----- Garantizar que el body es un objeto ----- */
  let bodyIn = req.body;
  if (typeof bodyIn === 'string') {
    try { bodyIn = JSON.parse(bodyIn); }
    catch { return res.status(400).json({ error: 'JSON inválido' }); }
  }

  const { items = [], payer_email = '' } = bodyIn;

  /* ----- Normalizar picture_url y back_urls ----- */
  const fixedItems = items.map(it => ({
    ...it,
    picture_url: it.picture_url?.startsWith('http')
      ? it.picture_url
      : `${BASE}/${it.picture_url}`
  }));

  const baseURL = BASE || `https://${req.headers.host}`;

  try {
    const preferenceClient = new Preference(mp);
    const pref = await preferenceClient.create({
      items: fixedItems,
      payer: { email: payer_email },
      back_urls: {
        success: `${baseURL}/success.html`,
        failure: `${baseURL}/error.html`,
        pending: `${baseURL}/pending.html`
      },
      auto_return: 'approved'
    });

    /* sandbox_init_point sólo existe en modo test */
    const payURL = pref.sandbox_init_point || pref.init_point;

    /* CORS header para el POST real */
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ init_point: payURL });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error: 'No se pudo crear la preferencia',
      detail: err.message ?? err
    });
  }
}
