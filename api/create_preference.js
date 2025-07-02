// api/create_preference.js
import mercadopago from "mercadopago";

/* ─── 1. Configuración SDK ─────────────────────────────────────────── */
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

/* ─── 2. Función Serverless (Vercel) ───────────────────────────────── */
export default async function handler(req, res) {
  // Permitimos solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    /* Esperamos data:
       {
         "items":[{ id,title,description,picture_url,unit_price,quantity }],
         "payer_email":"correo@test.com"
       }
    */
    const { items = [], payer_email = "" } = req.body || {};

    // Validación mínima
    if (!items.length) {
      return res.status(400).json({ error: "Items vacíos" });
    }

    // Creamos preferencia
    const preference = await mercadopago.preferences.create({
      items,
      payer: { email: payer_email },
      back_urls: {
        success: "https://electrotienda.vercel.app/success.html",
        failure: "https://electrotienda.vercel.app/error.html",
        pending: "https://electrotienda.vercel.app/pending.html",
      },
      auto_return: "approved",
    });

    // Respondemos con link de pago
    return res.status(200).json({ init_point: preference.body.init_point });
  } catch (err) {
    console.error("Error MP:", err);
    return res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
}

