// js/loading.js
const name = localStorage.getItem('playerName') || 'Jugador';
const avatar = localStorage.getItem('avatarImg') || '1.png';

document.getElementById('welcome').innerText = `¡Hola, ${name}!`;
document.getElementById('avatarPreview').src = `assets/img/${ avatar.includes('/') ? avatar.split('/').pop() : avatar }`;

const status = document.getElementById('status');
status.innerText = 'Iniciando sesión...';

setTimeout(() => {
  status.innerText = '✔ Sesión iniciada correctamente';
  setTimeout(() => window.location.href = 'menu.html', 900);
}, 900);










// mensajes aleotirios de carga intentos de Johan NO TOCAR
const mensajes = [
    "a pesar de mi sharingan no podia ver nada.",
    "despierta a la realidad, nada sale como se planea en este mundo maldito.",
    "tus palabras me cortan mas que cualquier navaja.",
    "siente el dolor  SHINRA TENSEI.",
    "yo sere el proximo hokage.",
    "Johan se esforzo mucho valoren eso jaja."
];

let ultimoMensaje = null;

// pa q no se repita esa monda
function obtenerMensajeAleatorio() {
    let mensaje;
    do {
        mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];
    } while (mensaje === ultimoMensaje);

    ultimoMensaje = mensaje;
    return mensaje;
}


function mostrarMensajeDeCarga() {
    const elemento = document.getElementById("mensaje-carga");
    elemento.textContent = obtenerMensajeAleatorio();
}

mostrarMensajeDeCarga();
