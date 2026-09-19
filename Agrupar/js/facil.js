/* =========================================================
   JUEGO: AGRUPA LOS OBJETOS SEGÚN CORRESPONDA
   (Agrupar/facil.html)

   Cada objeto pertenece a una de las dos carpetas:
   - #mitologia  -> cartas de la Aldea de la Roca
   - #scifi      -> cartas Akatsuki

   Mecánica:
   1) Se elige un objeto (clic sobre él, queda resaltado).
   2) Se hace clic sobre la carpeta correcta.
   3) Si acierta, el objeto queda colocado; si falla, el objeto
      se deselecciona y la carpeta "tiembla" (sin penalización).
   4) Ganas al agrupar todos; pierdes si se acaba el tiempo.
   ========================================================= */

(function () {
  "use strict";

  const TIEMPO_INICIAL = 40;

  const CLASIFICACION = {
    roca: [1, 2, 3, 4],
    akatsuki: [1, 2, 3, 4]
  };

  const RUTA_IMAGEN = (aldea, n) =>
    `../assets/img/cards/aldeas/${aldea}/${n}.png`;

  // ================== ELEMENTOS DEL DOM ==================
  const objetosContainer = document.getElementById("objetosContainer");
  const timerEl = document.getElementById("timer");
  const btnPause = document.getElementById("btnPause");
  const pauseMenu = document.getElementById("pauseMenu");
  const btnResume = document.getElementById("btnResume");
  const finalScreen = document.getElementById("finalScreen");
  const finalMessage = document.getElementById("finalMessage");
  const carpetas = {
    mitologia: document.getElementById("mitologia"),
    scifi: document.getElementById("scifi")
  };

  // ================== ESTADO ==================
  let segundos = TIEMPO_INICIAL;
  let pausado = false;
  let terminado = false;
  let seleccionado = null; // objeto actualmente resaltado
  let colocados = 0;
  const totalObjetos =
    Object.values(CLASIFICACION).reduce((acc, lista) => acc + lista.length, 0);

  // ================== OBJETOS ==================
  function construirObjetos() {
    const objetos = [];

    CLASIFICACION.roca.forEach((n) =>
      objetos.push({ aldea: "roca", carpeta: "mitologia", src: RUTA_IMAGEN("roca", n) })
    );
    CLASIFICACION.akatsuki.forEach((n) =>
      objetos.push({ aldea: "akatsuki", carpeta: "scifi", src: RUTA_IMAGEN("akatsuki", n) })
    );

    // Mezclar para que el orden no revele la clasificación
    for (let i = objetos.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [objetos[i], objetos[j]] = [objetos[j], objetos[i]];
    }

    objetos.forEach((datos) => {
      const boton = document.createElement("button");
      boton.className = "objeto";
      boton.type = "button";
      boton.dataset.carpeta = datos.carpeta;
      boton.style.cursor = "pointer";
      boton.style.border = "3px solid transparent";
      boton.style.borderRadius = "12px";
      boton.style.background = "rgba(0,0,0,0.35)";
      boton.style.padding = "4px";
      boton.style.transition = "transform .15s, border-color .15s, opacity .2s";

      const img = document.createElement("img");
      img.src = datos.src;
      img.alt = datos.carpeta === "mitologia" ? "Aldea de la roca" : "Akatsuki";
      img.style.width = "100%";
      img.style.display = "block";
      img.style.borderRadius = "8px";
      boton.appendChild(img);

      boton.addEventListener("click", () => seleccionar(boton));
      objetosContainer.appendChild(boton);
    });
  }

  // ================== SELECCIÓN ==================
  function seleccionar(boton) {
    if (terminado || pausado) return;

    // Ya colocado: se ignora
    if (boton.dataset.estado === "colocado") return;

    // Deseleccionar el anterior
    if (seleccionado && seleccionado !== boton) {
      seleccionado.style.borderColor = "transparent";
      seleccionado.style.transform = "scale(1)";
    }

    if (seleccionado === boton) {
      boton.style.borderColor = "transparent";
      boton.style.transform = "scale(1)";
      seleccionado = null;
      return;
    }

    seleccionado = boton;
    boton.style.borderColor = "#00ffcc";
    boton.style.boxShadow = "0 0 12px #00ffcc";
    boton.style.transform = "scale(1.08)";
  }

  // ================== COLOCAR EN CARPETA ==================
  function colocarEn(carpetaEl, carpetaId, carpetaObj) {
    if (terminado || pausado) return;

    if (!seleccionado) {
      // Sin objeto elegido: solo retroalimentación visual
      sacudir(carpetaObj);
      return;
    }

    const boton = seleccionado;
    const acierto = boton.dataset.carpeta === carpetaId;

    seleccionado = null;

    if (acierto) {
      boton.dataset.estado = "colocado";
      boton.style.borderColor = "#00ff66";
      boton.style.boxShadow = "0 0 12px #00ff66";
      boton.style.opacity = "0.65";
      boton.style.cursor = "default";
      colocados += 1;

      if (colocados === totalObjetos) {
        terminar(true);
      }
    } else {
      boton.style.borderColor = "transparent";
      boton.style.transform = "scale(1)";
      sacudir(carpetaObj);
    }
  }

  function sacudir(elemento) {
    elemento.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(6px)" },
        { transform: "translateX(0)" }
      ],
      { duration: 250 }
    );
  }

  // ================== TEMPORIZADOR ==================
  function iniciarTemporizador() {
    timerEl.textContent = segundos;

    setInterval(() => {
      if (terminado || pausado) return;

      segundos -= 1;
      timerEl.textContent = segundos;

      if (segundos <= 10) {
        timerEl.style.color = "#ff5544";
        timerEl.style.textShadow = "0 0 10px #ff5544";
      }

      if (segundos <= 0) {
        segundos = 0;
        terminar(false);
      }
    }, 1000);
  }

  // ================== FINAL ==================
  function terminar(victoria) {
    if (terminado) return;
    terminado = true;

    if (seleccionado) {
      seleccionado.style.borderColor = "transparent";
      seleccionado.style.transform = "scale(1)";
      seleccionado = null;
    }

    finalMessage.textContent = victoria
      ? "¡Perfecto, ninja! Agrupaste todos los objetos."
      : "¡Tiempo agotado! Inténtalo de nuevo.";

    finalScreen.classList.remove("hidden");
  }

  // ================== PAUSA ==================
  btnPause.addEventListener("click", () => {
    if (terminado) return;
    pausado = true;
    pauseMenu.classList.remove("hidden");
  });

  btnResume.addEventListener("click", () => {
    pausado = false;
    pauseMenu.classList.add("hidden");
  });

  // ================== CARPETAS ==================
  carpetas.mitologia.addEventListener("click", () =>
    colocarEn(carpetas.mitologia, "mitologia", carpetas.mitologia)
  );
  carpetas.scifi.addEventListener("click", () =>
    colocarEn(carpetas.scifi, "scifi", carpetas.scifi)
  );

  // ================== ARRANQUE ==================
  construirObjetos();
  iniciarTemporizador();
})();