const express = require("express");
const cors = require("cors");

const Jugador = require("./src/entities/Jugador");
const Partida = require("./src/entities/Partida");
const PoderFactory = require("./src/factories/PoderFactory");
const PoderService = require("./src/services/PoderService");
const PoderController = require("./src/controllers/PoderController");
const crearRutasPoderes = require("./src/routes/poderRoutes");

const DatabaseSqlite = require("./src/infraestructura/DatabaseSqlite");
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

/**
 * RAÍZ DE COMPOSICIÓN (Composition Root)
 *
 * Este es el ÚNICO lugar de todo el backend donde se hace "new" de las
 * implementaciones concretas. Todo lo demás (Service, Controller) recibe
 * sus dependencias ya armadas por constructor — nunca las crea por su
 * cuenta. Es la prueba en vivo de la Inversión de Dependencias (DIP)
 * que te va a pedir el instructor en la Fase 2 de la sustentación.
 *
 * >>> SQL + JSON en acción <<<
 * Acá se construye la base de datos SQLite (un único archivo
 * data/memorice.sqlite) y se inyecta en los repositorios SQL. Las
 * partidas viven en SQL con su estado interno como JSON. Para volver a
 * la implementación en memoria o en archivo, basta con cambiar esta
 * línea — el resto del sistema no se entera (LSP).
 */
const database = new DatabaseSqlite();
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

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", crearRutasPoderes(poderController));
app.use("/api", crearRutasUsuarios(usuarioController));
app.use("/api", crearRutasPartidas(partidaController));

// Ruta de prueba: crea una partida de ejemplo con 2 jugadores y 50 de chakra
// cada uno, para poder probar /api/poder/activar sin armar todo el flujo
// de salas todavía. La partida queda persistida en SQLite.
app.post("/api/partida/prueba", (req, res) => {
  const jugador1 = new Jugador("naruto", "Naruto");
  const jugador2 = new Jugador("sasuke", "Sasuke");
  jugador1.ganarChakra(50);
  jugador2.ganarChakra(50);

  const partida = new Partida("partida-1", jugador1, jugador2);
  partidaRepository.guardar(partida.id, partida);

  res.json({ idPartida: partida.id, jugadores: ["naruto", "sasuke"] });
});

const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Backend de poderes escuchando en http://localhost:${PUERTO}`);
  console.log(`Base de datos SQLite: ${database.ubicacion}`);
});