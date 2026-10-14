require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");

const Jugador = require("./src/entities/Jugador");
const Partida = require("./src/entities/Partida");
const PoderFactory = require("./src/factories/PoderFactory");
const PoderService = require("./src/services/PoderService");
const PoderController = require("./src/controllers/PoderController");
const crearRutasPoderes = require("./src/routes/poderRoutes");

const DatabasePostgres = require("./src/infraestructura/DatabasePostgres");
const PasswordHasher = require("./src/infraestructura/PasswordHasher");
const CodigoHasher = require("./src/infraestructura/CodigoHasher");
const CodigoNumericGenerator = require("./src/infraestructura/CodigoNumericGenerator");
const ConsolaNotificadorCorreo = require("./src/infraestructura/ConsolaNotificadorCorreo");
const EtherealNotificadorCorreo = require("./src/infraestructura/EtherealNotificadorCorreo");
const SmtpNotificadorCorreo = require("./src/infraestructura/SmtpNotificadorCorreo");
const PartidaRepositorySQL = require("./src/repositories/PartidaRepositorySQL");
const UsuarioRepositorySQL = require("./src/repositories/UsuarioRepositorySQL");
const HistorialPartidaRepositorySQL = require("./src/repositories/HistorialPartidaRepositorySQL");
const CodigoVerificacionRepositorySQL = require("./src/repositories/CodigoVerificacionRepositorySQL");
const SesionRepositorySQL = require("./src/repositories/SesionRepositorySQL");
const UsuarioService = require("./src/services/UsuarioService");
const AuthService = require("./src/services/AuthService");
const VerificacionService = require("./src/services/VerificacionService");
const RecuperacionService = require("./src/services/RecuperacionService");
const UsuarioController = require("./src/controllers/UsuarioController");
const AuthController = require("./src/controllers/AuthController");
const VerificacionController = require("./src/controllers/VerificacionController");
const RecuperacionController = require("./src/controllers/RecuperacionController");
const crearRutasUsuarios = require("./src/routes/usuarioRoutes");
const crearRutasAuth = require("./src/routes/authRoutes");
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
 * ÚNICO lugar donde se arma el grafo de dependencias con `new`.
 *
 * AHORA SOLO PostgreSQL: el esquema canónico es sql/esquema.sql (raíz),
 * que cada PC aplica con `npm run db:setup` usando SU .env. Si faltan las
 * credenciales, el backend NO arranca (fail fast) — nunca cae a SQLite.
 */
if ((process.env.DB_TYPE || "postgres").toLowerCase() !== "postgres") {
  throw new Error("Este backend usa SOLO PostgreSQL. Configura DB_TYPE=postgres en .env");
}
if (!process.env.PGPASSWORD || !process.env.PGDATABASE) {
  throw new Error(
    "Faltan credenciales de PostgreSQL. Copia .env.example a .env y completa PGPASSWORD/PGDATABASE."
  );
}

const database = new DatabasePostgres();
const passwordHasher = new PasswordHasher();
const codigoHasher = new CodigoHasher();
const codigoGenerador = new CodigoNumericGenerator();
// Selección del notificador de correo según MAILER (fail-fast si es smtp).
//   MAILER=consola  -> imprime el código en la consola del servidor (default)
//   MAILER=ethereal -> Ethereal (demo, URL de vista previa; nunca llega)
//   MAILER=smtp     -> SMTP real (Gmail/Resend/Brevo...) usando las SMTP_*
function crearNotificadorCorreo() {
  const mailer = (process.env.MAILER || "consola").toLowerCase();

  if (mailer === "smtp") {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error(
        "MAILER=smtp requiere SMTP_HOST, SMTP_USER y SMTP_PASS en el .env (en Gmail, una contraseña de aplicación)."
      );
    }
    return new SmtpNotificadorCorreo();
  }
  if (mailer === "ethereal") {
    return new EtherealNotificadorCorreo();
  }
  return new ConsolaNotificadorCorreo();
}

const notificador = crearNotificadorCorreo();

const duracionSesionMin = Number(process.env.COOKIE_TTL_MIN || 1440);

const partidaRepository = new PartidaRepositorySQL(database);
const poderFactory = new PoderFactory();
const poderService = new PoderService(partidaRepository, poderFactory);
const poderController = new PoderController(poderService);

