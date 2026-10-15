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
- [x] Backend PostgreSQL (7 tablas, 6 vistas, 5 triggers, 90 funcs) + `sql/esquema.sql`.
- [x] Auth real: registro, login (cookie httpOnly), verificación, recuperación (scrypt/sha256).
- [x] Seed demo (`npm run seed:demo`) + `sql/datos-simulados.sql` + `sql/consultas-demo.sql`.
- [x] pgAdmin reparado. Docs en español. Tests: 91/91 verdes.

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

## Parte 2 — Sesión real + "web normal" · Estado: EN VERIFICACIÓN (código listo; falta prueba manual en navegador)
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
**Bloqueo detectado (prueba en navegador):** el CSP por defecto de `helmet()` (`script-src-attr 'none'`) bloqueaba los `onclick` inline → login/registro/recuperar/logout no respondían al servir desde el backend.
**Resuelto (Opción A):** se quitaron todos los `onclick`/`onerror` inline del frontend y se conectaron por `addEventListener` (login, registro, recuperar, pre-partida, menu). El simulador de `pre-partida` ya no llama a `actualizarClan` (no existía) y ahora usa el controller; el `<script>` inline de `objetos-postgresql-final.html` se movió a `js/objetos-postgresql-final.js`. Solo queda `Agrupar/facil.html` con inline (legado, no se toca).
**Verificación:** logueado → menú completo; logout → cookie revocada (`/auth/me` 401); sin sesión → juego sí, menú limitado; servidor apagado → offline jugable.
**Depende de:** nada. **Habilita:** Parte 3 (ranking/historial reales).

## Parte 3 — Datos reales · Estado: PENDIENTE
**Objetivo:** ranking, historial y perfil con datos del backend; sin mocks ni rutas absolutas.
**Revisión previa:**
- [ ] Revisar endpoints `/api/vistas/*` (existen, nadie los usa) y su forma de respuesta.
- [ ] Identificar TODOS los hardcodeos (ranking, "Itachi969", ping "45ms", `mod.html`).
- [ ] Listar URLs absolutas `http://localhost:3000` a cambiar.
**Tareas:**
- [ ] Ranking con `/api/vistas/ranking`.
- [ ] Historial desde backend.
- [ ] Quitar hardcodeos/mocks (ranking, "Itachi969", ping "45ms", `mod.html`).
- [ ] URLs relativas `/api` en los 4 archivos detectados.
- [ ] **Merge invitado→cuenta**: al primer login, pasar el historial local del invitado a su cuenta (patrón "enlazar cuenta").
**Verificación:** funciona servido desde cualquier host y refleja la base real.

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
- [ ] Confirmar navegación rota: `game.html` (`pre-partida.html:69`, `menu.js:71`), `#levelBtn` ausente.
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
| 1. Correo SMTP | Completada | 2026-10-12 | SMTP Gmail funcionando + tests 98/98. Pendiente rotar app password / cuenta propia |
| 2. Sesión real | En verificación | 2026-10-12 | Implementado (guard 3 estados + logout real + cartel). Refactor CSP (onclick inline → addEventListener). Tests 98/98. Falta prueba manual en navegador |
| 3. Datos reales | Pendiente | | |
| 4. Endurecer backend | Pendiente | | |
| 5. Multijugador online | Pendiente | | |
| 6. Pulido/despliegue | Pendiente | | |
| 7. Offline/sincronización | Pendiente | | Mejora futura (offline-first + merge invitado) |
