const { Router } = require("express");

function crearRutasPoderes(poderController) {
  const router = Router();
  router.post("/poder/activar", poderController.activarPoder);
  return router;
}

module.exports = crearRutasPoderes;
