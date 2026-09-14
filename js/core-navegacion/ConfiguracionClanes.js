/**
 * CONFIGURACIÓN DE CLANES
 *
 * >>> OCP <<< Sumar un clan/aldea nuevo es agregar una entrada acá y
 * en destinosJuego — RepositorioClanes, VistaClan y el controller no
 * se tocan.
 */
export const CLANES = {
    sarutobi: {
        nombre: "CLAN SARUTOBI",
        dificultad: "★★☆☆☆",
        xp: "300 XP",
        descripcion: "Ninjas veteranos de Konoha, guardianes de la sabiduría del Tercer Hokage.",
        logo: "assets/sarutobi.png",
    },
    hyuga: {
        nombre: "CLAN HYUGA",
        dificultad: "★★★☆☆",
        xp: "350 XP",
        descripcion: "Maestros del Byakugan, capaces de ver el flujo de chakra de cualquier rival.",
        logo: "assets/hyuga.png",
    },
    uzumaki: {
        nombre: "CLAN UZUMAKI",
        dificultad: "★★★★☆",
        xp: "500 XP",
        descripcion: "Domina el poder del chakra sellado y supera los desafíos del clan Uzumaki.",
        logo: "assets/uzumaki.png",
    },
    uchiha: {
        nombre: "CLAN UCHIHA",
        dificultad: "★★★★★",
        xp: "500 XP",
        descripcion: "Desata el poder del Sharingan y domina las llamas oscuras del legendario clan Uchiha.",
        logo: "img/uchiha.png",
    },
    arena: {
        nombre: "ALDEA DE LA ARENA",
        dificultad: "★★★☆☆",
        xp: "400 XP",
        descripcion: "Expertos en el control de la arena y técnicas de marionetas letales.",
        logo: "img/arena.png",
    },
    roca: {
        nombre: "ALDEA DE LA ROCA",
        dificultad: "★★★☆☆",
        xp: "450 XP",
        descripcion: "Ninja resilientes con una defensa impenetrable como la roca misma.",
        logo: "img/roca.png",
    },
    niebla: {
        nombre: "ALDEA DE LA NIEBLA",
        dificultad: "★★★★☆",
        xp: "550 XP",
        descripcion: "Espadachines legendarios envueltos en la niebla, letales a corta distancia.",
        logo: "assets/niebla.png",
    },
    nube: {
        nombre: "ALDEA DE LA NUBE",
        dificultad: "★★★★☆",
        xp: "550 XP",
        descripcion: "Ninjas veloces y disciplinados, expertos en el combate con el Rayo.",
        logo: "assets/nube.png",
    },
    akatsuki: {
        nombre: "AKATSUKI",
        dificultad: "★★★★★",
        xp: "800 XP",
        descripcion: "Una organización temida en todo el mundo ninja por sus poderosos miembros.",
        logo: "assets/akatsuki.png",
    },
};

export const DESTINOS_JUEGO = {
    sarutobi: "sarutobi.html",
    hyuga: "hyuga.html",
    uzumaki: "uzumaki.html",
    uchiha: "uchiha.html",
    arena: "arena.html",
    roca: "roca.html",
    niebla: "niebla.html",
    nube: "nube.html",
    akatsuki: "akatsuki.html",
};
