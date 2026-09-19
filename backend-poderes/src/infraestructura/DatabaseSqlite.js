const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

/**
 * INFRAESTRUCTURA: DatabaseSqlite
 *
 * Punto ÚNICO de contacto con SQLite. Todos los repositorios SQL
 * (PartidaRepositorySQL, UsuarioRepositorySQL, HistorialPartidaRepositorySQL)
 * reciben ESTA clase por constructor y usan su propiedad `db` — nunca
 * abren su propia conexión. Así la creación del esquema (migración) y
 * la conexión viven en un solo lugar.
 *
 * >>> SRP <<<
 * Esta clase solo sabe UNA cosa: abrir la base y garantizar que las
 * tablas existan. No conoce partidas, usuarios ni reglas de negocio.
 *
 * >>> DIP <<<
 * Quien usa la base de datos no sabe (ni le interesa) que por debajo
 * es SQLite: los repositorios reciben "un DatabaseSqlite" ya armado
 * desde server.js (composition root).
 *
 * El estado complejo de cada partida (tablero, eventos, chakra, vida,
 * poderes activos) se persiste como COLUMNA JSON dentro de la tabla
 * `partidas`: SQL para lo estructural (id, claves, fechas, historial
 * consultable) + JSON para lo flexible (el estado exacto del juego).
 */
class DatabaseSqlite {
  constructor(rutaArchivo = path.join(__dirname, "..", "..", "data", "memorice.sqlite")) {
    if (rutaArchivo !== ":memory:") {
      const carpeta = path.dirname(rutaArchivo);
      if (!fs.existsSync(carpeta)) {
        fs.mkdirSync(carpeta, { recursive: true });
      }
    }

    this.ubicacion = rutaArchivo;
    this.db = new DatabaseSync(rutaArchivo);
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.#crearEsquema();
  }

  /** Crea las tablas si no existen (migración idempotente). */
  #crearEsquema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS partidas (
        id             TEXT PRIMARY KEY,
        estado_json    TEXT NOT NULL,
        creada_en      TEXT NOT NULL DEFAULT (datetime('now')),
        actualizada_en TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS usuarios (
        id            TEXT PRIMARY KEY,
        usuario       TEXT NOT NULL UNIQUE,
        correo        TEXT NOT NULL UNIQUE,
        nacimiento    TEXT,
        password_hash TEXT NOT NULL,
        creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS historial_partidas (
        id         TEXT PRIMARY KEY,
        id_usuario TEXT NOT NULL,
        id_partida TEXT,
        zona       TEXT,
        puntaje    INTEGER,
        modo       TEXT,
        ganador    TEXT,
        jugada_en  TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
      );

      CREATE INDEX IF NOT EXISTS idx_historial_usuario
        ON historial_partidas(id_usuario, jugada_en DESC);
    `);
  }

  cerrar() {
    this.db.close();
  }
}

module.exports = DatabaseSqlite;