# Plan de desarrollo — Memorice Duel (Memoria Ninja)

> Documento vivo. Órdenes: `[ ]` pendiente · `[~]` en progreso · `[x]` hecho · `[!]` bloqueado.
> Orden recomendado: 1 → 2 → 3 → 4 → 6 → 5 → 7.

## Reglas de trabajo
- Cada parte o es **100% real** o queda **claramente marcada como simulada**. Nunca mostrar mock como real.
- Una parte se marca `[x]` solo con: código + integración + tests verdes (`npm test`) + docs.

## Protocolo obligatorio ANTES de cada parte
Toda parte sigue estos 5 pasos; no se implementa nada sin cerrar el paso 1.
1. **Revisión previa (auditoría):** releer el estado real del código de esa parte y escribir, en la
   sección "Revisión previa" de abajo, qué EXISTE, qué FALTA y qué NO se tuvo en cuenta.
2. **Plan de aplicación:** listar los archivos exactos a tocar y cómo (con números de línea).
3. **Implementación.**
4. **Verificación:** correr tests + prueba manual del flujo.
5. **Cierre:** marcar `[x]`, anotar fecha y notas en el Registro de avance.

> Al empezar cada parte, revisar esta lista buscando huecos: dependencias, variables de entorno,
> permisos, rutas absolutas, páginas que consumen el endpoint, tests que pueden romperse,
> y datos/config que hagan falta (secretos, dominio, etc.).

---

## Estado base (ya hecho antes de este plan)
- [x] Backend PostgreSQL (7 tablas, 6 vistas, 5 triggers, 8 objetos propios: 5 funciones + 3 procedimientos) + `sql/esquema.sql`.
  > Nota (2026-10-17): el resumen de `npm run db:setup` imprime `funciones_procs: 90` porque cuenta
  > TODO `pg_proc` de `public`: incluye 68 funciones de extensiones (`pgcrypto`, `citext`) y 14
  > built-ins de PostgreSQL 18 (`regexp_*`, `replace`, `split_part`…). Los objetos REALES del
  > proyecto son **8** (5 funciones + 3 procedimientos), tal como aparecen en `sql/esquema.sql`.
- [x] Auth real: registro, login (cookie httpOnly), verificación, recuperación (scrypt/sha256).
- [x] Seed demo (`npm run seed:demo`) + `sql/datos-simulados.sql` + `sql/consultas-demo.sql`.
- [x] pgAdmin reparado. Docs en español. Tests: 98/98 verdes (22 suites).

---

## Parte 1 — Correo SMTP profesional (Gmail) · Estado: COMPLETA ✅
**Objetivo:** que los códigos lleguen a correos reales.
**Revisión previa (qué revisar antes de empezar):**
- [x] Confirmado `nodemailer` ^10.1.0 instalado e interfaz `enviar({para, asunto, texto, html})`.
- [x] Revisado quién llama al notificador (VerificacionService:51, RecuperacionService:48).
- [x] Revisado `server.js` (:21-22 import, :74-78 selección) y `authE2e.test.js` (MAILER=consola → texto `es: 123456` intacto).
- [x] Decisiones: se soporta 465 (`secure:true`) y 587; `SMTP_SERVICE=gmail` opcional; `SMTP_FROM` configurable.
- [x] Pre-requisito usuario: 2FA + App Password de Gmail (creada "Memoria Ninja").
**Cómo se aplicará:**
- Nuevo `src/infraestructura/SmtpNotificadorCorreo.js`; selección en `server.js` con *fail-fast*;
  `.env.example` ampliado; test con transporte *stub*; fix del `README.md`.
**Tareas:**
- [x] Crear `SmtpNotificadorCorreo.js` (transporte perezoso, HTML + texto, `SMTP_FROM`, transporte inyectable).
- [x] Añadir `src/utils/plantillaCorreo.js` (plantilla HTML única) y usarla en ambos servicios.
- [x] `server.js`: `MAILER=smtp|ethereal|consola` + error claro si faltan `SMTP_*` (verificado: falla al arrancar con exit 1).
- [x] `.env.example`: `SMTP_SERVICE`, `SMTP_SECURE`, `SMTP_FROM` + notas Gmail.
- [x] `.env` real con Gmail (usuario + app password cargados). No se sube al repo.
- [x] Test unitario `tests/smtpNotificadorCorreo.test.js` (7 casos, sin red) + `npm test` verde (98/98).
- [x] Corregir afirmación falsa del `README.md` y `backend-poderes/README.md`.
- [x] `scripts/probar-correo.js` + `npm run correo:probar` (envío real de prueba).
**Verificación:** `npm run correo:probar` → correo recibido y confirmado por el usuario. ✅
**Riesgos / a confirmar:** Spam / límite ~500 correos/día de Gmail; entregabilidad.
**Pendiente de seguridad:** rotar la contraseña de aplicación (quedó expuesta en el chat).
**Mejora futura:** usar un Gmail propio del juego o un proveedor transaccional (Resend/Brevo).

