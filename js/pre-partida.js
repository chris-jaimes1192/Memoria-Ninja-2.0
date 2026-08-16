/* ======================================================
   DATOS DE LOS CLANES (La base de información)
   ====================================================== */
const clanes = {
    uzumaki: {
        nombre: "CLAN UZUMAKI",
        dificultad: "★★★★☆",
        xp: "500 XP",
        descripcion: "Domina el poder del chakra sellado y supera los desafíos del clan Uzumaki.",
        logo: "assets/uzumaki.png"
    },
    uchiha: {
        nombre: "CLAN UCHIHA",
        dificultad: "★★★★★",
        xp: "500 XP",
        descripcion: "Desata el poder del Sharingan y domina las llamas oscuras del legendario clan Uchiha.",
        logo: "img/uchiha.png"
    },
    akatsuki: {
        nombre: "AKATSUKI",
        dificultad: "★★★★★",
        xp: "800 XP",
        descripcion: "Una organización temida en todo el mundo ninja por sus poderosos miembros.",
        logo: "assets/akatsuki.png"
    },
    arena: {
        nombre: "CLAN ARENA",
        dificultad: "★★★☆☆",
        xp: "400 XP",
        descripcion: "Expertos en el control de la arena y técnicas de marionetas letales.",
        logo: "img/arena.png"
    },
    roca: {
        nombre: "CLAN ROCA",
        dificultad: "★★★☆☆",
        xp: "450 XP",
        descripcion: "Ninja resilientes con una defensa impenetrable como la roca misma.",
        logo: "img/roca.png"
    }
};

/* ======================================================
   FUNCIÓN PARA ACTUALIZAR LA INTERFAZ
   ====================================================== */
function actualizarClan(idClan) {
    const clan = clanes[idClan];
    if (!clan) return;

    // 1. Actualizar Panel Superior
    document.getElementById('clan-title').innerText = clan.nombre;
    document.getElementById('dificultad').innerText = clan.dificultad;
    document.getElementById('recompensa').innerText = clan.xp;
    document.getElementById('desc-text').innerText = clan.descripcion;

    // 2. Actualizar Panel Inferior (Footer)
    document.getElementById('bar-title').innerText = clan.nombre;
    document.getElementById('bar-diff').innerText = clan.dificultad;
    document.getElementById('bar-xp').innerText = clan.xp;
    document.getElementById('bar-desc').innerText = clan.descripcion;

    // Si la imagen no carga, se quedará vacía sin romper el diseño
    const logoImg = document.getElementById('bar-logo');
    logoImg.src = clan.logo;

    // 3. Hacer visible el botón de inicio
    document.getElementById('btn-iniciar').style.display = 'block';
}

/* ======================================================
   FUNCIÓN DE ACCIÓN
   ====================================================== */
function confirmarNivel() {

    document.getElementById("btn-iniciar").style.display = "block";

    document.getElementById("btn-confirmar").classList.add("confirmado");
}

// Inicializar con un clan por defecto al cargar la página
window.onload = () => {
    actualizarClan('uzumaki');
};