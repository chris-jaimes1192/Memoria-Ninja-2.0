/*=========================================================
  MEMORIA NINJA
  CAPA: SERVICIOS (lógica de negocio)
  ARCHIVO: servicios/VerificacionService.js

  SRP: solo se encarga de generar y validar el código de
  verificación de correo. No sabe nada de temporizadores en
  pantalla ni de alert()/DOM: eso lo maneja
  VerificacionController.

  DIP: recibe un ICodigoGenerador inyectado. No le importa si
  el código es alfanumérico, numérico o llega por SMS más
  adelante: solo llama a generador.generar().
=========================================================*/

export class VerificacionService {
  #codigoActual = null;
  #correoActual = "";

  /** @param {import("../core/interfaces/ICodigoGenerador.js").ICodigoGenerador} generadorCodigo */
  constructor(generadorCodigo) {
    this.generadorCodigo = generadorCodigo;
  }

  generarNuevoCodigo(correo) {
    this.#correoActual = correo;
    this.#codigoActual = this.generadorCodigo.generar();
    return this.#codigoActual;
  }

  validarCodigo(codigoIngresado) {
    if (this.#codigoActual === null) {
      throw new Error(
        'Tu código expiró. Pide uno nuevo con "Reenviar código".'
      );
    }

    if (codigoIngresado.trim().toUpperCase() !== this.#codigoActual) {
      throw new Error("El código no es correcto. Revisa e inténtalo de nuevo.");
    }

    return true;
  }

  expirarCodigo() {
    this.#codigoActual = null;
  }

  get correoActual() {
    return this.#correoActual;
  }
}
