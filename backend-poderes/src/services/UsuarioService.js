const crypto = require("crypto");
const Usuario = require("../entities/Usuario");

/**
 * SERVICIO: UsuarioService
 *
 * >>> SRP <<<
 * Toda la lógica de negocio de usuarios vive ACÁ: validaciones de
 * registro, unicidad de usuario/correo, hash de contraseña y sesión.
 * No sabe nada de HTTP (eso es del Controller) ni de SQL (eso es del
 * Repository).
 *
 * >>> DIP <<<
 * Recibe los repositorios y el hasher YA ARMADOS por constructor desde
 * server.js. No hace "new" de nada concreto en medio de su lógica.
 */
class UsuarioService {
  constructor(usuarioRepository, historialRepository, passwordHasher) {
    this.usuarioRepository = usuarioRepository;
    this.historialRepository = historialRepository;
    this.passwordHasher = passwordHasher;
  }

  registrar({ usuario, correo, nacimiento, password }) {
    // Validación en el límite (fail fast): no se confía en el cliente.
    this.#validarCamposObligatorios({ usuario, correo, password });

    if (this.usuarioRepository.buscarPorUsuario(usuario)) {
      throw new Error("El nombre de usuario ya está en uso");
    }
    if (this.usuarioRepository.buscarPorCorreo(correo)) {
      throw new Error("El correo ya está registrado");
    }

    const id = crypto.randomUUID();
    const passwordHash = this.passwordHasher.generarHash(password);

    const nuevo = new Usuario({ id, usuario, correo, nacimiento, passwordHash });
    this.usuarioRepository.guardar(nuevo);
    return nuevo.publico();
  }

  iniciarSesion({ usuario, password }) {
    const encontrado =
      this.usuarioRepository.buscarPorUsuario(usuario) ||
      this.usuarioRepository.buscarPorCorreo(usuario);

    // Mensaje idéntico para "no existe" y "contraseña mala":
    // no se filtra qué usuario está registrado.
    if (!encontrado || !this.passwordHasher.verificar(password, encontrado.passwordHash)) {
      throw new Error("Usuario o contraseña incorrectos");
    }

    return encontrado.publico();
  }

  buscarPorId(idUsuario) {
    const usuarios = this.usuarioRepository.obtenerTodos();
    return usuarios.find((u) => u.id === idUsuario)?.publico() || null;
  }

  buscarPorCorreo(correo) {
    return this.usuarioRepository.buscarPorCorreo(correo)?.publico() || null;
  }

  obtenerTodos() {
    return this.usuarioRepository.obtenerTodos().map((u) => u.publico());
  }

  guardarResultadoPartida({ idUsuario, idPartida, zona, puntaje, modo, ganador }) {
    // El historial solo tiene sentido para un usuario que exista.
    if (!this.buscarPorId(idUsuario)) {
      throw new Error(`El usuario ${idUsuario} no existe`);
    }
    this.historialRepository.registrar({
      id: crypto.randomUUID(),
      idUsuario,
      idPartida,
      zona,
      puntaje,
      modo,
      ganador,
    });
  }

  obtenerHistorial(idUsuario) {
    return this.historialRepository.porUsuario(idUsuario);
  }

  #validarCamposObligatorios({ usuario, correo, password }) {
    if (!usuario || String(usuario).trim() === "") {
      throw new Error("El nombre de usuario es obligatorio");
    }
    if (!correo || String(correo).trim() === "" || !String(correo).includes("@")) {
      throw new Error("Debes ingresar un correo válido");
    }
    if (!password || String(password).length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
  }
}

module.exports = UsuarioService;