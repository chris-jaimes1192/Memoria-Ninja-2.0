import { MockServer } from './mock-server.js';
import { UIManager } from './ui-manager.js';
import { BoardManager } from './board-manager.js';

window.onload = () => {

    // CAMBIO: BoardManager.renderBoard() va primero y solo, así el
    // tablero se dibuja sí o sí, aunque MockServer/UIManager fallen.
    BoardManager.renderBoard(procesarResultado, mostrarModalFinal, esMiTurno);

    try {
        const data = MockServer.getData();
        UIManager.renderPlayers(data.players);
    } catch (error) {
        console.warn("No se pudieron cargar los datos de MockServer (no afecta al tablero):", error);
    }

    iniciarTemporizadores();
    actualizarIndicadorTurno();
    actualizarVida();
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

// ---------- Turno + tiempo + combo (NUEVO) ----------

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

// ---------- Vida (NUEVO) ----------

const vidaTextoSasuke = document.getElementById("vidaTextoSasuke");
const vidaTextoNaruto = document.getElementById("vidaTextoNaruto");
const vidaBarraSasuke = document.getElementById("vidaBarraSasuke");
const vidaBarraNaruto = document.getElementById("vidaBarraNaruto");

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

let tiempoSasukeActual = 0;
let tiempoNarutoActual = 0;
let intervaloTiempo = null;


/*==================================================
                CONFIGURACIÓN
==================================================*/

const TOTAL_CARTAS = 16;

const TOTAL_PAREJAS = 8;

const CHAKRA_MAXIMO = 100;

const TIEMPO_INICIAL = 180;


/*==================================================
        IDENTIDAD LOCAL / MODO DE PRUEBA
==================================================*/

const miPersonaje = "sasuke";

const MODO_PRUEBA_LOCAL = true;

function esMiTurno(){

    if (MODO_PRUEBA_LOCAL) return true;

    return miPersonaje === "sasuke" ? turnoJugador : !turnoJugador;

}

function jugadorActivo(){
    return turnoJugador ? jugador : rival;
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

    vida : 100,

    aciertos : 0,

    errores : 0,

    combo : 0,

    puntaje : 0

};


const rival = {

    nombre : "NARUTO",

    nivel : 20,

    chakra : 65,

    vida : 100,

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
                INICIAR JUEGO
==================================================*/

function iniciarJuegoOnline(){

    cargarPanelSuperior();
    cargarJugador();
    cargarRival();
    cargarPanelInferior();
    cargarEstadoConexion();

}

function cargarPanelSuperior(){

    if(movimientos) movimientos.textContent="0";
    if(puntaje) puntaje.textContent="0";

}

function cargarJugador(){

    if(nombreJugador) nombreJugador.textContent=jugador.nombre;
    if(avatarJugador) avatarJugador.src="assets/img/sasuke.png";
    if(chakraJugador) chakraJugador.style.width=jugador.chakra+"%";
    if(chakraTextoJugador) chakraTextoJugador.textContent = jugador.chakra+" / "+CHAKRA_MAXIMO;
    if(aciertosJugador) aciertosJugador.textContent = jugador.aciertos;
    if(erroresJugador) erroresJugador.textContent = jugador.errores;
    if(comboJugador) comboJugador.textContent = "x"+jugador.combo;

}

function cargarRival(){

    if(nombreRival) nombreRival.textContent=rival.nombre;
    if(avatarRival) avatarRival.src="assets/img/naruto.png";
    if(chakraRival) chakraRival.style.width=rival.chakra+"%";
    if(chakraTextoRival) chakraTextoRival.textContent = rival.chakra+" / "+CHAKRA_MAXIMO;
    if(aciertosRival) aciertosRival.textContent = rival.aciertos;
    if(erroresRival) erroresRival.textContent = rival.errores;
    if(comboRival) comboRival.textContent = "x"+rival.combo;

}

function cargarPanelInferior(){

    if(estadoPartida){
        estadoPartida.textContent = "Esperando inicio de la partida...";
    }

}

function cargarEstadoConexion(){

    console.log("Servidor:",conexion.servidor);
    console.log("Socket:",conexion.socket);
    console.log("Ping:",conexion.ping+" ms");

}

/*==================================================
        TURNOS
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
        estadoPartida.textContent = turnoJugador ? "Turno de SASUKE" : "Turno de NARUTO";
    }

}

function cambiarTurno(){

    turnoJugador = !turnoJugador;
    actualizarIndicadorTurno();
    actualizarUsosByakugan();
    actualizarUsosSustitucion();
    actualizarUsosRobo();
    actualizarUsosSello();

}

/*==================================================
        TEMPORIZADORES INDIVIDUALES
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
        }

    }, 1000);

}

function actualizarTextosTiempo(){

    if(tiempoSasuke) tiempoSasuke.textContent = formatearTiempo(tiempoSasukeActual);
    if(tiempoNaruto) tiempoNaruto.textContent = formatearTiempo(tiempoNarutoActual);

    if(tiempo){
        tiempo.textContent = formatearTiempo(turnoJugador ? tiempoSasukeActual : tiempoNarutoActual);
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
            if(jugador.combo >= 1) actualizarCombo();
            ganarChakra(true);
            if(jugador.combo >= 2) ganarChakraPorCombo(true);
        } else {
            if (sustitucionArmadaSasuke) {
                desarmarSustitucion(true);
                mostrarAvisoSustitucionUsada();
            } else {
                jugador.errores++;
                if(erroresJugador) erroresJugador.textContent = jugador.errores;
                if(jugador.combo > 0) mostrarComboRoto(true);
                jugador.combo = 0;
                perderVida(true, VIDA_PERDIDA_POR_ERROR);
                cambiarTurno();
            }
        }

    } else {

        // Le tocaba a NARUTO

        if(esAcierto){
            rival.aciertos++;
            rival.combo++;
            if(aciertosRival) aciertosRival.textContent = rival.aciertos;
            actualizarCombo();
            ganarChakra(false);
            if(rival.combo >= 2) ganarChakraPorCombo(false);
        } else {
            if (sustitucionArmadaNaruto) {
                desarmarSustitucion(false);
                mostrarAvisoSustitucionUsada();
            } else {
                rival.errores++;
                if(erroresRival) erroresRival.textContent = rival.errores;
                if(rival.combo > 0) mostrarComboRoto(false);
                rival.combo = 0;
                perderVida(false, VIDA_PERDIDA_POR_ERROR);
                cambiarTurno();
            }
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
        COMBO
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
        CHAKRA
==================================================*/

const CHAKRA_POR_ACIERTO = 5;
const CHAKRA_BASE_COMBO = 3;

function ganarChakraPorCombo(esSasuke){

    const jugadorActual = esSasuke ? jugador : rival;
    const bono = CHAKRA_BASE_COMBO * jugadorActual.combo;

    jugadorActual.chakra = Math.min(CHAKRA_MAXIMO, jugadorActual.chakra + bono);

    actualizarChakra();
    mostrarBonoChakraVisual(esSasuke, bono);
    mostrarBonificacionCombo(esSasuke, jugadorActual.combo, bono);

}

function mostrarBonificacionCombo(esSasuke, combo, chakra) {

    // Destello rápido en toda la pantalla, para que se note
    // incluso si no estabas mirando el panel de chakra.
    const flash = document.createElement("div");
    flash.className = "combo-flash-overlay";
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); }, 500);

    const mensaje = document.createElement("div");
    mensaje.className = "bonificacion-combo";
    mensaje.innerHTML = `
        <strong>COMBO x${combo}</strong>
        <span>+${chakra} CHAKRA</span>
    `;
    document.body.appendChild(mensaje);

    setTimeout(() => {
        mensaje.remove();
    }, 1400);

}

