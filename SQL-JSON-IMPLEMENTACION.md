# SQL + JSON — Implementación en Memorice Duel (Ninja Memory)

> Mapa archivo por archivo de cómo se le dio **persistencia real** al proyecto: SQLite como base de datos y JSON como formato de serialización (en la columna `estado_json`, en el intercambio HTTP y en el respaldo de `localStorage`). Documento de apoyo para la sustentación.

---

## 0. Resumen ejecutivo

El repo pasó de **funcionar 100% en el navegador** (localStorage + `MockServer`) a tener una **base de datos SQLite real** en el backend y una **capa HTTP/JSON** que la conecta con el frontend. El juego quedó así:

| Escenario | Qué pasa |
|---|---|
| Backend arriba | Login, registro, partidas, poderes e historial viven en **SQLite** (sobreviven reinicios). |
| Backend caído | Todo cae a los **respaldos locales** (`localStorage` + `MockServer`): el juego no se rompe. |
| Servidor responde con error (400/401) | Ese error es la verdad del servidor y **se propaga** — no se falsea con datos locales. |

**Dónde vive el JSON (3 sitios):**

1. **Columna `estado_json`** de la tabla `partidas`: la partida entera (jugadores, tablero, eventos, poderes) serializada como JSON.
2. **JSON por HTTP**: cada `fetch` entre frontend y backend envía/recibe JSON.
3. **JSON en `localStorage`**: mismo formato, pero como respaldo offline.

---

## 1. SQL — la base de datos

### 1.1 Esquema (`backend-poderes/src/infraestructura/DatabaseSqlite.js`)

Conexión SQLite nativa de Node 24 (`node:sqlite`, **cero dependencias npm**) al archivo `backend-poderes/data/memorice.sqlite` (gitignored).

```sql
-- partidas: EL cuerpo se guarda como JSON
partidas(id TEXT PRIMARY KEY, estado_json TEXT, creada_en TEXT, actualizada_en TEXT);

-- usuarios: contraseña SOLO como hash scrypt ("sal:hash")
usuarios(id TEXT PRIMARY KEY, usuario TEXT UNIQUE, correo TEXT UNIQUE,
         password_hash TEXT, nacimiento TEXT, creado_en TEXT);

-- historial: un registro por partida jugada, con clave foránea al usuario
historial_partidas(id TEXT PRIMARY KEY, id_usuario TEXT REFERENCES usuarios(id),
                   id_partida TEXT, zona TEXT, puntaje INTEGER, modo TEXT, ganador TEXT, jugada_en TEXT);
```

### 1.2 Repositorios (capa de acceso a datos)

| Archivo | Rol | Clave |
|---|---|---|
| `src/repositories/PartidaRepositorySQL.js` | Guarda/lee partidas en SQL | `estado_json` en `JSON.stringify`/`JSON.parse` |
| `src/repositories/UsuarioRepositorySQL.js` | CRUD de usuarios en SQL | `usuario`/`correo` UNIQUE, nunca expone el hash |
| `src/repositories/HistorialPartidaRepositorySQL.js` | Insert/select de historial | FK a `usuarios(id)` |
| `src/repositories/PartidaRepositoryMemoria.js` | Implementación en memoria (tests) | misma interfaz → **LSP** |
| `src/repositories/PartidaRepositoryArchivo.js` | Implementación en archivos JSON en disco (`{id}.json`) | misma interfaz → **LSP**; `obtener()` **vuelve al disco** si el cache en memoria está vacío (sobrevive reinicios) |
| `src/infraestructura/PasswordHasher.js` | Cifra contraseñas con scrypt | `sal:hash`, nunca texto plano |

**El corazón del "SQL + JSON": `PartidaRepositorySQL.guardar()`**
```js
const estado = {
  jugadores: /* {id: {nombre, chakra, vida}} */,
  tablero:   { /* fila y columnas con ids de cartas */ },
  eventos:   partida.eventos,
  poderesActivos: partida.poderesActivos,
};
db.prepare("INSERT INTO partidas (id, estado_json, creada_en, actualizada_en) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET estado_json = excluded.estado_json, actualizada_en = excluded.actualizada_en")
  .run(partida.id, JSON.stringify(estado), ahora, ahora);
```
Y `obtener()` hace el proceso inverso: `JSON.parse(estado_json)` → reconstruye `Jugador`/`Tablero` reales.

