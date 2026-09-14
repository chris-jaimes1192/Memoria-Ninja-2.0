/**
 * CONFIGURACIÓN DE ZONAS DEL MAPA
 *
 * >>> OCP <<< En el niveles.js original había 3 objetos separados
 * (BOTON_SIZE, posiciones, destinos) que había que tocar los 3 cada
 * vez que se agregaba una zona nueva. Acá es uno solo por zona — para
 * sumar una zona nueva, se agrega UN objeto a este array, nada más.
 */
export const ZONAS = [
    { id: "sarutobi", tamano: 105, x: 139, y: 443 },
    { id: "hyuga", tamano: 105, x: 321, y: 449 },
    { id: "uzumaki", tamano: 105, x: 501, y: 443 },
    { id: "uchiha", tamano: 105, x: 686, y: 411 },
    { id: "arena", tamano: 105, x: 1051, y: 249 },
    { id: "roca", tamano: 105, x: 1510, y: 280 },
    { id: "niebla", tamano: 125, x: 555, y: 955 },
    { id: "nube", tamano: 125, x: 1197, y: 943 },
    { id: "akatsuki", tamano: 165, x: 1646, y: 893 },
];

// Todas las zonas van primero a pre-partida.html (tal como en el original)
export const DESTINO_COMUN = "pre-partida.html";
