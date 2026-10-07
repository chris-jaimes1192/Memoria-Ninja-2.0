const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const DatabaseSqlite = require("../src/infraestructura/DatabaseSqlite");
const PasswordHasher = require("../src/infraestructura/PasswordHasher");
const UsuarioRepositorySQL = require("../src/repositories/UsuarioRepositorySQL");
const HistorialPartidaRepositorySQL = require("../src/repositories/HistorialPartidaRepositorySQL");
const ProcedimientoRepositorySQL = require("../src/repositories/ProcedimientoRepositorySQL");
const VistaRepositorySQL = require("../src/repositories/VistaRepositorySQL");
const UsuarioService = require("../src/services/UsuarioService");
const ProcedimientoService = require("../src/services/ProcedimientoService");

/**
 * >>> Procedimiento almacenado en ambos motores <<<
 *
 * Con PostgreSQL el repositorio hace `CALL sp_registrar_partida(...)`.
 * Con SQLite (que no tiene procedimientos) ejecuta el MISMO INSERT como
 * equivalente directo. Este test verifica la rama SQLite y que la fila
 * quede visible en la vista vw_historial_detallado.
 */
function montar() {
  const database = new DatabaseSqlite(":memory:");
  const usuarioRepository = new UsuarioRepositorySQL(database);
  const historialRepository = new HistorialPartidaRepositorySQL(database);
  const usuarioService = new UsuarioService(usuarioRepository, historialRepository, new PasswordHasher());
  const procedimientoService = new ProcedimientoService(new ProcedimientoRepositorySQL(database));
  const vistaRepository = new VistaRepositorySQL(database);
  return { database, usuarioService, procedimientoService, vistaRepository };
}

describe("Procedimiento almacenado sp_registrar_partida", () => {
  it("registra un resultado y la vista vw_historial_detallado lo refleja con el nombre de usuario", async () => {
    const { usuarioService, procedimientoService, vistaRepository } = montar();

    const { id } = await usuarioService.registrar({
      usuario: "shikamaru",
      correo: "shikamaru@konoha.ni",
      password: "perezoso1",
    });

    await procedimientoService.registrarResultado({
      idUsuario: id,
      zona: "niebla",
      puntaje: 210,
      modo: "2",
      ganador: "shikamaru",
    });

    const historial = await usuarioService.obtenerHistorial(id);
    assert.equal(historial.length, 1);
    assert.equal(historial[0].puntaje, 210);

    const detallado = await vistaRepository.historialDetallado();
    const fila = detallado.find((f) => f.id_usuario === id);
    assert.equal(fila.usuario, "shikamaru");
    assert.equal(fila.puntaje, 210);
  });

  it("valida los parámetros antes de llegar a la BD", async () => {
    const { procedimientoService } = montar();

    await assert.rejects(
      () => procedimientoService.registrarResultado({ puntaje: 10 }),
      /identificador del usuario/
    );
    await assert.rejects(
      () => procedimientoService.registrarResultado({ idUsuario: "u1", puntaje: "no-numero" }),
      /puntaje debe ser un número/
    );
  });

  it("rechaza registrar un usuario que no existe (FK de historial_partidas)", async () => {
    const { procedimientoService } = montar();

    await assert.rejects(
      () =>
        procedimientoService.registrarResultado({
          idUsuario: "no-existe",
          zona: "roca",
          puntaje: 50,
        }),
      /insert or update|FOREIGN KEY|foreign key/i
    );
  });
});