> **`PartidaRepositoryArchivo` (JSON en disco) — misma fidelidad, sin cache perdido.** El fix que igualó a SQL: `guardar()` serializa toda la partida a `{carpeta}/{id}.json` y `obtener()` consulta primero el **cache en memoria** y, si falla (p. ej. tras un reinicio del servidor), **vuelve al disco** y **materializa la ENTIDAD** real con sus métodos encapsulados:
>
> ```js
> obtener(idPartida) {
>   this.cacheEnMemoria ??= new Map();
>   if (this.cacheEnMemoria.has(idPartida)) {
>     return this.cacheEnMemoria.get(idPartida);   // cache hit → retorno directo
>   }
>   const ruta = this.#rutaDe(idPartida);
>   if (!fs.existsSync(ruta)) return null;         // misses → null (contrato)
>   const foto = JSON.parse(fs.readFileSync(ruta, "utf8")); // deserialización
>   const partida = this.#reconstruirPartida(foto);         // hidratación
>   this.cacheEnMemoria.set(idPartida, partida);            // repoblar cache
>   return partida;
> }
> ```
>
> `#reconstruirPartida()` es el mismo corazón que `PartidaRepositorySQL.#reconstruirPartida()`: crea `Jugador` con `ganarChakra()`/`recibirDanio()` (multiplicación solo vía la API encapsulada, nunca `jugador.chakra = x`) y recompone `Partida` con sus `eventos`, `poderesActivos` (por id) y un `Tablero` nuevo. Antes este repositorio **escribía el JSON pero leía solo del cache** → al reiniciar devolvía `null`; ahora la partida sobrevive, igual que en SQLite.

> **Prueba LSP**: la misma batería de tests de contrato (`tests/contratoPartidaRepository.js`) corre contra las 3 implementaciones y las 3 pasan. Cambiar de una a otra no toca el Service.

### 1.3 Servicios y endpoints

| Endpoint | Método | Servicio | Qué hace |
|---|---|---|---|
| `/api/partida` | POST | `PartidaService.crearPartida` | Valida jugadores/chakra, crea `Partida(UUID)` y la persiste en SQLite |
| `/api/poder/activar` | POST | `PoderService.activarPoder` | Valida chakra/contraataques, cambia el estado y lo vuelve a persistir |
| `/api/usuarios/registro` | POST | `UsuarioService.registrar` | Hashea (scrypt) y crea el usuario |
| `/api/usuarios/login` | POST | `UsuarioService.iniciarSesion` | Verifica hash y devuelve datos públicos |
| `/api/usuarios` | GET | `UsuarioService.obtenerTodos` | Lista usuarios sin hashes |
| `/api/usuarios/por-correo/:correo` | GET | `UsuarioService.buscarPorCorreo` | Busca por correo (para validar duplicados) |
| `/api/usuarios/:id/historial` | GET/POST | `UsuarioService.obtenerHistorial` / `guardarResultadoPartida` | Historial de SQL por usuario |

> **Composition Root**: en `server.js` es el ÚNICO lugar donde se hace `new` de las implementaciones (SQL). Todo lo demás recibe sus dependencias por constructor. Eso es DIP en vivo.

---

## 2. JSON en el intercambio HTTP (frontend ↔ backend)

### 2.1 Repositorios HTTP del frontend (`js/infraestructura/repositorios/`)

| Archivo | Rol |
|---|---|
| `HttpUsuarioRepositorio.js` | Cliente HTTP de usuarios: `obtenerTodos`, `buscarPorCorreo`, `buscarPorCredenciales`, `guardar`. Lanza `ErrorDeConexion` tipado cuando el backend no responde. |
| `RepositorioUsuariosConRespaldo.js` | Decorator: intenta HTTP y, ante `ErrorDeConexion`, repite la llamada en `localStorage`. |
| `HttpHistorialRepositorio.js` | `historialApi.obtener(idUsuario)` / `guardar({zona, puntaje, modo, ganador})`. Best-effort. |

```js
// HttpUsuarioRepositorio — el patrón de cada método
async buscarPorCredenciales(usuario, password) {
  const cuerpo = await this.#peticion("/usuarios/login", {
    method: "POST",
    body: JSON.stringify({ usuario, password })
  });
  return this.#aEntidad(cuerpo.usuario);   // mapea el JSON del servidor a la entidad
}
```

### 2.2 Composición en cada página

