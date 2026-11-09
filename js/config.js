/*=========================================================
  MEMORIA NINJA — CONFIGURACIÓN DE DESPLIEGUE

  En local, LAN y Dev Tunnel se ignora: el multijugador usa el
  mismo origen que sirve la página. En producción (Vercel) apunta
  al backend de Render, que es quien mantiene los WebSockets.

  Reemplazar TU-BACKEND por el nombre real del servicio de Render.
=========================================================*/

window.MEMORIA_NINJA_BACKEND_URL = "https://TU-BACKEND.onrender.com";
