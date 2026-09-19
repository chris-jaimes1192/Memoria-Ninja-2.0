// === ELEMENTOS DEL MENÚ ===
const inputJugador1 = document.getElementById('playerName1');
const inputJugador2 = document.getElementById('playerName2');
const gameModeSelect = document.getElementById('gameMode');
const levelSelect = document.getElementById('difficulty');
const botonIniciar = document.getElementById('startBtn');
const listaRegistros = document.getElementById('recordsList');
const botonNivel = document.getElementById('levelBtn');

// === HISTORIAL (lista lateral) ===
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

// === ACCIÓN COMPLEMENTARIA: SELECCIONAR UNA SALA DE LA LISTA ===
const filasSalas = document.querySelectorAll('.sala-row');
filasSalas.forEach(fila => {
  fila.addEventListener('click', () => {
    const creador = fila.querySelector('.sala-creador').textContent;
    const slots = fila.querySelector('.sala-slots').textContent;

    if (slots === "2/2") {
      alert(`La sala de ${creador} está llena.`);
    } else {
      console.log(`Uniéndose a la sala de: ${creador}`);
      localStorage.setItem('salaActualOnline', creador);
    }
  });
});

// Redirección exclusiva al presionar la fila de Itachi969
document.getElementById('btnFilaItachi')?.addEventListener('click', function() {
  window.location.href = 'game-online.html';
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

// === PING EN TIEMPO REAL EN LA BARRA DE ESTADO ===
const pingValor = document.getElementById('pingValor');
let pingSimulado = 45;

function simularPing() {
  const deriva = Math.round((Math.random() - 0.5) * 12);
  pingSimulado = Math.min(140, Math.max(12, pingSimulado + deriva));
  return pingSimulado;
}

async function medirPingReal() {
  const inicio = performance.now();
  try {
    await fetch(`http://localhost:3000/api/estado?t=${Date.now()}`, {
      mode: 'no-cors',
      cache: 'no-store'
    });
    return Math.max(1, Math.round(performance.now() - inicio));
  } catch {
    return null; // Servidor no disponible
  }
}

async function actualizarPing() {
  if (!pingValor) return;
  const ms = await medirPingReal();
  const valor = ms ?? simularPing();
  pingValor.textContent = `${valor}ms`;
}

setInterval(actualizarPing, 2000);
actualizarPing();