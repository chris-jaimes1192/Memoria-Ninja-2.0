const express = require("express");

/**
 * RUTAS: procedimientos almacenados
 *
 * POST /api/procedimientos/registrar-partida -> CALL sp_registrar_partida(...)
 */
function crearRutasProcedimientos(procedimientoController) {
  const router = express.Router();

  router.post(
    "/procedimientos/registrar-partida",
    procedimientoController.registrarResultado
  );

  return router;
}

module.exports = crearRutasProcedimientos;
