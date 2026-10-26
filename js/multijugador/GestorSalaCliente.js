import { clienteMultijugador } from "./ClienteMultijugador.js";
import { BoardManager } from "../board-manager.js";

export class GestorSalaCliente {
  constructor() {
    this.codigoSala = null;
    this.miId = null;
    this.miNombre = "Jugador";
    this.rivalNombre = "Rival";
    this.estado = null;
    this.esMiTurno = false;
    this.iniciado = false;
    this.listenersRegistrados = false;
    this.promesaPartida = null;
    this.resolverPartida = null;
  }

  async iniciar(opciones = {}) {
    if (this.iniciado) return this.estado;

    const params = new URLSearchParams(window.location.search);
    this.codigoSala = (opciones.codigoSala || params.get("codigo") || "").toUpperCase();
    if (!this.codigoSala) {
      this.iniciado = true;
      return null;
    }

    await clienteMultijugador.conectar();
    this.miId = clienteMultijugador.token;
    this.registrarEventos();

    const respuesta = await clienteMultijugador.reincorporarseSala(this.codigoSala);
    if (!respuesta?.exito) {
      this.iniciado = true;
      this.mostrarErrorSala(respuesta?.error || "No se pudo entrar a la sala.");
      return null;
    }

    this.aplicarEstado(respuesta.estado);
    this.iniciado = true;

    if (this.estado?.estado === "jugando") return this.estado;

    this.esperandoInicio();
    return this.promesaPartida;
  }

  esperandoInicio() {
    if (!this.promesaPartida) {
      this.promesaPartida = new Promise((resolve, reject) => {
        this.resolverPartida = resolve;
        this.temporizadorInicio = setTimeout(() => {
          reject(new Error("La partida no comenzó. El rival no se unió a tiempo."));
        }, 120000);
      });
    }
    return this.promesaPartida;
  }

  registrarEventos() {
    if (this.listenersRegistrados) return;
    this.listenersRegistrados = true;

    clienteMultijugador.on("partida-iniciada", (estado) => {
      this.aplicarEstado(estado);
      if (this.resolverPartida) {
        clearTimeout(this.temporizadorInicio);
        const resolver = this.resolverPartida;
        this.resolverPartida = null;
        this.promesaPartida = null;
        resolver(this.estado);
      }
    });

    clienteMultijugador.on("carta-volteada", (datos) => {
      BoardManager.revelarCartaRemota(datos.index, datos.valor, datos.aldea);
    });

    clienteMultijugador.on("acierto", (datos) => {
      BoardManager.marcarEmparejadas(datos.index1, datos.index2);
      if (this.estado) {
        this.estado.movimientos = datos.movimientos;
        this.estado.parejas = datos.parejas || this.estado.parejas;
        this.estado.turno = datos.turno;
      }
      this.refrescarMarcadores();
      this.actualizarTurno(datos.turno);
    });

    clienteMultijugador.on("fallo", (datos) => {
      BoardManager.bloquearTablero(true);
      BoardManager.ocultarCartasRemotas(datos.index1, datos.index2, 800);
    });

    clienteMultijugador.on("turno-cambiado", (datos) => {
      if (this.estado) this.estado.turno = datos.turno;
      this.actualizarTurno(datos.turno);
    });

    clienteMultijugador.on("partida-terminada", (datos) => {
      if (this.estado) this.estado.estado = "terminada";
      BoardManager.bloquearTablero(true);
      window.dispatchEvent(new CustomEvent("partida-terminada-online", { detail: datos }));
    });

    clienteMultijugador.on("jugador-desconectado", (datos) => {
      BoardManager.bloquearTablero(true);
      window.dispatchEvent(new CustomEvent("jugador-desconectado-online", { detail: datos }));
    });

    clienteMultijugador.on("jugador-reconectado", (datos) => {
      BoardManager.bloquearTablero(!this.esMiTurno);
      window.dispatchEvent(new CustomEvent("jugador-reconectado-online", { detail: datos }));
    });

    clienteMultijugador.on("poder-activado", (datos) => {
      window.dispatchEvent(new CustomEvent("poder-activado-online", { detail: datos }));
    });

    clienteMultijugador.on("error-sesion", (datos) => {
      this.mostrarErrorSala(datos?.error || "Sesión de sala inválida.");
    });

    window.addEventListener("desconectado", () => {
      this.actualizarEstadoConexion("SIN CONEXIÓN · reintentando...");
      BoardManager.bloquearTablero(true);
    });

    window.addEventListener("reconectado", () => {
      if (!this.codigoSala) return;
      this.actualizarEstadoConexion();
      clienteMultijugador
        .reincorporarseSala(this.codigoSala)
        .then((respuesta) => {
          if (respuesta?.exito) {
            this.aplicarEstado(respuesta.estado);
            if (this.estado?.cartasVolteadas?.length) {
              for (const carta of this.estado.cartasVolteadas) {
                BoardManager.revelarCartaRemota(carta.index, carta.valor, carta.aldea);
              }
            }
          }
        })
        .catch(() => {});
    });

  }

