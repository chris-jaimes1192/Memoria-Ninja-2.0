/*=========================================================
  MEMORIA NINJA
  COMPOSITION ROOT: registro.js

  IMPORTANTE: type="module" en el <script> de registro.html.
=========================================================*/

import { HttpUsuarioRepositorio } from "./infraestructura/repositorios/HttpUsuarioRepositorio.js";
import { LocalStorageUsuarioRepositorio } from "./infraestructura/repositorios/LocalStorageUsuarioRepositorio.js";
import { RepositorioUsuariosConRespaldo } from "./infraestructura/repositorios/RepositorioUsuariosConRespaldo.js";
import { MensajeDomNotificador } from "./infraestructura/notificadores/MensajeDomNotificador.js";
import { RegistroService } from "./servicios/RegistroService.js";
import { RegistroController } from "./controladores/RegistroController.js";
import { alternarVisibilidadPassword } from "./utils/TogglePasswordHelper.js";
import {
  abrirModal,
  cerrarModal,
  inicializarCierreClicFuera
} from "./utils/ModalHelper.js";

// --- Composición ---
// El registro va contra SQLite (backend HTTP) cuando hay servidor: el
// backend hashea la contraseña con scrypt y devuelve 400 si el
// usuario/correo ya existe. Si el servidor no está arriba, el respaldo
// local guarda el usuario en el navegador para que login/registro sigan
// funcionando de punta a punta offline.
const repositorioUsuarios = new RepositorioUsuariosConRespaldo({
  principal: new HttpUsuarioRepositorio(),
  respaldo: new LocalStorageUsuarioRepositorio()
});
const notificador = new MensajeDomNotificador("msg");
const registroService = new RegistroService(repositorioUsuarios);
const registroController = new RegistroController(registroService, notificador);

// --- Conexión con el DOM ---
async function registrar() {
  const datosFormulario = {
    usuario: document.getElementById("usuario").value.trim(),
    nacimiento: document.getElementById("nacimiento").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    pass: document.getElementById("pass").value.trim(),
    confirmarPass: document.getElementById("pass2").value.trim()
  };

  const aceptaTerminos = document.getElementById("aceptaTerminos").checked;
  const aceptaPolitica = document.getElementById("aceptaPolitica").checked;

  const exito = await registroController.manejarEnvio({
    datosFormulario,
    aceptaTerminos,
    aceptaPolitica
  });

  if (exito) {
    document.getElementById("usuario").value = "";
    document.getElementById("nacimiento").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("pass").value = "";
    document.getElementById("pass2").value = "";
  }
}

function togglePassword(idInput, icono) {
  alternarVisibilidadPassword(idInput, icono);
}

window.registrar = registrar;
window.togglePassword = togglePassword;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;

inicializarCierreClicFuera(["modalTerminos", "modalPolitica"]);
