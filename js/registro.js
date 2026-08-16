function registrar() {

    const usuario = document.getElementById("usuario").value.trim();
    const nacimiento = document.getElementById("nacimiento").value.trim();
    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("pass").value.trim();
    const confirmar = document.getElementById("pass2").value.trim();
    const mensaje = document.getElementById("msg");

    mensaje.textContent = "";

    if (!usuario || !nacimiento || !correo || !contrasena || !confirmar) {
        mostrarMensaje("Por favor, completa todos los campos.", "red");
        return;
    }

    if (contrasena !== confirmar) {
        mostrarMensaje("Las contraseñas no coinciden.", "red");
        return;
    }
const aceptaTerminos = document.getElementById("aceptaTerminos").checked;
const aceptaPolitica = document.getElementById("aceptaPolitica").checked;

if (!aceptaTerminos) {
    mostrarMensaje("Debes aceptar los Términos y Condiciones.", "red");
    return;
}

if (!aceptaPolitica) {
    mostrarMensaje("Debes aceptar la Política de Privacidad.", "red");
    return;
}
    const usuarios = JSON.parse(localStorage.getItem("usuariosRegistrados")) || [];

    const correoRepetido = usuarios.some(u => u.correo === correo);

    if (correoRepetido) {
        mostrarMensaje("Este correo ya está registrado.", "red");
        return;
    }

    const nuevo = {
        usuario,
        nacimiento,
        correo,
        pass: contrasena
    };

    usuarios.push(nuevo);
    localStorage.setItem("usuariosRegistrados", JSON.stringify(usuarios));

    mostrarMensaje("Registro exitoso. Ahora puedes iniciar sesión.", "lightgreen");

    document.getElementById("usuario").value = "";
    document.getElementById("nacimiento").value = "";
    document.getElementById("correo").value = "";
    document.getElementById("pass").value = "";
    document.getElementById("pass2").value = "";
}

/* 🔥 función para mensajes con animación */
function mostrarMensaje(texto, color) {
    const mensaje = document.getElementById("msg");
    mensaje.textContent = texto;
    mensaje.style.color = color;

    mensaje.style.opacity = "0";
    setTimeout(() => {
        mensaje.style.transition = "0.5s";
        mensaje.style.opacity = "1";
    }, 50);
}


// ==========================
// MODALES
// ==========================

function abrirModal(id){
    document.getElementById(id).style.display = "flex";
}

function cerrarModal(id){
    document.getElementById(id).style.display = "none";
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event){

    const modalTerminos = document.getElementById("modalTerminos");
    const modalPolitica = document.getElementById("modalPolitica");

    if(event.target == modalTerminos){
        modalTerminos.style.display = "none";
    }

    if(event.target == modalPolitica){
        modalPolitica.style.display = "none";
    }

}