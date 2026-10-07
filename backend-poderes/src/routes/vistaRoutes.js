const express = require("express");

/**
 * RUTAS: consultas a las VISTAS de la base de datos
 *
 * GET /api/vistas/partidas-recientes      -> vw_partidas_recientes
 * GET /api/vistas/historial-detallado     -> vw_historial_detallado
 * GET /api/vistas/ranking                 -> vw_ranking_mejor_puntaje
 * GET /api/vistas/usuarios-resumen        -> vw_usuarios_resumen
 */
function crearRutasVistas(vistaController) {
  const router = express.Router();

  router.get("/vistas/partidas-recientes", vistaController.partidasRecientes);
  router.get("/vistas/historial-detallado", vistaController.historialDetallado);
  router.get("/vistas/ranking", vistaController.rankingMejorPuntaje);
  router.get("/vistas/usuarios-resumen", vistaController.usuariosResumen);

  return router;
}

module.exports = crearRutasVistas;
