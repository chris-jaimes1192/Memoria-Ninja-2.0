function login() {
  const usuarioIngresado = document.getElementById("user").value.trim();
  const passwordIngresada = document.getElementById("pass").value.trim();
  const mensaje = document.getElementById("msg");

  // Obtener usuarios registrados
  const usuariosRegistrados = JSON.parse(
    localStorage.getItem("usuariosRegistrados")
  ) || [];

  // Buscar usuario válido
  const usuarioValido = usuariosRegistrados.find(
    usuario =>
      usuario.usuario === usuarioIngresado &&
      usuario.pass === passwordIngresada
  );

  if (usuarioValido) {
    mensaje.textContent = "Acceso concedido ⚡";
    mensaje.style.color = "lightgreen";

    // Guardar sesión activa
    // Revisar si el usuario quiere recordar la sesión
const recordar = document.getElementById("recordarme").checked;

if (recordar) {

    localStorage.setItem("usuarioActivo", JSON.stringify(usuarioValido));

}
    setTimeout(() => {
      window.location.href = "menu.html";
    }, 800);

  } else {
    mensaje.textContent = "Datos incorrectos";
    mensaje.style.color = "red";
  }



}

function togglePassword(idInput, icono) {
    const input = document.getElementById(idInput);

    if (input.type === "password") {
        input.type = "text";
        icono.classList.add("activo");
    } else {
        input.type = "password";
        icono.classList.remove("activo");
    }
}


/*=========================================================
    MEMORIA NINJA
    RECORDAR SESIÓN

    Si existe un usuario con la sesión iniciada,
    automáticamente se envía al menú principal.

document.addEventListener("DOMContentLoaded", () => {

    const usuarioActivo = localStorage.getItem("usuarioActivo");

    if (usuarioActivo) {

        window.location.href = "menu.html";

    }

});
*/