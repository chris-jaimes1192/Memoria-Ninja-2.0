/*==================================================
                MEMORIA NINJA ONLINE
                GAME-ONLINE.JS

    Este archivo quedó reducido a un punto de arranque.
    Antes tenía ~1560 líneas con toda la lógica mezclada
    (turno, tiempo, chakra, vida, combo y los 6 poderes).
    Ahora esa lógica vive organizada en js/nucleo/, en
    clases con una sola responsabilidad cada una — ver
    js/nucleo/COMO-QUEDO-ORGANIZADO.md para el detalle
    completo de qué se movió a dónde y por qué.
==================================================*/

import { GestorPartida } from "./nucleo-GAME ONLI/GestorPartida.js";

window.addEventListener("load", () => {
    const partida = new GestorPartida();
    partida.iniciar();
});
