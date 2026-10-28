# MAPEO PLAN-DESARROLLO.md LINEA A LINEA
Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
Objetivo: CUMPLE / PARCIAL / FALTA / DESVIACIÓN con evidencia

## 1-23 (Reglas/Protocolo)
1-22: CUMPLE - Reglas y protocolo documentados.

## 25-34 (Estado base)
26: CUMPLE - sql/esquema.sql existe
31: CUMPLE - Auth real implementado
32: CUMPLE - seed-demo + datos-simulados
33: CUMPLE - Tests verdes

## 37-63 (Parte 1 SMTP)
37-62: CUMPLE - Verificado en README/AGENTS/archivos backend. Tests 98/98.

## 64-97 (Parte 2 Sesión real)
64-96: CUMPLE - sesion-guard.js, botón invitado, logout real, CSP arreglado.

## 98-214 (Parte 3 Datos reales + 3.5)
98-213: CUMPLE - URLs relativas, ranking real, historial real, merge invitado->cuenta, tests 104/104.

## 215-230 (Parte 4 Endurecer)
215-229: CUMPLE - middlewares, CORS, cookies, tests 124/124.

## 231-306 (Parte 5 + 5.1)
231-276: CUMPLE - Socket.io 1v1, 137/137
278-305: CUMPLE - 2v2/QR/LAN/móvil, 152/152

## 307-323 (Parte 6)
307: EN PROGRESO
317-319: CUMPLE (adelantados)
320-322: PENDIENTE - Afinar UX invitado, A11y WCAG 2.2, Desplegar
309-311: Documentado

## 324-340 (Parte 7)
324: PENDIENTE
331: CUMPLE - cola historialPendiente
335: CUMPLE - dedup servidor
333: FALTA - reintento online/offline
337-339: Documentado

## 343-352 (Registro)
350: PARCIAL/DESVIADO - Indica 137/137 pero ahora hay 152/152 (5.1 añadido)
