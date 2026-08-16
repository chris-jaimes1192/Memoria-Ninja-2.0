// === ELEMENTOS DEL MENÚ ===
const inputJugador1 = document.getElementById('playerName1');
const inputJugador2 = document.getElementById('playerName2');
const gameModeSelect = document.getElementById('gameMode');
const levelSelect = document.getElementById('difficulty');
const botonIniciar = document.getElementById('startBtn');
const listaRegistros = document.getElementById('recordsList');
const musica = document.getElementById('musica');
const botonNivel = document.getElementById('levelBtn');
const textoNivel = document.getElementById('nivelMostrado');

// === ELEMENTOS DEL MODAL DE PERFIL ===
const openProfileBtn = document.getElementById('openProfileBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const profileModal = document.getElementById('profileModal');
const modalName = document.getElementById('modalName');
const modalLevel = document.getElementById('modalLevel');
const statWins = document.getElementById('statWins');
const statHighScore = document.getElementById('statHighScore');

// === HISTORIAL ===
function actualizarHistorial() {
  if (!listaRegistros) return; // Evita errores si no existe en el DOM actual
  const historial = JSON.parse(localStorage.getItem('registros')) || [];

  if (historial.length === 0) {
    listaRegistros.textContent = 'No hay partidas guardadas.';
  } else {
    listaRegistros.innerHTML = historial.map(r => {
      if (r.puntajeJugador1 !== undefined) {
        return `<p>${r.nombre} — ${r.tiempo} — ${r.puntajeJugador1} | ${r.puntajeJugador2}</p>`;
      } else {
        return `<p>${r.nombre} — ${r.tiempo} — ${r.puntaje}</p>`;
      }
    }).join('');
  }
}

// === INICIAR JUEGO ===
if (botonIniciar) {
  botonIniciar.addEventListener('click', function() {
    const nombre1 = inputJugador1?.value || 'Jugador 1';
    const nombre2 = inputJugador2?.value || 'Jugador 2';
    const nivelSeleccionado = localStorage.getItem('nivelActual') || 1;
    const modoJuego = gameModeSelect?.value || '1';

    // GUARDAR DATOS PARA EL JUEGO
    localStorage.setItem('playerName1', nombre1);
    localStorage.setItem('playerName2', nombre2);
    localStorage.setItem('nivelActual', nivelSeleccionado);
    localStorage.setItem('modo2Jugadores', modoJuego === '2');
    
    // IR AL JUEGO
    window.location.href = 'game.html';
  });
}

if (botonNivel) {
  botonNivel.addEventListener('click', () => {
    window.location.href = "niveles.html";
  });
}

// === CONTROL DEL MODAL DE PERFIL ===
if (openProfileBtn && profileModal && closeProfileBtn) {
  openProfileBtn.addEventListener('click', () => {
    // Recuperar datos desde LocalStorage o asignar valores base de Shinobi
    const nombreGuardado = localStorage.getItem('playerName1') || 'Ninja Player';
    const nivelActual = localStorage.getItem('nivelActual') || '1';
    
    // Inyectar la información dinámicamente al modal
    modalName.textContent = nombreGuardado;
    modalLevel.textContent = nivelActual;
    
    // Valores de demostración modificables según tu lógica futura
    statWins.textContent = "12";
    statHighScore.textContent = "2,450 XP";

    // Mostrar el modal agregando la clase activa
    profileModal.classList.add('activo');
  });

  // Cerrar presionando la 'X'
  closeProfileBtn.addEventListener('click', () => {
    profileModal.classList.remove('activo');
  });

  // Cerrar al pulsar sobre el fondo oscuro
  window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
      profileModal.classList.remove('activo');
    }
  });
}

// === CARGAR HISTORIAL ===
actualizarHistorial();

// === MÚSICA MENÚ ===
const musicaMenu = document.getElementById("musicaMenu");

