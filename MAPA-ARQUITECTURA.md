# MAPA DE ARQUITECTURA — Memorice Duel (Ninja Memory)

> Cómo los principios de **Arquitectura de Software: De los Cimientos a la Nube** ya están implementados en este repositorio. Este documento es un mapa: qué concepto del temario vive en qué archivo, con rutas exactas.

---

## 0. Resumen ejecutivo

El repo NO es un solo monolito: contiene **varias arquitecturas completas y paralelas** que ya practican los principios modernos:

| Zona | Ruta | Estilo de módulo | Arquitectura |
|---|---|---|---|
| Backend de poderes (aprendizaje SOLID) | `backend-poderes/` | CommonJS (`require`) | Capas: entities → factories → repositories → services → controllers → routes |
| Núcleo del juego online (motor vivo) | `js/nucleo-GAME ONLI/` | ES modules | Composition root + Template Method + DIP |
| Capa de cuentas (login/registro) | `js/controladores/`, `js/core/`, `js/infraestructura/`, `js/servicios/`, `js/utils/` | ES modules | Capas SOLID puras en el frontend |
| Capa del menú | `js/domain/`, `js/infrastructure/`, `js/services/`, `js/ui/` | ES modules | DIP mínima (Repository + Services + 8 modales) |
| Clanes/aldeas (variantes del juego) | `js/{arena,roca,niebla,nube,akatsuki,hyuga,sarutobi,uchiha,uzumaki,muerte,orden}/` | ES modules | Mini-capas por clan (entities/services/controllers) |
| Navegación del mapa | `js/core-navegacion/` | ES modules | Configuración (datos) separada de la vista |

**Idea fuerza del temario ya cumplida aquí:** el software evolucionó de los scripts procedurales originales (`game-online.js` ~1560 líneas) a sistemas en capas, modificables y con dependencias invertidas, sin dejar de ser un frontend vanilla sin bundler.

---

## 1. MÓDULO 1 — Fundamentos y Capas

> *"El mesero, el jefe de cocina y el almacén."* Las tres capas requeridas existen duplicadas en frontend y backend.

### 1.1 Presentación (Frontend)

| Concepto | Dónde está |
|---|---|
| Páginas HTML (una por flujo) | `login.html`, `registro.html`, `verifivacion.html`, `recuperar.html`, `menu.html`, `pre-partida.html`, `niveles.html`, `game-online.html`, y una `{aldea}.html` por clan (`arena.html`, `sarutobi.html`, `muerte.html`, `orden.html`, etc.) |
| Controladores de presentación | `js/controladores/` (Login, Registro, Recuperacion, Verificacion, `FormularioControllerBase`), `js/ui/MenuController.js`, `js/{clan}/{Clan}Controller.js` |
| Helpers de UI (los que mencionó el prompt: "carpeta js.ui") | `js/ui/` (BaseModal + 8 modales del menú), `js/utils/ModalHelper.js`, `js/utils/TogglePasswordHelper.js` |
| Vista purificada del motor online (todo el DOM aislado) | `js/nucleo-GAME ONLI/vista/VistaPartida.js` |
| Render del tablero | `js/board-manager.js` (constante `ALDEA = "arena"` al inicio, línea ~18) |

### 1.2 Lógica de Negocio / Controlador (Backend Core)

Reglas **puras**, sin HTTP, sin HTML, sin SQL:

| Concepto | Dónde está |
|---|---|
| Reglas de activación de poderes (backend) | `backend-poderes/src/services/PoderService.js` |
| Entidades de dominio puras (backend) | `backend-poderes/src/entities/` (`Jugador.js`, `Partida.js`, `Tablero.js`, `poderes/*`) |
| Reglas de la partida online (frontend) | `js/nucleo-GAME ONLI/GestorPartida.js`, `GestorTurno.js`, `GestorTiempo.js`, `entidades/Personaje.js`, `poderes/*` |
| Reglas de cuentas (frontend) | `js/servicios/AutenticacionService.js`, `RegistroService.js`, `RecuperacionService.js`, `SesionService.js`, `VerificacionService.js` |
| Lógica de cada clan | `js/{clan}/services/{Carta,Juego,Puntaje,Tiempo}Service.js` (y `SecuenciaService` en `orden`) |

### 1.3 Base de Datos / Persistencia (Persistence)

