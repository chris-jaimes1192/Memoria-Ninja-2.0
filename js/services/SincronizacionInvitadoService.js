/*=========================================================
  MEMORIA NINJA
  CAPA: SERVICIOS
  ARCHIVO: services/SincronizacionInvitadoService.js

  SUB-PARTE 3.5 — Merge invitado→cuenta.

  Cuando alguien jugó como invitado/offline, los resultados quedaron
  en la cola local `historialPendiente` (HttpHistorialRepositorio) y
  el XP en `perfil:invitado`. Al iniciar sesión, ESTE servicio sube
  ambas cosas a la cuenta real vía POST /api/usuarios/:id/importar
  y limpia las claves locales SOLO si el servidor confirmó.

  >>> BEST-EFFORT <<<
  Nunca lanza ni bloquea el login: si la red o el servidor fallan,
  la cola queda intacta y se reintenta en el próximo inicio de sesión.
=========================================================*/

import { CLAVE_COLA_PENDIENTE } from "../infraestructura/repositorios/HttpHistorialRepositorio.js";

const URL_BASE = "/api";
const CLAVE_PERFIL_INVITADO = "perfil:invitado";

export class SincronizacionInvitadoService {
  /**
   * @param {string} idUsuario cuenta recién iniciada (el backend valida
   *        que la cookie de sesión le pertenezca).
   * @returns {Promise<object>} nunca lanza.
   */
  async sincronizar(idUsuario) {
    if (!idUsuario) return { sincronizado: false, motivo: "sin_usuario" };

    let cola = [];
    let perfil = null;
    try {
      cola = JSON.parse(localStorage.getItem(CLAVE_COLA_PENDIENTE)) || [];
      perfil = JSON.parse(localStorage.getItem(CLAVE_PERFIL_INVITADO));
    } catch {
      return { sincronizado: false, motivo: "datos_locales_corruptos" };
    }
    if (!Array.isArray(cola)) cola = [];

    if (cola.length === 0 && !perfil) {
      return { sincronizado: true, nada_que_importar: true };
    }

    try {
      const respuesta = await fetch(
        `${URL_BASE}/usuarios/${encodeURIComponent(idUsuario)}/importar`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historial: cola, perfil })
        }
      );
      if (!respuesta.ok) {
        return { sincronizado: false, motivo: "servidor_rechazo" };
      }

      const cuerpo = await respuesta.json().catch(() => ({}));
      localStorage.removeItem(CLAVE_COLA_PENDIENTE);
      localStorage.removeItem(CLAVE_PERFIL_INVITADO);
      return {
        sincronizado: true,
        importados: cuerpo.importados ?? 0,
        omitidos: cuerpo.omitidos ?? 0
      };
    } catch {
      return { sincronizado: false, motivo: "sin_conexion" };
    }
  }
}

/** Instancia compartida: el login y el guard usan la misma. */
export const sincronizacionInvitado = new SincronizacionInvitadoService();
