import { JuegoService } from "../akatsuki/services/JuegoService.js";
import { CartaService as CartaServiceA } from "../akatsuki/services/CartaService.js";
import { PuntajeService as PuntajeServiceA } from "../akatsuki/services/PuntajeService.js";
import { TiempoService } from "../core-navegacion/TiempoService.js";
import { Jugador } from "../akatsuki/entities/Jugador.js";
import { Partida } from "../akatsuki/entities/Partida.js";
import { historialApi } from "../infraestructura/repositorios/HttpHistorialRepositorio.js";
import { progresoService } from "../services/progresoService.js";
import { aplicarTemaAldea, prepararImagenCarta, precargarImagenes } from "../core-navegacion/TemaAldea.js";
import { conectarPausa } from "../ui/PauseModal.js";
import { obtenerConfigNivel } from "./configNivel.js";

/* ControladorNivel - Base (SRP: flujo; DIP: config+servicios; OCP: por config).
   Layout/posiciones/tamaños = uchiha (game-shell + tema-aldea). Colores/cartas/respaldo PROPIOS por nivel. */
export class ControladorNivel {
    constructor(aldeaId) {
        this.cfg = obtenerConfigNivel(aldeaId);
        this.aldeaId = this.cfg.aldea;
        aplicarTemaAldea(this.aldeaId); // setea --tema-principal/brillo/fondo/reverso + data-tema-aldea (tema-aldea posiciona como uchiha)
        Object.entries(this.cfg.vars || {}).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));

        this.rutaBack = this.cfg.reverso;
        this.rutaCartas = this.cfg.cartas;
        const nombre = localStorage.getItem("playerName1") || "Ninja";
        this.jugador = new Jugador(nombre);
        this.partida = new Partida(this.jugador);
        this.cartaService = new CartaServiceA(this.rutaBack, this.rutaCartas);
        this.puntajeService = new PuntajeServiceA();
        this.tiempoService = new TiempoService(this.cfg.tiempo);
        this.juegoService = new JuegoService(this.partida, this.cartaService, this.puntajeService);
        conectarPausa(this.tiempoService);
        this.tablero = document.getElementById("board");
        this.mostrarTiempo = document.getElementById("timer");
        this.mostrarMovimientos = document.getElementById("moves");
        this.mostrarPuntaje = document.getElementById("score");
        this.modal = document.getElementById("modal");
        this.victoryModal = document.getElementById("victoryModal");
        this.finalStats = document.getElementById("finalStats");
        this.victoryStats = document.getElementById("victoryStats");
        this.juegoBloqueado = false; this.cartasDOM = [];
        this.#textos();
        const bind = (id, fn) => { const el=document.getElementById(id); if(el) el.addEventListener("click", fn); };
        bind("restartGame", ()=>this.iniciarJuego()); bind("closeModal", ()=>this.irAlMenu());
        bind("victoryRestart", ()=>this.iniciarJuego()); bind("victoryClose", ()=>this.irAlMenu());
        this.iniciarJuego();
    }
    #textos(){ const t=this.cfg.textos||{};
        const set=(id,txt)=>{ if(txt){const e=document.getElementById(id); if(e) e.textContent=txt;} };
        const q=(sel,txt)=>{ if(txt){const e=document.querySelector(sel); if(e) e.textContent=txt;} };
        q("#victoryModal .victory-panel h2", t.victoriaTitulo);
        set("victoryMsg1", t.victoriaMsg1); set("victoryMsg2", t.victoriaMsg2);
        q("#modal .panel h2", t.derrotaTitulo); set("defeatMsg", t.derrotaMsg);
    }
    iniciarJuego(){ this.tiempoService.detener(); this.ocultarModales(); this.juegoBloqueado=false;
        const cartas=this.juegoService.iniciar();
        precargarImagenes([this.rutaBack,...cartas.map(c=>c.getImagen())]);
        this.generarTablero(cartas); this.actualizarInterfaz();
        this.tiempoService.reiniciar(this.cfg.tiempo); this.actualizarTiempo();
        this.tiempoService.iniciar((s)=>{ this.actualizarTiempo(); if(s<=0) this.mostrarDerrota(); });
    }
    generarTablero(cartas){ this.tablero.innerHTML=""; this.cartasDOM=[];
        cartas.forEach((carta,i)=>{ const dom=document.createElement("div"); dom.classList.add("card");
            const back=document.createElement("img"); back.src=this.rutaBack; back.classList.add("back"); prepararImagenCarta(back);
            const front=document.createElement("img"); front.src=carta.getImagen(); front.classList.add("front"); prepararImagenCarta(front);
            dom.dataset.indice=i; dom.carta=carta; dom.append(back,front);
            dom.addEventListener("click",()=>this.seleccionarCarta(dom));
            this.tablero.appendChild(dom); this.cartasDOM.push(dom);
        });
    }
    seleccionarCarta(dom){ if(this.juegoBloqueado) return; const carta=dom.carta;
        if(carta.estaEncontrada()||carta.estaVolteada()) return;
        if(!this.juegoService.voltearCarta(carta)) return;
        dom.classList.add("flipped"); this.juegoService.aumentarMovimiento(); this.actualizarInterfaz();
        if(this.partida.cartasVolteadas.length===2){ this.juegoBloqueado=true; setTimeout(()=>this.comprobarPareja(),800); }
    }
    comprobarPareja(){ const [c1,c2]=[...this.partida.cartasVolteadas];
        if(!c1||!c2){ this.juegoBloqueado=false; return; }
        const d1=this.cartasDOM.find(e=>e.carta===c1), d2=this.cartasDOM.find(e=>e.carta===c2);
        const ok=this.juegoService.verificarPareja();
        if(ok){ d1.classList.add("flipped","found"); d2.classList.add("flipped","found");
            d1.style.pointerEvents="none"; d2.style.pointerEvents="none";
            this.juegoService.finalizarIntento(); this.actualizarInterfaz();
            setTimeout(()=>{ d1.style.visibility="hidden"; d2.style.visibility="hidden"; },700);
            if(this.juegoService.verificarVictoria(this.cfg.totalCartas)){ this.tiempoService.detener(); setTimeout(()=>this.mostrarVictoria(),800); return; }
            setTimeout(()=>{ this.juegoBloqueado=false; },700); return;
        }
        setTimeout(()=>{ d1.classList.remove("flipped"); d2.classList.remove("flipped");
            c1.ocultar(); c2.ocultar(); this.juegoService.finalizarIntento(); this.actualizarInterfaz(); this.juegoBloqueado=false; },300);
    }
    actualizarInterfaz(){ if(this.mostrarMovimientos) this.mostrarMovimientos.textContent=this.partida.movimientos;
        if(this.mostrarPuntaje) this.mostrarPuntaje.textContent=this.partida.obtenerJugador().getPuntaje(); }
    actualizarTiempo(){ if(!this.mostrarTiempo) return; const s=this.tiempoService.obtenerTiempo();
        this.mostrarTiempo.textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`; }
    guardarResultadoServidor(victoria){ const puntaje=this.partida.obtenerJugador().getPuntaje();
        progresoService.registrarFinPartida({victoria,puntaje});
        historialApi.guardar({zona:this.aldeaId,puntaje,modo:"1",ganador:victoria?this.jugador.nombre:"ninguno",idPartida:`${this.aldeaId}-${Date.now()}`}); }
    mostrarDerrota(){ if(this.juegoBloqueado) return; this.juegoBloqueado=true; this.tiempoService.detener();
        if(this.finalStats) this.finalStats.textContent=`Movimientos: ${this.partida.movimientos} | Puntaje: ${this.partida.obtenerJugador().getPuntaje()}`;
        if(this.modal) this.modal.classList.remove("hidden"); this.guardarResultadoServidor(false); }
    mostrarVictoria(){ this.juegoBloqueado=true; this.tiempoService.detener();
        if(this.victoryStats) this.victoryStats.textContent=`Movimientos: ${this.partida.movimientos} | Puntaje: ${this.partida.obtenerJugador().getPuntaje()}`;
        if(this.victoryModal) this.victoryModal.classList.remove("hidden"); this.guardarResultadoServidor(true); }
    ocultarModales(){ if(this.modal) this.modal.classList.add("hidden"); if(this.victoryModal) this.victoryModal.classList.add("hidden"); }
    irAlMenu(){ this.tiempoService.detener(); window.location.href="menu.html"; }
}
