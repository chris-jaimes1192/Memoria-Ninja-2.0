const express = require("express");
const {
  CODIGO_VALIDO,
  construirUrlCompartir,
  generarQrDataUrl,
  obtenerIpsLocales,
} = require("../utils/compartirSala");

module.exports = function crearRutasSalas() {
  const router = express.Router();

  router.get("/salas/:codigo/compartir", async (req, res) => {
    const codigo = String(req.params.codigo || "").trim().toUpperCase();
    if (!CODIGO_VALIDO.test(codigo)) {
      return res.status(400).json({ exito: false, error: "Código de sala inválido" });
    }

    try {
      const url = construirUrlCompartir({
        codigo,
        protocolo: req.protocol,
        host: req.get("host"),
        ips: obtenerIpsLocales(),
      });
      const qrDataUrl = await generarQrDataUrl(url);
      return res.json({ exito: true, codigo, url, qrDataUrl });
    } catch (error) {
      return res.status(500).json({ exito: false, error: "No se pudo generar el QR" });
    }
  });

  return router;
};