| Archivo | Qué instancia ahora |
|---|---|
| `js/login.js` | `RepositorioUsuariosConRespaldo({ principal: HttpUsuarioRepositorio, respaldo: LocalStorageUsuarioRepositorio })` |
| `js/registro.js` | Ídem. |
| `js/menu.js` | `actualizarHistorial()`: lee de SQLite si hay sesión con `id`; si no, cae a `localStorage`. |

### 2.3 Costo real del desacople

`HttpUsuarioRepositorio` usa `fetch` (asíncrono), así que la cadena pasó a `async`:

`AutenticacionService.iniciarSesion` → `LoginController.manejarEnvio` → `login()` de `js/login.js`

Ese "efecto colateral" es la prueba de que el cambio es real: el dato ya no vive en el documento.

---

## 3. El motor en vivo habla con el backend

### 3.1 Proveedor de datos (`js/nucleo-GAME ONLI/datos/`)

- `ProveedorDatos.js` — interfaz: `obtenerDatos()` (y `notificarPoder()` opcional, no-op por defecto → **ISP**).
- `ProveedorDatosSimulado.js` — envuelve el `MockServer` (fallback).
- **`ProveedorDatosServidor.js` (nuevo)** — impl. real:

```js
// Crear la partida real en SQLite y devolver el MISMO formato que el MockServer
const respuesta = await fetch(`${URL_BASE}/partida`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ idJugador1: "sasuke", nombre1, idJugador2: "naruto", nombre2,
                         chakraInicial1, chakraInicial2 }),
});
// ... mapea a { room, players } y guarda this.idPartida
```

Si el servidor no responde → `catch` → devuelve `respaldo.obtenerDatos()` (el MockServer).

### 3.2 Poderes que se sincronizan (`poderes/Poder.js` + `GestorPartida.js`)

Al final de `Poder.activar()` (Template Method) se avisa al servidor por un hook OPCIONAL:

```js
// En Poder.activar(), tras aplicar el efecto local:
const notificar = contexto.notificarPoderAlServidor;
if (typeof notificar === "function") {
  const promesa = notificar(this.id, esSasuke);  // → POST /api/poder/activar
  if (promesa?.catch) promesa.catch(() => {});
}
```

`GestorPartida.js` provee el hook en el `contexto`, delegando en `ProveedorDatosServidor.notificarPoder()`. El backend valida el chakra, registra el evento y **persiste el nuevo estado en `estado_json`**.

> Flujo completo verificado: `POST /api/partida` → genjutsu (chakra 70→35) → **reinicio del servidor** → byakugan sobre la misma partida (35→15). La partida sobrevivió al reinicio.

---

## 4. Qué tocó cada commit

| Commit | Qué contiene |
|---|---|
| `9c55c68` | SQLite completo (esquema, repos, usuarios/historial, scrypt), endpoints de usuarios, frontend HTTP de login/registro/historial, juegos con POST best-effort. |
| `206714b` | `POST /api/partida` real, `ProveedorDatosServidor`, hook de poderes → servidor, fix de rutas en `ByakuganPoder`, AGENTS.md corregido. |
| `c718dae` | `ErrorDeConexion` + `RepositorioUsuariosConRespaldo`: login/registro a prueba de daños sin backend. |

---

## 5. Tests (58/58 verdes — 15 suites)

| Archivo | Qué cubre |
|---|---|
| `tests/contratoPartidaRepository.js` | La MISMA batería contra Memoria, Archivo y SQL (**LSP**) |
| `tests/partidaRepositorySQL.test.js` | Round-trip SQL + JSON, sobrescritura, ids aislados, **persistencia tras reinicio** |
| `tests/partidaRepositoryArchivo.test.js` | Round-trip JSON en disco, **persistencia tras reinicio (instancia nueva, cache vacío)**, restauración fiel de chakra/vida, `null` si no existe el `.json` |
| `tests/partidaService.test.js` | Crear+persistir, chakra personalizado, ids distintos, validación 0-100 |
| `tests/usuarioService.test.js` | Registro→login→historial→`obtenerTodos`→`buscarPorCorreo` |
| `tests/poderService.test.js` | Activación, contraataques, chakra insuficiente |

```bash
cd backend-poderes
npm test     # 58 passing, 0 failing
```

---

## 6. Cómo levantarlo

```bash
# Backend (SQLite en data/memorice.sqlite)
cd backend-poderes
npm install
npm start                     # http://localhost:3000

# Frontend (los ES modules requieren HTTP, no file://)
cd ..
npx serve .                   # o cualquier servidor estático → abrir game-online.html
```