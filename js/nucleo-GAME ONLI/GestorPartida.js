import { Personaje } from "./entidades/Personaje.js";
import { GestorTurno } from "./GestorTurno.js";
import { GestorTiempo } from "./GestorTiempo.js";
import { VistaPartida } from "./vista/VistaPartida.js";
import { GestorPoderes } from "./poderes/GestorPoderes.js";
import { ProveedorDatosSimulado } from "./datos/ProveedorDatosSimulado.js";
import { ProveedorDatosServidor } from "./datos/ProveedorDatosServidor.js";
import { UIManager } from "../ui-manager.js";
import { BoardManager } from "../board-manager.js";

const TIEMPO_INICIAL = 180;
const CHAKRA_POR_ACIERTO = 5;
const CHAKRA_BASE_COMBO = 3;
const VIDA_PERDIDA_POR_ERROR = 5;

const MODO_PRUEBA_LOCAL = true;
const MI_PERSONAJE_ES_SASUKE = true;

/**
 * GESTOR DE PARTIDA — raíz de composición del motor del juego.
 *
 * >>> DIP <<< Este es el ÚNICO lugar de todo el motor donde se hace
 * "new" de las clases concretas (Personaje, GestorTurno, GestorTiempo,
 * VistaPartida, GestorPoderes, ProveedorDatosSimulado). Todo lo demás
 * recibe sus dependencias por constructor o por el objeto "contexto",
 * nunca las crea por su cuenta.
 *
 * >>> SRP a nivel orquestador <<< esta clase no contiene NINGUNA regla
 * de negocio de un poder puntual, ni maneja el DOM directamente para
 * animaciones — solo conecta las piezas y reacciona a los eventos del
 * tablero (aciertos/errores) y del turno.
 */
export class GestorPartida {
    constructor() {
        const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
        this.esSalaOnline = !!params?.get("codigo");
        this.mazoOnline = null;
        this.gestorSala = null;
        this.iniciado = false;

        this.jugador = new Personaje({ nombre: "SASUKE", nivel: 18, chakraInicial: 70 });
        this.rival = new Personaje({ nombre: "NARUTO", nivel: 20, chakraInicial: 65 });

        this.gestorTurno = new GestorTurno({
            modoPruebaLocal: MODO_PRUEBA_LOCAL,
            miPersonajeEsSasuke: MI_PERSONAJE_ES_SASUKE,
        });

        this.gestorTiempo = new GestorTiempo(TIEMPO_INICIAL);
        this.vista = new VistaPartida();

        // >>> LSP en vivo <<< El proveedor de datos real crea y persiste
        // la partida en el backend (SQLite). Si el servidor no responde,
        // ProveedorDatosServidor cae solo al simulado: el juego no se rompe.
        this.proveedorDatos = new ProveedorDatosServidor({
            jugador: this.jugador,
            rival: this.rival,
            respaldo: new ProveedorDatosSimulado(),
        });

        this.puntajeActual = 0;
        this.partidaFinalizada = false;

        const contexto = {
            esOnline: this.esSalaOnline,
            esMiTurno: () => this.gestorTurno.esMiTurno(),
            esTurnoDeSasuke: () => this.gestorTurno.esTurnoDeSasuke(),
            jugadorActivo: () => (this.gestorTurno.esTurnoDeSasuke() ? this.jugador : this.rival),
            obtenerRivalDe: (esSasuke) => (esSasuke ? this.rival : this.jugador),
            actualizarChakra: () => this.vista.renderChakra(this.jugador, this.rival),
            perderVida: (esSasukeObjetivo, cantidad) => {
                const objetivo = esSasukeObjetivo ? this.jugador : this.rival;
                objetivo.recibirDanio(cantidad);
                this.vista.renderVida(this.jugador, this.rival);
            },
            mostrarAvisoRapido: (mensaje) => this.vista.mostrarAvisoRapido(mensaje),
            BoardManager,
            // Hook OPCIONAL que avisa al backend cada vez que un poder se
            // activa. Con proveedores simulados no hace nada.
            notificarPoderAlServidor: (idPoder, esSasuke) =>
                this.proveedorDatos.notificarPoder(idPoder, esSasuke),
        };

        this.gestorPoderes = new GestorPoderes(contexto);

        this.gestorTurno.alCambiarTurno((esTurnoDeSasuke) => {
            this.vista.renderTurno(esTurnoDeSasuke);
            this.gestorPoderes.poderes.forEach((poder) => poder._actualizarUsosUI(esTurnoDeSasuke));
        });
    }

