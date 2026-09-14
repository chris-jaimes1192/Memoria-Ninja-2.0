/*=========================================================
  MEMORIA NINJA
  CAPA: CONTROLADORES (presentación)
  ARCHIVO: controladores/RecuperacionController.js

  POLIMORFISMO / LSP: implementa manejarEnvio(datos) — antes
  esta clase NO lo sobreescribía y heredaba el throw de
  FormularioControllerBase, rompiendo la promesa de que las 4
  subclases responden a manejarEnvio(). Ahora sí lo hace, con
  la MISMA firma que LoginController, RegistroController y
  VerificacionController: un único objeto "datos". Como este
  flujo tiene 3 pasos (correo -> código -> nueva contraseña),
  internamente delega según datos.paso — pero hacia afuera
  siempre se ve el mismo contrato.

  DIP + OCP: recibe un IEnviadorCodigo inyectado en vez de
  hacer alert() directo con el código (igual que
  VerificacionController).
=========================================================*/

import { FormularioControllerBase } from "./FormularioControllerBase.js";

export class RecuperacionController extends FormularioControllerBase {
  /**
   * @param {import("../servicios/RecuperacionService.js").RecuperacionService} recuperacionService
   * @param {import("../core/interfaces/INotificador.js").INotificador} notificador
   * @param {import("../core/interfaces/IEnviadorCodigo.js").IEnviadorCodigo} enviadorCodigo
   */
  constructor(recuperacionService, notificador, enviadorCodigo) {
    super(notificador);
    this.recuperacionService = recuperacionService;
    this.enviadorCodigo = enviadorCodigo;
  }

  marcarPaso(numeroActual) {
    for (let i = 1; i <= 3; i++) {
      const punto = document.getElementById("punto-" + i);
      if (!punto) continue;

      punto.classList.remove("activo", "completado");

      if (i < numeroActual) {
        punto.classList.add("completado");
      } else if (i === numeroActual) {
        punto.classList.add("activo");
      }
    }
  }

  /**
   * Punto de entrada único (polimorfismo real con el resto de
   * controladores). datos.paso indica cuál de los 3 pasos del
   * flujo se está manejando.
   * @param {{ paso: "correo"|"codigo"|"password", correo?: string, codigo?: string, nuevaPassword?: string, confirmarPassword?: string }} datos
   * @returns {boolean}
   */
  manejarEnvio(datos) {
    switch (datos.paso) {
      case "correo":
        return this.#manejarPasoCorreo(datos.correo);
      case "codigo":
        return this.#manejarPasoCodigo(datos.codigo);
      case "password":
        return this.#manejarPasoPassword(datos.nuevaPassword, datos.confirmarPassword);
      default:
        throw new Error(`Paso de recuperación desconocido: "${datos.paso}"`);
    }
  }

  #manejarPasoCorreo(correo) {
    if (this.camposVacios(correo)) {
      this.notificador.mostrar("Ingresa un correo.", "error");
      return false;
    }

    try {
      const codigo = this.recuperacionService.solicitarRecuperacion(correo);
      this.enviadorCodigo.enviar(correo, codigo);
      this.marcarPaso(2);
      return true;
    } catch (error) {
      this.notificador.mostrar(error.message, "error");
      return false;
    }
  }

  #manejarPasoCodigo(codigo) {
    if (this.camposVacios(codigo)) {
      this.notificador.mostrar("Ingresa el codigo.", "error");
      return false;
    }

    try {
      this.recuperacionService.verificarCodigo(codigo);
      this.marcarPaso(3);
      return true;
    } catch (error) {
      this.notificador.mostrar(error.message, "error");
      return false;
    }
  }

  #manejarPasoPassword(nuevaPassword, confirmarPassword) {
    if (this.camposVacios(nuevaPassword, confirmarPassword)) {
      this.notificador.mostrar("Completa todos los campos.", "error");
      return false;
    }

    try {
      this.recuperacionService.cambiarPassword(nuevaPassword, confirmarPassword);
      this.marcarPaso(4);
      this.notificador.mostrar("Contraseña actualizada correctamente.", "exito");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
      return true;
    } catch (error) {
      this.notificador.mostrar(error.message, "error");
      return false;
    }
  }
}
