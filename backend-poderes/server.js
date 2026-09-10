const express = require("express");
const cors = require("cors");

const Jugador = require("./src/entities/Jugador");
const Partida = require("./src/entities/Partida");
const PoderFactory = require("./src/factories/PoderFactory");
const PartidaRepositoryMemoria = require("./src/repositories/PartidaRepositoryMemoria");
const PoderService = require("./src/services/PoderService");
const PoderController = require("./src/controllers/PoderController");
const crearRutasPoderes = require("./src/routes/poderRoutes");

/**
 * RAÍZ DE COMPOSICIÓN (Composition Root)
 *
 * Este es el ÚNICO lugar de todo el backend donde se hace "new" de las
 * implementaciones concretas. Todo lo demás (Service, Controller) recibe
 * sus dependencias ya armadas por constructor — nunca las crea por su
 * cuenta. Es la prueba en vivo de la Inversión de Dependencias (DIP)
 * que te va a pedir el instructor en la Fase 2 de la sustentación.
 */
const partidaRepository = new PartidaRepositoryMemoria();
const poderFactory = new PoderFactory();
const poderService = new PoderService(partidaRepository, poderFactory);
const poderController = new PoderController(poderService);

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", crearRutasPoderes(poderController));

// Ruta de prueba: crea una partida de ejemplo con 2 jugadores y 50 de chakra
// cada uno, para poder probar /api/poder/activar sin armar todo el flujo
// de salas todavía.
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
});