    async iniciar(opciones = {}) {
        if (this.iniciado) return;
        this.iniciado = true;

        const esSalaOnline = opciones.esSalaOnline ?? this.esSalaOnline;
        this.esSalaOnline = esSalaOnline;
        let estadoInicial = null;

        if (esSalaOnline) {
            this.activarEventosOnline();
            try {
                const mod = await import('../multijugador/GestorSalaCliente.js');
                this.gestorSala = mod.gestorSalaCliente;
                estadoInicial = await this.gestorSala.iniciar({ codigoSala: opciones.codigoSala });
            } catch (error) {
                this.mostrarErrorConexion(error.message);
                return;
            }
            if (!estadoInicial) return;
            this.mazoOnline = estadoInicial.mazo;
        }

        BoardManager.renderBoard(
            (esAcierto, puntajeTotal) => {
                if (esSalaOnline) return;
                this.procesarResultado(esAcierto, puntajeTotal);
            },
            (movimientos, puntaje) => {
                if (esSalaOnline) return;
                this.mostrarModalFinal(movimientos, puntaje);
            },
            () => {
                if (esSalaOnline && this.gestorSala) return this.gestorSala.esMiTurno;
                return this.gestorTurno.esMiTurno();
            },
            esSalaOnline ? this.mazoOnline : opciones.mazo || this.mazoExterno
        );

        if (esSalaOnline) {
            BoardManager.habilitarModoOnline({
                alVoltear: (index) => this.gestorSala?.voltearCarta(index),
            });
            this.vista.cargarPanelSuperior();
            this.gestorSala.refrescarUI();
            this.vista.bindBotonesModal();
            document.querySelector('a.boton[href="menu.html"]')
                ?.addEventListener('click', () => this.gestorSala?.abandonar());
            console.log(`Partida online iniciada en la sala ${this.gestorSala.codigoSala}.`);
            return;
        }

        try {
            const data = await this.proveedorDatos.obtenerDatos();
            UIManager.renderPlayers(data.players);
        } catch (error) {
            console.warn("No se pudieron cargar los datos del proveedor (no afecta al tablero):", error);
        }

        this.vista.cargarPanelSuperior();
        this.vista.cargarPanelJugador(this.jugador);
        this.vista.cargarPanelRival(this.rival);
        this.vista.bindBotonesModal();

        this.gestorTiempo.iniciar((tiempoSasuke, tiempoNaruto) => {
            if (this.partidaFinalizada) return;

            const seAgotoElTiempo = this.gestorTiempo.descontarSegundo(this.gestorTurno.esTurnoDeSasuke());
            this.vista.renderTiempos(this.gestorTiempo.tiempoSasuke, this.gestorTiempo.tiempoNaruto, this.gestorTurno.esTurnoDeSasuke(), GestorTiempo.formatear);

            if (seAgotoElTiempo) this.gestorTiempo.detener();
        });

        this.vista.renderTurno(this.gestorTurno.esTurnoDeSasuke());
        this.vista.renderVida(this.jugador, this.rival);

        console.log("Motor de partida iniciado correctamente.");
    }

    activarEventosOnline() {
        if (this.eventosOnlineActivos) return;
        this.eventosOnlineActivos = true;

        window.addEventListener('partida-terminada-online', (ev) => {
            this.mostrarModalFinalOnline(ev.detail || {});
        });

        window.addEventListener('jugador-desconectado-online', (ev) => {
            const detalle = ev.detail || {};
            const espera = detalle.segundos ? `${detalle.segundos}s` : "unos segundos";
            const quien = detalle.jugadorId === this.gestorSala?.miId ? "Tu conexión" : `${detalle.nombre || "El rival"}`;
            this.vista.mostrarAvisoRapido(`${quien} se desconectó. Esperando ${espera}...`);
            BoardManager.bloquearTablero(true);
        });

        window.addEventListener('jugador-reconectado-online', (ev) => {
            this.vista.mostrarAvisoRapido(`${ev.detail?.nombre || "El rival"} se reconectó.`);
        });

        window.addEventListener('sala-error-online', (ev) => {
            this.mostrarErrorConexion(ev.detail?.mensaje);
        });
    }