## Parte 2 — Sesión real + "web normal" · Estado: COMPLETA ✅
**Objetivo:** que la sesión se valide de verdad contra el servidor y el logout sea real.
**Modelo de 3 estados (decidido con el usuario):**
- **200 (sesión válida):** modo normal (acceso completo).
- **401 (online, sin sesión):** **invitado** → se puede jugar; menú limitado (perfil/ranking/historial piden login con un cartel).
- **Fallo de red (servidor caído):** **invitado/offline** → se puede jugar, guardado local (como hoy) y aviso "sin conexión".
- **No se bloquea el juego.** `login.html` se deja igual (no redirige).
**Revisión previa:**
- [x] Inventariadas las páginas HTML (16 que requieren sesión: menu, niveles, pre-partida + 13 de juego).
- [x] Verificado que hoy el usuario se lee de `localStorage["usuarioActivo"]` (LoginController:46; menu.js:16; HttpHistorialRepositorio:30).
- [x] Revisado `AuthController.js` (cookie `secure:false`, `sameSite:lax`) y `GET /api/auth/me` (existía, nadie lo usaba) y `POST /api/auth/logout`.
- [x] Decidido: guard **en el cliente** (no redirige en juego; limita menú). El middleware de servidor es Parte 4.
**Cómo se aplicará:** `js/sesion-guard.js` (script clásico) consulta `/api/auth/me`, refresca el snapshot local y marca estado; el menú reacciona.
**Tareas:**
- [x] Crear `js/sesion-guard.js` (3 estados; nunca redirige en juego).
- [x] Incluir el guard en `menu.html` y en las páginas de juego (refresca usuario).
- [x] Cartel de invitado en el menú ("Inicia sesión para guardar tu progreso y ver el ranking").
- [x] Limitar perfil/ranking/historial en modo invitado/offline.
- [x] Logout real vía `POST /api/auth/logout` (menu.js y GameSessionService).
- [x] Botón **"Jugar como invitado"** en `login.html`: faltaba la PUERTA DE ENTRADA al estado invitado
  (el guard ya sabía marcar `estadoSesion="invitado"` con 401, pero no había forma de elegirlo desde el login).
  Cierra cualquier sesión previa (best-effort), marca `estadoSesion="invitado"` y va al menú.
  Archivos: `login.html` (botón), `js/login.js` (`jugarComoInvitado`), `css/style.css` (`.btn-invitado`).
**Bloqueo detectado (prueba en navegador):** el CSP por defecto de `helmet()` (`script-src-attr 'none'`) bloqueaba los `onclick` inline → login/registro/recuperar/logout no respondían al servir desde el backend.
**Resuelto (Opción A):** se quitaron todos los `onclick`/`onerror` inline del frontend y se conectaron por `addEventListener` (login, registro, recuperar, pre-partida, menu). El simulador de `pre-partida` ya no llama a `actualizarClan` (no existía) y ahora usa el controller; el `<script>` inline de `objetos-postgresql-final.html` se movió a `js/objetos-postgresql-final.js`. Solo queda `Agrupar/facil.html` con inline (legado, no se toca).
**Verificación (2026-10-17, navegador real + PostgreSQL):** el usuario registró una cuenta, recibió y confirmó el **código por correo real (Gmail)**, inició sesión y cerró sesión. Comprobado además por HTTP:
login demo (`kakashi`/`clave123`) → **200** con perfil; `GET /api/auth/me` con cookie → **200**; sin cookie → **401** (estado `invitado`); `POST /api/auth/logout` → **200** y `me` → **401**; `/api/vistas/ranking` → datos reales.
Backend servido en `http://localhost:3000` (Live Server de VS Code **apagado**, que era la causa del "error en el servidor" al registrar). Tests 98/98.
**Pendiente menor:** el usuario aún debe probar los escenarios visuales de invitado (con el nuevo botón) y offline (apagar el servidor y recargar).
**Depende de:** nada. **Habilita:** Parte 3 (ranking/historial reales).

## Parte 3 — Datos reales · Estado: EN PROGRESO 🚧
**Objetivo:** ranking, historial y perfil con datos del backend; sin mocks ni rutas absolutas.

