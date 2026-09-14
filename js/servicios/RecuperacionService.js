/*=========================================================
  MEMORIA NINJA
  CAPA: SERVICIOS (lógica de negocio)
  ARCHIVO: servicios/RecuperacionService.js

  SRP: coordina las 3 reglas de negocio del flujo de
  recuperación (buscar correo, validar código, cambiar
  contraseña), sin tocar el DOM.

  DIP + ISP: depende de IUsuarioLector + IUsuarioEscritor
  (necesita leer para buscar el correo y escribir para
  actualizar la contraseña) e ICodigoGenerador, todas
  abstracciones inyectadas por constructor. Nota que aquí se
  inyecta un CodigoNumericoGenerador, mientras que en
  VerificacionService se inyecta un CodigoAlfanumericoGenerador:
  mismo servicio "tipo", distinta estrategia, cero código
  duplicado de generación.
=========================================================*/

export class RecuperacionService {
  #codigoActual = null;
  #correoActual = "";

  /**
   * @param {import("../core/interfaces/IUsuarioLector.js").IUsuarioLector & import("../core/interfaces/IUsuarioEscritor.js").IUsuarioEscritor} repositorioUsuarios
   * @param {import("../core/interfaces/ICodigoGenerador.js").ICodigoGenerador} generadorCodigo
   */
  constructor(repositorioUsuarios, generadorCodigo) {
    this.repositorioUsuarios = repositorioUsuarios;
    this.generadorCodigo = generadorCodigo;
  }

  solicitarRecuperacion(correo) {
    const usuario = this.repositorioUsuarios.buscarPorCorreo(correo);
    if (!usuario) {
      throw new Error("Ese correo no esta registrado.");
    }

    this.#correoActual = correo;
    this.#codigoActual = this.generadorCodigo.generar();
    return this.#codigoActual;
  }

  verificarCodigo(codigoIngresado) {
    if (codigoIngresado !== this.#codigoActual) {
      throw new Error("Codigo incorrecto.");
    }
    return true;
  }

  cambiarPassword(nuevaPassword, confirmarPassword) {
    if (nuevaPassword !== confirmarPassword) {
      throw new Error("Las contraseñas no coinciden.");
    }

    const usuario = this.repositorioUsuarios.buscarPorCorreo(this.#correoActual);
    if (!usuario) {
      throw new Error("Usuario no encontrado.");
    }

    usuario.actualizarPassword(nuevaPassword);
    this.repositorioUsuarios.actualizar(usuario);
  }
}
