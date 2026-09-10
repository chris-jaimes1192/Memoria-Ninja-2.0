# Backend de Poderes — Memorice Duel

Backend en Node.js + Express que implementa el sistema de los 6 poderes
(Byakugan, Sustitución, Robo de Chakra, Genjutsu, Sello, Bomba Explosiva)
con arquitectura en capas, POO y los 5 principios SOLID.

## Cómo correrlo

```bash
npm install
npm start
```

Queda escuchando en `http://localhost:3000`.

## Cómo probarlo (con curl o Postman)

1. Crear una partida de prueba con Naruto y Sasuke (50 de chakra cada uno):
   ```bash
   curl -X POST http://localhost:3000/api/partida/prueba
   ```
2. Activar un poder:
   ```bash
   curl -X POST http://localhost:3000/api/poder/activar \
     -H "Content-Type: application/json" \
     -d '{"idPartida":"partida-1","idJugador":"naruto","idPoder":"byakugan"}'
   ```
   `idPoder` puede ser: `byakugan`, `sustitucion`, `robo`, `genjutsu`, `sello`, `bomba`.

## Estructura de carpetas (patrón en capas)

```
server.js                      ← raíz de composición (único lugar con "new")
src/
  entities/                    ← Jugador, Partida, Tablero (datos + reglas propias)
    poderes/
      Poder.js                 ← clase ABSTRACTA (el contrato)
      ByakuganPoder.js          |
      SustitucionPoder.js       |  6 poderes concretos,
      RoboChakraPoder.js        |  todos heredan de Poder
      GenjutsuPoder.js          |
      SelloPoder.js             |
      BombaPoder.js            ←
  factories/
    PoderFactory.js             ← Factory Method: crea poderes por id, se le
                                   pueden registrar poderes nuevos en caliente
  repositories/
    PartidaRepository.js        ← interfaz/contrato
    PartidaRepositoryMemoria.js ← implementación 1: en memoria
    PartidaRepositoryArchivo.js ← implementación 2: persiste en JSON en disco
  services/
    PoderService.js             ← TODA la lógica de negocio de activar un poder
  controllers/
    PoderController.js          ← solo traduce HTTP <-> Service
  routes/
    poderRoutes.js               ← define las rutas Express
tests/
  contratoPartidaRepository.js  ← batería de tests REUTILIZABLE (prueba el LSP)
  partidaRepositoryMemoria.test.js  ← corre esa batería contra la implementación 1
  partidaRepositoryArchivo.test.js  ← corre la MISMA batería contra la implementación 2
  contratoPoder.test.js         ← misma idea, aplicada a los 6 poderes
  poderService.test.js          ← prueba el DIP: inyecta un repositorio inventado
diagramas/
  arquitectura.mermaid          ← entregable 1
  clases.mermaid                ← entregable 2
```

## Correr los tests

```bash
npm test
```

Corre 35 tests en 10 suites, todos en verde. Estos tests no son solo
para "que no se rompa nada" — son la PRUEBA del Liskov Substitution
Principle: la misma batería de tests corre contra
`PartidaRepositoryMemoria` y contra `PartidaRepositoryArchivo` (dos
implementaciones completamente distintas por dentro) y ambas la pasan
igual. Lo mismo con los 6 poderes: un mismo test genérico los activa a
los 6 sin ningún caso especial, y todos responden con la misma "forma"
de contrato. Mostrar esto corriendo en vivo es la evidencia más fuerte
que podés dar en la Fase 2 de la sustentación.

## Dónde está cada cosa que te va a pedir el instructor

| Concepto | Dónde está |
|---|---|
| **Abstracción** | `Poder.js` (clase abstracta) y `PartidaRepository.js` (interfaz) |
| **Encapsulamiento** | `Jugador.js` — `#chakra` y `#vida` son campos privados, solo se tocan con métodos |
| **Herencia** | Los 6 poderes (`ByakuganPoder`, `SustitucionPoder`, etc.) extienden `Poder` |
| **Polimorfismo** | `PoderService.activarPoder()` llama siempre `poder.activar(contexto)` sin importar cuál poder sea — cada uno responde distinto |
| **SRP** | `PoderController` solo HTTP, `PoderService` solo lógica, `PartidaRepositoryMemoria`/`PartidaRepositoryArchivo` solo persistencia, `PoderFactory` solo construcción |
| **OCP** | Para sumar un poder nuevo: creás la clase (heredando de `Poder`) y la registrás con `fabrica.registrar(id, Clase)` — no tocás `PoderService` ni `PoderController` |
| **LSP** | Hay **dos** implementaciones reales de `PartidaRepository` (memoria y archivo) que pasan exactamente la misma batería de tests de contrato (`tests/contratoPartidaRepository.js`), y los **6 poderes** pasan la misma batería genérica (`tests/contratoPoder.test.js`) — el LSP está verificado con tests, no solo prometido en un comentario |
| **ISP** | `PartidaRepository` solo tiene `obtener()` y `guardar()` — nada de más |
| **DIP** | `server.js` arma todo con `new` (única raíz de composición) y lo inyecta por constructor a `PoderService` y `PoderController`; ellos nunca instancian sus dependencias. `tests/poderService.test.js` lo prueba inyectando un repositorio de juguete escrito a mano |
| **Patrones de diseño nombrados** | `Poder` + sus 6 hijos = **Strategy**; `PoderFactory` = **Factory Method** |

## Qué falta si querés seguir de acá

- Conectar esto con el frontend real (`game-online.js`) reemplazando la
  lógica local por llamadas `fetch` a `/api/poder/activar`.
- Sumar el módulo de **salas** (rooms) con WebSockets/Socket.io para el
  multijugador real por internet — es un proyecto aparte, no hace falta
  para este taller.
