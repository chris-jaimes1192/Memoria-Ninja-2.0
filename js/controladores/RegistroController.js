/*=========================================================
  MEMORIA NINJA
  CAPA: CONTROLADORES (presentación)
  ARCHIVO: controladores/RegistroController.js

  POLIMORFISMO / LSP: manejarEnvio(datos) — mismo nombre y
  misma firma (un solo objeto) que LoginController,
  VerificacionController y RecuperacionController.
=========================================================*/

import { FormularioControllerBase } from "./FormularioControllerBase.js";

export class RegistroController extends FormularioControllerBase {
  constructor(registroService, notificador) {
    super(notificador);
    this.registroService = registroService;
  }

  /**
   * @param {{ datosFormulario: object, aceptaTerminos: boolean, aceptaPolitica: boolean }} datos
   * @returns {Promise<boolean>}
   */
  async manejarEnvio(datos) {
    const { datosFormulario, aceptaTerminos, aceptaPolitica } = datos;

    try {
      if (!aceptaTerminos) {
        throw new Error("Debes aceptar los Términos y Condiciones.");
      }
      if (!aceptaPolitica) {
        throw new Error("Debes aceptar la Política de Privacidad.");
      }

      await this.registroService.registrar(datosFormulario);
      this.notificador.mostrar(
        "Registro exitoso. Ahora puedes iniciar sesión.",
        "exito"
      );
      return true;
    } catch (error) {
      this.notificador.mostrar(error.message, "error");
      return false;
    }
  }
}
