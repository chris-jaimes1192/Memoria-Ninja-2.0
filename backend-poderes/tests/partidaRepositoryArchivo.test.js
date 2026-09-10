const fs = require("fs");
const os = require("os");
const path = require("path");
const PartidaRepositoryArchivo = require("../src/repositories/PartidaRepositoryArchivo");
const verificarContratoDePartidaRepository = require("./contratoPartidaRepository");

// Usa una carpeta temporal distinta en cada test para no ensuciar /data
verificarContratoDePartidaRepository(
  "PartidaRepositoryArchivo",
  () => new PartidaRepositoryArchivo(fs.mkdtempSync(path.join(os.tmpdir(), "partidas-")))
);
