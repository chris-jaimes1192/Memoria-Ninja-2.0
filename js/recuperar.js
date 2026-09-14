/*=========================================================
  MEMORIA NINJA
  MODULO: RECUPERACION DE CONTRASEÑA
  COMPOSITION ROOT: recuperar.js

  IMPORTANTE: type="module" en el <script> de recuperar.html.
=========================================================*/

import { LocalStorageUsuarioRepositorio } from "./infraestructura/repositorios/LocalStorageUsuarioRepositorio.js";
import { CodigoNumericoGenerador } from "./infraestructura/generadores/CodigoNumericoGenerador.js";
import { MensajeDomNotificador } from "./infraestructura/notificadores/MensajeDomNotificador.js";
import { EnvioCodigoModoPrueba } from "./infraestructura/envios/EnvioCodigoModoPrueba.js";
import { RecuperacionService } from "./servicios/RecuperacionService.js";
import { RecuperacionController } from "./controladores/RecuperacionController.js";

// --- Composición ---
const repositorioUsuarios = new LocalStorageUsuarioRepositorio();
const generadorCodigo = new CodigoNumericoGenerador();
const notificador = new MensajeDomNotificador("msg");
const enviadorCodigo = new EnvioCodigoModoPrueba(notificador);
const recuperacionService = new RecuperacionService(
  repositorioUsuarios,
  generadorCodigo
);
const recuperacionController = new RecuperacionController(
  recuperacionService,
  notificador,
  enviadorCodigo
);

// --- Conexión con el DOM ---
function buscarCorreo() {
  const correo = document.getElementById("correo").value.trim();
  const exito = recuperacionController.manejarEnvio({ paso: "correo", correo });

  if (exito) {
    document.getElementById("paso1").style.display = "none";
    document.getElementById("paso2").style.display = "block";
  }
}

function verificarCodigo() {
  const codigo = document.getElementById("codigo").value.trim();
  const exito = recuperacionController.manejarEnvio({ paso: "codigo", codigo });

  if (exito) {
    document.getElementById("paso2").style.display = "none";
    document.getElementById("paso3").style.display = "block";
  }
}

function guardarPassword() {
  const nuevaPassword = document.getElementById("nuevaPass").value.trim();
  const confirmarPassword = document.getElementById("confirmarPass").value.trim();
  recuperacionController.manejarEnvio({ paso: "password", nuevaPassword, confirmarPassword });
}

window.buscarCorreo = buscarCorreo;
window.verificarCodigo = verificarCodigo;
window.guardarPassword = guardarPassword;

document.addEventListener("DOMContentLoaded", () =>
  recuperacionController.marcarPaso(1)
);
