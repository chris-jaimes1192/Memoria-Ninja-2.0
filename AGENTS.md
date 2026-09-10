# AGENTS.md — Memorice Duel (Ninja Memory)

## What this is

Naruto-themed memory card game. Spanish UI and code comments throughout.
No build system, no bundler, no linter, no CI — vanilla HTML/CSS/JS frontend, Node.js + Express backend.

## Repository structure

- **Root**: static frontend (HTML pages + `js/` + `css/` + `assets/`). Each page = one HTML + one CSS + one JS file.
- **`backend-poderes/`**: Separate Node.js app for the powers system. Has its own `package.json`.
- **`Agrupar/`**: Legacy/prototype version of the game — do not modify unless explicitly asked.
- **`-files`**: Git log dump, not a real source file.

## Frontend (root)

- Entry flow: `login.html` → `menu.html` → `game-online.html`
- State is stored in `localStorage` (user session, player names, game history, difficulty level)
- `js/mock-server.js` provides fake game data for the frontend; the real backend is not yet wired in
- Modular JS files use ES module syntax (`export`/`import`) in some files (mock-server, ui-manager) but not others — inconsistent pattern
- Card images are in `assets/img/cards/aldeas/{village}/` — village names: arena, konoha (hyuga, sarutobi, uchiha, uzumaki), niebla, nube, roca, otros
- `js/board-manager.js` has the core board rendering logic; `ALDEA` variable at top controls which village's cards are shown

## Backend (`backend-poderes/`)

```bash
cd backend-poderes
npm install
npm start          # runs on http://localhost:3000
npm test           # runs Node built-in test runner (--test), 35 tests in 5 files
```

- Architecture: layered (entities → factories → repositories → services → controllers → routes)
- `server.js` is the **composition root** — only place where concrete implementations are instantiated with `new`
- 6 powers: byakugan, sustitucion, robo, genjutsu, sello, bomba
- Two repository implementations: `PartidaRepositoryMemoria` (in-memory) and `PartidaRepositoryArchivo` (file-based) — both pass the same contract tests (LSP proof)
- Tests are contract-based: same test battery runs against multiple implementations

## Testing

- **Backend only** — there are no frontend tests
- Run from `backend-poderes/` directory: `npm test`
- Test files: `contratoPartidaRepository.js`, `contratoPoder.test.js`, `poderService.test.js`, plus one per repository implementation

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

- No `package.json` at root — root `package-lock.json` is empty
- Frontend has no dev server — open HTML files directly or use a static file server
- Some JS files use ES modules, some don't — check each file's import style before adding code
- The backend is not connected to the frontend yet (TODO noted in backend README)
- Variable/function names mix Spanish and English
- `game-online.js` is ~1560 lines — the largest and most complex file in the project
