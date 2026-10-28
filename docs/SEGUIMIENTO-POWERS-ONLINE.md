# SEGUIMIENTO PODERES ONLINE + CUBRIR PLAN
Última actualización: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

## Estado global
- Partes 1-5.1: COMPLETAS (152/152 tests backend)
- Parte 6: EN PROGRESO
- Parte 7: PENDIENTE (falta reintento online/offline)

## Objetivo actual
Habilitar poderes reales en modo online (1v1/2v2) por Socket.io. Sincronizar UI (espacio de poderes cambia al usar). Cubrir PLAN-DESARROLLO.md línea a línea.

## Archivos clave a tocar
### Servidor
- backend-poderes/src/servicios/online/GestorSalas.js

### Cliente
- js/multijugador/ClienteMultijugador.js
- js/multijugador/GestorSalaCliente.js
- js/nucleo-GAME ONLI/poderes/Poder.js
- js/nucleo-GAME ONLI/poderes/GestorPoderes.js
- js/nucleo-GAME ONLI/GestorPartida.js

### UI/otros
- game-online.html (revisar)
- js/board-manager.js (solo bloqueo)
- css/game-online.css (estilos para panel)

## Checklist
- [ ] Crear docs/PLAN-LINEA-A-LINEA-MAPEO.md
- [ ] Crear docs/POWERS-ONLINE-CHECKLIST.md
- [ ] Fase 2: Servidor poderes
- [ ] Fase 3: Cliente poderes
- [ ] Fase 4: UI panel poderes
- [ ] Fase 5: Pruebas

## Siguiente paso exacto
Leer PLAN-DESARROLLO.md completo y generar mapeo línea a línea.
