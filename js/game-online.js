import { MockServer } from './mock-server.js';
import { UIManager } from './ui-manager.js';
import { BoardManager } from './board-manager.js';

window.onload = () => {
    const data = MockServer.getData();
    UIManager.renderPlayers(data.players);

    // CAMBIO: se agrega "esMiTurno" como tercer argumento.
    // No se tocó nada de lo que ya estaba, solo se sumó un parámetro más.
    BoardManager.renderBoard(procesarResultado, mostrarModalFinal, esMiTurno);

    iniciarTemporizadores();
    actualizarIndicadorTurno();
    console.log("Sistema modular iniciado correctamente.");
};

/*==================================================
                MEMORIA NINJA ONLINE
                GAME-ONLINE.JS
==================================================*/

/*==================================================
                ELEMENTOS DEL DOM
==================================================*/

// ---------- Barra superior ----------

const tiempo = document.getElementById("timer");
const movimientos = document.getElementById("moves");
const puntaje = document.getElementById("score");
const btnConfiguracion = document.getElementById("settingsButton");

// ---------- Turno + tiempo individual (NUEVO) ----------
// Estos elementos hay que agregarlos al HTML dentro de cada
// personaje-header (ver mensaje aparte con el snippet a pegar).

const turnoSasuke = document.getElementById("turnoSasuke");
const turnoNaruto = document.getElementById("turnoNaruto");

const tiempoSasuke = document.getElementById("tiempoSasuke");
const tiempoNaruto = document.getElementById("tiempoNaruto");
const comboSasuke = document.getElementById("comboSasuke");
const comboNaruto = document.getElementById("comboNaruto");

const chakraTextoSasuke = document.getElementById("chakraTextoSasuke");
const chakraTextoNaruto = document.getElementById("chakraTextoNaruto");
const chakraBarraSasuke = document.getElementById("chakraBarraSasuke");
const chakraBarraNaruto = document.getElementById("chakraBarraNaruto");
// ---------- Panel jugador izquierdo ----------

const nombreJugador = document.getElementById("playerName");
const avatarJugador = document.getElementById("playerAvatar");
const chakraJugador = document.getElementById("playerChakra");
const chakraTextoJugador = document.getElementById("playerChakraText");

const aciertosJugador = document.getElementById("playerHits");
const erroresJugador = document.getElementById("playerErrors");
const comboJugador = document.getElementById("playerCombo");

// ---------- Panel jugador derecho ----------

const nombreRival = document.getElementById("enemyName");
const avatarRival = document.getElementById("enemyAvatar");
const chakraRival = document.getElementById("enemyChakra");
const chakraTextoRival = document.getElementById("enemyChakraText");

const aciertosRival = document.getElementById("enemyHits");
const erroresRival = document.getElementById("enemyErrors");
const comboRival = document.getElementById("enemyCombo");

// ---------- Tablero ----------

const tablero = document.getElementById("board");

// ---------- Panel inferior ----------

const listaEventos = document.getElementById("eventList");

const estadoPartida = document.getElementById("matchStatus");

const listaObjetivos = document.getElementById("objectives");

// ---------- Chat ----------

const chatMensajes = document.getElementById("chatMessages");

const inputMensaje = document.getElementById("chatInput");

const botonEnviar = document.getElementById("sendMessage");

// ---------- Modal de fin de partida ----------

const modal = document.getElementById("modal");
const finalStats = document.getElementById("finalStats");
const botonGuardar = document.getElementById("saveRecord");
const botonCerrar = document.getElementById("closeModal");

// ---------- Modales (no usados todavía) ----------

const modalVictoria = document.getElementById("victoryModal");

const modalDerrota = document.getElementById("defeatModal");

const modalCuentaRegresiva = document.getElementById("countdownModal");


/*==================================================
                VARIABLES DEL JUEGO
==================================================*/

let cartasVolteadas = [];

let cartasEmparejadas = [];

let movimientosActuales = 0;

let puntajeActual = 0;

let turnoJugador = true;   // true = turno de SASUKE, false = turno de NARUTO

let juegoIniciado = false;

let partidaFinalizada = false;

// ---------- Tiempo individual (NUEVO) ----------

let tiempoSasukeActual = 0;
let tiempoNarutoActual = 0;
let intervaloTiempo = null;


