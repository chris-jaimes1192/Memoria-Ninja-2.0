const RUTA_BACK = "assets/img/back.png";
const RUTA_ALDEAS = "assets/img/cards/aldeas/";
const IDS = ["1","2","3","4","5","6","7","8"];
const TOTAL_PAREJAS = 8;
const PUNTOS_POR_PAREJA = 10;

const ALDEA = "arena";

let cartasVolteadas = [];
let movimientos = 0;
let parejasEncontradas = 0;
let puntajeActual = 0;

let onResultado = null;
let onPartidaCompletada = null;
let onEsMiTurno = null;

let modoOnline = false;
let alVoltearOnline = null;

function obtenerCartasOcultas() {
    const tablero = document.getElementById("board");

    if (!tablero) return [];

    return [...tablero.querySelectorAll(".card")]
        .filter(carta =>
            !carta.classList.contains("volteada") &&
            !carta.classList.contains("emparejada")
        );
}

function actualizarMovimientos() {
    const el = document.getElementById("moves");
    if (el) el.textContent = movimientos;
}

function cartaPorIndice(index) {
    const tablero = document.getElementById("board");
    if (!tablero) return null;
    return tablero.querySelector(`.card[data-index="${Number(index)}"]`);
}

function mostrarFrente(carta, valor, aldea) {
    if (!carta || !valor) return;
    carta.dataset.valor = valor;
    carta.dataset.aldea = aldea || ALDEA;
    const img = carta.querySelector("img");
    if (img) img.src = `${RUTA_ALDEAS}${aldea || ALDEA}/${valor}.png`;
    carta.classList.add("volteada");
}