### Revisión previa (auditoría — paso 1) · 2026-10-17

**Qué EXISTE (verificado en el código):**
- **Endpoints de vistas ya implementados y probados** (nadie los usa desde el frontend):
  `backend-poderes/src/routes/vistaRoutes.js:14-17` → `VistaController` → `VistaService` → `VistaRepositorySQL`.
  Formas de respuesta (`VistaController.js:13-46`):
  - `GET /api/vistas/ranking` → `{ exito, ranking: [{ id_usuario, usuario, mejor_puntaje, total_partidas, ultima_jugada }] }`
  - `GET /api/vistas/historial-detallado` → `{ exito, historial: [{ id, id_usuario, usuario, id_partida, zona, puntaje, modo, ganador, jugada_en }] }`
  - `GET /api/vistas/partidas-recientes` → `{ exito, partidas: [...] }`
  - `GET /api/vistas/usuarios-resumen` → `{ exito, usuarios: [...] }`
- **Historial por usuario ya implementado y usado**: `GET/POST /api/usuarios/:id/historial`
  (consumido por `js/infraestructura/repositorios/HttpHistorialRepositorio.js:37-71`, instancia `historialApi`).
- **Perfil XP ya real**: `GET/POST /api/usuarios/:id/perfil` + `js/services/progresoService.js` (Parte 2).
- **Modales de UI ya cableados** en `js/app.js:35-60` e instanciados por `js/ui/MenuController.js`.
- **Vistas SQL** (`sql/esquema.sql:372-401`): `vw_ranking_mejor_puntaje` (usuario, mejor_puntaje, total_partidas,
  ultima_jugada — **no** trae xp ni nivel) y `vw_historial_detallado` (zona, puntaje, modo, ganador, jugada_en).

**Qué FALTA (el objetivo real de esta parte):**
- `js/ui/RankingModal.js:8-11` es un **stub**: `cargarRanking()` solo abre el modal, NO hace `fetch`.
  El ranking del menú está **hardcodeado** en `menu.html:243-318` (7 filas: Itachi 3250 … Gaara 2200, con NIVEL/XP inventados).
- `js/ui/HistoryModal.js:8-17` tiene **datos falsos hardcodeados** en el constructor
  (`this.partidas.normales` con 4 filas del 12/05/2024); NO consulta el backend.
- `js/menu.js:7,82` usa `#recordsList` / `actualizarHistorial()` con `historialApi`, pero `#recordsList`
  **no existe** en `menu.html` → retorno temprano: **código muerto**.
- **Ping**: `js/menu.js:161,163-167` (`pingSimulado`/`simularPing()` = mock) y `menu.html:589` (texto fijo `45ms`).
- **Multijugador**: salas hardcodeadas en `menu.html:161-208` ("Itachi969", "Sasukexd"…) y
  `js/menu.js:114-117` redirige `#btnFilaItachi` a `game-online.html` (hardcode).
- **URLs absolutas** `http://localhost:3000/api` en **4 archivos**:
  `js/infraestructura/repositorios/HttpHistorialRepositorio.js:21`,
  `js/infraestructura/repositorios/HttpPerfilRepositorio.js:24`,
  `js/nucleo-GAME ONLI/datos/ProveedorDatosServidor.js:3`,
  `js/menu.js:172`.
- `mod.html` (huérfana) tiene ping `45ms` fijo.
- **Merge invitado→cuenta**: no existe nada (ni endpoint de "enlazar" ni lógica en el login).

**Qué NO se tuvo en cuenta (hallazgos):**
1. La vista de ranking **no trae xp ni nivel**, pero la tabla del menú tiene columnas NIVEL y XP. Hay que
   decidir el mapeo (ver decisiones abajo).
2. Hay **dos** mecanismos de historial: el muerto (`menu.js` + `#recordsList`) y el real (`HistoryModal`
   + `#historialBody`). Se usará `HistoryModal` y se eliminará el código muerto.
3. El botón de ranking llama a `estaBloqueado('ver el ranking')` (`MenuController.js:63-66`), así que
   en invitado/offline el modal ni se abre: el ranking real solo aplica a sesión activa (correcto).
4. **No hay tests de frontend** (regla del proyecto) → la verificación de esta parte es HTTP + manual.
5. "Merge invitado→cuenta" es una **funcionalidad nueva y grande** (formato del historial local del
   invitado + endpoint de enlace). El `AGENTS.md` la sitúa entre Partes 3 y 7. Se implementa aparte,
   como sub-parte 3.5, para no mezclarla con lo visual.

