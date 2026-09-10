const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1088;

// Tamaño del botón en el mapa original
const BOTON_SIZE = {

    sarutobi:105,
    hyuga:105,
    uzumaki:105,
    uchiha:105,

    arena:105,
    roca:105,

    niebla:125,
    nube:125,

    akatsuki:165

};

const overlay = document.getElementById("overlay");
const video = document.getElementById("mapaVideo");

const posiciones = {

    // ===== KONOHA =====
    sarutobi:{x:139,y:443},
    hyuga:{x:321,y:449},
    uzumaki:{x:501,y:443},
    uchiha:{x:686,y:411},

    // ===== ALDEAS =====
    arena:{x:1051,y:249},
    roca:{x:1510,y:280},
    niebla:{x:555,y:955},
    nube:{x:1197,y:943},

    // ===== FINAL =====
    akatsuki:{x:1646,y:893}

};

const destinos={

    sarutobi:"sarutobi.html",
    hyuga:"hyuga.html",
    uzumaki:"uzumaki.html",
    uchiha:"uchiha.html",

    arena:"arena.html",
    roca:"roca.html",
    niebla:"niebla.html",
    nube:"nube.html",

    akatsuki:"akatsuki.html"

};

// Eventos
Object.keys(destinos).forEach(id=>{

    const boton=document.getElementById(id);

    if(!boton) return;

    boton.addEventListener("click",()=>{

        localStorage.setItem("nivelActual",id);

        window.location.href=destinos[id];

    });

});

function actualizarMapa(){

    const vw=window.innerWidth;
    const vh=window.innerHeight;

    const escala=Math.min(
        vw/VIDEO_WIDTH,
        vh/VIDEO_HEIGHT
    );

    const ancho=VIDEO_WIDTH*escala;
    const alto=VIDEO_HEIGHT*escala;

    const offsetX=(vw-ancho)/2;
    const offsetY=(vh-alto)/2;

    overlay.style.left=offsetX+"px";
    overlay.style.top=offsetY+"px";
    overlay.style.width=ancho+"px";
    overlay.style.height=alto+"px";

Object.keys(posiciones).forEach(id=>{

    const b=document.getElementById(id);

    if(!b) return;

    const size = BOTON_SIZE[id] * escala;

    b.style.width = size + "px";
    b.style.height = size + "px";

    b.style.left = (posiciones[id].x * escala - size / 2) + "px";
    b.style.top = (posiciones[id].y * escala - size / 2) + "px";

});

}

window.addEventListener("resize",actualizarMapa);

video.addEventListener("loadedmetadata",actualizarMapa);

window.addEventListener("load",()=>{

    actualizarMapa();

    video.play().catch(()=>{});

});



/* ======================================
   MODO OBTENER COORDENADAS
   (Presiona la tecla C para activar)
====================================== */

let modoCoordenadas = false;

document.addEventListener("keydown", (e) => {

    if (e.key.toLowerCase() === "c") {

        modoCoordenadas = !modoCoordenadas;

        console.clear();

        console.log(
            modoCoordenadas
            ? "🟢 Modo coordenadas ACTIVADO"
            : "🔴 Modo coordenadas DESACTIVADO"
        );

    }

});

overlay.addEventListener("click", (e) => {

    if (!modoCoordenadas) return;

    const rect = overlay.getBoundingClientRect();

    const escala = rect.width / VIDEO_WIDTH;

    const x = Math.round((e.clientX - rect.left) / escala);
    const y = Math.round((e.clientY - rect.top) / escala);

    console.log(`x:${x}, y:${y}`);

    navigator.clipboard.writeText(`{x:${x},y:${y}}`);

    // Marca visual
    const punto = document.createElement("div");

    punto.style.position = "absolute";
    punto.style.left = (e.clientX - rect.left - 5) + "px";
    punto.style.top = (e.clientY - rect.top - 5) + "px";
    punto.style.width = "10px";
    punto.style.height = "10px";
    punto.style.background = "red";
    punto.style.borderRadius = "50%";
    punto.style.pointerEvents = "none";

    overlay.appendChild(punto);

    setTimeout(() => {

        punto.remove();

    }, 800);

});