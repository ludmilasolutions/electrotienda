// api/create_preference.js  –  ES Modules en Vercel
import Mercadopago from "mercadopago";

const mp = new Mercadopago({
  accessToken: process.env.MP_ACCESS_TOKEN    //  ← tu access-token de prueba o prod
});

// Solo POST
export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Método no permitido" });

  try {
    const { items = [], payer_email = "" } = req.body;
    if (!items.length) {
      return res.status(400).json({ error: "Items vacíos" });
    }

    // normalizo a número por si vienen como string
    const clean = items.map(it => ({
      ...it,
      unit_price: Number(it.unit_price),
      quantity:   Number(it.quantity)
    }));

    const pref = await mp.preferences.create({
      items: clean,
      payer: { email: payer_email },
      back_urls: {
        success: `${process.env.BASE_URL}/success.html`,
        failure: `${process.env.BASE_URL}/error.html`,
        pending: `${process.env.BASE_URL}/pending.html`
      },
      auto_return: "approved"
    });

    return res.status(200).json({ init_point: pref.init_point });
  } catch (err) {
    console.error("MP-error", err);
    return res.status(500).json({ error: "No se pudo crear la preferencia" });
  }
}



