# Navegación refactorizada (niveles.js / pre-partida.js)

## Resultado
De 189 + 81 = 270 líneas mezcladas, a **6 clases/configuraciones**
en `core-navegacion/` + los 2 archivos originales como controladores
delgados.

## Capas — niveles.js (mapa)
- `ConfiguracionZonas.js` — los datos de las 9 zonas (antes eran 3
  objetos sueltos que había que tocar los 3 al agregar una zona)
- `MapaInteractivo.js` — escala y posiciona los botones sobre el video
- `ModoCoordenadas.js` — la herramienta de desarrollo (tecla "C"),
  separada por completo de la navegación real

## Capas — pre-partida.js (selección de clan)
- `ConfiguracionClanes.js` — los datos de los 9 clanes/aldeas
- `RepositorioClanes.js` — acceso a esos datos
- `VistaClan.js` — pintar el panel superior y el footer

## ⚠️ Único cambio obligatorio: `type="module"`

En `niveles.html` y `pre-partida.html`:
```html
<script type="module" src="js/niveles.js"></script>
<script type="module" src="js/pre-partida.js"></script>
```

## ⚠️ Además, sacar el `onclick` hardcodeado del botón INICIAR JUEGO

Tu `pre-partida.html` actual tiene:
```html
<button id="btn-iniciar" ... onclick="window.location.href='game.html'">INICIAR JUEGO</button>
```
Ese `onclick` apunta a `game.html`, que no existe, y le gana de mano
a la navegación real. Hay que dejarlo así, SIN el `onclick`:
```html
<button id="btn-iniciar" class="btn-start" style="display: none;">INICIAR JUEGO</button>
```
`PrePartidaController` ya se encarga de mandarlo al HTML correcto de
cada aldea (`arena.html`, `sarutobi.html`, etc.) según el nivel que se
haya elegido en el mapa.

## El `onclick="confirmarNivel()"` sigue funcionando

`pre-partida.html` tiene `onclick="confirmarNivel()"` en el botón
CONFIRMAR — se sigue exponiendo con `window.confirmarNivel = ...`, no
hace falta tocar ese botón en el HTML.

## Comportamiento verificado igual al original
- El mapa se sigue escalando y reposicionando igual al resizar.
- El modo coordenadas (tecla "C") sigue copiando al portapapeles.
- Clic en una zona guarda `nivelActual` en localStorage y va a
  pre-partida.html, igual que antes.
- pre-partida.html sigue leyendo `nivelActual`, usando "uzumaki" como
  clan por defecto si no hay nada guardado.
- Confirmar nivel sigue mostrando el botón "INICIAR JUEGO" y
  marcándolo como confirmado.
