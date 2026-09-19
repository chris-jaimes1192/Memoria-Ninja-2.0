/*=========================================================
  MEMORIA NINJA
  COMPOSITION ROOT: login.js

  IMPORTANTE: el <script> que carga este archivo en login.html
  debe tener type="module".
=========================================================*/

import { HttpUsuarioRepositorio } from "./infraestructura/repositorios/HttpUsuarioRepositorio.js";
import { LocalStorageUsuarioRepositorio } from "./infraestructura/repositorios/LocalStorageUsuarioRepositorio.js";
import { RepositorioUsuariosConRespaldo } from "./infraestructura/repositorios/RepositorioUsuariosConRespaldo.js";
import { LocalStorageSesionRepositorio } from "./infraestructura/repositorios/LocalStorageSesionRepositorio.js";
import { MensajeDomNotificador } from "./infraestructura/notificadores/MensajeDomNotificador.js";
import { AutenticacionService } from "./servicios/AutenticacionService.js";
import { SesionService } from "./servicios/SesionService.js";
import { LoginController } from "./controladores/LoginController.js";
import { alternarVisibilidadPassword } from "./utils/TogglePasswordHelper.js";

// --- Composición (Dependency Injection manual) ---
// Los usuarios viven en SQLite (backend) y este repositorio intenta con
// HTTP primero. Si el backend NO está arriba (ErrorDeConexion), cae solo
// al respaldo local: el login sigue funcionando contra los usuarios que
// se registraron alguna vez sin servidor.
const repositorioUsuarios = new RepositorioUsuariosConRespaldo({
  principal: new HttpUsuarioRepositorio(),
  respaldo: new LocalStorageUsuarioRepositorio()
});
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
