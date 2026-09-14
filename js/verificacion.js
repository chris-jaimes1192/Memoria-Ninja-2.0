/*=========================================================
  MEMORIA NINJA
  COMPOSITION ROOT: verificacion.js

  IMPORTANTE: type="module" en el <script> de verificacion.html.
=========================================================*/

import { CodigoAlfanumericoGenerador } from "./infraestructura/generadores/CodigoAlfanumericoGenerador.js";
import { AlertaNotificador } from "./infraestructura/notificadores/AlertaNotificador.js";
import { EnvioCodigoModoPrueba } from "./infraestructura/envios/EnvioCodigoModoPrueba.js";
import { VerificacionService } from "./servicios/VerificacionService.js";
import { VerificacionController } from "./controladores/VerificacionController.js";

document.addEventListener("DOMContentLoaded", () => {
  const inputCorreo = document.getElementById("input-correo");
  const btnEnviarCorreo = document.getElementById("btn-enviar-correo");
  const btnComprobarCodigo = document.getElementById("btn-comprobar-codigo");
  const paso1 = document.getElementById("paso-1");
  const paso2 = document.getElementById("paso-2");
  const contenedorCarga = document.getElementById("contenedor-carga");
  const inputCodigo = document.getElementById("input-codigo");
  const textoEnviado = document.getElementById("texto-enviado");
  const temporizador = document.getElementById("temporizador");
  const reenviarBox = document.getElementById("reenviar");
  const btnReenviar = document.getElementById("btn-reenviar");

  // --- Composición ---
  const generadorCodigo = new CodigoAlfanumericoGenerador(6);
  const notificador = new AlertaNotificador();
  const enviadorCodigo = new EnvioCodigoModoPrueba(notificador);
  const verificacionService = new VerificacionService(generadorCodigo);
  const verificacionController = new VerificacionController(
    verificacionService,
    notificador,
    enviadorCodigo,
    {
      textoEnviado,
      temporizador,
      reenviarBox,
      btnComprobarCodigo,
      inputCodigo,
      contenedorCarga
    }
  );

  let correoActual = "";

  btnEnviarCorreo.addEventListener("click", () => {
    const correo = inputCorreo.value.trim();

    if (correo === "") {
      notificador.mostrar("Escribe tu correo primero.", "error");
      return;
    }

    correoActual = correo;
    verificacionController.enviarCodigo(correoActual);

    paso1.classList.remove("activa");
    setTimeout(() => paso2.classList.add("activa"), 150);
  });

  btnReenviar.addEventListener("click", () => {
    verificacionController.enviarCodigo(correoActual);
    inputCodigo.value = "";
    inputCodigo.focus();
  });

  btnComprobarCodigo.addEventListener("click", () => {
    const codigo = inputCodigo.value.trim();

    if (codigo === "") {
      notificador.mostrar("Por favor, ingresa el código.", "error");
      return;
    }

    verificacionController.manejarEnvio({ codigo });
  });
});
