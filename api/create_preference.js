// api/create_preference.js
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  /* 1. Body seguro (string → objeto) */
  let data = req.body;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); }
    catch { return res.status(400).json({ error: 'JSON inválido' }); }
  }

  const { items = [], payer_email = '' } = data;
  if (!items.length) return res.status(400).json({ error: 'items vacío' });

  /* 2. Construyo preferencia */
  const base = process.env.BASE_URL || `https://${req.headers.host}`;
  const prefBody = {
    items: items.map(it => ({
      title       : String(it.title        ?? 'Producto'),
      quantity    : Number(it.quantity     ?? 1),
      unit_price  : Number(it.unit_price   ?? 0),
      currency_id : 'ARS',
      picture_url : (it.picture_url ?? '').startsWith('http')
                      ? it.picture_url
                      : `${base}/${it.picture_url ?? ''}`
    })),
    payer: { email: payer_email },
    back_urls: {
      success : `${base}/success.html`,
      failure : `${base}/error.html`,
      pending : `${base}/pending.html`
    },
    auto_return: 'approved'
  };

  /* 3. 💡 LOG para depurar */
  console.log('Payload enviado a Mercado Pago ⇒\n', JSON.stringify(prefBody, null, 2));

  try {
    /* SDK v2 */
    const prefClient = new Preference(mp);
    const pref       = await prefClient.create({ body: prefBody });

    /* sandbox_init_point durante tests ⚠️ */
    const url = pref.sandbox_init_point || pref.init_point;
    return res.status(200).json({ init_point: url });
  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({ error: 'No se pudo crear la preferencia', detail: err.message });
  }
}

