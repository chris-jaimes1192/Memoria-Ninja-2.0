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

  async registrar({ usuario, correo, nacimiento, password }) {
    // Validación en el límite (fail fast): no se confía en el cliente.
    this.#validarCamposObligatorios({ usuario, correo, password });

    if (await this.usuarioRepository.buscarPorUsuario(usuario)) {
      throw new Error("El nombre de usuario ya está en uso");
    }
    if (await this.usuarioRepository.buscarPorCorreo(correo)) {
      throw new Error("El correo ya está registrado");
    }

    const id = crypto.randomUUID();
    const passwordHash = this.passwordHasher.generarHash(password);

    const nuevo = new Usuario({ id, usuario, correo, nacimiento, passwordHash });
    await this.usuarioRepository.guardar(nuevo);
    return nuevo.publico();
  }

  async iniciarSesion({ usuario, password }) {
    const encontrado =
      (await this.usuarioRepository.buscarPorUsuario(usuario)) ||
      (await this.usuarioRepository.buscarPorCorreo(usuario));

    // Mensaje idéntico para "no existe" y "contraseña mala":
    // no se filtra qué usuario está registrado.
    if (!encontrado || !this.passwordHasher.verificar(password, encontrado.passwordHash)) {
      throw new Error("Usuario o contraseña incorrectos");
    }

    return encontrado.publico();
  }

  async buscarPorId(idUsuario) {
    const usuarios = await this.usuarioRepository.obtenerTodos();
    return usuarios.find((u) => u.id === idUsuario)?.publico() || null;
  }

  async buscarPorCorreo(correo) {
    const encontrado = await this.usuarioRepository.buscarPorCorreo(correo);
    return encontrado?.publico() || null;
  }

  async obtenerTodos() {
    const usuarios = await this.usuarioRepository.obtenerTodos();
    return usuarios.map((u) => u.publico());
  }

  async guardarResultadoPartida({ idUsuario, idPartida, zona, puntaje, modo, ganador }) {
    // El historial solo tiene sentido para un usuario que exista.
    if (!(await this.buscarPorId(idUsuario))) {
      throw new Error(`El usuario ${idUsuario} no existe`);
    }
    await this.historialRepository.registrar({
      id: crypto.randomUUID(),
      idUsuario,
      idPartida,
      zona,
      puntaje,
      modo,
      ganador,
    });
  }

  async obtenerHistorial(idUsuario) {
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