function mostrarBonoChakraVisual(esSasuke, cantidad){

    const barraChakra = esSasuke ? chakraBarraSasuke : chakraBarraNaruto;
    if(!barraChakra) return;

    // CAMBIO: antes se insertaba dentro de .chakra-barra, pero esa caja
    // tiene overflow:hidden y recortaba el texto antes de que se viera.
    // Ahora se inserta en .personaje-chakra (el panel completo), que no
    // recorta nada, así se ve grande y claro.
    const panel = barraChakra.closest(".personaje-chakra");
    if(!panel) return;

    const aviso = document.createElement("div");
    aviso.className = "chakra-bono-flotante";
    aviso.textContent = "+" + cantidad + " 🔵 COMBO";
    panel.appendChild(aviso);

    setTimeout(() => {
        aviso.remove();
    }, 1000);

}

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

/*==================================================
        VIDA (NUEVO)
==================================================*/

const VIDA_MAXIMA = 100;
const VIDA_PERDIDA_POR_ERROR = 5;

function perderVida(esSasuke, cantidad){

    if(esSasuke){
        jugador.vida = Math.max(0, jugador.vida - cantidad);
    } else {
        rival.vida = Math.max(0, rival.vida - cantidad);
    }

    actualizarVida();

}

function actualizarVida(){

    if(vidaTextoSasuke) vidaTextoSasuke.textContent = jugador.vida + "/" + VIDA_MAXIMA;
    if(vidaBarraSasuke) vidaBarraSasuke.style.width = jugador.vida + "%";

    if(vidaTextoNaruto) vidaTextoNaruto.textContent = rival.vida + "/" + VIDA_MAXIMA;
    if(vidaBarraNaruto) vidaBarraNaruto.style.width = rival.vida + "%";

}