const usuarioRepository = new UsuarioRepositorySQL(database);
const historialRepository = new HistorialPartidaRepositorySQL(database);
const codigoVerificacionRepository = new CodigoVerificacionRepositorySQL(database);
const sesionRepository = new SesionRepositorySQL(database);

const usuarioService = new UsuarioService(usuarioRepository, historialRepository, passwordHasher);
const authService = new AuthService(
  usuarioRepository,
  codigoVerificacionRepository,
  sesionRepository,
  passwordHasher,
  codigoGenerador,
  codigoHasher,
  notificador,
  duracionSesionMin
);
const verificacionService = new VerificacionService(
  usuarioRepository,
  codigoVerificacionRepository,
  codigoHasher,
  codigoGenerador,
  notificador,
  database
);
const recuperacionService = new RecuperacionService(
  usuarioRepository,
  codigoVerificacionRepository,
  codigoHasher,
  passwordHasher,
  codigoGenerador,
  notificador,
  database
);

const usuarioController = new UsuarioController(usuarioService);
const authController = new AuthController(authService, duracionSesionMin);
const verificacionController = new VerificacionController(verificacionService);
const recuperacionController = new RecuperacionController(recuperacionService);

const partidaService = new PartidaService(partidaRepository);
const partidaController = new PartidaController(partidaService);

const vistaRepository = new VistaRepositorySQL(database);
const vistaService = new VistaService(vistaRepository);
const vistaController = new VistaController(vistaService);

const procedimientoRepository = new ProcedimientoRepositorySQL(database);
const procedimientoService = new ProcedimientoService(procedimientoRepository);
const procedimientoController = new ProcedimientoController(procedimientoService);
const estadoController = new EstadoController();

// ---------- Middlewares de seguridad ----------
// En tests e2e (que ejercitan /api/auth muchas veces) se puede desactivar
// con RATE_LIMIT_DESACTIVADO=1 para no toparse con el 429 al repetir la suite.
const saltarRateLimit = () => process.env.RATE_LIMIT_DESACTIVADO === "1";
const limitadorGeneral = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: saltarRateLimit,
});
const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: saltarRateLimit,
  message: { exito: false, error: "Demasiadas peticiones. Intenta en unos minutos." },
});

const app = express();
app.use(helmet());
// Mismo origen para el frontend versionado (login.html, verificacion.html...).
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", limitadorGeneral);
app.use("/api/auth", limitadorAuth);

app.use("/api", crearRutasEstado(estadoController));
app.use("/api", crearRutasPoderes(poderController));
app.use("/api", crearRutasUsuarios(usuarioController));
app.use("/api", crearRutasAuth(authController, verificacionController, recuperacionController));
app.use("/api", crearRutasPartidas(partidaController));
app.use("/api", crearRutasVistas(vistaController));
app.use("/api", crearRutasProcedimientos(procedimientoController));

// El backend también sirve el frontend (mismo origen -> cookies httpOnly OK).
app.use(express.static(path.join(__dirname, "..")));

// Ruta de prueba: crea una partida de ejemplo con 2 jugadores y 50 de chakra
// cada uno, para poder probar /api/poder/activar sin armar todo el flujo.
app.post("/api/partida/prueba", async (req, res) => {
  const jugador1 = new Jugador("naruto", "Naruto");
  const jugador2 = new Jugador("sasuke", "Sasuke");
  jugador1.ganarChakra(50);
  jugador2.ganarChakra(50);

  const partida = new Partida("partida-1", jugador1, jugador2);
  await partidaRepository.guardar(partida.id, partida);

  res.json({ idPartida: partida.id, jugadores: ["naruto", "sasuke"] });
});

const PUERTO = Number(process.env.SERVER_PORT || 3000);

async function iniciar() {
  // PostgreSQL: aplica sql/esquema.sql (idempotente) si hace falta.
  if (typeof database.init === "function") {
    await database.init();
  }

  app.listen(PUERTO, () => {
    console.log(`Backend de poderes escuchando en http://localhost:${PUERTO}`);
    console.log(`Motor de base de datos: postgres (${process.env.PGPORT || 5432}/${process.env.PGDATABASE})`);
    console.log(`Frontend servido en el mismo puerto (mismo origen)`);
  });
}

iniciar().catch((error) => {
  console.error("No se pudo iniciar el backend:", error.message);
  process.exit(1);
});