  aplicarEstado(estado) {
    if (!estado) return;
    this.estado = estado;
    this.codigoSala = estado.codigo || this.codigoSala;
    this.esMiTurno = estado.turno === this.miId;

    const yo = estado.jugadores.find((j) => j.id === this.miId);
    const rival = estado.jugadores.find((j) => j.id !== this.miId);
    this.miNombre = yo?.nombre || "Jugador";
    this.rivalNombre = rival?.nombre || "Rival";

    window.dispatchEvent(new CustomEvent("sala-lista-online", { detail: estado }));
    this.refrescarUI();
  }

  refrescarUI() {
    const estado = this.estado;
    if (!estado) return;

    const nombres = document.querySelectorAll(
      ".panel-personaje-lateral .nombre-personaje, .panel-naruto-lateral .nombre-personaje"
    );
    if (nombres[0]) nombres[0].textContent = this.miNombre;
    if (nombres[1]) nombres[1].textContent = this.rivalNombre;

    const tiempo = document.getElementById("timer");
    if (tiempo) tiempo.textContent = "—";

    this.refrescarMarcadores();
    this.actualizarEstadoConexion();
    this.actualizarTurno(estado.turno);

    if (Array.isArray(estado.mazo)) {
      estado.mazo.forEach((carta, index) => {
        if (carta?.emparejada && carta.valor) {
          BoardManager.revelarCartaRemota(index, carta.valor, carta.aldea, true);
        }
      });
    }
    if (Array.isArray(estado.cartasVolteadas)) {
      for (const carta of estado.cartasVolteadas) {
        BoardManager.revelarCartaRemota(carta.index, carta.valor, carta.aldea);
      }
    }
  }

  refrescarMarcadores() {
    if (!this.estado) return;
    const movimientos = document.getElementById("moves");
    const puntaje = document.getElementById("score");
    if (movimientos) movimientos.textContent = this.estado.movimientos ?? 0;
    if (puntaje) puntaje.textContent = (this.estado.parejas?.[this.miId] || 0) * 10;
  }

  actualizarEstadoConexion(texto) {
    const el = document.getElementById("onlineEstado");
    if (!el) return;
    el.hidden = false;
    el.textContent =
      texto ||
      `SALA ${this.codigoSala} · ${this.miNombre} vs ${this.rivalNombre} · PAREJAS ${this.estado?.parejas?.[this.miId] || 0} - ${this.estado?.parejas?.[this.rivalId()] || 0}`;
  }

  rivalId() {
    return this.estado?.jugadores?.find((j) => j.id !== this.miId)?.id || null;
  }

  actualizarTurno(turnoId) {
    if (!turnoId) return;
    this.esMiTurno = turnoId === this.miId;
    const turnoSasuke = document.getElementById("turnoSasuke");
    const turnoNaruto = document.getElementById("turnoNaruto");
    if (turnoSasuke) {
      turnoSasuke.textContent = this.esMiTurno ? "TU TURNO" : "";
      turnoSasuke.classList.toggle("turno-activo", this.esMiTurno);
    }
    if (turnoNaruto) {
      turnoNaruto.textContent = !this.esMiTurno ? "TURNO RIVAL" : "";
      turnoNaruto.classList.toggle("turno-activo", !this.esMiTurno);
    }
    BoardManager.bloquearTablero(!this.esMiTurno);
  }

  voltearCarta(index) {
    if (!this.estado || this.estado.estado !== "jugando") return false;
    if (!this.esMiTurno) return false;
    clienteMultijugador.voltearCarta(index);
    return true;
  }

  mostrarErrorSala(mensaje) {
    const el = document.getElementById("onlineEstado");
    if (el) {
      el.hidden = false;
      el.textContent = `ERROR DE SALA · ${mensaje}`;
    }
    window.dispatchEvent(new CustomEvent("sala-error-online", { detail: { mensaje } }));
  }

  abandonar() {
    clienteMultijugador.abandonarSala();
  }
}

export const gestorSalaCliente = new GestorSalaCliente();