/*==================================================
        AVISO RÁPIDO COMPARTIDO (NUEVO)
        Mensaje flotante para errores de uso de poder
        (sin chakra, sin usos, no es tu turno).
==================================================*/

function mostrarAvisoRapido(mensaje) {

    const aviso = document.createElement("div");
    aviso.className = "aviso-rapido-central";
    aviso.textContent = "⚠️ " + mensaje;
    document.body.appendChild(aviso);

    setTimeout(() => {
        aviso.remove();
    }, 1200);

}

/*==================================================
                BYAKUGAN
==================================================*/

const COSTO_BYAKUGAN = 30;
const DURACION_BYAKUGAN = 3000;
const USOS_INICIALES_BYAKUGAN = 2;

let usosByakuganSasuke = USOS_INICIALES_BYAKUGAN;
let usosByakuganNaruto = USOS_INICIALES_BYAKUGAN;
let byakuganActivo = false;

const botonByakugan = document.getElementById("btnByakugan");
const contadorUsosByakugan = document.getElementById("usosByakugan");

function usarByakugan() {

    if (byakuganActivo) return;

    if (!esMiTurno()) {
        mostrarMensajeByakugan("NO ES TU TURNO");
        return;
    }

    const esSasuke = turnoJugador;
    const p = jugadorActivo();
    let usos = esSasuke ? usosByakuganSasuke : usosByakuganNaruto;

    if (usos <= 0) {
        mostrarMensajeByakugan("SIN USOS");
        return;
    }

    if (p.chakra < COSTO_BYAKUGAN) {
        mostrarMensajeByakugan("CHAKRA INSUFICIENTE");
        return;
    }

    const cartas = BoardManager.obtenerCartasParaByakugan();

    if (cartas.length < 2) {
        mostrarMensajeByakugan("NO HAY CARTAS DISPONIBLES");
        return;
    }

    byakuganActivo = true;

    p.chakra -= COSTO_BYAKUGAN;
    actualizarChakra();

    if (esSasuke) { usosByakuganSasuke--; } else { usosByakuganNaruto--; }
    actualizarUsosByakugan();

    activarAnimacionByakugan(esSasuke);
    revelarCartasByakugan(cartas);

    // NUEVO: contraataque contra Genjutsu. Si la ilusión está activa
    // cuando usás Byakugan, la detecta y la cancela de inmediato.
    if (genjutsuActivo) {
        cancelarGenjutsu(true);
    }

}

