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
  #consultaTodos;
  #insertaUsuario;

  constructor(database) {
    super();
    this.database = database;
    // prepare() en el constructor, no como campo de clase: los campos se
    // inicializan antes del cuerpo del constructor (this.database aún no
    // existe en ese punto).
    this.#consultaPorUsuario = this.database.db.prepare(
      "SELECT * FROM usuarios WHERE usuario = ? COLLATE NOCASE"
    );

    this.#consultaPorCorreo = this.database.db.prepare(
      "SELECT * FROM usuarios WHERE correo = ? COLLATE NOCASE"
    );

    this.#consultaTodos = this.database.db.prepare(
      "SELECT * FROM usuarios ORDER BY usuario COLLATE NOCASE"
    );

    this.#insertaUsuario = this.database.db.prepare(`
      INSERT INTO usuarios (id, usuario, correo, nacimiento, password_hash)
      VALUES (?, ?, ?, ?, ?)
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
    });
  }

  buscarPorUsuario(usuario) {
    return this.#filaAUsuario(this.#consultaPorUsuario.get(usuario));
  }

  buscarPorCorreo(correo) {
    return this.#filaAUsuario(this.#consultaPorCorreo.get(correo));
  }

  obtenerTodos() {
    return this.#consultaTodos.all().map((fila) => this.#filaAUsuario(fila));
  }

  guardar(usuario) {
    this.#insertaUsuario.run(
      usuario.id,
      usuario.usuario,
      usuario.correo,
      usuario.nacimiento,
      usuario.passwordHash
    );
  }
}

module.exports = UsuarioRepositorySQL;