// api/create_preference.js
import mercadopago from "mercadopago";

// ── SDK v2: se instancia la clase ──────────────────────────────────────────────
const mp = new mercadopago.MercadoPago({
  accessToken: process.env.MP_ACCESS_TOKEN   // tu token de PRODUCCIÓN o TEST
});

// ── Handler serverless ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // solo POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { items, payer_email } = req.body;   // { items:[...], payer_email:"..." }

    const pref = await mp.preferences.create({
      items,
      payer: { email: payer_email },
      back_urls: {
        success: "https://electrotienda.vercel.app/success.html",
        failure: "https://electrotienda.vercel.app/error.html",
        pending:  "https://electrotienda.vercel.app/pending.html"
      },
      auto_return: "approved"
    });

    // Devolvemos el link de pago
    return res.status(200).json({ init_point: pref.body.init_point });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
}

