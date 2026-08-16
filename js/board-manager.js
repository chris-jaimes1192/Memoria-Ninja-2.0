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

let onResultado = null;        // avisa acierto o error
let onPartidaCompletada = null;

// NUEVO: callback que game-online.js manda para preguntar
// "¿me toca jugar a mí ahora?". Si no se pasa (queda null),
// el tablero funciona exactamente igual que antes, sin bloqueo.
let onEsMiTurno = null;


// ==========================================
// BYAKUGAN
// ==========================================

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

export const BoardManager = {
    // NUEVO: se agregó el tercer parámetro "callbackEsMiTurno".
    // Los dos primeros parámetros (callbackResultado, callbackFinal)
    // funcionan exactamente igual que antes.
        obtenerCartasParaByakugan() {

        const cartas = obtenerCartasOcultas();

        if (cartas.length < 2) {
            return [];
        }

        // Mezclamos las cartas disponibles
        const mezcladas = [...cartas]
            .sort(() => Math.random() - 0.5);

        // Tomamos solamente 2
        return mezcladas.slice(0, 2);
    },
    
    renderBoard(callbackResultado, callbackFinal, callbackEsMiTurno) {
        onResultado = callbackResultado || null;
        onPartidaCompletada = callbackFinal || null;
        onEsMiTurno = callbackEsMiTurno || null; // NUEVO

        const tablero = document.getElementById('board');
        tablero.innerHTML = '';

        cartasVolteadas = [];
        movimientos = 0;
        parejasEncontradas = 0;
        puntajeActual = 0;
        actualizarMovimientos();

        const valores = [...IDS, ...IDS];
        valores.sort(() => Math.random() - 0.5);

        valores.forEach(valor => {
            const carta = document.createElement('div');
            carta.className = 'card';
            carta.dataset.valor = valor;

            const img = document.createElement('img');
            img.src = RUTA_BACK;
            img.className = 'img-card';

            carta.appendChild(img);
            carta.addEventListener('click', () => this.voltearCarta(carta));
            tablero.appendChild(carta);
        });
    },

    voltearCarta(carta) {
        // NUEVO: si hay un callback de turno y dice que no te toca,
        // no se deja voltear la carta. Si no hay callback (onEsMiTurno
        // sigue en null), esta línea no hace nada y el juego se
        // comporta exactamente igual que antes.
        if (onEsMiTurno && !onEsMiTurno()) return;

        if (carta.classList.contains('volteada') || cartasVolteadas.length === 2) return;

        carta.classList.add('volteada');
        carta.querySelector('img').src = `${RUTA_ALDEAS}${ALDEA}/${carta.dataset.valor}.png`;

        cartasVolteadas.push(carta);

        if (cartasVolteadas.length === 2) {
            movimientos++;
            actualizarMovimientos();
            this.verificarCoincidencia();
        }
    },

    verificarCoincidencia() {
        const [c1, c2] = cartasVolteadas;
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
                c1.classList.remove('volteada');
                c2.classList.remove('volteada');
                c1.querySelector('img').src = RUTA_BACK;
                c2.querySelector('img').src = RUTA_BACK;
                cartasVolteadas = [];
            }, 800);
        }
    }
};