# POWERS ONLINE CHECKLIST
Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

## Servidor (GestorSalas.js)
- [ ] Añadir estado: sala.chakra, sala.defensas.sustitucion, sala.poderEnProceso
- [ ] Inicializar en inicializarEstadoSala()
- [ ] Reescribir evento "activar-poder" con validaciones (turno/equipo, usos, chakra)
- [ ] Añadir "poder-rechazado"
- [ ] Añadir "poder-activado" con info para UI
- [ ] Añadir "poder-efecto" con resultado
- [ ] Añadir "estado-poderes" para rejoin
- [ ] Bloquear voltear-carta si poderEnProceso
- [ ] Lógica Sustitución/Bomba/Robo
- [ ] Incluir poderes/estado en vistaEstado

## Cliente
- [ ] ClienteMultijugador.activarPoder(poderId)
- [ ] GestorSalaCliente escuchar poder-rechazado/poder-efecto/estado-poderes
- [ ] GestorPartida contexto.activarPoderOnline
- [ ] Poder.js quitar bloqueo online, usar flujo socket
- [ ] GestorPoderes pasar contexto correcto

## UI
- [ ] Resaltar botón al usar poder
- [ ] Actualizar contadores desde servidor
- [ ] Mostrar aviso quién usó poder
- [ ] Estilos CSS

## Tests/Pruebas
- [ ] npm test backend >=152
- [ ] 1v1 online poderes
- [ ] 2v2 online poderes por equipo
- [ ] Sustitución+Bomba (10) consume
- [ ] Sustitución+Robo evade consume
- [ ] Usos se agotan
