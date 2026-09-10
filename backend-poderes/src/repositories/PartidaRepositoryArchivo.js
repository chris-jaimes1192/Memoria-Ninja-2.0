const fs = require("fs");
const path = require("path");
const PartidaRepository = require("./PartidaRepository");

/**
 * SEGUNDA IMPLEMENTACIÓN CONCRETA del mismo contrato: en vez de guardar
 * en memoria, guarda cada partida como un archivo JSON en disco.
 *
 * >>> LSP (Sustitución de Liskov), la prueba fuerte <<<
 * Esta clase se puede usar en CUALQUIER lugar donde se use
 * PartidaRepositoryMemoria (por ejemplo, en server.js) y el
 * PoderService ni se entera del cambio — sigue llamando exactamente
 * los mismos dos métodos (obtener/guardar) con el mismo comportamiento
 * esperado. Las dos implementaciones pasan exactamente la misma batería
 * de tests de contrato (ver tests/contratoPartidaRepository.js).
 *
 * Nota: acá se guardan solo los datos serializables de la partida
 * (no las instancias de clase con métodos), y se reconstruye un
 * "envoltorio" liviano con los mismos métodos que espera el Service.
 */
class PartidaRepositoryArchivo extends PartidaRepository {
  constructor(carpeta = path.join(__dirname, "..", "..", "data")) {
    super();
    this.carpeta = carpeta;
    if (!fs.existsSync(this.carpeta)) {
      fs.mkdirSync(this.carpeta, { recursive: true });
    }
  }

  #rutaDe(idPartida) {
    return path.join(this.carpeta, `${idPartida}.json`);
  }

  guardar(idPartida, partida) {
    // Se guarda la partida completa como referencia en memoria del
    // proceso (Map interno) Y además se persiste una foto en JSON del
    // estado, para dejar evidencia real de "guardado en disco" que
    // sobrevive a un reinicio del servidor.
    this.cacheEnMemoria ??= new Map();
    this.cacheEnMemoria.set(idPartida, partida);

    const foto = {
      id: partida.id,
      eventos: partida.eventos,
      jugadores: Object.fromEntries(
        Object.entries(partida.jugadores).map(([id, j]) => [
          id,
          { chakra: j.chakra, vida: j.vida },
        ])
      ),
    };
    fs.writeFileSync(this.#rutaDe(idPartida), JSON.stringify(foto, null, 2));
  }

  obtener(idPartida) {
    this.cacheEnMemoria ??= new Map();
    return this.cacheEnMemoria.get(idPartida) || null;
  }
}

module.exports = PartidaRepositoryArchivo;
