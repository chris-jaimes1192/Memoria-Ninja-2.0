/**
 * INTERFAZ: ProveedorDatos
 *
 * >>> ABSTRACCIÓN + ISP <<<
 * Un solo método: obtenerDatos(). El día que haya un servidor real,
 * se crea ProveedorDatosServidor.js con este mismo método (por
 * ejemplo, haciendo fetch a un backend real) y GestorPartida ni se
 * entera del cambio — sigue llamando exactamente lo mismo.
 */
export class ProveedorDatos {
    obtenerDatos() {
        throw new Error("obtenerDatos() no implementado");
    }
}