| Concepto | Dónde está |
|---|---|
| Contrato de repositorio (interfaz) | `backend-poderes/src/repositories/PartidaRepository.js` |
| Implementación en memoria | `backend-poderes/src/repositories/PartidaRepositoryMemoria.js` |
| Implementación en archivos (JSON en disco) | `backend-poderes/src/repositories/PartidaRepositoryArchivo.js` → snapshots en `backend-poderes/data/*.json` (gitignored) |
| Persistencia frontend (localStorage) | `js/infraestructura/repositorios/LocalStorageUsuarioRepositorio.js`, `LocalStorageSesionRepositorio.js`, `js/infrastructure/LocalStorageRepository.js`, y los repositorios de clanes avanzados (`js/{hyuga,muerte,orden,sarutobi,uchiha,uzumaki}/repositories/`) |
| Datos simulados (en lugar de backend real) | `js/mock-server.js` (sala `NINJA-99`, jugadores Naruto/Sasuke) |

---

## 2. MÓDULO 2 — Corazón del Sistema (Lógica de Negocio)

> *Reglas puras aisladas de HTTP, HTML o SQL.* El temario usa el ejemplo **"Saldo insuficiente"** antes de una transacción:

```ts
if (cuenta.getSaldo() < monto + COMISION) {
    throw new Exception("Saldo insuficiente");
}
```

Ese patrón existe **literalmente** en el repo, pero con chakra en vez de saldo:

### 2.1 El equivalente "Saldo insuficiente" → "Chakra insuficiente"

| Ejemplo del temario | Equivalente real en el repo | Archivo |
|---|---|---|
| `cuenta.getSaldo()` | `jugador.chakra` (getter, campo privado `#chakra`) | `backend-poderes/src/entities/Jugador.js:24` y `js/nucleo-GAME ONLI/entidades/Personaje.js` |
| `monto + COMISION` | `poder.costoChakra` | `backend-poderes/src/entities/poderes/Poder.js` |
| `throw "Saldo insuficiente"` | `{ exito: false, motivo: "chakra_insuficiente" }` | `backend-poderes/src/services/PoderService.js:38-41` |

```js
// backend-poderes/src/services/PoderService.js:38-41
if (!jugador.tieneChakraPara(poder.costoChakra)) {
    partida.registrarEvento(`${jugador.nombre} intentó usar ${poder.nombre} sin chakra suficiente`);
    return { exito: false, motivo: "chakra_insuficiente" };
}
```

La validación ocurre en el **Servicio** (lógica pura), nunca en el controller HTTP ni en el DOM. El endpoint `POST /api/poder/activar` (`backend-poderes/src/routes/poderRoutes.js`) solo traduce JSON → servicio → JSON.

### 2.2 Aislamiento de las reglas (sin HTTP/HTML/SQL)

| Regla pura | Vive en | Prueba de pureza |
|---|---|---|
| `Jugador.gastarChakra()` / `recibirDanio()` / `estaDerrotado()` | `backend-poderes/src/entities/Jugador.js` | campos `#privados`, mutación solo vía métodos validados; cero imports de Express |
| `Poder.activar()` con esqueleto fijo (bloqueo → turno → usos → chakra → efecto) | `js/nucleo-GAME ONLI/poderes/Poder.js` | Template Method: los 6 poderes hijos solo implementan el efecto |
| `GestorTurno` (quién tiene el turno) | `js/nucleo-GAME ONLI/GestorTurno.js` | estado `#esTurnoDeSasuke` + observer `alCambiarTurno` |
| `ProveedorDatos` (DIP) | `js/nucleo-GAME ONLI/datos/ProveedorDatos.js` | la vista no conoce de dónde vienen los datos; `ProveedorDatosSimulado` envuelve `MockServer` |

**Ninguna de las entidades/servicios importa HTML, Express ni SQL.** El DOM solo aparece en la capa `vista/` y en los controllers.

---

## 3. Principios de Arquitectura Moderna presentes en el repo

### 3.1 SOLID

| Principio | Evidencia | Archivo clave |
|---|---|---|
| **S** (responsabilidad única) | Cada clase hace una cosa: `PoderController` traduce HTTP, `PoderService` orquesta, `Jugador` encapsula. El motor online pasó de 1 archivo de 1560 líneas a 15 clases. | `backend-poderes/src/controllers/PoderController.js`, `js/nucleo-GAME ONLI/*` |
| **O** (abierto/cerrado) | `PoderFactory.registrar()` agrega poderes sin tocar Service/Controller | `backend-poderes/src/factories/PoderFactory.js:43-45` |
| **L** (sustitución) | Una sola batería de contrato corre contra repo de memoria Y repo de archivo | `backend-poderes/tests/contratoPartidaRepository.js` + `partidaRepositoryMemoria.test.js` + `partidaRepositoryArchivo.test.js` |
| **I** (segregación) | `AutenticacionService` solo depende de `IUsuarioLector`; los repos definen solo `obtener(id)`/`guardar(id, partida)` | `js/core/interfaces/`, `backend-poderes/src/repositories/PartidaRepository.js` |
| **D** (inversión) | Dependencias inyectadas por constructor; clases dependen de interfaces | `backend-poderes/server.js:21-24` (composition root), `js/login.js`, `js/app.js`, `js/{clan}/{Clan}.js` |

