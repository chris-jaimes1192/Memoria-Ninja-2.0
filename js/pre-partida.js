import { RepositorioClanes } from "./core-navegacion/RepositorioClanes.js";
import { VistaClan } from "./core-navegacion/VistaClan.js";

/**
 * PrePartidaController
 *
 * >>> SRP <<< Decide QUÉ clan mostrar (a partir de localStorage) y
 * QUÉ pasa al confirmar/iniciar. Delega el CÓMO se ve en VistaClan y
 * el DÓNDE están los datos en RepositorioClanes.
 * >>> DIP <<< Recibe ambas dependencias por constructor.
 */
class PrePartidaController {
    constructor(repositorioClanes, vistaClan) {
        this.repositorioClanes = repositorioClanes;
        this.vistaClan = vistaClan;
        this.claveActual = null;
    }

    iniciar() {
        const nivelGuardado = localStorage.getItem("nivelActual");
        const idInicial = this.repositorioClanes.existe(nivelGuardado) ? nivelGuardado : "uzumaki";

        this._seleccionarClan(idInicial);

        // Ya viene con nivel elegido desde el mapa, así que se muestra el botón de una
        this.vistaClan.mostrarBotonIniciar();

        document.getElementById("btn-iniciar").addEventListener("click", () => this._irAJugar());
    }

    _seleccionarClan(idClan) {
        const clan = this.repositorioClanes.obtener(idClan);
        if (!clan) return;

        this.claveActual = idClan;
        this.vistaClan.mostrar(clan);
    }

    seleccionarClan(idClan) {
        this._seleccionarClan(idClan);
    }

    confirmarNivel() {
        this.vistaClan.mostrarBotonIniciar();
        this.vistaClan.marcarConfirmado();
    }

    _irAJugar() {
        const destino = this.repositorioClanes.obtenerDestinoJuego(this.claveActual);
        if (destino) window.location.href = destino;
    }
}

// ================== RAÍZ DE COMPOSICIÓN ==================
const repositorioClanes = new RepositorioClanes();
const vistaClan = new VistaClan();
const prePartidaController = new PrePartidaController(repositorioClanes, vistaClan);

// Se mantiene window.confirmarNivel por compatibilidad, pero el botón se
// conecta por listener (el CSP bloquea los onclick inline).
window.confirmarNivel = () => prePartidaController.confirmarNivel();

// --- Conexión real con el DOM (sin onclick inline: el CSP lo bloquea) ---
document.getElementById("btn-confirmar")?.addEventListener("click", () =>
  prePartidaController.confirmarNivel()
);

document.getElementById("btnVolverMenu")?.addEventListener("click", () => {
  window.location.href = "menu.html";
});

document.querySelectorAll("[data-clan]").forEach((boton) => {
  boton.addEventListener("click", () =>
    prePartidaController.seleccionarClan(boton.dataset.clan)
  );
});

prePartidaController.iniciar();
