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

    /** Reemplaza a los dos "window.onload" separados que había antes — ahora es uno solo. */
    async iniciar() {
        BoardManager.renderBoard(
            (esAcierto, puntajeTotal) => this.procesarResultado(esAcierto, puntajeTotal),
            (movimientos, puntaje) => this.mostrarModalFinal(movimientos, puntaje),
            () => this.gestorTurno.esMiTurno()
        );

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
        this.partidaFinalizada = true;
        this.gestorTiempo.detener();
        this.vista.mostrarModalFinal(
            movimientosFinales, puntajeFinal, this.jugador, this.rival,
            GestorTiempo.formatear, this.gestorTiempo.tiempoSasuke, this.gestorTiempo.tiempoNaruto
        );
    }
}
