// server.js  –  versión mínima y probada
import express from "express";
import cors    from "cors";
import dotenv  from "dotenv";
import { MercadoPagoConfig, Preference } from "mercadopago";   // <─ SDK v2

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Instancia de configuración
const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

// 2. Endpoint para generar la preferencia
app.post("/create_preference", async (req, res) => {
  try {
    const { items = [], payer_email } = req.body;

    const preference = {
      items,                                  // [{ title, quantity, unit_price … }]
      payer:       payer_email ? { email: payer_email } : undefined,
      back_urls: {
        success : "http://localhost:5500/success.html",
        failure : "http://localhost:5500/error.html",
        pending : "http://localhost:5500/pending.html"
      },
      auto_return: "approved"
    };

    // 3. Crear preferencia con el nuevo método
    const { id, init_point } = await new Preference(mp).create({ body: preference });

    return res.json({ id, init_point });     // ← devuelvo ambos por comodidad
  } catch (err) {
    console.error("MP-ERROR ►", err?.message, err?.cause);
    return res.status(500).json({ error: "No se pudo crear la preferencia", detail: err?.message });
  }
});

// 4. Arrancar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Mercado Pago backend listo en http://localhost:${PORT}`));
