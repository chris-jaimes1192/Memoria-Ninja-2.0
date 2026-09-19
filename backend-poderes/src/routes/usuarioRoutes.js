const { Router } = require("express");

function crearRutasUsuarios(usuarioController) {
  const router = Router();

  router.post("/usuarios/registro", usuarioController.registrar);
  router.post("/usuarios/login", usuarioController.iniciarSesion);
  router.get("/usuarios", usuarioController.obtenerTodos);
  router.get("/usuarios/por-correo/:correo", usuarioController.buscarPorCorreo);
  router.get("/usuarios/:idUsuario/historial", usuarioController.obtenerHistorial);
  router.post("/usuarios/:idUsuario/historial", usuarioController.registrarResultado);

  return router;
}

module.exports = crearRutasUsuarios;