/*==================================================
                CONFIGURACIÓN
==================================================*/

const TOTAL_CARTAS = 16;

const TOTAL_PAREJAS = 8;

const CHAKRA_MAXIMO = 100;

const TIEMPO_INICIAL = 180; // 3:00 para cada jugador


/*==================================================
        IDENTIDAD LOCAL / MODO DE PRUEBA (NUEVO)
==================================================*/

// Por ahora el juego no tiene servidor real conectado, así que no hay
// forma de saber "quién sos vos" en la partida. Dejamos esto como una
// constante fija por ahora. El día que se conecte el servidor real
// (Etapa 3 del plan), este valor lo va a definir el login/socket
// en vez de estar escrito a mano acá.
const miPersonaje = "sasuke"; // cambiar a "naruto" para probar esa perspectiva

// Bandera para pruebas sin servidor: mientras esté en true, el tablero
// NUNCA bloquea el click por turno, así podés probar todo el juego
// vos solo sin tener que recargar y cambiar "miPersonaje" a mano.
// Cuando conectes el servidor/socket real, poné esto en false y ahí
// sí se va a respetar el turno de verdad entre los dos navegadores.
const MODO_PRUEBA_LOCAL = true; // cambiar a false cuando haya servidor real

// Devuelve true si, en este momento, a este navegador le toca jugar.
function esMiTurno(){

    if (MODO_PRUEBA_LOCAL) return true; // sin bloqueo mientras se prueba local

    return miPersonaje === "sasuke" ? turnoJugador : !turnoJugador;

}


/*==================================================
                RUTAS
==================================================*/

const RUTA_BACK = "assets/img/back.png";

const RUTA_ALDEAS = "assets/img/cards/aldeas/";


/*==================================================
                ALDEAS
==================================================*/

const aldeas = {

    konoha : ["1","2","3","4","5","6","7","8"],

    arena : ["1","2","3","4","5","6","7","8"],

    roca : ["1","2","3","4","5","6","7","8"],

    niebla : ["1","2","3","4","5","6","7","8"],

    nube : ["1","2","3","4","5","6","7","8"]

};


/*==================================================
                NIVELES
==================================================*/

const niveles = [

    {

        nombre : "Clan Sarutobi",

        dificultad : "Media",

        aldea : "konoha",

        cartas : ["1","2","3","4","5","6","7","8"]

    }

];


/*==================================================
                DATOS SIMULADOS
==================================================*/

const jugador = {

    nombre : "SASUKE",

    nivel : 18,

    chakra : 70,

    aciertos : 0,

    errores : 0,

    combo : 0,

    puntaje : 0

};


const rival = {

    nombre : "NARUTO",

    nivel : 20,

    chakra : 65,

    aciertos : 0,

    errores : 0,

    combo : 0,

    puntaje : 0

};


/*==================================================
                HABILIDADES
==================================================*/

const habilidades = {

    sharingan : {

        nombre : "Sharingan",

        disponible : true

    },

    chidori : {

        nombre : "Chidori",

        disponible : true

    },

    susanoo : {

        nombre : "Susanoo",

        disponible : false

    }

};


/*==================================================
                ESTADO ONLINE
==================================================*/

const conexion = {

    servidor : false,

    socket : false,

    rivalConectado : true,

    ping : 35

};


/*==================================================
                FIN PARTE 1
==================================================*/

/*==================================================
            PARTE 2
            INICIALIZACIÓN GENERAL
==================================================*/

/*==================================================
                INICIAR JUEGO
==================================================*/

function iniciarJuegoOnline(){

    cargarPanelSuperior();

    cargarJugador();

    cargarRival();

    cargarPanelInferior();

    cargarEstadoConexion();

}

/*==================================================
            CARGAR PANEL SUPERIOR
==================================================*/

function cargarPanelSuperior(){

    if(movimientos)
        movimientos.textContent="0";

    if(puntaje)
        puntaje.textContent="0";

}

/*==================================================
            CARGAR JUGADOR
==================================================*/

