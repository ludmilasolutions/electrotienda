// api/create_preference.js            – ESM
import { MercadoPagoConfig } from "mercadopago";

// SDK v2 – usa tu Access Token real
const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  // ------ datos recibidos ------
  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); }
    catch { return res.status(400).json({ error: "JSON inválido" }); }
  }

  const { items = [], payer_email = "" } = data;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "items vacío" });
  }

  // ------ armo preferencia ------
  const baseURL = process.env.BASE_URL || `https://${req.headers.host}`;

  const prefBody = {
    items: items.map(i => ({
      title      : String(i.title ?? "Producto"),
      quantity   : Number(i.quantity)   || 1,
      unit_price : Number(i.unit_price) || 0
    })),
    payer: { email: payer_email },
    back_urls: {
      success: `${baseURL}/success.html`,
      failure: `${baseURL}/error.html`,
      pending: `${baseURL}/pending.html`
    },
    auto_return: "approved"
  };

  /* (opcional) log en Preview para depurar */
  if (process.env.VERCEL_ENV !== "production") {
    console.log("Pref. enviada a MP ⇒\n", JSON.stringify(prefBody, null, 2));
  }

  // ------ llamo a MP ------
  try {
    const pref = await mp.preferences.create({ body: prefBody });
    const url  = pref.sandbox_init_point || pref.init_point;
    return res.status(200).json({ init_point: url });
  } catch (err) {
    console.error("MP-error ►", err);
    return res.status(500).json({
      error : "No se pudo crear la preferencia",
      detail: err?.message ?? err
    });
  }
}



