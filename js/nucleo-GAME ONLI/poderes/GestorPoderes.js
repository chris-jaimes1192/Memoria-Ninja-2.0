import { ByakuganPoder } from "./ByakuganPoder.js";
import { SustitucionPoder } from "./SustitucionPoder.js";
import { RoboPoder } from "./RoboPoder.js";
import { GenjutsuPoder } from "./GenjutsuPoder.js";
import { SelloPoder } from "./SelloPoder.js";
import { BombaPoder } from "./BombaPoder.js";

/**
 * GESTOR DE PODERES
 *
 * Es el equivalente, del lado del navegador, a la "raíz de
 * composición" que arma todo con "new" en el backend: acá, y SOLO
 * acá, se instancian los 6 poderes concretos y se les inyecta el
 * contexto del juego (turno, jugadores, tablero, funciones de UI).
 *
 * >>> DIP <<< Ningún poder busca sus dependencias por su cuenta —
 * todas se las pasa este gestor por medio de inyectarContexto().
 *
 * >>> OCP <<< Para sumar un poder nuevo el día de mañana, se agrega
 * UNA línea acá (this.poderes.push(new PoderNuevo())) — nunca hay que
 * tocar game-online.js ni los otros 5 poderes.
 */
export class GestorPoderes {
    constructor(contexto) {
        this.byakugan = new ByakuganPoder();
        this.sustitucion = new SustitucionPoder();
        this.robo = new RoboPoder();
        this.genjutsu = new GenjutsuPoder();
        this.sello = new SelloPoder();
        this.bomba = new BombaPoder();

        this.poderes = [
            this.byakugan,
            this.sustitucion,
            this.robo,
            this.genjutsu,
            this.sello,
            this.bomba,
        ];

        // Cada poder recibe el MISMO contexto, más las referencias a los
        // poderes que colaboran entre sí (sustitucion y genjutsu), así
        // Bomba y Byakugan no necesitan ninguna variable global.
        const contextoCompleto = { ...contexto, sustitucion: this.sustitucion, genjutsu: this.genjutsu };
        this.poderes.forEach((poder) => poder.inyectarContexto(contextoCompleto));
    }
}
