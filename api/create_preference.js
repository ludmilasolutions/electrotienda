// api/create_preference.js
import mercadopago from "mercadopago";   // 👈  minúsculas, default-import

// 2.x → el constructor vive en mercadopago.MercadoPago
const mp = new mercadopago.MercadoPago({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

// ───── función serverless ────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  try {
    const { items = [], payer_email = "" } = req.body;

    const pref = await mp.preferences.create({
      items: items.map(it => ({
        ...it,
        unit_price: Number(it.unit_price),
        quantity:   Number(it.quantity),
      })),
      payer: { email: payer_email },
      back_urls: {
        success: `${process.env.BASE_URL}/success.html`,
        failure: `${process.env.BASE_URL}/error.html`,
        pending: `${process.env.BASE_URL}/pending.html`,
      },
      auto_return: "approved",
    });

    return res.status(200).json({ init_point: pref.init_point });
  } catch (err) {
    console.error("MP-error ►", err);
    return res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
}

