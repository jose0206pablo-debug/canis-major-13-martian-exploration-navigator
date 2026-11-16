# CANIS V1.6 · correcciones de auditoría del visor 3D

Fecha: 2026-11-16 (America/Lima). Rama: `canis-next/integration-3d`. Base inmediata: `3071aaaebb1a819e312bbc32f4858843df729544`. No se modifica la V1.5.3 estable ni la rama `main`.

## Cambios acotados

1. **Color DTM.** La paleta del manifiesto está expresada en sRGB. Los atributos de color de Three.js se interpretan como lineales. `meshColors` convierte cada canal a lineal antes de enviarlo a la GPU. La malla usa `MeshBasicMaterial` sin iluminación sintética ni tone mapping, de modo que los colores representan la misma paleta de elevación que el 2D. Una prueba verifica la conversión de `#808080` a ~0,21586 lineal. La captura `v1_6_palette_a_desktop.png` muestra el morado oscuro de cotas bajas, frente al tono lavanda de `after_3d_a_1440.png` del commit anterior. El relieve geométrico y sus alturas no cambian.
2. **Posiciones históricas.** `buildWaypointPoints` recibe los 708 registros D-005 ya cargados por la aplicación, convierte lon/lat con el CRS marciano existente y toma altura del mismo DTM mediante `sampleBilinear`. Solo crea puntos visuales: 686 registros y 22 interpolados, diferenciados por color. No une los puntos ni los presenta como trayecto exacto. Se activa con un control secundario; la interfaz explica que los puntos se superponen para ser visibles. No altera el GeoJSON ni los cálculos A/B. Captura: `v1_6_waypoints_desktop.png`.
3. **Teclado.** En el 3D: flechas giran, `+`/`−` cambian distancia de cámara, `0`/Home restablecen y Escape vuelve al mapa. Los controles quedan anunciados en la descripción accesible del lienzo y en «Datos y límites». Una prueba de navegador confirmó que ArrowLeft genera un nuevo fotograma y cambia la orientación de la brújula; Escape ya estaba probado. La navegación depende de que el foco esté dentro del visor 3D.
4. **A/B.** Las mismas muestras de perfil se representan mediante `Line2` a 2,5 píxeles de ancho. A sigue cian y discontinua; B sigue blanca y continua. No se recalcula ni suaviza la polilínea. El aviso de superposición detrás del relieve permanece. Captura: `v1_6_ab_desktop.png`.

## Verificaciones

| Control | Resultado |
|---|---|
| Pruebas | 82/82 en 15 archivos. Dos pruebas nuevas cubren conversión de color y la colocación/conteo de los 708 puntos sobre el DTM. |
| Lint | 0 errores y 0 advertencias. |
| TypeScript / build | `npm run build` correcto (`tsc -b` + Vite). Chunk 3D cargado bajo demanda: 589,23 kB bruto / 147,49 kB gzip; +6,64 kB gzip frente al commit base. |
| Datos y 2D | 580 archivos en `public/data/`; `git diff` vacío en datos, `src/analysis`, `src/data`, `src/surface` y `MapView.tsx`. Manifiesto SHA-256 `30001324EBCC47BB1A1B514C25A11E51913486FBB9AC2CE63DE726309B899BC0`; DTM SHA-256 `95E0F863C03C7BFD27D5A9E1A1592770E0E94DE6B3E807D03E79C23D01F359FA`. |
| Navegador local | CTX cargado; A 10,28 km / +826,3 m / −50,1 m; B 10,43 km / +836,9 m / −60,7 m. La tabla permanece idéntica al abrir/cerrar 3D. 708 puntos visibles al activarlos, 38 190 nodos en móvil emulado; cero errores de consola o peticiones externas. |
| Ciclo de vida | 12 aperturas/cierres en móvil emulado, sin excepción; mediana de apertura 400 ms en Chrome headless/SwiftShader. No es una medición de rendimiento en un teléfono físico. |

La textura CTX permanece desactivada; su registro fino frente al DTM sigue sin puntos de control. El visor 3D continúa siendo experimental y no evalúa seguridad, transitabilidad ni navegación EVA.

## Pendiente antes de producción

- Prueba de gestos, rendimiento y memoria en teléfono físico.
- Confirmar en el dashboard la referencia inmutable correcta del deployment V1.5.3 para rollback; la URL antes copiada terminada en `nikprz50b` devolvió `DEPLOYMENT_NOT_FOUND`.
- Verificar el nuevo Preview asociado al commit de estas correcciones en el proyecto Vercel existente. El enlace privado de Share nunca se registra en este informe.
