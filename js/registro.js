/*=========================================================
  MEMORIA NINJA
  COMPOSITION ROOT: registro.js

  IMPORTANTE: el <script> que carga este archivo en registro.html
  debe tener type="module".
=========================================================*/

import { HttpUsuarioRepositorio } from "./infraestructura/repositorios/HttpUsuarioRepositorio.js";
import { LocalStorageUsuarioRepositorio } from "./infraestructura/repositorios/LocalStorageUsuarioRepositorio.js";
import { RepositorioUsuariosConRespaldo } from "./infraestructura/repositorios/RepositorioUsuariosConRespaldo.js";
import { MensajeDomNotificador } from "./infraestructura/notificadores/MensajeDomNotificador.js";
import { RegistroService } from "./servicios/RegistroService.js";
import { RegistroController } from "./controladores/RegistroController.js";
import { abrirModal, cerrarModal, inicializarCierreClicFuera } from "./utils/ModalHelper.js";

// --- Composición (Dependency Injection manual) ---
// Igual que en login.js: primero se intenta el backend real (SQLite) y,
// si no está alcanzable, el registro sigue funcionando contra localStorage.
const repositorioUsuarios = new RepositorioUsuariosConRespaldo({
  principal: new HttpUsuarioRepositorio(),
  respaldo: new LocalStorageUsuarioRepositorio()
});
const notificador = new MensajeDomNotificador("msg");
const registroService = new RegistroService(repositorioUsuarios);
const registroController = new RegistroController(registroService, notificador);

// --- Conexión con el DOM (se mantienen los mismos nombres de función
// en window para no romper los onclick="..." ya existentes en registro.html) ---
async function registrar() {
  const datosFormulario = {
    usuario: document.getElementById("usuario").value.trim(),
    nacimiento: document.getElementById("nacimiento").value,
    correo: document.getElementById("correo").value.trim(),
    pass: document.getElementById("pass").value,
    confirmarPass: document.getElementById("pass2").value
  };

  const aceptaTerminos = document.getElementById("aceptaTerminos").checked;
  const aceptaPolitica = document.getElementById("aceptaPolitica").checked;

  const exito = await registroController.manejarEnvio({
    datosFormulario,
    aceptaTerminos,
    aceptaPolitica
  });

  if (exito) {
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  }
}

window.registrar = registrar;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;

inicializarCierreClicFuera(["modalTerminos", "modalPolitica"]);
