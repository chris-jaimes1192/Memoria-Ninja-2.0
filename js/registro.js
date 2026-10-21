/*=========================================================
  MEMORIA NINJA
  COMPOSITION ROOT: registro.js

  IMPORTANTE: el <script> que carga este archivo en registro.html
  debe tener type="module".
=========================================================*/

import { HttpUsuarioRepositorio } from "./infraestructura/repositorios/HttpUsuarioRepositorio.js";
import { MensajeDomNotificador } from "./infraestructura/notificadores/MensajeDomNotificador.js";
import { RegistroService } from "./servicios/RegistroService.js";
import { RegistroController } from "./controladores/RegistroController.js";
import { abrirModal, cerrarModal, inicializarCierreClicFuera } from "./utils/ModalHelper.js";

// --- Composición (Dependency Injection manual) ---
// Registro REAL vía /api/auth: el backend guarda la cuenta en PostgreSQL
// DESACTIVADA y envía un código de verificación al correo. Sin respaldo
// local: la cuenta nace en el servidor, no en el navegador.
const repositorioUsuarios = new HttpUsuarioRepositorio();
const notificador = new MensajeDomNotificador("msg");
const registroService = new RegistroService(repositorioUsuarios);
const registroController = new RegistroController(registroService, notificador);

// --- Conexión con el DOM (listeners; sin onclick inline, que el CSP bloquea.
// Los nombres en window se mantienen por compatibilidad) ---
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
      window.location.href = "verificacion.html";
    }, 1500);
  }
}

window.registrar = registrar;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;

// --- Conexión real con el DOM (sin onclick inline: el CSP lo bloquea) ---
document.getElementById("btnRegistrar")?.addEventListener("click", registrar);

document.querySelectorAll("[data-modal]").forEach((el) => {
  el.addEventListener("click", () => abrirModal(el.dataset.modal));
  el.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      abrirModal(el.dataset.modal);
    }
  });
});

document.querySelectorAll("[data-cerrar]").forEach((el) => {
  el.addEventListener("click", () => cerrarModal(el.dataset.cerrar));
  el.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
      evento.preventDefault();
      cerrarModal(el.dataset.cerrar);
    }
  });
});

inicializarCierreClicFuera(["modalTerminos", "modalPolitica"]);
