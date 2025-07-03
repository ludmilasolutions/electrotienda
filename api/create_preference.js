// api/create_preference.js
//-------------------------------------------------------------
//  ⚡  Mercado Pago – función serverless (Vercel / Netlify)
//  SDK clásico v1.x  (en tu package.json:  "mercadopago": "1.5.14")
//-------------------------------------------------------------
import mercadopago from 'mercadopago';

// 1) ─── Configuración global ────────────────────────────────
const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;          // ← TU token PRIVADO
if (!ACCESS_TOKEN) {
  throw new Error('⛔ Falta MP_ACCESS_TOKEN en las variables de entorno');
}

mercadopago.configure({
  access_token : ACCESS_TOKEN,
  integrator_id: process.env.MP_INTEGRATOR_ID || undefined // (opcional)
});

// 2) ─── Handler HTTP POST /api/create_preference ───────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    /* --------- Extraer y validar payload recibido -------- */
    const { items = [], payer_email = '' } = req.body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debes enviar items[]' });
    }

    /* --------- Construir preferencia -------- */
    const preference = {
      items,                               // deben cumplir el esquema MP
      payer   : payer_email ? { email: payer_email } : undefined,
      back_urls: {
        success : `${process.env.BASE_URL}/success.html`,
        failure : `${process.env.BASE_URL}/error.html`,
        pending : `${process.env.BASE_URL}/pending.html`
      },
      auto_return: 'approved'
    };

    // DEBUG: imprime exactamente lo que se envía al SDK
    console.log('=== PREF A MP ===\n', JSON.stringify(preference, null, 2));

    /* --------- Crear preferencia -------- */
    const { body } = await mercadopago.preferences.create(preference);

    // En modo test la URL suele estar en sandbox_init_point
    const init_point = body.sandbox_init_point || body.init_point;

    return res.status(200).json({ init_point });

  } catch (err) {
    console.error('MP-error ►', err);
    return res.status(500).json({
      error : 'No se pudo crear la preferencia',
      detail: err?.message || 'error interno'
    });
  }
}