### 3.2 Patrones de diseño

| Patrón | Dónde | Archivos |
|---|---|---|
| **Repository** | Contrato + 2 implementaciones intercambiables (memoria/archivo) y localStorage frontend | `backend-poderes/src/repositories/`, `js/infraestructura/repositorios/`, `js/infrastructure/LocalStorageRepository.js` |
| **Factory** | Crea instancias nuevas de poderes por id; permite registrar nuevos en caliente | `backend-poderes/src/factories/PoderFactory.js`, `js/nucleo-GAME ONLI/poderes/GestorPoderes.js` |
| **Strategy** | Jerarquía `Poder` + 6 hijos; `PoderService.activar` llama polimórficamente a `poder.activar()` | `backend-poderes/src/entities/poderes/Poder.js` |
| **Template Method** | `Poder.activar()` define el orden fijo de validaciones; hijos solo dan el efecto | `js/nucleo-GAME ONLI/poderes/Poder.js` |
| **Observer** | `GestorTurno` notifica `alCambiarTurno` | `js/nucleo-GAME ONLI/GestorTurno.js` |
| **Composition Root** | Único lugar con `new` de concretos (backend y ambos núcleos frontend) | `backend-poderes/server.js`, `js/nucleo-GAME ONLI/GestorPartida.js`, `js/{login,registro,recuperar,verificacion}.js`, `js/app.js` |

### 3.3 Proceso del temario: scripts → capas (git log view)

El `-files` en la raíz (dump de `git log`, 15 KB) muestra la evolución: primero el juego era procedural; hoy `js/game-online.js` quedó reducido a **19 líneas** que solo arrancan `GestorPartida`:

```js
// js/game-online.js (estado actual, completo)
import { GestorPartida } from "./nucleo-GAME ONLI/GestorPartida.js";
window.addEventListener("load", () => {
    const partida = new GestorPartida();
    partida.iniciar();
});
```

Mapeo completo `game-online.js` antiguo → clases nuevas: `js/nucleo-GAME ONLI/COMO-QUEDO-ORGANIZADO.md`.

---

## 4. Los dos "mismos" sistemas de poderes (NO confundir)

Existen **dos jerarquías de poderes independientes** que practican el mismo patrón:

| Aspecto | `backend-poderes/` (aprendizaje) | `js/nucleo-GAME ONLI/` (juego vivo) |
|---|---|---|
| Módulos | CommonJS | ES modules |
| Patrón de poderes | Strategy + hook `puedeSerContrarrestadoPor` | Template Method `activar()` |
| Factory | `PoderFactory` | `GestorPoderes` |
| Composition root | `server.js` | `GestorPartida` |
| Persistencia | Repos memoria/archivo con contrato test | `localStorage` / `MockServer` |
| Conectado al juego | NO (módulo aislado) | SÍ (`game-online.html` → `game-online.js` → `GestorPartida`) |

> ⚠️ **AGENTS.md está desactualizado aquí**: dice que `game-online.js` (~1562 líneas) sigue siendo el motor vivo y que `js/nucleo-GAME ONLI` "no está conectado al juego". **Ambas afirmaciones son falsas hoy** — el refactor SÍ corre en `game-online.html` (línea 253: `<script type="module" src="js/game-online.js">`).

---

## 5. Capa de cuentas: ejemplo completo de capas en el frontend

Flujo real (el "mesero → cocina → almacén" del temario, todo en el navegador):

```
verifivacion.html (Presentación)
        │
        ▼
js/verificacion.js ── composition root ──▶ new VerificacionController(...)
        │                                       │
        ▼                                       ▼
        └─▶ servicios/VerificacionService.js  (lógica pura: valida el código)
                │   │
                ├──▶ core/interfaces/ICodigoGenerador.js (abstracción)
                └──▶ infraestructura/generadores/CodigoNumericoGenerador.js (concreto)
                     infraestructura/notificadores/* / envios/EnvioCodigoModoPrueba.js (persistencia/envío)
```