function activarAnimacionByakugan(esSasuke) {

    const selector = esSasuke
        ? ".panel-personaje-lateral .personaje-imagen"
        : ".panel-naruto-lateral .personaje-imagen";

    const avatar = document.querySelector(selector);
    if (avatar) {
        avatar.classList.add("byakugan-brillo-avatar");
        setTimeout(() => {
            avatar.classList.remove("byakugan-brillo-avatar");
        }, 600);
    }

    const simbolo = document.createElement("div");
    simbolo.className = "byakugan-simbolo-central";
    simbolo.textContent = "👁️ BYAKUGAN";
    document.body.appendChild(simbolo);

    setTimeout(() => {
        simbolo.remove();
    }, 900);

}

function revelarCartasByakugan(cartas) {

    cartas.forEach(carta => {
        const imagen = carta.querySelector("img");
        if (!imagen) return;
        carta.dataset.backOriginal = imagen.src;
        imagen.src = `${RUTA_ALDEAS}arena/${carta.dataset.valor}.png`;
        carta.classList.add("byakugan-revelada");
    });

    setTimeout(() => {

        cartas.forEach(carta => {
            const imagen = carta.querySelector("img");
            if (!imagen) return;
            imagen.src = RUTA_BACK;
            carta.classList.remove("byakugan-revelada");
        });

        byakuganActivo = false;

    }, DURACION_BYAKUGAN);
}

function actualizarUsosByakugan() {

    const usos = turnoJugador ? usosByakuganSasuke : usosByakuganNaruto;

    if (contadorUsosByakugan) {
        contadorUsosByakugan.textContent = usos;
    }

    if (botonByakugan) {
        botonByakugan.classList.toggle("poder-agotado", usos <= 0);
    }

}

if (botonByakugan) {
    botonByakugan.addEventListener("click", usarByakugan);
}

function mostrarMensajeByakugan(mensaje) {
    console.log("BYAKUGAN:", mensaje);
    mostrarAvisoRapido(mensaje);
}

/*==================================================
                SUSTITUCIÓN
==================================================*/

const COSTO_SUSTITUCION = 25;
const DURACION_ARMADA_SUSTITUCION = 8000;
const USOS_INICIALES_SUSTITUCION = 2;

let usosSustitucionSasuke = USOS_INICIALES_SUSTITUCION;
let usosSustitucionNaruto = USOS_INICIALES_SUSTITUCION;
let sustitucionArmadaSasuke = false;
let sustitucionArmadaNaruto = false;
let timeoutSustitucion = null;

const botonSustitucion = document.getElementById("btnSustitucion");
const contadorUsosSustitucion = document.getElementById("usosSustitucion");
const spanSustitucionEstado = document.getElementById("sustitucionEstado");

function usarSustitucion() {

    const esSasuke = turnoJugador;
    const armada = esSasuke ? sustitucionArmadaSasuke : sustitucionArmadaNaruto;

    if (armada) return;

    if (!esMiTurno()) {
        mostrarMensajeSustitucion("NO ES TU TURNO");
        return;
    }

    const p = jugadorActivo();
    const usos = esSasuke ? usosSustitucionSasuke : usosSustitucionNaruto;

    if (usos <= 0) {
        mostrarMensajeSustitucion("SIN USOS");
        return;
    }

    if (p.chakra < COSTO_SUSTITUCION) {
        mostrarMensajeSustitucion("CHAKRA INSUFICIENTE");
        return;
    }

    p.chakra -= COSTO_SUSTITUCION;
    actualizarChakra();

    if (esSasuke) { usosSustitucionSasuke--; } else { usosSustitucionNaruto--; }
    actualizarUsosSustitucion();

    if (esSasuke) { sustitucionArmadaSasuke = true; } else { sustitucionArmadaNaruto = true; }

    activarAnimacionSustitucion(esSasuke);

    if (spanSustitucionEstado) {
        spanSustitucionEstado.textContent = "🔄 SUSTITUCIÓN ARMADA";
        spanSustitucionEstado.classList.add("sustitucion-activa");
    }

    timeoutSustitucion = setTimeout(() => {
        desarmarSustitucion(esSasuke);
    }, DURACION_ARMADA_SUSTITUCION);

}

