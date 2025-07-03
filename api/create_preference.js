// api/create_preference.js  (ES-modules)
import { MercadoPagoConfig, Preference } from "mercadopago";

// ❶ Instanciamos el SDK v2
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// ❷ Función serverless (Vercel)
export default async function handler(req, res) {
  // Métodos permitidos
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  // CORS muy laxo (ajustalo si hace falta)
  res.setHeader("Access-Control-Allow-Origin", "*");

  /* —— Preparar datos —— */
  // body puede venir como string cuando el front usa fetch()
  let data = req.body;
  if (typeof data === "string") {
    try { data = JSON.parse(data); }               // -> objeto
    catch { return res.status(400).json({ error: "JSON inválido" }); }
  }

  const { items = [], payer_email = "" } = data;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "items vacío" });
  }

  // URL base absoluta
  const baseURL = process.env.BASE_URL || `https://${req.headers.host}`;

  // Normalizar items al mínimo que acepta MP v2
  const fixedItems = items.map(i => ({
    title      : i.title?.toString()       ?? "Producto",
    quantity   : Number(i.quantity)  || 1,
    unit_price : Number(i.unit_price) || 0,
    picture_url: i.picture_url?.startsWith("http")
                   ? i.picture_url
                   : `${baseURL}/${i.picture_url ?? ""}`
  }));

  /* —— Crear preferencia —— */
  try {
    const preferenceClient = new Preference(mp);

    const pref = await preferenceClient.create({
      items : fixedItems,
      payer : { email: payer_email },
      back_urls: {
        success: `${baseURL}/success.html`,
        failure: `${baseURL}/error.html`,
        pending: `${baseURL}/pending.html`
      },
      auto_return: "approved"
    });

    // sandbox_init_point (tests)  /  init_point (live)
    const url = pref.sandbox_init_point || pref.init_point;
    return res.status(200).json({ init_point: url });

  } catch (err) {
    console.error("MP-error ►", err);
    return res.status(500).json({
      error : "No se pudo crear la preferencia",
      detail: err?.message || err
    });
  }
}




