/**
 * IMPLEMENTACIÓN CONCRETA: HistorialPartidaRepositorySQL
 *
 * Guarda el HISTORIAL de partidas de cada usuario en la tabla
 * `historial_partidas` (relación por FK con `usuarios`). Esta tabla es
 * 100% relacional: puntaje, zona, modo, ganador y fecha son columnas
 * consultables — aquí JSON no aporta nada porque no hay estado flexible.
 *
 * >>> SRP <<<
 * Esta clase solo sabe persistir/consultar histórico. No calcula
 * puntajes ni decide ganadores: eso es del frontend/Services.
 */
class HistorialPartidaRepositorySQL {
  #insertaRegistro;
  #consultaPorUsuario;

  constructor(database) {
    this.database = database;
    // prepare() en el constructor, no como campo de clase (los campos se
    // inicializan antes del cuerpo del constructor).
    this.#insertaRegistro = this.database.db.prepare(`
      INSERT INTO historial_partidas
        (id, id_usuario, id_partida, zona, puntaje, modo, ganador)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    this.#consultaPorUsuario = this.database.db.prepare(`
      SELECT * FROM historial_partidas
      WHERE id_usuario = ?
      ORDER BY jugada_en DESC, rowid DESC
    `);
  }

  registrar({ id, idUsuario, idPartida, zona, puntaje, modo, ganador }) {
    this.#insertaRegistro.run(
      id,
      idUsuario,
      idPartida ?? null,
      zona ?? null,
      puntaje ?? null,
      modo ?? null,
      ganador ?? null
    );
  }

  porUsuario(idUsuario) {
    return this.#consultaPorUsuario.all(idUsuario);
  }
}

module.exports = HistorialPartidaRepositorySQL;