function activarAnimacionSustitucion(esSasuke) {

    const selector = esSasuke
        ? ".panel-personaje-lateral .personaje-imagen"
        : ".panel-naruto-lateral .personaje-imagen";

    const avatar = document.querySelector(selector);
    if (avatar) {
        avatar.classList.add("sustitucion-brillo-avatar");
        setTimeout(() => {
            avatar.classList.remove("sustitucion-brillo-avatar");
        }, 600);
    }

    const simbolo = document.createElement("div");
    simbolo.className = "sustitucion-simbolo-central";
    simbolo.textContent = "🪵💨 SUSTITUCIÓN";
    document.body.appendChild(simbolo);

    setTimeout(() => {
        simbolo.remove();
    }, 900);

}

function desarmarSustitucion(esSasuke) {

    if (esSasuke) { sustitucionArmadaSasuke = false; } else { sustitucionArmadaNaruto = false; }

    if (timeoutSustitucion) {
        clearTimeout(timeoutSustitucion);
        timeoutSustitucion = null;
    }

    if (spanSustitucionEstado) {
        spanSustitucionEstado.classList.remove("sustitucion-activa");
        spanSustitucionEstado.textContent = "";
    }

}

function mostrarAvisoSustitucionUsada() {

    if (!spanSustitucionEstado) return;

    spanSustitucionEstado.textContent = "🪵💨 ¡SUSTITUCIÓN!";
    spanSustitucionEstado.classList.add("sustitucion-usada");

    setTimeout(() => {
        spanSustitucionEstado.classList.remove("sustitucion-usada");
        spanSustitucionEstado.textContent = "";
    }, 900);

}

function actualizarUsosSustitucion() {

    const usos = turnoJugador ? usosSustitucionSasuke : usosSustitucionNaruto;

    if (contadorUsosSustitucion) {
        contadorUsosSustitucion.textContent = usos;
    }

    if (botonSustitucion) {
        botonSustitucion.classList.toggle("poder-agotado", usos <= 0);
    }

}

if (botonSustitucion) {
    botonSustitucion.addEventListener("click", usarSustitucion);
}

function mostrarMensajeSustitucion(mensaje) {
    console.log("SUSTITUCIÓN:", mensaje);
    mostrarAvisoRapido(mensaje);
}

/*==================================================
                ROBO DE CHAKRA
==================================================*/

const COSTO_ROBO = 30;
const CANTIDAD_ROBADA = 20;
const USOS_INICIALES_ROBO = 2;

let usosRoboSasuke = USOS_INICIALES_ROBO;
let usosRoboNaruto = USOS_INICIALES_ROBO;

const botonRobo = document.getElementById("btnRobo");
const contadorUsosRobo = document.getElementById("usosRobo");

function usarRobo() {

    if (!esMiTurno()) {
        mostrarMensajeRobo("NO ES TU TURNO");
        return;
    }

    const esSasuke = turnoJugador;
    const atacante = jugadorActivo();
    const defensor = esSasuke ? rival : jugador;
    const usos = esSasuke ? usosRoboSasuke : usosRoboNaruto;

    if (usos <= 0) {
        mostrarMensajeRobo("SIN USOS");
        return;
    }

    if (atacante.chakra < COSTO_ROBO) {
        mostrarMensajeRobo("CHAKRA INSUFICIENTE");
        return;
    }

    // Se paga el costo de activar el poder
    atacante.chakra -= COSTO_ROBO;

    // Se roba del defensor lo que realmente tenga disponible
    // (no se puede robar de más ni dejarlo en negativo)
    const robado = Math.min(CANTIDAD_ROBADA, defensor.chakra);
    defensor.chakra -= robado;
    atacante.chakra = Math.min(CHAKRA_MAXIMO, atacante.chakra + robado);

    actualizarChakra();

    if (esSasuke) { usosRoboSasuke--; } else { usosRoboNaruto--; }
    actualizarUsosRobo();

    activarAnimacionRobo(esSasuke, robado);

}