function cargarJugador(){

    if(nombreJugador)
        nombreJugador.textContent=jugador.nombre;

    if(avatarJugador)
        avatarJugador.src="assets/img/sasuke.png";

    if(chakraJugador)
        chakraJugador.style.width=jugador.chakra+"%";

    if(chakraTextoJugador)
        chakraTextoJugador.textContent=
        jugador.chakra+" / "+CHAKRA_MAXIMO;

    if(aciertosJugador)
        aciertosJugador.textContent=jugador.aciertos;

    if(erroresJugador)
        erroresJugador.textContent=jugador.errores;

    if(comboJugador)
        comboJugador.textContent="x"+jugador.combo;

}

/*==================================================
            CARGAR RIVAL
==================================================*/

function cargarRival(){

    if(nombreRival)
        nombreRival.textContent=rival.nombre;

    if(avatarRival)
        avatarRival.src="assets/img/naruto.png";

    if(chakraRival)
        chakraRival.style.width=rival.chakra+"%";

    if(chakraTextoRival)
        chakraTextoRival.textContent=
        rival.chakra+" / "+CHAKRA_MAXIMO;

    if(aciertosRival)
        aciertosRival.textContent=rival.aciertos;

    if(erroresRival)
        erroresRival.textContent=rival.errores;

    if(comboRival)
        comboRival.textContent="x"+rival.combo;

}

/*==================================================
            PANEL INFERIOR
==================================================*/

function cargarPanelInferior(){

    if(estadoPartida){

        estadoPartida.textContent=
        "Esperando inicio de la partida...";

    }

}

/*==================================================
        ESTADO DE CONEXIÓN
==================================================*/

function cargarEstadoConexion(){

    console.log("Servidor:",conexion.servidor);

    console.log("Socket:",conexion.socket);

    console.log("Ping:",conexion.ping+" ms");

}

/*==================================================
        TURNOS (NUEVO)
==================================================*/

function actualizarIndicadorTurno(){

    if(turnoSasuke){
        turnoSasuke.textContent = turnoJugador ? "TU TURNO" : "";
        turnoSasuke.classList.toggle("turno-activo", turnoJugador);
    }

    if(turnoNaruto){
        turnoNaruto.textContent = !turnoJugador ? "TURNO RIVAL" : "";
        turnoNaruto.classList.toggle("turno-activo", !turnoJugador);
    }

    if(estadoPartida){
        estadoPartida.textContent = turnoJugador
            ? "Turno de SASUKE"
            : "Turno de NARUTO";
    }

}

function cambiarTurno(){

    turnoJugador = !turnoJugador;
    actualizarIndicadorTurno();

}

/*==================================================
        TEMPORIZADORES INDIVIDUALES (NUEVO)
        Cada jugador tiene su propio contador.
        Solo baja el del jugador con el turno activo.
==================================================*/

function iniciarTemporizadores(){

    tiempoSasukeActual = TIEMPO_INICIAL;
    tiempoNarutoActual = TIEMPO_INICIAL;

    actualizarTextosTiempo();

    if(intervaloTiempo) clearInterval(intervaloTiempo);

    intervaloTiempo = setInterval(() => {

        if(partidaFinalizada) return;

        if(turnoJugador){
            tiempoSasukeActual--;
        } else {
            tiempoNarutoActual--;
        }

        actualizarTextosTiempo();

        if(tiempoSasukeActual <= 0 || tiempoNarutoActual <= 0){
            clearInterval(intervaloTiempo);
            // El jugador que se quedó sin tiempo pierde el turno
            // (la resolución de victoria/derrota por tiempo se define en Etapa 2)
        }

    }, 1000);

}

function actualizarTextosTiempo(){

    if(tiempoSasuke) tiempoSasuke.textContent = formatearTiempo(tiempoSasukeActual);
    if(tiempoNaruto) tiempoNaruto.textContent = formatearTiempo(tiempoNarutoActual);

    // El #timer superior muestra el tiempo del jugador con el turno activo
    if(tiempo){
        tiempo.textContent = formatearTiempo(
            turnoJugador ? tiempoSasukeActual : tiempoNarutoActual
        );
    }

}

function formatearTiempo(segundos){

    const s = Math.max(0, segundos);
    const min = String(Math.floor(s / 60)).padStart(2, "0");
    const seg = String(s % 60).padStart(2, "0");
    return `${min}:${seg}`;

}

/*==================================================
        RESULTADO DE CADA JUGADA
        Se llama cada vez que se voltean 2 cartas.
        esAcierto = true si formaron pareja.
==================================================*/

