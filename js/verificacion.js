document.addEventListener("DOMContentLoaded", () => {
    const inputCorreo = document.getElementById("input-correo");
    const btnEnviarCorreo = document.getElementById("btn-enviar-correo");
    const btnComprobarCodigo = document.getElementById("btn-comprobar-codigo");
    const paso1 = document.getElementById("paso-1");
    const paso2 = document.getElementById("paso-2");
    const contenedorCarga = document.getElementById("contenedor-carga");
    const inputCodigo = document.getElementById("input-codigo");
    const textoEnviado = document.getElementById("texto-enviado");
    const temporizador = document.getElementById("temporizador");
    const reenviarBox = document.getElementById("reenviar");
    const btnReenviar = document.getElementById("btn-reenviar");

    let codigoGenerado = null;
    let correoActual = "";
    let segundosRestantes = 60;
    let intervaloId = null;

    const DURACION_CODIGO = 60; // segundos que dura valido el codigo

    function generarCodigo() {
        const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1
        let codigo = "";
        for (let i = 0; i < 6; i++) {
            codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
        }
        return codigo;
    }

    function enmascararCorreo(correo) {
        const [usuario, dominio] = correo.split("@");
        if (!dominio) return correo;
        const visible = usuario.slice(0, 2);
        return `${visible}${"•".repeat(Math.max(usuario.length - 2, 2))}@${dominio}`;
    }

    function enviarCodigo() {
        codigoGenerado = generarCodigo();

        // No hay servidor de correo real todavia, asi que mostramos el
        // codigo aqui mismo para poder probar el flujo completo. Cuando
        // conectes un backend real, esta linea se reemplaza por el envio real.
        alert(`Modo de prueba: tu codigo es ${codigoGenerado}\n(esto se quitara cuando haya envio de correo real)`);

        textoEnviado.textContent = `Enviamos un código a ${enmascararCorreo(correoActual)}`;
        iniciarTemporizador();
    }

    function iniciarTemporizador() {
        clearInterval(intervaloId);
        segundosRestantes = DURACION_CODIGO;
        reenviarBox.style.display = "none";
        actualizarTemporizadorTexto();

        intervaloId = setInterval(() => {
            segundosRestantes--;
            actualizarTemporizadorTexto();

            if (segundosRestantes <= 0) {
                clearInterval(intervaloId);
                codigoGenerado = null; // el codigo ya no sirve
                temporizador.textContent = "Tu código expiró.";
                reenviarBox.style.display = "block";
            }
        }, 1000);
    }

    function actualizarTemporizadorTexto() {
        temporizador.textContent = `El código expira en ${segundosRestantes}s`;
    }

    btnEnviarCorreo.addEventListener("click", () => {
        const correo = inputCorreo.value.trim();

        if (correo === "") {
            alert("Escribe tu correo primero.");
            return;
        }

        correoActual = correo;
        enviarCodigo();

        paso1.classList.remove("activa");
        setTimeout(() => paso2.classList.add("activa"), 150);
    });

    btnReenviar.addEventListener("click", () => {
        enviarCodigo();
        inputCodigo.value = "";
        inputCodigo.focus();
    });

    btnComprobarCodigo.addEventListener("click", () => {
        const codigoIngresado = inputCodigo.value.trim().toUpperCase();

        if (codigoIngresado === "") {
            alert("Por favor, ingresa el código.");
            return;
        }

        if (codigoGenerado === null) {
            alert("Tu código expiró. Pide uno nuevo con \"Reenviar código\".");
            return;
        }

        if (codigoIngresado !== codigoGenerado) {
            alert("El código no es correcto. Revisa e inténtalo de nuevo.");
            inputCodigo.value = "";
            inputCodigo.focus();
            return;
        }

        clearInterval(intervaloId);

        btnComprobarCodigo.style.display = "none";
        inputCodigo.disabled = true;
        contenedorCarga.style.display = "block";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 2000);
    });
});