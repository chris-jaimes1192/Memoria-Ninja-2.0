const express = require("express");
const cors = require("cors");

const Jugador = require("./src/entities/Jugador");
const Partida = require("./src/entities/Partida");
const PoderFactory = require("./src/factories/PoderFactory");
const PoderService = require("./src/services/PoderService");
const PoderController = require("./src/controllers/PoderController");
const crearRutasPoderes = require("./src/routes/poderRoutes");

const DatabaseSqlite = require("./src/infraestructura/DatabaseSqlite");
const DatabasePostgres = require("./src/infraestructura/DatabasePostgres");
const PasswordHasher = require("./src/infraestructura/PasswordHasher");
const PartidaRepositorySQL = require("./src/repositories/PartidaRepositorySQL");
const UsuarioRepositorySQL = require("./src/repositories/UsuarioRepositorySQL");
const HistorialPartidaRepositorySQL = require("./src/repositories/HistorialPartidaRepositorySQL");
const UsuarioService = require("./src/services/UsuarioService");
const UsuarioController = require("./src/controllers/UsuarioController");
const crearRutasUsuarios = require("./src/routes/usuarioRoutes");
const PartidaService = require("./src/services/PartidaService");
const PartidaController = require("./src/controllers/PartidaController");
const crearRutasPartidas = require("./src/routes/partidaRoutes");
const VistaRepositorySQL = require("./src/repositories/VistaRepositorySQL");
const VistaService = require("./src/services/VistaService");
const VistaController = require("./src/controllers/VistaController");
const crearRutasVistas = require("./src/routes/vistaRoutes");
const ProcedimientoRepositorySQL = require("./src/repositories/ProcedimientoRepositorySQL");
const ProcedimientoService = require("./src/services/ProcedimientoService");
const ProcedimientoController = require("./src/controllers/ProcedimientoController");
const crearRutasProcedimientos = require("./src/routes/procedimientoRoutes");
const EstadoController = require("./src/controllers/EstadoController");
const crearRutasEstado = require("./src/routes/estadoRoutes");

/**
 * RAÍZ DE COMPOSICIÓN (Composition Root)
 *
 * Soporta SQLite (por defecto, para mantener tests) o PostgreSQL (si DB_TYPE=postgres)
 * para consumir vistas, trigger y procedimientos definidos en pgAdmin4.
 */
const dbType = (process.env.DB_TYPE || "sqlite").toLowerCase();
let database;
if (dbType === "postgres") {
  database = new DatabasePostgres();
} else {
  database = new DatabaseSqlite();
}
const passwordHasher = new PasswordHasher();

const partidaRepository = new PartidaRepositorySQL(database);
const poderFactory = new PoderFactory();
const poderService = new PoderService(partidaRepository, poderFactory);
const poderController = new PoderController(poderService);

const usuarioRepository = new UsuarioRepositorySQL(database);
const historialRepository = new HistorialPartidaRepositorySQL(database);
const usuarioService = new UsuarioService(usuarioRepository, historialRepository, passwordHasher);
const usuarioController = new UsuarioController(usuarioService);

const partidaService = new PartidaService(partidaRepository);
const partidaController = new PartidaController(partidaService);

const vistaRepository = new VistaRepositorySQL(database);
const vistaService = new VistaService(vistaRepository);
const vistaController = new VistaController(vistaService);

const procedimientoRepository = new ProcedimientoRepositorySQL(database);
const procedimientoService = new ProcedimientoService(procedimientoRepository);
const procedimientoController = new ProcedimientoController(procedimientoService);
const estadoController = new EstadoController();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", crearRutasEstado(estadoController));
app.use("/api", crearRutasPoderes(poderController));
app.use("/api", crearRutasUsuarios(usuarioController));
app.use("/api", crearRutasPartidas(partidaController));
app.use("/api", crearRutasVistas(vistaController));
app.use("/api", crearRutasProcedimientos(procedimientoController));

// Ruta de prueba: crea una partida de ejemplo con 2 jugadores y 50 de chakra
// cada uno, para poder probar /api/poder/activar sin armar todo el flujo
// de salas todavía. La partida queda persistida en la BD activa.
app.post("/api/partida/prueba", async (req, res) => {
  const jugador1 = new Jugador("naruto", "Naruto");
  const jugador2 = new Jugador("sasuke", "Sasuke");
  jugador1.ganarChakra(50);
  jugador2.ganarChakra(50);

  const partida = new Partida("partida-1", jugador1, jugador2);
  await partidaRepository.guardar(partida.id, partida);

  res.json({ idPartida: partida.id, jugadores: ["naruto", "sasuke"] });
});

const PUERTO = 3000;

async function iniciar() {
  // PostgreSQL: carga schema-postgres.sql (tablas, vistas, trigger, procedimientos)
  if (typeof database.init === "function") {
    await database.init();
  }

  app.listen(PUERTO, () => {
    console.log(`Backend de poderes escuchando en http://localhost:${PUERTO}`);
    console.log(`Motor de base de datos: ${dbType}`);
    console.log(`Base de datos: ${database.ubicacion}`);
  });
}

iniciar().catch((error) => {
  console.error("No se pudo iniciar el backend:", error.message);
  process.exit(1);
});