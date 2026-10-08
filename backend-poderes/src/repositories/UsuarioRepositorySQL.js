const UsuarioRepository = require("./UsuarioRepository");
const Usuario = require("../entities/Usuario");

/**
 * IMPLEMENTACIÓN CONCRETA: UsuarioRepositorySQL
 *
 * Guarda usuarios en la tabla `usuarios` de SQLite. Las columnas
 * relacionales (usuario, correo con UNIQUE) garantizan que no existan
 * duplicados a nivel de base de datos, además de la validación que hace
 * UsuarioService antes de insertar.
 */
class UsuarioRepositorySQL extends UsuarioRepository {
  #consultaPorUsuario;
  #consultaPorCorreo;
  #consultaPorId;
  #consultaTodos;
  #insertaUsuario;
  #actualizaPerfil;

  constructor(database) {
    super();
    this.database = database;
    // prepare() en el constructor, no como campo de clase: los campos se
    // inicializan antes del cuerpo del constructor (this.database aún no
    // existe en ese punto).
    this.#consultaPorUsuario = this.database.db.prepare(
      "SELECT * FROM usuarios WHERE lower(usuario) = lower(?)"
    );

    this.#consultaPorCorreo = this.database.db.prepare(
      "SELECT * FROM usuarios WHERE lower(correo) = lower(?)"
    );

    this.#consultaPorId = this.database.db.prepare(
      "SELECT * FROM usuarios WHERE id = ?"
    );

    this.#consultaTodos = this.database.db.prepare(
      "SELECT * FROM usuarios ORDER BY lower(usuario) ASC"
    );

    this.#insertaUsuario = this.database.db.prepare(`
      INSERT INTO usuarios (id, usuario, correo, nacimiento, password_hash,
                            xp, victorias, derrotas, racha, puntaje_max)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.#actualizaPerfil = this.database.db.prepare(`
      UPDATE usuarios
      SET xp = ?, victorias = ?, derrotas = ?, racha = ?, puntaje_max = ?
      WHERE id = ?
    `);
  }

  #filaAUsuario(fila) {
    if (!fila) return null;
    return new Usuario({
      id: fila.id,
      usuario: fila.usuario,
      correo: fila.correo,
      nacimiento: fila.nacimiento,
      passwordHash: fila.password_hash,
      xp: fila.xp,
      victorias: fila.victorias,
      derrotas: fila.derrotas,
      racha: fila.racha,
      puntajeMax: fila.puntaje_max,
    });
  }

  async buscarPorUsuario(usuario) {
    return this.#filaAUsuario(await this.#consultaPorUsuario.get(usuario));
  }

  async buscarPorCorreo(correo) {
    return this.#filaAUsuario(await this.#consultaPorCorreo.get(correo));
  }

  async buscarPorId(id) {
    return this.#filaAUsuario(await this.#consultaPorId.get(id));
  }

  async obtenerTodos() {
    const filas = await this.#consultaTodos.all();
    return filas.map((fila) => this.#filaAUsuario(fila));
  }

  guardar(usuario) {
    this.#insertaUsuario.run(
      usuario.id,
      usuario.usuario,
      usuario.correo,
      usuario.nacimiento,
      usuario.passwordHash,
      usuario.xp,
      usuario.victorias,
      usuario.derrotas,
      usuario.racha,
      usuario.puntajeMax
    );
  }

  actualizarPerfil(id, perfil) {
    this.#actualizaPerfil.run(
      perfil.xp,
      perfil.victorias,
      perfil.derrotas,
      perfil.racha,
      perfil.puntajeMax,
      id
    );
  }
}

module.exports = UsuarioRepositorySQL;