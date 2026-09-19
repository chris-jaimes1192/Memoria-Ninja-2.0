const { Router } = require("express");

function crearRutasPartidas(partidaController) {
  const router = Router();
  router.post("/partida", partidaController.crearPartida);
  return router;
}

module.exports = crearRutasPartidas;