function procesarResultado(esAcierto, puntajeTotal){

    puntajeActual = puntajeTotal;
    if(puntaje) puntaje.textContent = puntajeActual;

    if(turnoJugador){

        // Le tocaba a SASUKE

        if(esAcierto){
            jugador.aciertos++;
            jugador.combo++;
            if(aciertosJugador) aciertosJugador.textContent = jugador.aciertos;
            actualizarCombo();
            ganarChakra(true);
            // acertó: sigue su turno
        } else {
            jugador.errores++;
            if(erroresJugador) erroresJugador.textContent = jugador.errores;
            if(jugador.combo > 0) mostrarComboRoto(true);
            jugador.combo = 0;
            cambiarTurno(); // falló: pasa el turno a NARUTO
        }
    } 
    
    else {

        // Le tocaba a NARUTO
                if(esAcierto){
            rival.aciertos++;
            rival.combo++;
            if(aciertosRival) aciertosRival.textContent = rival.aciertos;
            actualizarCombo();
            ganarChakra(false);
            // acertó: sigue su turno
        } else {
            rival.errores++;
            if(erroresRival) erroresRival.textContent = rival.errores;
            if(rival.combo > 0) mostrarComboRoto(false);
            rival.combo = 0;
            cambiarTurno(); // falló: pasa el turno a SASUKE
        }
    }

}

/*==================================================
        MODAL DE FIN DE PARTIDA
==================================================*/

function mostrarModalFinal(movimientosFinales, puntajeFinal){

    partidaFinalizada = true;
    clearInterval(intervaloTiempo);

    if(finalStats){
        finalStats.innerHTML =
            `Movimientos: ${movimientosFinales}<br>` +
            `Puntaje: ${puntajeFinal}<br>` +
            `SASUKE — Aciertos: ${jugador.aciertos} / Errores: ${jugador.errores} / Tiempo restante: ${formatearTiempo(tiempoSasukeActual)}<br>` +
            `NARUTO — Aciertos: ${rival.aciertos} / Errores: ${rival.errores} / Tiempo restante: ${formatearTiempo(tiempoNarutoActual)}`;
    }

    if(modal){
        modal.classList.remove("hidden");
    }

}

if(botonGuardar){
    botonGuardar.addEventListener("click", () => {
        if(modal) modal.classList.add("hidden");
    });
}

if(botonCerrar){
    botonCerrar.addEventListener("click", () => {
        if(modal) modal.classList.add("hidden");
    });
}

/*==================================================
            WINDOW LOAD
==================================================*/

window.addEventListener("load",()=>{

    iniciarJuegoOnline();

});



/*==================================================
        COMBO (NUEVO)
==================================================*/

function actualizarCombo(){

    if(comboSasuke){
        comboSasuke.textContent = jugador.combo > 0 ? "COMBO x" + jugador.combo : "";
    }

    if(comboNaruto){
        comboNaruto.textContent = rival.combo > 0 ? "COMBO x" + rival.combo : "";
    }

}

function mostrarComboRoto(esSasuke){

    const elemento = esSasuke ? comboSasuke : comboNaruto;
    if(!elemento) return;

    elemento.textContent = "COMBO ROTO";
    elemento.classList.add("combo-roto");

    setTimeout(() => {
        elemento.classList.remove("combo-roto");
        elemento.textContent = "";
    }, 900);

}

/*==================================================
        CHAKRA (NUEVO)
==================================================*/

const CHAKRA_POR_ACIERTO = 5;

function ganarChakra(esSasuke){

    if(esSasuke){
        jugador.chakra = Math.min(CHAKRA_MAXIMO, jugador.chakra + CHAKRA_POR_ACIERTO);
    } else {
        rival.chakra = Math.min(CHAKRA_MAXIMO, rival.chakra + CHAKRA_POR_ACIERTO);
    }

    actualizarChakra();

}

function actualizarChakra(){

    if(chakraTextoSasuke) chakraTextoSasuke.textContent = jugador.chakra + "/" + CHAKRA_MAXIMO;
    if(chakraBarraSasuke) chakraBarraSasuke.style.width = jugador.chakra + "%";

    if(chakraTextoNaruto) chakraTextoNaruto.textContent = rival.chakra + "/" + CHAKRA_MAXIMO;
    if(chakraBarraNaruto) chakraBarraNaruto.style.width = rival.chakra + "%";

}