function iniciarMusica() {
  if (musicaMenu) {
    musicaMenu.volume = 0.5;
    musicaMenu.play().catch(err => console.log("Interacción requerida para audio"));
  }
  document.removeEventListener("click", iniciarMusica);
}

// La música inicia en el primer click
document.addEventListener("click", iniciarMusica);


// === CONTROL DEL MODAL DE SELECCIÓN DE MODO DE JUEGO (UN JUGADOR) ===
const panelUnJugador = document.querySelector('.panel.azul'); // Selecciona el recuadro azul
const gameModeModal = document.getElementById('gameModeModal');
const closeGameModeBtn = document.getElementById('closeGameModeBtn');

if (panelUnJugador && gameModeModal && closeGameModeBtn) {
    // Al hacer clic en el panel azul, abrimos el modal interactivo
    panelUnJugador.style.cursor = "pointer"; // Asegura que el puntero cambie
    panelUnJugador.addEventListener('click', (e) => {
        gameModeModal.classList.add('activo');
    });

    // Cerrar el modal con el botón VOLVER
    closeGameModeBtn.addEventListener('click', () => {
        gameModeModal.classList.remove('activo');
    });

    // Cerrar si se hace clic fuera del recuadro (en el fondo translúcido)
    window.addEventListener('click', (e) => {
        if (e.target === gameModeModal) {
            gameModeModal.classList.remove('activo');
        }
    });
}

// === EVENTOS PARA LOS MODOS INTERNOS (Opcional por ahora) ===
const btnEncontrarPares = document.getElementById('btnEncontrarPares');
const btnMemoria = document.getElementById('btnMemoria');

if(btnEncontrarPares) {
    btnEncontrarPares.addEventListener('click', () => {
        localStorage.setItem('subModoJuego', 'pares');
        // Aquí puedes redirigir o activar tu lógica de inicio
        console.log("Modo Encontrar Pares seleccionado");
    });
}

if(btnMemoria) {
    btnMemoria.addEventListener('click', () => {
        localStorage.setItem('subModoJuego', 'memoria');
        console.log("Modo Memoria seleccionado");
    });
}



// === CONTROL DEL MODAL DE DOS JUGADORES (ONLINE / SALAS) ===
const panelDosJugadores = document.querySelector('.panel.morado'); // Selecciona el recuadro morado
const twoPlayersModal = document.getElementById('twoPlayersModal');
const closeTwoPlayersBtn = document.getElementById('closeTwoPlayersBtn');

if (panelDosJugadores && twoPlayersModal && closeTwoPlayersBtn) {
    // Al hacer clic en el panel morado, abrimos la vista de salas
    panelDosJugadores.style.cursor = "pointer";
    panelDosJugadores.addEventListener('click', () => {
        twoPlayersModal.classList.add('activo');
        
        // Opcional: Aquí podrías generar un código de sala aleatorio dinámicamente
        const txtCodigo = document.getElementById('txtCodigoGenerado');
        if (txtCodigo) {
            txtCodigo.textContent = Math.floor(100000 + Math.random() * 900000); // Genera número de 6 dígitos
        }
    });

    // Cerrar el modal con el botón SALIR
    closeTwoPlayersBtn.addEventListener('click', () => {
        twoPlayersModal.classList.remove('activo');
    });

    // Cerrar si se hace clic fuera del contenido en el fondo oscuro
    window.addEventListener('click', (e) => {
        if (e.target === twoPlayersModal) {
            twoPlayersModal.classList.remove('activo');
        }
    });
}


// === CONTROL DEL MODAL DE MULTIJUGADOR ONLINE (LISTA DE SALAS) ===
const panelMultijugador = document.querySelector('.panel.verde'); // Selecciona el recuadro verde
const multiplayerModal = document.getElementById('multiplayerModal');
const closeMultiplayerBtn = document.getElementById('closeMultiplayerBtn');

