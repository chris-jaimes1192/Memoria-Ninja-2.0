import { TEMAS_ALDEA } from "../core-navegacion/TemaAldea.js";
/* Config por nivel (OCP/SRP). Colores/cartas+reverso/respaldo PROPIOS por aldea via TemaAldea (no compartidos). */
function cfg(aldea, totalCartas, tiempo, textos, vars = {}) {
    const t = TEMAS_ALDEA[aldea] || {};
    return { aldea, totalCartas, tiempo, reverso: t.reverso, cartas: t.cartas, textos, vars };
}
export const CONFIG_NIVELES = {
    akatsuki: cfg("akatsuki", 16, 60,
        { victoriaTitulo:"¡VICTORIA!", victoriaMsg1:"¡Has derrotado a la organización Akatsuki! Eres un ninja excepcional y has demostrado tu habilidad y destreza en este desafío. ¡Felicidades por tu victoria!", victoriaMsg2:"tus ojos son casi tan fuertes como el sharingan estoy muy sorprendido de que hayas podido completar este desafío, eres un gran ninja", derrotaTitulo:"💀 ¡DERROTA!", derrotaMsg:"No pudiste completar el desafío" },
        { "--n-body-bg":"#342141","--n-text":"#f0f6ff","--n-stats":"#e8d6ff","--n-frame-bg":"linear-gradient(180deg,#3b2f20,#2d2418)","--n-frame-border":"#b8843b","--n-board-bg":"#1b1b1b","--n-panel-a":"#2a1733","--n-panel-b":"#160d1c","--n-brillo":"#d4a45a","--n-btn-bg":"linear-gradient(135deg,#3b2f20,#b8843b)","--n-v-glow":"rgba(184,132,59,.45)" }),
    uchiha: cfg("uchiha", 16, 300,
        { victoriaTitulo:"¡VICTORIA!", victoriaMsg1:"¡Has completado el desafío del clan Uchiha!", victoriaMsg2:"tus ojos son casi tan fuertes como el sharingan estoy muy sorprendido de que hayas podido completar este desafío, eres un gran ninja", derrotaTitulo:"💀 ¡DERROTA!", derrotaMsg:"No pudiste completar el desafío" },
        { "--n-body-bg":"#0b0808","--n-text":"#f5eeee","--n-stats":"#d9baba","--n-frame-bg":"linear-gradient(180deg,#210909,#0b0505)","--n-frame-border":"#700d0d","--n-board-bg":"#111111","--n-panel-a":"#240909","--n-panel-b":"#100404","--n-brillo":"#b71c1c","--n-btn-bg":"linear-gradient(135deg,#420909,#8b1111)","--n-v-glow":"rgba(255,0,0,.28)" }),
};
export function obtenerConfigNivel(id){ return CONFIG_NIVELES[id] || CONFIG_NIVELES.akatsuki; }
