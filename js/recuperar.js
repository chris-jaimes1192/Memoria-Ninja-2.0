/*=========================================================
    MEMORIA NINJA
    MODULO: RECUPERACION DE CONTRASEÑA
    ARCHIVO: recuperar.js

    Flujo:
    Paso 1 -> Buscar correo
    Paso 2 -> Verificar codigo
    Paso 3 -> Cambiar contraseña
=========================================================*/

let codigoGenerado = "";
let correoRecuperacion = "";

/*=========================================================
    INDICADOR DE PASOS
=========================================================*/

function marcarPaso(numeroActual) {
    for (let i = 1; i <= 3; i++) {
        const punto = document.getElementById("punto-" + i);
        if (!punto) continue;

        punto.classList.remove("activo", "completado");

        if (i < numeroActual) {
            punto.classList.add("completado");
        } else if (i === numeroActual) {
            punto.classList.add("activo");
        }
    }
}

/*=========================================================
    PASO 1 - BUSCAR CORREO
=========================================================*/

function buscarCorreo() {

    const correo = document.getElementById("correo").value.trim();
    const mensaje = document.getElementById("msg");

    mensaje.textContent = "";

    if (correo === "") {
        mensaje.textContent = "Ingresa un correo.";
        mensaje.style.color = "red";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuariosRegistrados")) || [];
    const usuario = usuarios.find(u => u.correo === correo);

    if (!usuario) {
        mensaje.textContent = "Ese correo no esta registrado.";
        mensaje.style.color = "red";
        return;
    }

    correoRecuperacion = correo;
    codigoGenerado = Math.floor(100000 + Math.random() * 900000).toString();

    alert("Codigo de recuperacion: " + codigoGenerado);

    document.getElementById("paso1").style.display = "none";
    document.getElementById("paso2").style.display = "block";
    marcarPaso(2);
}

/*=========================================================
    PASO 2 - VERIFICAR CODIGO
=========================================================*/

function verificarCodigo() {

    const codigo = document.getElementById("codigo").value.trim();
    const mensaje = document.getElementById("msg");

    mensaje.textContent = "";

    if (codigo === "") {
        mensaje.textContent = "Ingresa el codigo.";
        mensaje.style.color = "red";
        return;
    }

    if (codigo !== codigoGenerado) {
        mensaje.textContent = "Codigo incorrecto.";
        mensaje.style.color = "red";
        return;
    }

    document.getElementById("paso2").style.display = "none";
    document.getElementById("paso3").style.display = "block";
    marcarPaso(3);
}

/*=========================================================
    PASO 3 - CAMBIAR CONTRASEÑA
=========================================================*/

function guardarPassword() {

    const nueva = document.getElementById("nuevaPass").value.trim();
    const confirmar = document.getElementById("confirmarPass").value.trim();
    const mensaje = document.getElementById("msg");

    mensaje.textContent = "";

    if (nueva === "" || confirmar === "") {
        mensaje.textContent = "Completa todos los campos.";
        mensaje.style.color = "red";
        return;
    }

    if (nueva !== confirmar) {
        mensaje.textContent = "Las contraseñas no coinciden.";
        mensaje.style.color = "red";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem("usuariosRegistrados")) || [];
    const indice = usuarios.findIndex(u => u.correo === correoRecuperacion);

    if (indice === -1) {
        mensaje.textContent = "Usuario no encontrado.";
        mensaje.style.color = "red";
        return;
    }

    usuarios[indice].pass = nueva;
    localStorage.setItem("usuariosRegistrados", JSON.stringify(usuarios));

    // marcar el paso 3 como completado antes de salir
    marcarPaso(4);

    alert("Contraseña actualizada correctamente.");
    window.location.href = "login.html";
}

// arranca marcando el paso 1 como activo
document.addEventListener("DOMContentLoaded", () => marcarPaso(1));