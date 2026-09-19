/*=========================================================
  MEMORIA NINJA
  CAPA: INFRAESTRUCTURA -> Repositorio
  ARCHIVO: infraestructura/repositorios/HttpHistorialRepositorio.js

  Historial de partidas contra el backend (tabla SQLite
  `historial_partidas`, 100% relacional).

  Los juegos (pares, uzumaki, muerte...) siguen guardando su copia
  local en localStorage (offline), pero ADEMÁS envían el resultado
  al servidor cuando hay una sesión activa. El menú lee PRIMERO del
  backend y solo cae a localStorage si no hay sesión o el servidor
  no responde.

  USO EN SCRIPTS CLÁSICOS (no-module):
  const { historialApi } = await import(
    "./js/infraestructura/repositorios/HttpHistorialRepositorio.js"
  );
=========================================================*/

const URL_BASE = "http://localhost:3000/api";

export class HttpHistorialRepositorio {
  /**
   * Lee la sesión activa y devuelve el id del usuario (el que asigna
   * el backend en SQLite). Usuarios viejos de localStorage no tienen id.
   */
  #idDeSesionActiva() {
    try {
      const sesion = JSON.parse(localStorage.getItem("usuarioActivo"));
      return sesion && sesion.id ? sesion.id : null;
    } catch {
      return null;
    }
  }

  async obtener(idUsuario) {
    const respuesta = await fetch(
      `${URL_BASE}/usuarios/${encodeURIComponent(idUsuario)}/historial`
    );
    const cuerpo = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
      throw new Error(cuerpo.error || "No se pudo leer el historial.");
    }
    return cuerpo.historial || [];
  }

  /**
   * Envía el resultado de una partida al servidor. Es BEST-EFFORT para
   * nunca bloquear el juego: si no hay sesión activa o el backend no
   * responde, simplemente no envía nada (el registro local ya quedó).
   */
  async guardar({ zona, puntaje, modo, ganador, idPartida }) {
    const idUsuario = this.#idDeSesionActiva();
    if (!idUsuario) return { enviado: false };

    try {
      const respuesta = await fetch(
        `${URL_BASE}/usuarios/${encodeURIComponent(idUsuario)}/historial`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ zona, puntaje, modo, ganador, idPartida })
        }
      );
      const cuerpo = await respuesta.json().catch(() => ({}));
      return { enviado: respuesta.ok, error: cuerpo.error };
    } catch {
      return { enviado: false, error: "servidor no disponible" };
    }
  }
}

/** Instancia compartida (evita crear una conexión por juego). */
export const historialApi = new HttpHistorialRepositorio();