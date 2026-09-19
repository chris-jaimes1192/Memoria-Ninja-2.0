/* =========================================================
   JUEGO: ENCONTRAR PARES
   (pares.html)

   Dinámica:
   - Debe encontrar las 8 parejas de cartas ninja volteando
     dos cartas por turno.
   - Acierto: la pareja queda marcada (verde/apagada) y suma
     100 puntos por cada par.
   - Fallo: las cartas se ocultan de nuevo.
   - Tienes 60 segundos. Sin pares restantes = victoria.
   ========================================================= */

(function () {
  "use strict";

  const TIEMPO_JUEGO = 60; // segundos
  const PUNTOS_POR_PAR = 100;

  const IMAGENES = [
    "assets/img/cards/aldeas/akatsuki/1.png",
    "assets/img/cards/aldeas/akatsuki/2.png",
    "assets/img/cards/aldeas/akatsuki/3.png",
    "assets/img/cards/aldeas/akatsuki/4.png",
    "assets/img/cards/aldeas/konoha/uchiha/1.png",
    "assets/img/cards/aldeas/konoha/uchiha/2.png",
    "assets/img/cards/aldeas/konoha/uchiha/3.png",
    "assets/img/cards/aldeas/konoha/uchiha/4.png"
  ];

  // ================== ELEMENTOS DEL DOM ==================
  const tableroIzq = document.getElementById("tableroIzquierdo");
  const tableroDer = document.getElementById("tableroDerecho");
  const puntajeDOM = document.getElementById("puntaje");
  const tiempoDOM = document.getElementById("tiempo");
  const contadorDOM = document.getElementById("contador");
  const victoriaTexto = document.getElementById("victoriaTexto");
  const modalPerder = document.getElementById("modalPerder");
  const modalGanar = document.getElementById("modalGanar");
  const modalAjustes = document.getElementById("modalAjustes");
  const btnAjustes = document.getElementById("btnAjustes");
  const btnMusica = document.getElementById("btnMusica");
  const btnPausa = document.getElementById("btnPausa");
  const btnMenuAjustes = document.getElementById("btnMenuAjustes");
  const btnCerrarAjustes = document.getElementById("btnCerrarAjustes");
  const musica = document.getElementById("gameMusic");

  // ================== ESTADO ==================
  let cartas = [];          // elementos .carta generados
  let primera = null;       // primera carta descubierta
  let segunda = null;       // segunda carta descubierta
  let bloqueado = false;    // true mientras se comprueba un intento
  let puntaje = 0;
  let segundosRestantes = TIEMPO_JUEGO;
  let temporizadorInterval = null;
  let pausado = false;
  let partidaTerminada = false;
  let parejasRestantes = IMAGENES.length;

  // ================== BARAJAR ==================
  function barajar(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // ================== TABLERO ==================
  function construirTablero() {
    const mezcla = barajar([...IMAGENES, ...IMAGENES]); // cada imagen x2 = 16 cartas

    const mitades = [mezcla.slice(0, 8), mezcla.slice(8, 16)];
    const contenedores = [tableroIzq, tableroDer];

    contenedores.forEach((contenedor, mitad) => {
      mitades[mitad].forEach((src, indice) => {
        const carta = document.createElement("div");
        carta.className = "carta";
        carta.dataset.src = src;
        carta.dataset.pareja = IMAGENES.indexOf(src);

        const img = document.createElement("img");
        img.src = src;
        img.alt = "Carta ninja";
        img.style.opacity = "0"; // boca abajo hasta voltear
        img.draggable = false;

        carta.appendChild(img);
        carta.addEventListener("click", () => voltear(carta));
        contenedor.appendChild(carta);
        cartas.push(carta);
      });
    });
  }

  // ================== VOLTEAR ==================
  function voltear(carta) {
    if (bloqueado || pausado || partidaTerminada) return;
    if (carta === primera) return;
    if (carta.classList.contains("correcta")) return;

    mostrar(carta);

    if (!primera) {
      primera = carta;
      return;
    }

    segunda = carta;
    bloqueado = true;
    comprobar();
  }

  function mostrar(carta) {
    carta.querySelector("img").style.opacity = "1";
    carta.classList.add("activa");
  }

  function ocultar(carta) {
    carta.querySelector("img").style.opacity = "0";
    carta.classList.remove("activa");
  }

  // ================== COMPROBAR PAREJA ==================
  function comprobar() {
    const acierto = primera.dataset.pareja === segunda.dataset.pareja;

    if (acierto) {
      setTimeout(() => {
        primera.classList.add("correcta");
        primera.classList.remove("activa");
        segunda.classList.add("correcta");
        segunda.classList.remove("activa");

        puntaje += PUNTOS_POR_PAR;
        puntajeDOM.textContent = puntaje;

        parejasRestantes -= 1;
        if (parejasRestantes === 0) {
          terminarPartida(true);
        }

        limpiarIntento();
      }, 250);
    } else {
      setTimeout(() => {
        ocultar(primera);
        ocultar(segunda);
        limpiarIntento();
      }, 900);
    }
  }

  function limpiarIntento() {
    primera = null;
    segunda = null;
    bloqueado = false;
  }

  // ================== CONTADOR 3-2-1 ==================
  function iniciarCuentaRegresiva() {
    let numero = 3;
    contadorDOM.style.display = "block";
    contadorDOM.textContent = numero;

    const intervalo = setInterval(() => {
      numero -= 1;
      if (numero > 0) {
        contadorDOM.textContent = numero;
      } else {
        contadorDOM.textContent = "¡YA!";
        clearInterval(intervalo);
        setTimeout(() => {
          contadorDOM.style.display = "none";
          iniciarTemporizador();
        }, 400);
      }
    }, 800);
  }

  // ================== TEMPORIZADOR ==================
  function iniciarTemporizador() {
    mostrarTiempo();

    temporizadorInterval = setInterval(() => {
      if (pausado || partidaTerminada) return;

      segundosRestantes -= 1;
      mostrarTiempo();

      if (segundosRestantes <= 0) {
        segundosRestantes = 0;
        terminarPartida(false);
      }
    }, 1000);
  }

  function mostrarTiempo() {
    const min = String(Math.floor(segundosRestantes / 60)).padStart(2, "0");
    const seg = String(segundosRestantes % 60).padStart(2, "0");
    tiempoDOM.textContent = `${min}:${seg}`;
  }

  // ================== FIN DE PARTIDA ==================
  function terminarPartida(victoria) {
    if (partidaTerminada) return;
    partidaTerminada = true;

    clearInterval(temporizadorInterval);
    guardarRegistro(victoria);

    if (victoria) {
      victoriaTexto.style.display = "block";
      if (typeof confetti === "function") {
        confetti({ particleCount: 180, spread: 90, origin: { y: 0.6 } });
      }
      setTimeout(() => {
        victoriaTexto.style.display = "none";
        abrirModal(modalGanar);
      }, 1700);
    } else {
      abrirModal(modalPerder);
    }
  }

  function guardarRegistro(victoria) {
    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    const nombre = (JSON.parse(localStorage.getItem("usuarioActivo")) || {}).nombre || "Jugador";
    registros.push({
      nombre: nombre,
      puntaje: puntaje,
      tiempo: tiempoDOM.textContent,
      victoria: victoria
    });
    localStorage.setItem("registros", JSON.stringify(registros));
  }

  // ================== MODALES ==================
  function abrirModal(modal) {
    modal.style.display = "flex";
  }
  function cerrarModal(modal) {
    modal.style.display = "none";
  }

  function reiniciar() {
    window.location.reload();
  }

  // ================== AJUSTES ==================
  btnAjustes.addEventListener("click", () => {
    if (partidaTerminada) return;
    pausado = true;
    abrirModal(modalAjustes);
  });

  btnCerrarAjustes.addEventListener("click", () => {
    cerrarModal(modalAjustes);
    pausado = false;
  });

  btnPausa.addEventListener("click", () => {
    pausado = !pausado;
    btnPausa.textContent = pausado ? "Reanudar partida" : "Pausar partida";
  });

  btnMusica.addEventListener("click", () => {
    if (musica.paused) {
      musica.play();
      btnMusica.textContent = "Música: ON";
    } else {
      musica.pause();
      btnMusica.textContent = "Música: OFF";
    }
  });

  btnMenuAjustes.addEventListener("click", () => {
    window.location.href = "menu.html";
  });

  // Botones de los modales
  document.getElementById("reiniciar").addEventListener("click", reiniciar);
  document.getElementById("menu").addEventListener("click", () => {
    window.location.href = "menu.html";
  });
  document.getElementById("volverJugar").addEventListener("click", reiniciar);
  document.getElementById("volverMenu").addEventListener("click", () => {
    window.location.href = "menu.html";
  });

  // ================== ARRANQUE ==================
  construirTablero();
  iniciarCuentaRegresiva();
})();