function activarAnimacionRobo(esSasuke, robado) {

    const origenSelector = esSasuke
        ? ".panel-naruto-lateral .chakra-barra"
        : ".panel-personaje-lateral .chakra-barra";

    const destinoSelector = esSasuke
        ? ".panel-personaje-lateral .chakra-barra"
        : ".panel-naruto-lateral .chakra-barra";

    const origen = document.querySelector(origenSelector);
    const destino = document.querySelector(destinoSelector);

    // Efecto de "succión": la barra de chakra del que pierde tiembla y se oscurece
    if (origen) {
        origen.classList.add("robo-origen-efecto");
        setTimeout(() => origen.classList.remove("robo-origen-efecto"), 700);
    }

    // Efecto de "carga": la barra de chakra del que gana brilla
    if (destino) {
        destino.classList.add("robo-destino-efecto");
        setTimeout(() => destino.classList.remove("robo-destino-efecto"), 700);
    }

    // Rayo de energía viajando de una barra a la otra
    if (origen && destino) {

        const rectOrigen = origen.getBoundingClientRect();
        const rectDestino = destino.getBoundingClientRect();

        const rayo = document.createElement("div");
        rayo.className = "robo-rayo";
        rayo.style.left = (rectOrigen.left + rectOrigen.width / 2) + "px";
        rayo.style.top = (rectOrigen.top + rectOrigen.height / 2) + "px";
        rayo.style.setProperty("--dx", (rectDestino.left - rectOrigen.left) + "px");
        rayo.style.setProperty("--dy", (rectDestino.top - rectOrigen.top) + "px");
        document.body.appendChild(rayo);

        setTimeout(() => rayo.remove(), 700);

    }

    const simbolo = document.createElement("div");
    simbolo.className = "robo-simbolo-central";
    simbolo.textContent = "🔵 ROBO DE CHAKRA (-" + robado + ")";
    document.body.appendChild(simbolo);

    setTimeout(() => simbolo.remove(), 900);

}

function actualizarUsosRobo() {

    const usos = turnoJugador ? usosRoboSasuke : usosRoboNaruto;

    if (contadorUsosRobo) {
        contadorUsosRobo.textContent = usos;
    }

    if (botonRobo) {
        botonRobo.classList.toggle("poder-agotado", usos <= 0);
    }

}

if (botonRobo) {
    botonRobo.addEventListener("click", usarRobo);
}

function mostrarMensajeRobo(mensaje) {
    console.log("ROBO:", mensaje);
    mostrarAvisoRapido(mensaje);
}

/*==================================================
                GENJUTSU
==================================================*/

const COSTO_GENJUTSU = 35;
const DURACION_GENJUTSU = 5000;
const USOS_INICIALES_GENJUTSU = 2;

let usosGenjutsuSasuke = USOS_INICIALES_GENJUTSU;
let usosGenjutsuNaruto = USOS_INICIALES_GENJUTSU;
let genjutsuActivo = false;
let timeoutGenjutsu = null;

const botonGenjutsu = document.getElementById("btnGenjutsu");
const contadorUsosGenjutsu = document.getElementById("usosGenjutsu");

function usarGenjutsu() {

    if (genjutsuActivo) return;

    if (!esMiTurno()) {
        mostrarMensajeGenjutsu("NO ES TU TURNO");
        return;
    }

    const esSasuke = turnoJugador;
    const p = jugadorActivo();
    const usos = esSasuke ? usosGenjutsuSasuke : usosGenjutsuNaruto;

    if (usos <= 0) {
        mostrarMensajeGenjutsu("SIN USOS");
        return;
    }

    if (p.chakra < COSTO_GENJUTSU) {
        mostrarMensajeGenjutsu("CHAKRA INSUFICIENTE");
        return;
    }

    p.chakra -= COSTO_GENJUTSU;
    actualizarChakra();

    if (esSasuke) { usosGenjutsuSasuke--; } else { usosGenjutsuNaruto--; }
    actualizarUsosGenjutsu();

    activarAnimacionGenjutsu();
    activarIlusionTablero();

    genjutsuActivo = true;

    timeoutGenjutsu = setTimeout(() => {
        cancelarGenjutsu();
    }, DURACION_GENJUTSU);

}

