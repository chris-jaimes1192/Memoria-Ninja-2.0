/*=========================================================
  MEMORIA NINJA
  COMPOSITION ROOT: login.js

  IMPORTANTE: el <script> que carga este archivo en login.html
  debe tener type="module".
=========================================================*/

import { HttpUsuarioRepositorio } from "./infraestructura/repositorios/HttpUsuarioRepositorio.js";
import { LocalStorageSesionRepositorio } from "./infraestructura/repositorios/LocalStorageSesionRepositorio.js";
import { MensajeDomNotificador } from "./infraestructura/notificadores/MensajeDomNotificador.js";
import { AutenticacionService } from "./servicios/AutenticacionService.js";
import { SesionService } from "./servicios/SesionService.js";
import { LoginController } from "./controladores/LoginController.js";
import { alternarVisibilidadPassword } from "./utils/TogglePasswordHelper.js";

// --- Composición (Dependency Injection manual) ---
// Los usuarios viven en SQLite (backend); este repositorio es un cliente
// HTTP. Si el backend no está arriba, el login te avisa con un mensaje
// amigable en vez de guardar datos falsos en el navegador.
const repositorioUsuarios = new HttpUsuarioRepositorio();
const sesionRepositorio = new LocalStorageSesionRepositorio();
const notificador = new MensajeDomNotificador("msg");
const autenticacionService = new AutenticacionService(repositorioUsuarios);
const sesionService = new SesionService(sesionRepositorio);
const loginController = new LoginController(
  autenticacionService,
  sesionService,
  notificador
);

// --- Conexión con el DOM (se mantienen los mismos nombres de función
// en window para no romper los onclick="..." ya existentes en login.html) ---
async function login() {
  const usuario = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value.trim();
  const recordar = document.getElementById("recordarme").checked;

  await loginController.manejarEnvio({ usuario, password, recordar });
}

function togglePassword(idInput, icono) {
  alternarVisibilidadPassword(idInput, icono);
}

window.login = login;
window.togglePassword = togglePassword;
