/*=========================================================
  MEMORIA NINJA
  CAPA: CONTROLADORES (presentación)
  ARCHIVO: controladores/VerificacionController.js

  Orquesta el flujo de verificación de correo: usa
  VerificacionService para la lógica de negocio (generar y
  validar código) y un IEnviadorCodigo para "entregar" el
  código (hoy en modo de prueba, mañana por correo real) sin
  que esta clase sepa ni le importe cuál de los dos es (OCP).

  POLIMORFISMO / LSP: manejarEnvio(datos) — misma firma que el
  resto de controladores.
=========================================================*/

import { FormularioControllerBase } from "./FormularioControllerBase.js";

const DURACION_CODIGO = 60; // segundos

export class VerificacionController extends FormularioControllerBase {
  #intervaloId = null;
  #segundosRestantes = DURACION_CODIGO;

  /**
   * @param {import("../servicios/VerificacionService.js").VerificacionService} verificacionService
   * @param {import("../core/interfaces/INotificador.js").INotificador} notificador
   * @param {import("../core/interfaces/IEnviadorCodigo.js").IEnviadorCodigo} enviadorCodigo
   * @param {object} elementos
   */
  constructor(verificacionService, notificador, enviadorCodigo, elementos) {
    super(notificador);
    this.verificacionService = verificacionService;
    this.enviadorCodigo = enviadorCodigo;
    this.elementos = elementos; // referencias a nodos del DOM inyectadas desde el composition root
  }

  enmascararCorreo(correo) {
    const [usuario, dominio] = correo.split("@");
    if (!dominio) return correo;
    const visible = usuario.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(usuario.length - 2, 2))}@${dominio}`;
  }

  enviarCodigo(correo) {
    const codigo = this.verificacionService.generarNuevoCodigo(correo);

    // OCP: esta clase no sabe CÓMO se entrega el código. Hoy
    // enviadorCodigo es EnvioCodigoModoPrueba (lo muestra en
    // pantalla). El día que exista backend de correo, se
    // inyecta EnvioCodigoPorCorreo en el composition root y
    // esta línea sigue exactamente igual.
    this.enviadorCodigo.enviar(correo, codigo);

    this.elementos.textoEnviado.textContent = `Enviamos un código a ${this.enmascararCorreo(correo)}`;
    this.#iniciarTemporizador();
  }

  #iniciarTemporizador() {
    clearInterval(this.#intervaloId);
    this.#segundosRestantes = DURACION_CODIGO;
    this.elementos.reenviarBox.style.display = "none";
    this.#actualizarTemporizadorTexto();

    this.#intervaloId = setInterval(() => {
      this.#segundosRestantes--;
      this.#actualizarTemporizadorTexto();

      if (this.#segundosRestantes <= 0) {
        clearInterval(this.#intervaloId);
        this.verificacionService.expirarCodigo();
        this.elementos.temporizador.textContent = "Tu código expiró.";
        this.elementos.reenviarBox.style.display = "block";
      }
    }, 1000);
  }

  #actualizarTemporizadorTexto() {
    this.elementos.temporizador.textContent = `El código expira en ${this.#segundosRestantes}s`;
  }

  /**
   * @param {{ codigo: string }} datos
   */
  manejarEnvio(datos) {
    const { codigo } = datos;

    try {
      this.verificacionService.validarCodigo(codigo);
      clearInterval(this.#intervaloId);

      this.elementos.btnComprobarCodigo.style.display = "none";
      this.elementos.inputCodigo.disabled = true;
      this.elementos.contenedorCarga.style.display = "block";

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } catch (error) {
      this.notificador.mostrar(error.message, "error");
      this.elementos.inputCodigo.value = "";
      this.elementos.inputCodigo.focus();
    }
  }
}