### Plan de aplicación (paso 2) — archivos y líneas exactas

1. **URLs relativas** (4 archivos, 1 línea cada uno → `/api`):
   - `js/infraestructura/repositorios/HttpHistorialRepositorio.js:21`
   - `js/infraestructura/repositorios/HttpPerfilRepositorio.js:24`
   - `js/nucleo-GAME ONLI/datos/ProveedorDatosServidor.js:3`
   - `js/menu.js:172` (dentro de `medirPingReal`)
2. **Ranking real**:
   - `menu.html:243-318`: envolver las 7 filas en `<div id="rankingBody">` (el header `:236-241` se mantiene).
   - `js/ui/RankingModal.js`: `cargarRanking()` → `fetch('/api/vistas/ranking')`; render dinámico en `#rankingBody`;
     estado "cargando"/vacío/error. Mapeo de columnas decidido: **# = posición**, **JUGADOR = usuario**,
     **NIVEL → "PARTIDAS" = total_partidas**, **XP → "MEJOR PUNTAJE" = mejor_puntaje** (cabeceras `menu.html:239-240`
     renombradas). Podio (oro/plata/bronce) reutiliza `.badge-rank`.
3. **Historial real**:
   - `js/ui/HistoryModal.js`: quitar `this.partidas` hardcodeado; en `abrir()` leer
     `historialApi.obtener(idUsuario)` de `localStorage['usuarioActivo']`; mapear a
     `{resultado (ganador===usuario ? victoria : derrota), modo, puntaje, fecha, hora}` y reusar `renderTabla`.
     Tabs "online"/"sala" quedan vacíos reales (Parte 5). Invitado/offline → mensaje "inicia sesión".
   - `js/menu.js:7,13-54,82`: eliminar el mecanismo muerto `#recordsList`/`actualizarHistorial`/`renderHistorial`.
4. **Quitar hardcodeos / mocks**:
   - Ping: `menu.html:589` → `Ping: <span id="pingValor">--</span>`; `js/menu.js:161-167,182-187` →
     sin `simularPing`; si el server no responde mostrar `--` (no un número falso). `menu.js:172` ya queda relativo.
   - Multijugador: `menu.html:161-208` → reemplazar las 7 salas falsas por un estado real
     ("No hay salas disponibles — el multijugador online llega en la Parte 5"). Quitar `menu.js:114-117`
     (`#btnFilaItachi`) y `js/menu.js:99-112` (listener de salas falsas).
   - `mod.html`: se deja como huérfana documentada (se trata en la Parte 6); no se toca aquí.
5. **Sub-parte 3.5 — Merge invitado→cuenta** (por separado, requiere endpoint nuevo): marcar como
   pendiente explícita con su propia revisión previa antes de tocar código.

**Verificación:** tests 98/98 verdes + prueba HTTP de `/api/vistas/ranking` y `/api/usuarios/:id/historial`
+ prueba manual en `http://localhost:3000/menu.html` con sesión demo (`kakashi`/`clave123`).

**Tareas:**
- [x] URLs relativas `/api` en los 4 archivos detectados.
      (`HttpHistorialRepositorio.js`, `HttpPerfilRepositorio.js`, `ProveedorDatosServidor.js`, `menu.js:172`.)
- [x] Ranking con `/api/vistas/ranking`. (`RankingModal.js` real + `#rankingBody` + cabeceras PARTIDAS/MEJOR PUNTAJE.)
- [x] Historial desde backend. (`HistoryModal.js` lee `/api/usuarios/:id/historial` vía `historialApi`.)
- [x] Quitar hardcodeos/mocks (ranking hardcodeado, salas "Itachi969" → estado vacío,
      ping "45ms" → real/`--`, `simularPing` eliminado, código muerto `#recordsList` eliminado).
      `mod.html` queda como huérfana para la Parte 6 (documentado).
- [ ] **Sub-parte 3.5 — Merge invitado→cuenta** (apartado propio, pendiente).
**Verificación (2026-10-17):** tests 98/98 ✅; `GET /api/estado` y `GET /api/vistas/ranking` devuelven
datos reales; frontend servido confirma las nuevas marcas (`rankingBody`, `PARTIDAS`, `salas-vacio`,
`/api/estado` relativo, sin `localhost:3000`/`simularPing`/`Itachi969`). Falta prueba visual del usuario
en `http://localhost:3000/menu.html` con sesión demo (`kakashi`/`clave123`).

