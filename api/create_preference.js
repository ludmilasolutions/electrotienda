// api/create_preference.js  (ESM, SDK v2)
import { MercadoPagoConfig, Preference } from 'mercadopago';

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido' });

  try {
    /* 1️⃣ Sanitizar body -------------------------------------------------- */
    const { items = [], payer_email } = req.body ?? {};

    if (!Array.isArray(items) || !items.length)
      return res.status(400).json({ error: 'items vacío' });

    const cleanItems = items.map(it => ({
      title      : String(it.title ?? '').trim(),
      quantity   : Number(it.quantity ?? 1),
      unit_price : Number(it.unit_price ?? it.price ?? 0),
      currency_id: 'ARS',
      ...(it.id            ? { id: String(it.id) }           : {}),
      ...(it.description   ? { description: String(it.description) } : {}),
      ...(it.picture_url||it.image
                        ? { picture_url: String(it.picture_url||it.image) }
                        : {})
    }));

    // validaciones mínimas
    if (cleanItems.some(it => !it.title || it.unit_price <= 0 || it.quantity < 1))
      return res.status(400).json({ error: 'items con datos inválidos' });

    /* 2️⃣ Armar preferencia ---------------------------------------------- */
    const prefBody = {
      items : cleanItems,
      ...(payer_email ? { payer: { email: payer_email } } : {}),
      back_urls: {
        success : `${process.env.BASE_URL}/success.html`,
        failure : `${process.env.BASE_URL}/error.html`,
        pending : `${process.env.BASE_URL}/pending.html`
      },
      auto_return: 'approved'
    };

    console.log('≡ Payload a Mercado Pago:\n', JSON.stringify(prefBody, null, 2));

    /* 3️⃣ Crear preferencia --------------------------------------------- */
    const prefClient = new Preference(mp);
    const pref = await prefClient.create(prefBody);

    return res.status(200).json({
      init_point: pref.sandbox_init_point ?? pref.init_point
    });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err.message
    });
  }
}



