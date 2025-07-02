// api/create_preference.js
import mercadopago from "mercadopago";

// ───────────────── Configuración ─────────────────
// Usa tu token de producción o de prueba
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

// ───────────────── Handler (Vercel/Netlify) ─────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    // Solo aceptamos POST
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // items: [{ id, title, description, picture_url, unit_price, quantity, currency_id }]
    // payer_email: String
    const { items, payer_email } = req.body;

    const pref = await mercadopago.preferences.create({
      items,
      payer: { email: payer_email },
      back_urls: {
        success: "https://electrotienda.vercel.app/success.html",
        failure: "https://electrotienda.vercel.app/error.html",
        pending:  "https://electrotienda.vercel.app/pending.html",
      },
      auto_return: "approved",
    });

    // Devolvemos el link a Mercado Pago
    return res.status(200).json({ init_point: pref.body.init_point });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "No se pudo crear la preferencia" });
  }
}