    mostrarErrorConexion(mensaje) {
        const texto = mensaje || "No se pudo conectar con la sala.";
        document.getElementById("onlineEstado")?.removeAttribute("hidden");
        const estado = document.getElementById("onlineEstado");
        if (estado) estado.textContent = `ERROR DE SALA · ${texto}`;
        this.vista.mostrarAvisoRapido(texto);
    }

    procesarResultado(esAcierto, puntajeTotal) {
        this.puntajeActual = puntajeTotal;
        this.vista.renderPuntaje(this.puntajeActual);

        const esSasuke = this.gestorTurno.esTurnoDeSasuke();
        const actor = esSasuke ? this.jugador : this.rival;

        if (esAcierto) {
            actor.registrarAcierto();
            this.vista.renderAciertoJugador(esSasuke, actor);
            this.vista.renderCombo(this.jugador, this.rival);

            actor.ganarChakra(CHAKRA_POR_ACIERTO);
            this.vista.renderChakra(this.jugador, this.rival);

            if (actor.combo >= 2) this._ganarChakraPorCombo(esSasuke, actor);
        } else {
            if (this.gestorPoderes.sustitucion.estaArmada(esSasuke)) {
                this.gestorPoderes.sustitucion.desarmar(esSasuke);
                this.gestorPoderes.sustitucion.notificarUsoDefensivo();
            } else {
                const teniaCombo = actor.registrarError();
                this.vista.renderErrorJugador(esSasuke, actor);
                if (teniaCombo) this.vista.mostrarComboRoto(esSasuke);

                this._perderVida(esSasuke, VIDA_PERDIDA_POR_ERROR);
                this.gestorTurno.cambiar();
            }
        }
    }

    _perderVida(esSasukeObjetivo, cantidad) {
        const objetivo = esSasukeObjetivo ? this.jugador : this.rival;
        objetivo.recibirDanio(cantidad);
        this.vista.renderVida(this.jugador, this.rival);
    }

    _ganarChakraPorCombo(esSasuke, actor) {
        const bono = CHAKRA_BASE_COMBO * actor.combo;
        actor.ganarChakra(bono);
        this.vista.renderChakra(this.jugador, this.rival);
        this.vista.mostrarBonoChakraVisual(esSasuke, bono);
        this.vista.mostrarBonificacionCombo(actor.combo, bono);
    }

    mostrarModalFinal(movimientosFinales, puntajeFinal) {
        if (this.partidaFinalizada) return;
        this.partidaFinalizada = true;
        try { this.gestorTiempo.detener(); } catch (e) {}
        this.vista.mostrarModalFinal(
            movimientosFinales, puntajeFinal, this.jugador, this.rival,
            GestorTiempo.formatear, this.gestorTiempo.tiempoSasuke, this.gestorTiempo.tiempoNaruto
        );
    }

    mostrarModalFinalOnline(datos = {}) {
        if (this.partidaFinalizada) return;
        this.partidaFinalizada = true;
        try { this.gestorTiempo.detener(); } catch (e) {}
        BoardManager.bloquearTablero(true);

        const miId = this.gestorSala?.miId;
        const empate = !datos.ganadorId;
        const soyGanador = datos.ganadorId === miId;
        const resultado = empate ? "EMPATE" : soyGanador ? "¡VICTORIA!" : "DERROTA";
        const motivo = datos.motivo === "abandono" ? " (por abandono del rival)" : "";

        const parejas = datos.parejas || {};
        const misParejas = parejas[miId] || 0;
        const rivalId = this.gestorSala?.rivalId();
        const parejasRival = rivalId ? parejas[rivalId] || 0 : 0;

        if (this.vista.finalStats) {
            const fuerte = document.createElement("strong");
            fuerte.textContent = `${resultado}${motivo}`;
            const detalle = [
                `${this.gestorSala?.miNombre || "Jugador"}: ${misParejas} parejas`,
                `${this.gestorSala?.rivalNombre || "Rival"}: ${parejasRival} parejas`,
                `Movimientos: ${datos.movimientos ?? 0}`,
                `Sala: ${datos.codigo || this.gestorSala?.codigoSala || "--"}`,
            ];
            const fragmento = document.createDocumentFragment();
            fragmento.appendChild(fuerte);
            for (const linea of detalle) {
                fragmento.appendChild(document.createElement("br"));
                fragmento.appendChild(document.createTextNode(linea));
            }
            this.vista.finalStats.replaceChildren(fragmento);
        }
        if (this.vista.modal) this.vista.modal.classList.remove("hidden");
    }
}