function activarAnimacionGenjutsu() {

    const simbolo = document.createElement("div");
    simbolo.className = "genjutsu-simbolo-central";
    simbolo.textContent = "🌀 GENJUTSU";
    document.body.appendChild(simbolo);

    setTimeout(() => simbolo.remove(), 900);

}

let genjutsuOverlayEl = null;

function activarIlusionTablero(){

    const tableroFrame = document.getElementById("boardFrame");
    if (tableroFrame) {
        tableroFrame.classList.add("genjutsu-ilusion");
    }

    // NUEVO: velo púrpura pulsante en toda la pantalla, dura
    // todo el efecto (no un destello corto como el del combo).
    if (!genjutsuOverlayEl) {
        genjutsuOverlayEl = document.createElement("div");
        genjutsuOverlayEl.className = "genjutsu-pantalla-overlay";
        document.body.appendChild(genjutsuOverlayEl);
    }

    // NUEVO: cada carta salta visualmente a la posición de otra
    // carta del tablero (además de rodar, ahora también "se mezclan").
    aplicarDesplazamientoVisualGenjutsu();

}

function quitarIlusionTablero(){

    const tableroFrame = document.getElementById("boardFrame");
    if (tableroFrame) {
        tableroFrame.classList.remove("genjutsu-ilusion");
    }

    if (genjutsuOverlayEl) {
        genjutsuOverlayEl.remove();
        genjutsuOverlayEl = null;
    }

    // NUEVO: las cartas vuelven solas a su posición real
    quitarDesplazamientoVisualGenjutsu();

}

// NUEVO: calcula, para cada carta, la posición de otra carta random
// del tablero y guarda esa diferencia como variables CSS (--genjutsu-dx/dy).
// Esto es puramente visual (un transform): nunca se mueve la carta en
// el DOM ni se toca su dataset.valor, así que la pareja real nunca cambia.
function aplicarDesplazamientoVisualGenjutsu(){

    const cartas = [...document.querySelectorAll("#board .card")];
    if (cartas.length < 2) return;

    const posiciones = cartas.map(c => c.getBoundingClientRect());

    // Barajamos un array de índices para saber a qué posición
    // "salta" visualmente cada carta.
    const indices = cartas.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    cartas.forEach((carta, i) => {
        const origen = posiciones[i];
        const destino = posiciones[indices[i]];
        const dx = destino.left - origen.left;
        const dy = destino.top - origen.top;
        carta.style.setProperty("--genjutsu-dx", dx + "px");
        carta.style.setProperty("--genjutsu-dy", dy + "px");
    });

}

// NUEVO: saca el desplazamiento visual — como nunca se tocó la
// posición real, la carta simplemente vuelve a donde ya estaba.
function quitarDesplazamientoVisualGenjutsu(){

    document.querySelectorAll("#board .card").forEach(carta => {
        carta.style.removeProperty("--genjutsu-dx");
        carta.style.removeProperty("--genjutsu-dy");
    });

}

// Se llama sola cuando pasan los 5 segundos, o antes si el rival
// usa Byakugan para detectar la ilusión (ver usarByakugan()).
function cancelarGenjutsu(detectadoPorByakugan){

    genjutsuActivo = false;

    if (timeoutGenjutsu) {
        clearTimeout(timeoutGenjutsu);
        timeoutGenjutsu = null;
    }

    quitarIlusionTablero();

    if (detectadoPorByakugan) {
        mostrarAvisoRapido("¡GENJUTSU DETECTADO!");
    }

}

function actualizarUsosGenjutsu() {

    const usos = turnoJugador ? usosGenjutsuSasuke : usosGenjutsuNaruto;

    if (contadorUsosGenjutsu) {
        contadorUsosGenjutsu.textContent = usos;
    }

    if (botonGenjutsu) {
        botonGenjutsu.classList.toggle("poder-agotado", usos <= 0);
    }

}

if (botonGenjutsu) {
    botonGenjutsu.addEventListener("click", usarGenjutsu);
}

