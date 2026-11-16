# CANIS NEXT · candidata de relieve 3D integrado

Fecha: 2026-11-16 (America/Lima). Copia aislada: `canis_next_integration_3d`. Rama: `canis-next/integration-3d`. Base exacta: `b6aadf6c8a276096914a4da1d578f99a1395144b` (V1.5.3). Esta candidata no se ha fusionado ni publicado.

## Alcance y procedencia

- Se conservó la integración React, la carga bajo demanda y el control 2D/3D del prototipo Claude `0bb67d281c74538a166c713d6b6d6eb925f70b9f`. Se sustituyó su renderizador WebGL propio por un único motor Three.js.
- La transformación horizontal y el control de NoData toman el planteamiento comprobado en el prototipo independiente `e64775bb32e45f438471bc64f2e7371fc42c815d`. No se copió su aplicación autónoma, su cargador de datos duplicado ni su textura experimental.
- La cuadrícula procede exclusivamente del DTM D-001 que ya carga `src/data/elevation.ts` desde `public/data/dtm/dtm_20m_f32le.bin`, descrito en `public/data/manifest.json`. Las alturas de los nodos son las muestras Float32 originales. El DTM original mide 20 m por píxel proyectado.
- `src/data/mars-crs.ts` define el CRS EQC marciano con radio 3 396 190 m y `lat_ts=0`. El eje este-oeste de la escena aplica `cos(latitud_central)` a los metros proyectados. Los ejes horizontales y la altura se expresan en kilómetros. La escala vertical inicial es 1×, con 2×/3× opcionales y rotulados.
- La malla toma un nodo cada 4 píxeles en escritorio y cada 8 en pantallas estrechas. Los triángulos interpolan visualmente entre nodos reales; no se inventan mediciones. Una celda NoData original dentro de un cuadrilátero muestreado elimina sus triángulos. Las líneas A/B consumen directamente las muestras de `ProfileResult` ya calculadas por el mapa 2D y se cortan ante tramos NoData.
- La ortoimagen CTX no se proyecta sobre la malla. Su alineación de contenido fina con el DTM no está demostrada mediante puntos de control. Los colores de la paleta DTM y la iluminación son representaciones visuales, no mediciones adicionales.
- Three.js 0.187.0 tiene licencia MIT. Se incorporó su aviso original en `public/third_party_3d_license.txt`, enlazado desde el panel 3D y registrado en `THIRD_PARTY_ATTRIBUTIONS.md`.

## Verificaciones reproducibles

Desde esta carpeta: `npm ci`, `npm run lint`, `npm test -- --run`, `npx tsc -b --pretty false`, `npm run build`. Para QA en navegador se usaron Chrome headless con CDP y Vite local; scripts y resultados en `evidence/browser_qa.mjs`, `evidence/browser_qa_results.json`, `evidence/ab_fallback_qa.mjs` y `evidence/ab_fallback_qa_results.json`.

| Control | Resultado |
|---|---|
| Pruebas | 80/80; 15 archivos. Cinco pruebas nuevas verifican alturas originales, distancia horizontal, NoData interior, muestras A/B y DTM real. |
| Instalación reproducible | `npm ci --no-audit --no-fund` completó desde el lockfile en la copia aislada; las pruebas, lint y build se repitieron después. |
| Lint / TypeScript | Sin errores ni advertencias finales. |
| Build | Correcto. Chunk Three.js/3D cargado bajo demanda: 565,87 kB bruto, 140,85 kB gzip. Vite advierte por tamaño bruto >500 kB. |
| Datos | 580/580 archivos de `public/data/` coinciden por objeto Git con la base V1.5.3; cero cambios. `dist/data/` contiene 580 archivos. |
| DTM real | 151 600 nodos y 301 644 triángulos en escritorio; 38 190 nodos y 75 600 triángulos en móvil emulado. Cero píxeles NoData en este DTM; el caso NoData interior se probó con una cuadrícula sintética. Área horizontal nominal de la cuadrícula: 30,276 × 30,240 km. |
| Cinco viewports | 1440×900, 1280×800, 1024×768, 390×844 y 360×800: 3D listo, 1× inicial, 3× seleccionable, retorno a 2D y teselas 2D conservadas. Sin excepciones JS ni peticiones externas en este recorrido. |
| A/B | La sesión de QA muestra A y B en 3D. Tabla 2D de la sesión: A 10,28 km / +826,3 m / −50,1 m; B 10,43 km / +836,9 m / −60,7 m; NoData 0,0 % ambos. La tabla es idéntica tras abrir/cerrar 3D, simular ausencia de WebGL y perder el contexto WebGL. Los cálculos originales (`src/analysis/*`) no cambiaron. |
| Fallback | Se forzó `getContext` a devolver `null` y se usó `WEBGL_lose_context`: aparecen mensajes accesibles, se puede cerrar 3D y el mapa 2D conserva A/B. |
| Orientación | La flecha norte cambió de 0 a −0,554 rad al girar la cámara en QA; no permanece fija cuando rota la vista. |

Hashes SHA-256 de control: `manifest.json` = `30001324EBCC47BB1A1B514C25A11E51913486FBB9AC2CE63DE726309B899BC0`; `dtm_20m_f32le.bin` = `95E0F863C03C7BFD27D5A9E1A1592770E0E94DE6B3E807D03E79C23D01F359FA`. La comparación completa de los 580 recursos se hizo con los blobs del commit base y los bytes del árbol de trabajo, no con fechas de modificación.

## Capturas

- Antes: `evidence/before_v153_1440.png` (V1.5.3 pública, 2D).
- Después 2D: `evidence/after_2d_1440.png` y `evidence/after_2d_ab_1440.png`.
- Después 3D: `evidence/after_3d_1440x900.png`, `evidence/after_3d_1280x800.png`, `evidence/after_3d_1024x768.png`, `evidence/after_3d_390x844.png`, `evidence/after_3d_360x800.png`.
- A/B y fallos: `evidence/after_3d_a_1440.png`, `evidence/after_3d_ab_1440.png`, `evidence/after_3d_no_webgl_1440.png`, `evidence/after_3d_context_lost_1440.png`.

## Límites y decisión

El relieve 3D es una vista experimental del mismo DTM 2D. La escala y la procedencia de las alturas son comprobables; la malla es una simplificación visual a 80/160 m proyectados. No resuelve rasgos inferiores a la resolución del DTM, ni peligros locales, ni transitabilidad, seguridad o planificación EVA. Las líneas A/B se dibujan sobre el relieve incluso si físicamente quedarían ocultas tras él, para facilitar la comparación; esto se advierte en la interfaz. El registro fino CTX/DTM sigue pendiente; por ello no se presenta una textura CTX como evidencia espacial.

Los tiempos de apertura medidos en Chrome headless/SwiftShader fueron 0,48–1,64 s después de cargar el mapa, según viewport. No son mediciones de FPS ni predicen rendimiento en un teléfono real. Falta una prueba en hardware móvil, especialmente de GPU, temperatura y memoria. No hay despliegue de prueba de Vercel todavía, porque esta fase no autoriza push ni publicación.

**Recomendación: GO para conservar esta candidata experimental y pasar a revisión humana/preview controlado. NO-GO para sustituir producción sin validar en hardware móvil y en un preview del proyecto Vercel existente.** La versión pública V1.5.3 permanece intacta y es el rollback.
