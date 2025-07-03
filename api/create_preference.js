// api/create_preference.js   (ES Modules, SDK v2)
import { MercadoPagoConfig, Preference } from 'mercadopago';

// 1) Instanciamos el cliente una sola vez
const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN  //  <-- tu Access-Token real o de test
});

export default async function handler(req, res) {
  // ── Sólo POST ───────────────────────────────────────────
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Método no permitido' });

  try {
    // Desestructuramos y saneamos body
    const { items = [], payer_email = '' } = req.body ?? {};

    // Sanitizamos items (números & currency_id)
    const cleanItems = items.map(it => ({
      id          : String(it.id ?? ''),           // opcional
      title       : String(it.title ?? ''),
      description : String(it.description ?? ''),
      picture_url : String(it.picture_url ?? it.image ?? ''),
      quantity    : Number(it.quantity ?? 1),
      unit_price  : Number(it.unit_price ?? it.price ?? 0),
      currency_id : 'ARS'
    }));

    // 2) Creamos preferencia
    const preferenceClient = new Preference(mp);
    const pref = await preferenceClient.create({
      items : cleanItems,
      payer : { email: payer_email },

      back_urls: {
        success : `${process.env.BASE_URL}/success.html`,
        failure : `${process.env.BASE_URL}/error.html`,
        pending : `${process.env.BASE_URL}/pending.html`
      },
      auto_return: 'approved'
    });

    // 3) Respondemos la URL de pago
    const init_point = pref.sandbox_init_point ?? pref.init_point;
    return res.status(200).json({ init_point });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err.message
    });
  }
}