export const BoardManager = {
    obtenerCartasParaByakugan() {
        const cartas = obtenerCartasOcultas();

        if (cartas.length < 2) {
            return [];
        }

        const mezcladas = [...cartas]
            .sort(() => Math.random() - 0.5);

        return mezcladas.slice(0, 2);
    },

    obtenerCartaParaSello() {
        const cartas = obtenerCartasOcultas()
            .filter(carta => !carta.classList.contains("carta-sellada"));

        if (cartas.length === 0) {
            return null;
        }

        const indice = Math.floor(Math.random() * cartas.length);
        return cartas[indice];
    },

    habilitarModoOnline(opciones = {}) {
        modoOnline = true;
        alVoltearOnline = typeof opciones.alVoltear === "function" ? opciones.alVoltear : null;
    },

    deshabilitarModoOnline() {
        modoOnline = false;
        alVoltearOnline = null;
    },

    bloquearTablero(bloqueado) {
        const tablero = document.getElementById("board");
        if (tablero) tablero.classList.toggle("bloqueado-turno", !!bloqueado);
    },

    revelarCartaRemota(index, valor, aldea, emparejada = false) {
        const carta = cartaPorIndice(index);
        if (!carta) return;
        mostrarFrente(carta, valor, aldea);
        if (emparejada) carta.classList.add("emparejada");
    },

    marcarEmparejadas(index1, index2) {
        for (const index of [index1, index2]) {
            const carta = cartaPorIndice(index);
            if (carta) carta.classList.add("emparejada");
        }
    },

    ocultarCartasRemotas(index1, index2, espera = 800) {
        setTimeout(() => {
            for (const index of [index1, index2]) {
                const carta = cartaPorIndice(index);
                if (!carta || carta.classList.contains("emparejada")) continue;
                carta.classList.remove("volteada");
                const img = carta.querySelector("img");
                if (img) img.src = RUTA_BACK;
            }
        }, espera);
    },

    revelarTemporal(index, valor, aldea, duracion = 3000) {
        const carta = cartaPorIndice(index);
        if (!carta || !valor || carta.classList.contains("emparejada")) return;
        carta.dataset.valor = valor;
        carta.dataset.aldea = aldea || ALDEA;
        const img = carta.querySelector("img");
        if (img) img.src = `${RUTA_ALDEAS}${aldea || ALDEA}/${valor}.png`;
        carta.classList.add("byakugan-revelada");
        setTimeout(() => {
            if (carta.classList.contains("volteada") || carta.classList.contains("emparejada")) return;
            const imagen = carta.querySelector("img");
            if (imagen) imagen.src = RUTA_BACK;
            carta.classList.remove("byakugan-revelada");
        }, duracion);
    },

    sellarCarta(index, duracion = 5000) {
        const carta = cartaPorIndice(index);
        if (!carta || carta.classList.contains("emparejada")) return;
        carta.classList.add("carta-sellada");
        if (!carta.querySelector(".sello-icono-carta")) {
            const icono = document.createElement("div");
            icono.className = "sello-icono-carta";
            icono.textContent = "封";
            carta.appendChild(icono);
        }
        clearTimeout(carta._selloTimeout);
        carta._selloTimeout = setTimeout(() => this.quitarSello(index), Math.max(0, duracion));
    },

    quitarSello(index) {
        const carta = cartaPorIndice(index);
        if (!carta) return;
        carta.classList.remove("carta-sellada");
        carta.querySelector(".sello-icono-carta")?.remove();
        clearTimeout(carta._selloTimeout);
        carta._selloTimeout = null;
    },

    aplicarMezcla(cartas) {
        for (const datos of cartas || []) {
            const carta = cartaPorIndice(datos.index);
            if (!carta || !datos.valor) continue;
            carta.dataset.valor = datos.valor;
            carta.dataset.aldea = datos.aldea || ALDEA;
            const img = carta.querySelector("img");
            if (!img) continue;
            const visible = carta.classList.contains("volteada") || carta.classList.contains("byakugan-revelada");
            img.src = visible
                ? `${RUTA_ALDEAS}${datos.aldea || ALDEA}/${datos.valor}.png`
                : RUTA_BACK;
        }
    },

    aplicarEstadoSello(sello) {
        for (const carta of document.querySelectorAll(".card.carta-sellada")) {
            this.quitarSello(Number(carta.dataset.index));
        }
        if (sello && Number.isInteger(sello.index)) {
            this.sellarCarta(sello.index, Math.max(0, (sello.hasta || 0) - Date.now()));
        }
    },

    renderBoard(callbackResultado, callbackFinal, callbackEsMiTurno, mazoExterno = null) {
        onResultado = callbackResultado || null;
        onPartidaCompletada = callbackFinal || null;
        onEsMiTurno = callbackEsMiTurno || null;

        modoOnline = false;
        alVoltearOnline = null;

        const tablero = document.getElementById('board');
        tablero.innerHTML = '';

        cartasVolteadas = [];
        movimientos = 0;
        parejasEncontradas = 0;
        puntajeActual = 0;
        actualizarMovimientos();

        const usaMazo = Array.isArray(mazoExterno) && mazoExterno.length > 0;
        const valores = usaMazo
            ? mazoExterno
            : [...IDS, ...IDS].sort(() => Math.random() - 0.5);

        valores.forEach((entrada, idx) => {
            const valor = usaMazo && typeof entrada === "object" ? entrada.valor : entrada;
            const aldea = usaMazo && typeof entrada === "object" ? entrada.aldea : ALDEA;

            const carta = document.createElement('div');
            carta.className = 'card';
            carta.dataset.index = idx;
            if (valor) {
                carta.dataset.valor = valor;
                carta.dataset.aldea = aldea || ALDEA;
            }

            const img = document.createElement('img');
            img.src = RUTA_BACK;
            img.className = 'img-card';

            carta.appendChild(img);
            carta.addEventListener('click', () => this.voltearCarta(carta));
            tablero.appendChild(carta);

            if (usaMazo && entrada?.emparejada && valor) {
                mostrarFrente(carta, valor, aldea);
                carta.classList.add("emparejada");
            }
        });
    },

    voltearCarta(carta) {
        if (onEsMiTurno && !onEsMiTurno()) return;
        if (carta.classList.contains("carta-sellada")) return;
        if (carta.classList.contains("volteada") || carta.classList.contains("emparejada")) return;

        if (modoOnline) {
            if (!alVoltearOnline) return;
            alVoltearOnline(parseInt(carta.dataset.index, 10));
            return;
        }

        if (cartasVolteadas.length === 2) return;

        carta.classList.add('volteada');
        const aldeaCarta = carta.dataset.aldea || ALDEA;
        carta.querySelector('img').src = `${RUTA_ALDEAS}${aldeaCarta}/${carta.dataset.valor}.png`;

        cartasVolteadas.push(carta);

        if (cartasVolteadas.length === 2) {
            movimientos++;
            actualizarMovimientos();
            this.verificarCoincidencia();
        }
    },

    verificarCoincidencia() {
        const [c1, c2] = cartasVolteadas;
        if (!c1 || !c2) { cartasVolteadas = []; return; }
        const esAcierto = c1.dataset.valor === c2.dataset.valor;

        if (esAcierto) {
            c1.classList.add('emparejada');
            c2.classList.add('emparejada');
            cartasVolteadas = [];
            parejasEncontradas++;

            puntajeActual += PUNTOS_POR_PAREJA;

            if (onResultado) onResultado(true, puntajeActual);

            if (parejasEncontradas === TOTAL_PAREJAS) {
                if (onPartidaCompletada) onPartidaCompletada(movimientos, puntajeActual);
            }
        } else {
            if (onResultado) onResultado(false, puntajeActual);

            setTimeout(() => {
                try {
                    c1.classList.remove('volteada');
                    c2.classList.remove('volteada');
                    const img1 = c1.querySelector('img');
                    const img2 = c2.querySelector('img');
                    if (img1) img1.src = RUTA_BACK;
                    if (img2) img2.src = RUTA_BACK;
                } catch (e) {}
                cartasVolteadas = [];
            }, 800);
        }
    }
};
