// api/create_preference.js  (Node 18, "type": "module")
import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { items, payer_email } = req.body;

    const preference = {
      items,
      payer: { email: payer_email },
      back_urls: {
        success: "https://electrotienda.vercel.app/success.html",
        failure: "https://electrotienda.vercel.app/error.html",
        pending: "https://electrotienda.vercel.app/pending.html"
      },
      auto_return: "approved"
    };

    const resp = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: resp.body.init_point });

  } catch (err) {
    console.error(err);              // ← lo verás en Runtime Logs
    return res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
}