if (panelMultijugador && multiplayerModal && closeMultiplayerBtn) {
    // Abrir al presionar el recuadro verde
    panelMultijugador.style.cursor = "pointer";
    panelMultijugador.addEventListener('click', () => {
        multiplayerModal.classList.add('activo');
    });

    // Cerrar con el botón SALIR
    closeMultiplayerBtn.addEventListener('click', () => {
        multiplayerModal.classList.remove('activo');
    });

    // Cerrar al dar clic en el fondo translúcido
    window.addEventListener('click', (e) => {
        if (e.target === multiplayerModal) {
            multiplayerModal.classList.remove('activo');
        }
    });
}

// === ACCIÓN COMPLEMENTARIA: SELECCIONAR UNA SALA DE LA LISTA ===
const filasSalas = document.querySelectorAll('.sala-row');
filasSalas.forEach(fila => {
    fila.addEventListener('click', () => {
        const creador = fila.querySelector('.sala-creador').textContent;
        const slots = fila.querySelector('.sala-slots').textContent;
        
        if(slots === "2/2") {
            alert(`La sala de ${creador} está llena.`);
        } else {
            console.log(`Uniéndose a la sala de: ${creador}`);
            localStorage.setItem('salaActualOnline', creador);
            // Aquí puedes redirigir al flujo de carga del juego multijugador
        }
    });
});




// === CONTROL DEL MODAL DE RANKING (TOP JUGADORES) ===
const botonRanking = document.querySelector('.ranking-panel'); // Selecciona tu panel de Ranking superior derecho
const rankingModal = document.getElementById('rankingModal');
const closeRankingBtn = document.getElementById('closeRankingBtn');

if (botonRanking && rankingModal && closeRankingBtn) {
    // Cambiar cursor a pointer para indicar que es clickeable
    botonRanking.style.cursor = "pointer";
    
    // Abrir modal de Ranking
    botonRanking.addEventListener('click', () => {
        rankingModal.classList.add('activo');
    });

    // Cerrar modal con el botón VOLVER
    closeRankingBtn.addEventListener('click', () => {
        rankingModal.classList.remove('remove'); // Remueve si hubiera otra lógica
        rankingModal.classList.remove('activo');
    });

    // Cerrar al hacer clic fuera del recuadro
    window.addEventListener('click', (e) => {
        if (e.target === rankingModal) {
            rankingModal.classList.remove('activo');
        }
    });
}



// === CONTROL DEL MODAL DE DETALLE DE PUNTAJE ===
document.addEventListener('DOMContentLoaded', () => {
    const btnInfoPuntaje = document.getElementById('btnInfoPuntaje');
    const puntajeInfoModal = document.getElementById('puntajeInfoModal');
    const closePuntajeInfoBtn = document.getElementById('closePuntajeInfoBtn');

    if (btnInfoPuntaje && puntajeInfoModal) {
        // Al hacer clic en el contenedor de PUNTAJE (el botón 🏆 de la barra inferior)
        btnInfoPuntaje.addEventListener('click', (e) => {
            e.preventDefault();
            puntajeInfoModal.classList.add('activo');
        });
    }

    if (closePuntajeInfoBtn && puntajeInfoModal) {
        // Al hacer clic en el botón "Volver" dentro del cuadro
        closePuntajeInfoBtn.addEventListener('click', () => {
            puntajeInfoModal.classList.remove('activo');
        });
    }

    if (puntajeInfoModal) {
        // Al hacer clic en el fondo oscuro (fuera del cuadro), también se cierra
        puntajeInfoModal.addEventListener('click', (e) => {
            if (e.target === puntajeInfoModal) {
                puntajeInfoModal.classList.remove('activo');
            }
        });
    }
});


// Redirección para el modo ENCONTRAR PARES (va a pre-partida.html)
document.getElementById('btnEncontrarPares').addEventListener('click', function() {
    window.location.href = 'pre-partida.html';
});

// Redirección para el modo MEMORIA (va a pares.html)
document.getElementById('btnMemoria').addEventListener('click', function() {

    sessionStorage.setItem("iniciarMusica", "si");

    window.location.href = "pares.html";

});