## Parte 4 — Endurecer backend · Estado: PENDIENTE
**Objetivo:** proteger endpoints y preparar para producción.
**Revisión previa:**
- [x] Los `onclick`/`onerror` inline ya se eliminaron (Parte 2) → el CSP de `helmet()` ya no rompe la UI.
- [ ] Revisar qué endpoints son públicos y cuáles deberían exigir sesión.
- [ ] Confirmar que hoy NO hay middleware de auth (`router.use` no existe).
- [ ] Ver CORS (refleja cualquier origen) y cookie `secure:false`.
**Tareas:**
- [ ] Middleware de autenticación + proteger `/api/usuarios/:id/*` y `/api/poder/activar`.
- [ ] CORS restringido.
- [ ] Cookie `secure` en producción + HTTPS.
**Verificación:** endpoints protegidos → 401 sin sesión; tests actualizados.
**Riesgos:** puede romper tests/flujo frontend → revisar antes de aplicar.

## Parte 5 — Multijugador online real (WebSockets) · Estado: PENDIENTE
**Objetivo:** dos jugadores en tiempo real (hoy es simulación local).
**Revisión previa:**
- [ ] Revisar `js/nucleo-GAME ONLI/datos/ProveedorDatosServidor.js` y su fallback simulado.
- [ ] Decidir Socket.io vs WebSocket nativo; ver si hace falta persistir salas en la BD.
- [ ] Ver `TwoPlayersModal.js` (crear/unir sala por código) para reutilizar la UI.
**Tareas:**
- [ ] Servidor de salas + WebSockets.
- [ ] Sincronización de turnos/estado entre dos clientes.
**Verificación:** dos PCs juegan la misma partida.
**Riesgos:** es la parte más grande; "proyecto aparte".

## Parte 6 — Pulido y despliegue · Estado: PENDIENTE
**Revisión previa:**
- [ ] Confirmar navegación rota: `menu.js:71` → `game.html` (no existe) y `#levelBtn` ausente en `menu.html`.
  > Corregido (2026-10-17): `pre-partida.html:69` es el `<nav class="bottom-nav">` y **NO** apunta a `game.html`;
  > `js/pre-partida.js:69` va a `menu.html` (correcto).
- [ ] Listar páginas huérfanas (`loading.html`, `mod.html`).
- [ ] Decidir hosting/dominio (para HTTPS y `MAILER` real).
**Tareas:**
- [ ] Arreglar navegación rota y botón NIVELES.
- [ ] Páginas huérfanas (`loading.html`, `mod.html`).
- [ ] Afinar qué ve el invitado en el menú (UX fina).
- [ ] Accesibilidad (WCAG 2.2).
- [ ] Desplegar el juego.

## Parte 7 — Modo offline y sincronización · Estado: PENDIENTE
**Objetivo:** que lo jugado sin conexión no se pierda y se suba al reconectar (patrón "offline-first").
**Revisión previa:**
- [ ] Revisar el fallback local de `historialApi.guardar()` y `progresoService` (best-effort).
- [ ] Definir una cola local de resultados pendientes (por usuario/dispositivo).
- [ ] Ver qué datos hacen falta para reconciliar sin duplicar (id de partida, fecha).
**Tareas:**
- [ ] Cola local de partidas/puntos no enviados.
- [ ] Reintento/sincronización automática al volver la conexión.
- [ ] Evitar duplicados al sincronizar.
**Verificación:** jugar offline, reconectar y ver los resultados reflejados en el ranking/historial.
**Nota:** marcado como mejora futura por el usuario; va al final.
**Depende de:** Partes 2 y 3.

---

## Registro de avance (actualizar al cerrar cada parte)
| Parte | Estado | Fecha | Notas |
|---|---|---|---|
| 1. Correo SMTP | Completada | 2026-10-12 | SMTP Gmail funcionando + tests 98/98. Reverificado con correo real el 2026-10-17 (app password nueva). Pendiente: cuenta/proveedor propio |
| 2. Sesión real | Completada | 2026-10-17 | Verificado en navegador real: registro + verificación por correo Gmail real + login + logout contra PostgreSQL. Añadido botón "Jugar como invitado". Tests 98/98 |
| 3. Datos reales | En progreso (4/5) | 2026-10-17 | Ranking/historial reales, URLs relativas y mocks eliminados. Tests 98/98. Pendiente: merge invitado→cuenta (sub-parte 3.5) y prueba visual |
| 4. Endurecer backend | Pendiente | | |
| 5. Multijugador online | Pendiente | | |
| 6. Pulido/despliegue | Pendiente | | |
| 7. Offline/sincronización | Pendiente | | Mejora futura (offline-first + merge invitado) |
