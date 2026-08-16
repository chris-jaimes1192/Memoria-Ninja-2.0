let tiempo = 40;
const sonidoGanar = new Audio("sonidos/Ganar.mp3");
const sonidoPerder = new Audio("sonidos/Perder.mp3");
let timerInterval;
let pausado = false;

const objetos = [
    // Mitológicos
    { img: "Zeus.png", carpeta: "mitologia" },
    { img: "Sirena.png", carpeta: "mitologia" },
    { img: "Mounstro.png", carpeta: "mitologia" },
    { img: "Medusa.png", carpeta: "mitologia" },
    { img: "Minotauro.png", carpeta: "mitologia" },
    { img: "Cupido.png", carpeta: "mitologia" },

    // Ciencia Ficción
    { img: "Batman.png", carpeta: "scifi" },
    { img: "LinternaVerde.png", carpeta: "scifi" },
    { img: "Marciano.png", carpeta: "scifi" },
    { img: "Nave.png", carpeta: "scifi" },
    { img: "StrangerThings.png", carpeta: "scifi" },
    { img: "Superman.png", carpeta: "scifi" }
];

// Mezclar objetos
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

const cont = document.getElementById("objetosContainer");
const shuffleObjs = shuffle([...objetos]);

shuffleObjs.forEach((obj, i) => {
    const img = document.createElement("img");
    img.src = "img/" + obj.img;
    img.classList.add("objeto");
    img.draggable = true;
    img.id = "obj" + i;
    img.dataset.correct = obj.carpeta;

    img.addEventListener("dragstart", e => {
        e.dataTransfer.setData("id", img.id);
    });

    cont.appendChild(img);
});

// Carpetas drop
document.querySelectorAll(".carpeta").forEach(carp => {
    carp.addEventListener("dragover", e => e.preventDefault());
    carp.addEventListener("drop", e => {
        e.preventDefault();
        const id = e.dataTransfer.getData("id");
        const obj = document.getElementById(id);
        carp.appendChild(obj);
    });
});

// Timer
function iniciarTimer() {
    timerInterval = setInterval(() => {
        if (!pausado) {
            tiempo--;
            document.getElementById("timer").textContent = tiempo;

            if (tiempo <= 0) finalizarJuego(false);
        }
    }, 1000);
}

iniciarTimer();

// Botón pausa
const pauseMenu = document.getElementById("pauseMenu");

document.getElementById("btnPause").onclick = () => {
    pausado = true;
    pauseMenu.classList.remove("hidden");
};

document.getElementById("btnResume").onclick = () => {
    pausado = false;
    pauseMenu.classList.add("hidden");
};

// Finalización manual al colocar todos los objetos
document.addEventListener("mouseup", () => {
    const total = document.querySelectorAll(".objeto").length;
    const colocados = [...document.querySelectorAll(".carpeta img.objeto")].length;

    if (colocados === total) evaluarResultado();
});

function evaluarResultado() {
    pausado = true;
    clearInterval(timerInterval);

    const objetos = document.querySelectorAll(".objeto");
    let errores = 0;

    objetos.forEach(obj => {
        const carpetaActual = obj.parentElement.id;
        const carpetaCorrecta = obj.dataset.correct;

        if (carpetaActual !== carpetaCorrecta) errores++;
    });

    if (errores === 0) finalizarJuego(true);
    else finalizarJuego(false);
}

function finalizarJuego(gano) {
    pausado = true;
    clearInterval(timerInterval);

    const final = document.getElementById("finalScreen");
    const msg = document.getElementById("finalMessage");

    if (gano) {
    msg.textContent = "¡GANASTE!";
    sonidoGanar.play();

    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));

    if (usuarioActivo) {
        usuarioActivo.victoriasFacil =
            (usuarioActivo.victoriasFacil || 0) + 1;

        usuarioActivo.victoriasTotales =
            (usuarioActivo.victoriasFacil || 0) +
            (usuarioActivo.victoriasNormal || 0) +
            (usuarioActivo.victoriasDificil || 0);

        localStorage.setItem(
            "usuarioActivo",
            JSON.stringify(usuarioActivo)
        );
    }
} else {
    msg.textContent = "¡PERDISTE!";
    sonidoPerder.play();
}
    final.classList.remove("hidden");
}   