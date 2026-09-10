const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const Jugador = require("../src/entities/Jugador");
const Partida = require("../src/entities/Partida");

/**
 * >>> LSP (Sustitución de Liskov) — VERIFICADO, no solo documentado <<<
 *
 * Esta es la idea central de este archivo: en vez de solo ESCRIBIR en un
 * comentario que "cualquier PartidaRepository es sustituible por otro",
 * se ejecuta LA MISMA batería de pruebas contra cada implementación
 * concreta. Si mañana alguien agrega una implementación nueva
 * (PartidaRepositoryMongo, PartidaRepositoryRedis, lo que sea) y no pasa
 * estos mismos tests, esa implementación ESTÁ ROTA — viola el contrato
 * y no puede reemplazar a las demás sin peligro. Eso es exactamente lo
 * que Liskov exige, verificado con código y no solo con buena fe.
 *
 * Se usa así (ver partidaRepositoryMemoria.test.js y
 * partidaRepositoryArchivo.test.js): cada archivo de test solo dice
 * "corré esta batería contra ESTA implementación puntual".
 */
function verificarContratoDePartidaRepository(nombreImplementacion, crearRepositorioVacio) {
  describe(`Contrato de PartidaRepository — ${nombreImplementacion}`, () => {
    it("devuelve null si la partida no existe todavía", () => {
      const repo = crearRepositorioVacio();
      assert.equal(repo.obtener("no-existe"), null);
    });

    it("devuelve exactamente la partida que se guardó, con el mismo id", () => {
      const repo = crearRepositorioVacio();
      const partida = new Partida("p1", new Jugador("j1", "Naruto"), new Jugador("j2", "Sasuke"));

      repo.guardar("p1", partida);
      const recuperada = repo.obtener("p1");

      assert.notEqual(recuperada, null);
      assert.equal(recuperada.id, "p1");
    });

    it("guardar dos veces la misma partida no rompe nada (sobrescribe)", () => {
      const repo = crearRepositorioVacio();
      const partida = new Partida("p1", new Jugador("j1", "Naruto"), new Jugador("j2", "Sasuke"));

      repo.guardar("p1", partida);
      partida.registrarEvento("un evento cualquiera");
      repo.guardar("p1", partida);

      const recuperada = repo.obtener("p1");
      assert.equal(recuperada.eventos.length, 1);
    });

    it("dos partidas distintas no se pisan entre sí", () => {
      const repo = crearRepositorioVacio();
      const partidaA = new Partida("pA", new Jugador("j1", "Naruto"), new Jugador("j2", "Sasuke"));
      const partidaB = new Partida("pB", new Jugador("j3", "Hinata"), new Jugador("j4", "Kiba"));

      repo.guardar("pA", partidaA);
      repo.guardar("pB", partidaB);

      assert.equal(repo.obtener("pA").id, "pA");
      assert.equal(repo.obtener("pB").id, "pB");
    });
  });
}

module.exports = verificarContratoDePartidaRepository;