Carpetas implicadas (las que mencionó el prompt como "js.ui"):
- **Presentación/UI:** `js/utils/ModalHelper.js`, `js/utils/TogglePasswordHelper.js`, `js/ui/*` (modales), `js/controladores/*`
- **Lógica:** `js/servicios/*`, `js/core/entities/Usuario.js`
- **Abstracciones:** `js/core/interfaces/*` (`IUsuarioLector`, `IUsuarioEscritor`, `ISesionRepositorio`, `INotificador`, `ICodigoGenerador`, `IEnviadorCodigo`)
- **Persistencia/adapters:** `js/infraestructura/repositorios/*`, `js/infraestructura/generadores/*`, `js/infraestructura/notificadores/*`, `js/infraestructura/envios/*`

---

## 6. Clanes: variantes del juego y su arquitectura

Cada aldea (`{clan}.html`) tiene su propia mini-arquitectura en `js/{clan}/`:

- **Básicos:** `akatsuki`, `arena`, `niebla`, `nube`, `roca` → solo `{Clan}.js` + `controllers/` + `entities/` (3) + `services/` (4).
- **Avanzados:** `hyuga`, `muerte`, `orden`, `sarutobi`, `uchiha`, `uzumaki` → además `interfaces/` (IPartidaRepository, IJugadorRepository) y `repositories/`.
- **Variantes con mecánicas propias:**
  - `js/muerte/` — torneo 2 jugadores, 9 niveles/aldeas, `CartaService.js` (391 líneas, define todas las barajas), `MuerteController.js` (~1009 líneas, el más largo del grupo).
  - `js/orden/` — juego de secuencia (sin cartas): `SecuenciaService.js`, `Partida` con `ronda`/`secuencia`/`respuestaJugador`.
- Prueba de que aún hay deuda: `arena` y `uzumaki` son casi el mismo código (misma estructura, distinta ruta de assets y tiempo 60 vs 300), y varios `JugadorRepository.js` de clanes avanzados están **vacíos (0 bytes)**.

Consultar también: `js/COMO-INTEGRAR-NAVEGACION.md` (refactor de `niveles.js`/`pre-partida.js` → `js/core-navegacion/`) y `diagramas/auth-clases.md` / `diagramas/muerte-clases.md`.

---

## 7. Bugs conocidos y deuda técnica (relevantes para "los cimientos")

1. **`tieneSustitucionActiva` — rama muerta (backend).** `BombaPoder.js:14` comprueba `rival.tieneSustitucionActiva === true`, pero `Jugador` nunca define esa propiedad → la Bomba siempre resta 20 (el "−10" nunca ocurre). Tampoco `SustitucionPoder` la marca.
2. **`PartidaRepositoryArchivo` escribe a disco pero lee de caché.** Tras reiniciar el servidor, `obtener(id)` devuelve `null` aunque exista el `.json` (`PartidaRepositoryArchivo.js:55-58`).
3. **`usosPermitidos` definido y nunca aplicado.** `Poder.js` lo guarda, pero ningún service lo cuenta ni limita.
4. **Repositorios de clanes avanzados = scaffold muerto.** Ningún controller importa sus `repositories/`; solo `muerte` y `orden` tienen `JugadorRepository.js` con contenido.
5. **Mezcla de idiomas:** capa de cuentas y clanes en español; `js/domain|services|ui|infrastructure` del menú en inglés. `verifivacion.html` es un nombre real (con errata).
6. **El backend no está conectado al frontend** (el juego usa `mock-server.js`); conectarlo vía `fetch` + salas WebSocket es el trabajo futuro citado en `backend-poderes/README.md`.

---

## Anexo A — Tabla índice rápida por archivo

| Quieres ver… | Abre |
|---|---|
| Las 3 capas en un solo proyecto chico y testado | `backend-poderes/` (lea su `README.md` + `diagramas/*.mermaid`) |
| Reglas puras aisladas de HTTP/DOM | `backend-poderes/src/services/PoderService.js`, `js/nucleo-GAME ONLI/poderes/Poder.js` |
| El ejemplo "saldo/chakra insuficiente" | `backend-poderes/src/services/PoderService.js:38-41` |
| Composition root | `backend-poderes/server.js`, `js/nucleo-GAME ONLI/GestorPartida.js`, `js/login.js`, `js/app.js` |
| Prueba de LSP (contrato único, 2 implementaciones) | `backend-poderes/tests/` → `npm test` desde `backend-poderes/` (35 tests / 10 suites) |
| Abstracciones/interfaces | `backend-poderes/src/repositories/PartidaRepository.js`, `js/core/interfaces/`, `js/domain/` |
| UI / filas "js.ui" | `js/ui/`, `js/utils/ModalHelper.js`, `js/utils/TogglePasswordHelper.js`, `js/controladores/` |
| Cómo el motor viejo se reorganizó en clases | `js/nucleo-GAME ONLI/COMO-QUEDO-ORGANIZADO.md` |