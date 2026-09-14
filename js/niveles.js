import { ZONAS, DESTINO_COMUN } from "./core-navegacion/ConfiguracionZonas.js";
import { MapaInteractivo } from "./core-navegacion/MapaInteractivo.js";
import { ModoCoordenadas } from "./core-navegacion/ModoCoordenadas.js";

/**
 * NavegadorNiveles
 *
 * >>> SRP <<< Lo único que decide es "a dónde vamos cuando se
 * selecciona una zona" — guarda el nivel elegido y redirige. La
 * lógica de CÓMO se ve y se escala el mapa es de MapaInteractivo.
 */
class NavegadorNiveles {
    irA(idZona) {
        localStorage.setItem("nivelActual", idZona);
        window.location.href = DESTINO_COMUN;
    }
}

// ================== RAÍZ DE COMPOSICIÓN ==================
const navegadorNiveles = new NavegadorNiveles();

const mapaInteractivo = new MapaInteractivo({
    idOverlay: "overlay",
    idVideo: "mapaVideo",
    zonas: ZONAS,
    alSeleccionarZona: (idZona) => navegadorNiveles.irA(idZona),
});

// Herramienta de desarrollo (tecla "C"), separada de la navegación real.
new ModoCoordenadas({ idOverlay: "overlay", mapaInteractivo });