// Redirección exclusiva al presionar la fila de Itachi969
document.getElementById('btnFilaItachi').addEventListener('click', function() {
    window.location.href = 'game-online.html';
});


// 3. Carpetas (Azul) - ACTUALIZADO CON TU NUEVA RUTA
if (btnCarpetas) {
    btnCarpetas.addEventListener('click', () => {
        localStorage.setItem('subModoJuego', 'carpetas');
        console.log("Modo Carpetas seleccionado");
        window.location.href = 'Agrupar/facil.html'; // Cambiado aquí 👈
    });
}

if (btnMuerte) {
    btnMuerte.addEventListener('click', () => {
        localStorage.setItem('subModoJuego', 'muerte');
        window.location.href = 'muerte.html'; // 👈 Aquí ya apunta directamente a muerte.html
    });
}


// hitorial  de partidas //

const partidas = {

    normales: [
        {
            resultado: "victoria",
            modo: "Partida Normal",
            sub: "1 jugador",
            puntaje: "15,280",
            fecha: "12/05/2024",
            hora: "14:38"
        },
        {
            resultado: "derrota",
            modo: "Partida Normal",
            sub: "1 jugador",
            puntaje: "9,650",
            fecha: "12/05/2024",
            hora: "13:52"
        },
        {
            resultado: "victoria",
            modo: "Partida Normal",
            sub: "1 jugador",
            puntaje: "15,280",
            fecha: "12/05/2024",
            hora: "14:38"
        },
        {
            resultado: "derrota",
            modo: "Partida Normal",
            sub: "1 jugador",
            puntaje: "9,650",
            fecha: "12/05/2024",
            hora: "13:52"
        }
    ],

    online: [],

    sala: []

};

const btnHistorial = document.getElementById("btnHistorial");
const modal = document.getElementById("modalHistorial");
const cerrar = document.getElementById("cerrarHistorial");
const tabs = document.querySelectorAll(".tab-historial");
const cuerpoTabla = document.getElementById("historialBody");

function renderTabla(tabKey){

    const filas = partidas[tabKey] || [];

    if(filas.length===0){

        cuerpoTabla.innerHTML=`
        <tr>
            <td colspan="4">
                <div class="historial-vacio">
                    Todavía no hay partidas registradas en esta categoría.
                </div>
            </td>
        </tr>`;

        return;
    }

    cuerpoTabla.innerHTML=filas.map(p=>`

        <tr>

            <td class="${p.resultado==="victoria" ? "resultado-victoria":"resultado-derrota"}">

                ${p.resultado==="victoria" ? "VICTORIA":"DERROTA"}

            </td>

            <td>

                <span class="modo-principal">${p.modo}</span>
                <span class="modo-sub">${p.sub}</span>

            </td>

            <td>${p.puntaje}</td>

            <td class="fecha-hora">

                ${p.fecha}
                <br>
                <small>${p.hora}</small>

            </td>

        </tr>

    `).join("");

}

function abrirModal(){

    modal.classList.remove("hidden");

    renderTabla("normales");

}

function cerrarModal(){

    modal.classList.add("hidden");

}

btnHistorial.addEventListener("click",abrirModal);

cerrar.addEventListener("click",cerrarModal);

modal.addEventListener("click",(e)=>{

    if(e.target===modal){

        cerrarModal();

    }

});

document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape" && !modal.classList.contains("hidden")){

        cerrarModal();

    }

});

tabs.forEach(tab=>{

    tab.addEventListener("click",()=>{

        tabs.forEach(t=>t.classList.remove("activo"));

        tab.classList.add("activo");

        renderTabla(tab.dataset.tab);

    });

});


/*=========================================================
    MEMORIA NINJA
    CERRAR SESIÓN

    Elimina la sesión activa y vuelve al Login.
=========================================================*/

function cerrarSesion() {

    localStorage.removeItem("usuarioActivo");

    window.location.href = "login.html";

}