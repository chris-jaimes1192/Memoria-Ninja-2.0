/**
 * CONTROLADOR: UsuarioController
 *
 * >>> SRP <<<
 * Solo traduce HTTP <-> Service: lee el body, llama al Service y arma
 * la respuesta con el status que corresponde. No tiene ninguna regla de
 * negocio (validaciones, hash, unicidad) — eso vive en UsuarioService.
 */
class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }

  registrar = (req, res) => {
    try {
      const { usuario, correo, nacimiento, password } = req.body;
      const creado = this.usuarioService.registrar({ usuario, correo, nacimiento, password });
      res.status(201).json({ exito: true, usuario: creado });
    } catch (error) {
      res.status(400).json({ exito: false, error: error.message });
    }
  };

  iniciarSesion = (req, res) => {
    try {
      const { usuario, password } = req.body;
      const sesion = this.usuarioService.iniciarSesion({ usuario, password });
      res.json({ exito: true, usuario: sesion });
    } catch (error) {
      res.status(401).json({ exito: false, error: error.message });
    }
  };

  registrarResultado = (req, res) => {
    try {
      const { idUsuario } = req.params;
      const { idPartida, zona, puntaje, modo, ganador } = req.body;
      this.usuarioService.guardarResultadoPartida({
        idUsuario,
        idPartida,
        zona,
        puntaje,
        modo,
        ganador,
      });
      res.status(201).json({ exito: true, mensaje: "Resultado guardado" });
    } catch (error) {
      res.status(400).json({ exito: false, error: error.message });
    }
  };

  obtenerHistorial = (req, res) => {
    try {
      const { idUsuario } = req.params;
      const historial = this.usuarioService.obtenerHistorial(idUsuario);
      res.json({ exito: true, historial });
    } catch (error) {
      res.status(400).json({ exito: false, error: error.message });
    }
  };

  obtenerTodos = (req, res) => {
    try {
      res.json({ exito: true, usuarios: this.usuarioService.obtenerTodos() });
    } catch (error) {
      res.status(500).json({ exito: false, error: error.message });
    }
  };

  buscarPorCorreo = (req, res) => {
    try {
      const { correo } = req.params;
      const usuario = this.usuarioService.buscarPorCorreo(correo);
      res.json({ exito: true, usuario });
    } catch (error) {
      res.status(400).json({ exito: false, error: error.message });
    }
  };
}

module.exports = UsuarioController;