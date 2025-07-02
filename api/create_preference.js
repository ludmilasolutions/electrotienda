// ❶  ES Modules nativos en Vercel ¹
import mercadopago from "mercadopago";

const mp = new mercadopago.MercadoPago({
  accessToken: process.env.MP_ACCESS_TOKEN
});

export default async function handler(request, response) {
  if (request.method !== "POST")
    return response.status(405).json({ error: "Método no permitido" });

  try {
    const { items, payer_email } = request.body;

    const pref = await mp.preference.create({
      items,
      payer: { email: payer_email },
      back_urls: {
        success: "https://ludmilasolutions.github.io/electrotienda/success.html",
        failure: "https://ludmilasolutions.github.io/electrotienda/error.html",
        pending: "https://ludmilasolutions.github.io/electrotienda/pending.html"
      },
      auto_return: "approved"
    });

    // Devolvemos el link de pago
    return response.status(200).json({ init_point: pref.body.init_point });
  } catch (err) {
    console.error(err);
    return response.status(500).json({ error: "No se pudo crear la preferencia" });
  }
}
