import { RepositorioClanes } from "./core-navegacion/RepositorioClanes.js";
import { VistaClan } from "./core-navegacion/VistaClan.js";

/**
 * PrePartidaController
 *
 * >>> SRP <<< Decide QU├ë clan mostrar (a partir de localStorage) y
 * QU├ë pasa al confirmar/iniciar. Delega el C├ôMO se ve en VistaClan y
 * el D├ôNDE est├ín los datos en RepositorioClanes.
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
        if (this.vistaClan.estaConfirmado()) return;

        this.vistaClan.mostrarBotonIniciar();
        this.vistaClan.marcarConfirmado();
    }

    _irAJugar() {
        const destino = this.repositorioClanes.obtenerDestinoJuego(this.claveActual);
        if (destino) window.location.href = destino;
    }
}

// ================== RA├ìZ DE COMPOSICI├ôN ==================
const repositorioClanes = new RepositorioClanes();
const vistaClan = new VistaClan();
const prePartidaController = new PrePartidaController(repositorioClanes, vistaClan);

// Se mantiene window.confirmarNivel por compatibilidad, pero el bot├│n se
// conecta por listener (el CSP bloquea los onclick inline).
window.confirmarNivel = () => prePartidaController.confirmarNivel();

// --- Conexi├│n real con el DOM (sin onclick inline: el CSP lo bloquea) ---
document.getElementById("btn-confirmar")?.addEventListener("click", () =>
  prePartidaController.confirmarNivel()
);

document.getElementById("btnVolverMenu")?.addEventListener("click", () => {
  window.location.href = "menu.html";
});

document.getElementById("btn-cambiar-nivel")?.addEventListener("click", () => {
  window.location.href = "niveles.html";
});

prePartidaController.iniciar();

// Ajuste sin scroll (móvil H/V): escala el contenido como PC para que quepa en pantalla.
function ajustarPrePartida() {
    const cont = document.querySelector(".game-container");
    if (!cont) return;
    cont.style.transform = "";
    cont.style.transformOrigin = "top center";
    const baseW = 1100;
    const baseH = cont.scrollHeight || 760;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const escala = Math.min(vw / baseW, vh / baseH, 1);
    if (escala < 1) {
        cont.style.transform = `scale(${escala})`;
    }
}
window.addEventListener("resize", ajustarPrePartida);
window.addEventListener("orientationchange", () => setTimeout(ajustarPrePartida, 120));
setTimeout(ajustarPrePartida, 80);
setTimeout(ajustarPrePartida, 350);