function mostrarMensajeGenjutsu(mensaje) {
    console.log("GENJUTSU:", mensaje);
    mostrarAvisoRapido(mensaje);
}

/*==================================================
                SELLO DE BLOQUEO
==================================================*/

const COSTO_SELLO = 30;
const DURACION_SELLO = 5000;
const USOS_INICIALES_SELLO = 2;

let usosSelloSasuke = USOS_INICIALES_SELLO;
let usosSelloNaruto = USOS_INICIALES_SELLO;

// Solo puede haber UNA carta sellada activa a la vez en el tablero.
let cartaSelladaActual = null;
let timeoutSello = null;

const botonSello = document.getElementById("btnSello");
const contadorUsosSello = document.getElementById("usosSello");

function usarSello() {

    if (cartaSelladaActual) {
        mostrarMensajeSello("YA HAY UN SELLO ACTIVO");
        return;
    }

    if (!esMiTurno()) {
        mostrarMensajeSello("NO ES TU TURNO");
        return;
    }

    const esSasuke = turnoJugador;
    const p = jugadorActivo();
    const usos = esSasuke ? usosSelloSasuke : usosSelloNaruto;

    if (usos <= 0) {
        mostrarMensajeSello("SIN USOS");
        return;
    }

    if (p.chakra < COSTO_SELLO) {
        mostrarMensajeSello("CHAKRA INSUFICIENTE");
        return;
    }

    const carta = BoardManager.obtenerCartaParaSello();

    if (!carta) {
        mostrarMensajeSello("NO HAY CARTAS DISPONIBLES");
        return;
    }

    p.chakra -= COSTO_SELLO;
    actualizarChakra();

    if (esSasuke) { usosSelloSasuke--; } else { usosSelloNaruto--; }
    actualizarUsosSello();

    activarAnimacionSello();
    sellarCarta(carta);

}

function activarAnimacionSello() {

    // Destello naranja en toda la pantalla, mismo golpe visual
    // que un poder importante (igual que el combo).
    const flash = document.createElement("div");
    flash.className = "sello-flash-overlay";
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); }, 500);

    const simbolo = document.createElement("div");
    simbolo.className = "sello-simbolo-central";
    simbolo.textContent = "🔒 SELLO DE BLOQUEO";
    document.body.appendChild(simbolo);

    setTimeout(() => {
        simbolo.remove();
    }, 900);

}

function sellarCarta(carta) {

    cartaSelladaActual = carta;
    carta.classList.add("carta-sellada");

    // Candado grande que late encima de la carta bloqueada
    const icono = document.createElement("div");
    icono.className = "sello-icono-carta";
    icono.textContent = "🔒";
    carta.appendChild(icono);

    timeoutSello = setTimeout(() => {
        quitarSello();
    }, DURACION_SELLO);

}

// Se llama sola cuando pasan los 5 segundos. La carta nunca se tocó
// en el DOM ni perdió su dataset.valor: solo se le sacan la clase
// y el ícono, así que vuelve a jugarse con total normalidad.
function quitarSello() {

    if (cartaSelladaActual) {

        cartaSelladaActual.classList.remove("carta-sellada");

        const icono = cartaSelladaActual.querySelector(".sello-icono-carta");
        if (icono) icono.remove();

        cartaSelladaActual = null;

    }

    if (timeoutSello) {
        clearTimeout(timeoutSello);
        timeoutSello = null;
    }

}

function actualizarUsosSello() {

    const usos = turnoJugador ? usosSelloSasuke : usosSelloNaruto;

    if (contadorUsosSello) {
        contadorUsosSello.textContent = usos;
    }

    if (botonSello) {
        botonSello.classList.toggle("poder-agotado", usos <= 0);
    }

}

if (botonSello) {
    botonSello.addEventListener("click", usarSello);
}

function mostrarMensajeSello(mensaje) {
    console.log("SELLO:", mensaje);
    mostrarAvisoRapido(mensaje);
}

/*==================================================
            WINDOW LOAD
==================================================*/

window.addEventListener("load",()=>{

    iniciarJuegoOnline();

});