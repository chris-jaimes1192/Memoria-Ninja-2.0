# AGENTS.md — Memorice Duel (Ninja Memory)

## What this is

Naruto-themed memory card game. Spanish UI and code comments throughout.
No build system, no bundler, no linter, no CI — vanilla HTML/CSS/JS frontend, Node.js + Express backend.

## Repository structure

- **Root**: static frontend (HTML pages + `js/` + `css/` + `assets/`). Each page = one HTML + one CSS + one JS file.
- **`backend-poderes/`**: Separate Node.js app for the powers system. Has its own `package.json`.
- **`Agrupar/`**: Legacy/prototype version of the game — do not modify unless explicitly asked.
- **`-files`**: Git log dump (15KB text file), not a real source file.
- **`README.md` (root)** is a broken placeholder (`# MEMORIA-NINJA-1111` repeated) — do not treat it as a source of truth.

## Frontend (root)

- Entry flow: `login.html` → `menu.html` → `game-online.html`
- State is stored in `localStorage` (user session, player names, game history, difficulty level)
- `js/mock-server.js` provides fake game data for the frontend; the real backend is not yet wired in
- Card images are in `assets/img/cards/aldeas/{village}/` — village names: arena, konoha (hyuga, sarutobi, uchiha, uzumaki), niebla, nube, roca, otros
- `js/board-manager.js` has the core board rendering logic; `ALDEA` variable at top controls which village's cards are shown
- `js/game-online.js` is ~1560 lines and still the live game engine (largest file in the project)

### `js/` layered modules (auth + account flows)

`js/` also contains a small layered architecture mirroring the backend's SOLID style:

- `controladores/` — `LoginController`, `RegistroController`, `RecuperacionController`, `VerificacionController`, `FormularioControllerBase`
- `core/` — `entities/Usuario.js` + `interfaces/` (`ICodigoGenerador`, `INotificador`, `IUsuarioRepositorio`)
- `infraestructura/` — `repositorios/LocalStorageUsuarioRepositorio`, `generadores/` (alphanumeric + numeric codes), `notificadores/` (DOM alert + message)
- `servicios/` — `AutenticacionService`, `RegistroService`, `RecuperacionService`, `SesionService`, `VerificacionService`
- `utils/` — `ModalHelper`, `TogglePasswordHelper`

These are ES modules on some files (`import`/`export`), CommonJS-style `require` might not work — check each file's module style.

### Duplicate powers system (`js/nucleo-GAME ONLI/`)

- Folder name **contains spaces**: `js/nucleo-GAME ONLI/` — use quotes or `-LiteralPath` in shell commands, and be careful in import paths.
- Contains a SECOND, full powers implementation (Template Method): `poderes/Poder.js`, the 6 power classes, `GestorPoderes.js`, plus `GestorPartida.js` (composition root), `GestorTurno.js`, `GestorTiempo.js`, `entidades/Personaje.js`, `datos/ProveedorDatos*.js`, `vista/VistaPartida.js`
- This is a proposed refactor of `game-online.js` — **NOT wired into the running game**. `game-online.js` (still 1562 lines) remains the live engine. Don't confuse the two or edit them interchangeably.
- `COMO-QUEDO-ORGANIZADO.md` inside the folder maps old `game-online.js` code to the new classes.
- There's a 0-byte junk file `{entidades,poderes,datos,vista}` in the folder (broken brace-expansion), safe to ignore.

## Backend (`backend-poderes/`)

```bash
cd backend-poderes
npm install
npm start          # runs on http://localhost:3000
npm test           # Node built-in test runner (--test): 35 tests, 10 suites, all green
```

- Architecture: layered (entities → factories → repositories → services → controllers → routes)
- `server.js` is the **composition root** — only place where concrete implementations are instantiated with `new`
- 6 powers: byakugan, sustitucion, robo, genjutsu, sello, bomba
- Two repository implementations: `PartidaRepositoryMemoria` (in-memory) and `PartidaRepositoryArchivo` (file-based) — both pass the same contract tests (LSP proof)
- Tests are contract-based: same test battery runs against multiple implementations
- `PartidaRepositoryArchivo` writes a JSON snapshot per partida to `backend-poderes/data/` (gitignored via `data/*.json`), but **reads come from an in-memory cache**, not from disk — saved partidas return `null` after a server restart
- Known dead-code bug: `BombaPoder.activar()` checks `rival.tieneSustitucionActiva === true`, but `Jugador` never sets that property — the "−10 if Sustitución active" branch never runs
- `Poder.usosPermitidos` is defined in the base class but never enforced anywhere

## Testing

- **Backend only** — there are no frontend tests
- Run from `backend-poderes/` directory: `npm test`
- Test files: `contratoPartidaRepository.js`, `contratoPoder.test.js`, `poderService.test.js`, plus one per repository implementation
- Running tests creates real fixture data under `backend-poderes/data/` only when the file repository is exercised by tests

## Installed Skills (Autoskills)

Four specialized skills are installed and should be loaded via the `skill` tool when relevant tasks arise:

| Skill | When to apply |
|---|---|
| `nodejs-backend-patterns` | Building or modifying Express routes, controllers, middleware, error handling, or API design in `backend-poderes/` |
| `nodejs-best-practices` | Architectural decisions in the backend — async patterns, security, module structure, framework choices |
| `frontend-design` | Creating or redesigning UI components, pages, or visual elements in the frontend (`*.html`, `css/`, `js/` with DOM manipulation) |
| `accessibility` | Auditing or improving WCAG 2.2 compliance, screen reader support, keyboard navigation, or ARIA usage in any HTML page |

### Rules

- Always load the relevant skill **before** starting work on the task, not after.
- For backend tasks, load **both** `nodejs-backend-patterns` and `nodejs-best-practices` if the task touches architecture *and* implementation.
- For frontend visual work, load `frontend-design` first; if the page also needs a11y fixes, follow up with `accessibility`.
- Skills provide context-specific guidance — follow their recommendations over general defaults.

## Gotchas

- No `package.json` at root — root `package-lock.json` is empty (`"packages": {}`)
- Frontend has no dev server — open HTML files directly or use a static file server
- Some JS files use ES modules, some don't — check each file's module style before adding code
- The backend is not connected to the frontend yet (TODO noted in backend README)
- Variable/function names mix Spanish and English; `verifivacion.html` is a real (misspelled) filename
- `js/nucleo-GAME ONLI/` folder has a space in its name — quotes/`-LiteralPath` required in shell commands