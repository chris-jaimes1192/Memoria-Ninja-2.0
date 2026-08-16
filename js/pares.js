window.addEventListener("load", () => {

    
    // MÚSICA
    
const musica = document.getElementById("gameMusic");

if (musica) {

    musica.volume = 0.5;

    if (sessionStorage.getItem("iniciarMusica") === "si") {

        musica.play().catch(() => {});

        sessionStorage.removeItem("iniciarMusica");

    }

}

function iniciarMusica() {

    if (musicaActiva) {

        musica.play();

    }

}

    
    // ELEMENTOS
   
    const victoriaTexto = document.getElementById("victoriaTexto");

    const contador = document.getElementById("contador");

    const cartas = document.querySelectorAll(".carta");

    const mensaje = document.getElementById("mensajeJuego");

    const puntaje = document.getElementById("puntaje");

    const tiempo = document.getElementById("tiempo");

    const modalPerder = document.getElementById("modalPerder");

    const modalGanar = document.getElementById("modalGanar");
const btnAjustes = document.getElementById("btnAjustes");
const modalAjustes = document.getElementById("modalAjustes");

const btnCerrarAjustes = document.getElementById("btnCerrarAjustes");
const btnMusica = document.getElementById("btnMusica");
const btnPausa = document.getElementById("btnPausa");
const btnMenuAjustes = document.getElementById("btnMenuAjustes");



   
    // VARIABLES
   
    

    let juegoPausado = false;
    let musicaActiva = true;

    let secuencia = [];

    let respuestaJugador = [];

    let ronda = 4;

    let bloqueado = true;

    let puntos = 0;

    let segundos = 0;

    let minutos = 0;

    
    // GENERAR SECUENCIA
   

    function generarSecuencia() {

        secuencia = [];

        cartas.forEach(carta => {

            secuencia.push(Number(carta.dataset.id));

        });

        for (let i = secuencia.length - 1; i > 0; i--) {

            const j = Math.floor(Math.random() * (i + 1));

            [secuencia[i], secuencia[j]] = [secuencia[j], secuencia[i]];

        }

    }

    
    // CRONÓMETRO
    

    setInterval(() => {

        segundos++;

        if (segundos === 60) {

            segundos = 0;

            minutos++;

        }

        if (tiempo) {

            tiempo.textContent =
                String(minutos).padStart(2, "0") +
                ":" +
                String(segundos).padStart(2, "0");

        }

    }, 1000);

   
    // ESPERAR
    

    function esperar(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

    
    // REINICIAR CARTAS
    

    function limpiarCartas() {

        cartas.forEach(carta => {

            carta.classList.remove("activa");

            carta.classList.remove("correcta");

            carta.style.pointerEvents = "auto";

        });

    }


    async function cuentaRegresiva(){

    contador.style.display = "block";

    contador.textContent = "3";

    await esperar(1000);

    contador.textContent = "2";

    await esperar(1000);

    contador.textContent = "1";

    await esperar(1000);

    contador.textContent = "¡Memoriza!";

    await esperar(1000);

    contador.style.display = "none";

}
   
    // MOSTRAR SECUENCIA
    
    async function mostrarSecuencia() {

        bloqueado = true;

respuestaJugador = [];

limpiarCartas();

await cuentaRegresiva();

if(mensaje){

    mensaje.textContent = "Memoriza la secuencia";

}

        await esperar(1000);

        for (let i = 0; i < ronda; i++) {

            const id = secuencia[i];

            const carta = document.querySelector(
                `.carta[data-id="${id}"]`
            );

            carta.classList.add("activa");

            await esperar(700);

            carta.classList.remove("activa");

            await esperar(250);

        }

        if (mensaje) {

            mensaje.textContent = "¡Sigue el orden!";

        }

        bloqueado = false;

    }

    
    // INICIAR
    

    generarSecuencia();

    mostrarSecuencia();

    
    // CLIC EN LAS CARTAS
   

    cartas.forEach(carta => {

        carta.addEventListener("click", async () => {

            // Si el juego está mostrando la secuencia
            if (bloqueado) return;

            const idCarta = Number(carta.dataset.id);

            // Evitar pulsar la misma carta dos veces
            if (carta.classList.contains("correcta")) return;

            // Guardar respuesta del jugador
            respuestaJugador.push(idCarta);

            // Posición actual
            let posicion = respuestaJugador.length - 1;

            
            // ES CORRECTA
            

            if (idCarta === secuencia[posicion]) {

                // La carta queda negra
                carta.classList.add("correcta");

                // Ya no puede volver a pulsarse
                carta.style.pointerEvents = "none";

                
                // TERMINÓ LA RONDA
                
                if (respuestaJugador.length === ronda) {

                    bloqueado = true;

                    puntos += ronda * 10;

                    if (puntaje) {
                        puntaje.textContent = puntos;
                    }

                    if (mensaje) {
                        mensaje.textContent = "¡Correcto!";
                    }

                    await esperar(1200);

                    // ¿Ganó el juego?
if (ronda === 16) {

    bloqueado = true;

    await mostrarVictoria();

    return;

}

// Siguiente ronda (+2 cartas)
ronda += 2;

await mostrarSecuencia();

                }

            } else {

              
                // PERDIÓ
              

                bloqueado = true;

                if (mensaje) {
                    mensaje.textContent = "¡Has perdido!";
                }

                await esperar(500);

                if (modalPerder) {
                    modalPerder.style.display = "flex";
                }

            }

        });



    }); 
    //CONFETIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII 77
    
    function lanzarConfeti(){

    const duracion = 3000;
    const fin = Date.now() + duracion;

    const intervalo = setInterval(() => {

        if(Date.now() > fin){

            clearInterval(intervalo);
            return;

        }

        confetti({
            particleCount: 8,
            angle: 60,
            spread: 60,
            origin: { x: 0 }
        });

        confetti({
            particleCount: 8,
            angle: 120,
            spread: 60,
            origin: { x: 1 }
        });

    }, 200);

}
 //mensaje de que gano la partida//
async function mostrarVictoria() {

    lanzarConfeti();

    modalGanar.style.display = "flex";

    victoriaTexto.style.display = "block";

    await esperar(1500);

    victoriaTexto.style.display = "none";

}

    // ===========================
    // BOTÓN REINICIAR (DERROTA)
    // ===========================

    const btnReiniciar = document.getElementById("reiniciar");

    if (btnReiniciar) {

        btnReiniciar.addEventListener("click", () => {

            location.reload();

        });

    }

    // ===========================
    // BOTÓN MENÚ (DERROTA)
    // ===========================

    const btnMenu = document.getElementById("menu");

    if (btnMenu) {

        btnMenu.addEventListener("click", () => {

            window.location.href = "menu.html";

        });

    }

    //boton jugar otra vez (VICTORIA)

    const btnVolverJugar = document.getElementById("volverJugar");

    if (btnVolverJugar) {

        btnVolverJugar.addEventListener("click", () => {

            location.reload();

        });

    }

    
    // BOTÓN VOLVER AL MENÚ (VICTORIA)
    

    const btnVolverMenu = document.getElementById("volverMenu");

    if (btnVolverMenu) {

        btnVolverMenu.addEventListener("click", () => {

            window.location.href = "menu.html";

        });

    }


//boton de pausa donde esta la muusica ir al menu y volumen

// Abrir ajustes
btnAjustes.addEventListener("click", () => {

    modalAjustes.style.display = "flex";

});

// Cerrar ajustes
btnCerrarAjustes.addEventListener("click", () => {

    modalAjustes.style.display = "none";

});

// Música
if (btnMusica) {

    btnMusica.addEventListener("click", async () => {

        if (musica.paused) {

            musicaActiva = true;

            await musica.play();

            btnMusica.textContent = "🎵 Música: ON";

        } else {

            musicaActiva = false;

            musica.pause();

            btnMusica.textContent = "🔇 Música: OFF";

        }

    });

}

// Pausar juego
btnPausa.addEventListener("click", () => {

    juegoPausado = !juegoPausado;

    bloqueado = juegoPausado;

    if (juegoPausado) {

        btnPausa.textContent = "Reanudar partida";

    } else {

        btnPausa.textContent = "Pausar partida";

    }

});

// Ir al menú
btnMenuAjustes.addEventListener("click", () => {

    window.location.href = "menu.html";

});

});