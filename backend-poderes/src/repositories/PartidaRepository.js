/**
 * INTERFAZ: PartidaRepository
 *
 * >>> ABSTRACCIÓN + ISP <<<
 * Define solo los métodos que el Service realmente necesita para leer y
 * guardar partidas — nada más. Si mañana hay que guardar en una base de
 * datos real en vez de en memoria, se crea otra clase que cumpla este
 * mismo contrato (ej. PartidaRepositoryMongo) y el Service no se entera
 * del cambio.
 */
class PartidaRepository {
  obtener(idPartida) {
    throw new Error("obtener() no implementado");
  }

  guardar(idPartida, partida) {
    throw new Error("guardar() no implementado");
  }
}

module.exports = PartidaRepository;
