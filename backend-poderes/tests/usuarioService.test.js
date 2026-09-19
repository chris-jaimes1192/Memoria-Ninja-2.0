const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const DatabaseSqlite = require("../src/infraestructura/DatabaseSqlite");
const PasswordHasher = require("../src/infraestructura/PasswordHasher");
const UsuarioRepositorySQL = require("../src/repositories/UsuarioRepositorySQL");
const HistorialPartidaRepositorySQL = require("../src/repositories/HistorialPartidaRepositorySQL");
const UsuarioService = require("../src/services/UsuarioService");

/**
 * >>> DIP en acción con SQLite <<<
 * Se arma un UsuarioService con repositorios SQL concretos y se prueba
 * el ciclo de vida real: registro -> login -> registro de partida ->
 * historial. Todo persistido en una base en memoria.
 */
function crearServicio() {
  const database = new DatabaseSqlite(":memory:");
  const usuarioRepository = new UsuarioRepositorySQL(database);
  const historialRepository = new HistorialPartidaRepositorySQL(database);
  const passwordHasher = new PasswordHasher();
  const servicio = new UsuarioService(usuarioRepository, historialRepository, passwordHasher);
  return { servicio, usuarioRepository };
}

describe("UsuarioService con repositorios SQL", () => {
  it("registra un usuario y lo devuelve sin exponer el hash", () => {
    const { servicio, usuarioRepository } = crearServicio();

    const creado = servicio.registrar({
      usuario: "naruto",
      correo: "naruto@konoha.ni",
      nacimiento: "1990-10-10",
      password: "secreto123",
    });

    assert.equal(creado.usuario, "naruto");
    assert.equal(creado.correo, "naruto@konoha.ni");
    assert.equal("passwordHash" in creado, false);
    assert.equal(creado.passwordHash, undefined);

    // En la base quedó un hash real (nunca la contraseña en texto plano).
    const guardado = usuarioRepository.buscarPorCorreo("naruto@konoha.ni");
    assert.notEqual(guardado, null);
    assert.notEqual(guardado.passwordHash, "secreto123");
    assert.ok(guardado.passwordHash.includes(":"));
  });

  it("rechaza registro con usuario ya existente (formato duplicado)", () => {
    const { servicio } = crearServicio();
    servicio.registrar({ usuario: "sasuke", correo: "sasuke@konoha.ni", password: "clave123" });

    assert.throws(
      () => servicio.registrar({ usuario: "sasuke", correo: "otro@correo.com", password: "clave123" }),
      /ya está en uso/
    );
  });

  it("rechaza registro con correo ya existente", () => {
    const { servicio } = crearServicio();
    servicio.registrar({ usuario: "sakura", correo: "sakura@konoha.ni", password: "clave123" });

    assert.throws(
      () => servicio.registrar({ usuario: "otro", correo: "Sakura@Konoha.ni", password: "clave123" }),
      /correo ya está registrado/
    );
  });

  it("inicia sesión con credenciales correctas y rechaza las incorrectas", () => {
    const { servicio } = crearServicio();
    servicio.registrar({ usuario: "hinata", correo: "hinata@konoha.ni", password: "byakugan" });

    const sesion = servicio.iniciarSesion({ usuario: "hinata", password: "byakugan" });
    assert.equal(sesion.usuario, "hinata");

    assert.throws(
      () => servicio.iniciarSesion({ usuario: "hinata", password: "mal" }),
      /Usuario o contraseña incorrectos/
    );
    assert.throws(
      () => servicio.iniciarSesion({ usuario: "fantasma", password: "byakugan" }),
      /Usuario o contraseña incorrectos/
    );
  });

  it("guarda resultados de partidas y los lista ordenados del más reciente al más antiguo", () => {
    const { servicio } = crearServicio();
    const { id } = servicio.registrar({ usuario: "kiba", correo: "kiba@konoha.ni", password: "akamaru" });

    servicio.guardarResultadoPartida({ idUsuario: id, zona: "roca", puntaje: 120, modo: "1", ganador: "kiba" });
    servicio.guardarResultadoPartida({ idUsuario: id, zona: "niebla", puntaje: 90, modo: "2", ganador: "rival" });

    const historial = servicio.obtenerHistorial(id);
    assert.equal(historial.length, 2);
    assert.equal(historial[0].zona, "niebla");
    assert.equal(historial[0].puntaje, 90);
    assert.equal(historial[1].zona, "roca");
  });

  it("no guarda historial para un usuario inexistente (FK protegida por el Service)", () => {
    const { servicio } = crearServicio();
    assert.throws(
      () => servicio.guardarResultadoPartida({ idUsuario: "uuid-inexistente", zona: "roca", puntaje: 1 }),
      /no existe/
    );
  });

  it("buscarPorCorreo devuelve el usuario público o null (para el repositorio HTTP del frontend)", () => {
    const { servicio } = crearServicio();
    servicio.registrar({ usuario: "rocklee", correo: "lee@konoha.ni", password: "konohaForte" });

    const encontrado = servicio.buscarPorCorreo("lee@konoha.ni");
    assert.equal(encontrado.usuario, "rocklee");
    assert.equal(encontrado.passwordHash, undefined);

    assert.equal(servicio.buscarPorCorreo("no-existe@konoha.ni"), null);
  });

  it("obtenerTodos lista usuarios públicos sin exponer hashes", () => {
    const { servicio } = crearServicio();
    servicio.registrar({ usuario: "tenten", correo: "tenten@konoha.ni", password: "arma123" });
    servicio.registrar({ usuario: "neji", correo: "neji@konoha.ni", password: "giro123" });

    const todos = servicio.obtenerTodos();
    assert.equal(todos.length, 2);
    todos.forEach((u) => assert.equal(u.passwordHash, undefined));
  });
});