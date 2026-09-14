import { Poder } from "./Poder.js";

const RUTA_ALDEAS = "../assets/aldeas/";
const RUTA_BACK = "../assets/cartas/back.png";
const DURACION_BYAKUGAN = 3000;

export class ByakuganPoder extends Poder {
    constructor() {
        super({
            id: "byakugan",
            nombre: "Byakugan",
            costoChakra: 30,
            usosIniciales: 2,
            botonId: "btnByakugan",
            contadorId: "usosByakugan",
        });
        this._activo = false;
    }

    // Reemplaza el "if (byakuganActivo) return;" del original
    estaBloqueado(contexto) {
        return this._activo;
    }

    // Reemplaza el chequeo de "cartas.length < 2" del original
    validarCondicionesExtra(contexto) {
        this._cartasParaRevelar = contexto.BoardManager.obtenerCartasParaByakugan();
        if (this._cartasParaRevelar.length < 2) {
            this.mostrarMensaje("NO HAY CARTAS DISPONIBLES");
            return false;
        }
        return true;
    }

    efecto(contexto, esSasuke) {
        this._activo = true;

        this._activarAnimacion(esSasuke);
        this._revelarCartas(this._cartasParaRevelar);

        // Contraataque: si Genjutsu está activo, Byakugan lo detecta y lo cancela
        if (contexto.genjutsu.estaActivo()) {
            contexto.genjutsu.cancelar(true);
        }
    }

    _activarAnimacion(esSasuke) {
        const selector = esSasuke
            ? ".panel-personaje-lateral .personaje-imagen"
            : ".panel-naruto-lateral .personaje-imagen";

        const avatar = document.querySelector(selector);
        if (avatar) {
            avatar.classList.add("byakugan-brillo-avatar");
            setTimeout(() => avatar.classList.remove("byakugan-brillo-avatar"), 600);
        }

        const simbolo = document.createElement("div");
        simbolo.className = "byakugan-simbolo-central";
        simbolo.textContent = "👁️ BYAKUGAN";
        document.body.appendChild(simbolo);
        setTimeout(() => simbolo.remove(), 900);
    }

    _revelarCartas(cartas) {
        cartas.forEach((carta) => {
            const imagen = carta.querySelector("img");
            if (!imagen) return;
            carta.dataset.backOriginal = imagen.src;
            imagen.src = `${RUTA_ALDEAS}arena/${carta.dataset.valor}.png`;
            carta.classList.add("byakugan-revelada");
        });

        setTimeout(() => {
            cartas.forEach((carta) => {
                const imagen = carta.querySelector("img");
                if (!imagen) return;
                imagen.src = RUTA_BACK;
                carta.classList.remove("byakugan-revelada");
            });
            this._activo = false;
        }, DURACION_BYAKUGAN);
    }
}
