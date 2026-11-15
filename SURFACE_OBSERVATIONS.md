# Estaciones de superficie — módulo aislado V1.5

Consulta e inspección visual: 2026-11-15. Cuatro observaciones históricas contextuales; no son objetivos científicos seleccionados, una nueva medición de peligros ni una evaluación de movilidad.

Las coordenadas de los marcadores se obtienen por unión RMC + sol con el GeoJSON existente. Ningún registro de `public/data/` se modifica. Las copias web se conservan como WebP sin pérdida, sin recorte, filtros, cambio de dimensiones ni cambio de color, en `public/surface/`. Los originales siguen disponibles en sus enlaces oficiales PNG. El componente monta una sola imagen al seleccionar una estación; no hay galería ni solicitudes automáticas a terceros.

| RMC | Coordenadas CANIS (E, N) | Sol waypoint / imagen | Fecha / LMST | Cámara | Píxeles | Crédito |
|---|---|---|---|---|---|---|
| 33_366 | 77.40876340, 18.45810853 | 700 / 700 | 2023-02-08 / 15:34:30 | Mastcam-Z derecha | 1648 × 1200 | NASA/JPL-Caltech/ASU |
| 47_4404 | 77.34664678, 18.49539581 | 1000 / 1000 | 2023-12-13 / 16:18:26 | Mastcam-Z derecha | 1648 × 1200 | NASA/JPL-Caltech/ASU |
| 57_0 | 77.29887363, 18.48891695 | 1250 / 1250 | 2024-08-26 / 14:36:01 | Navcam derecha | 1288 × 968 | NASA/JPL-Caltech |
| 64_0 | 77.26852677, 18.45752781 | 1354 / 1356 | 2024-12-12 / 12:05:48 | Mastcam-Z derecha | 1648 × 1200 | NASA/JPL-Caltech/ASU |

## Identificadores y fuentes oficiales

- 700: `ZR0_0700_0729093942_894ECM_N0330366ZCAM08699_1100LMJ` — https://mars.nasa.gov/mars2020/multimedia/raw-images/ZR0_0700_0729093942_894ECM_N0330366ZCAM08699_1100LMJ
- 1000: `ZR0_1000_0755729009_894ECM_N0474404ZCAM07114_0340LMJ` — https://mars.nasa.gov/mars2020/multimedia/raw-images/index.cfm?mission=mars2020&urlpath=ZR0_1000_0755729009_894ECM_N0474404ZCAM07114_0340LMJ
- 1250: `NRF_1250_0777916348_292ECM_N0570000NCAM03250_04_195J` — https://mars.nasa.gov/mars2020/multimedia/raw-images/index.cfm?mission=mars2020&urlpath=NRF_1250_0777916348_292ECM_N0570000NCAM03250_04_195J
- 1356: `ZR0_1356_0787317174_285EBY_N0640000ZCAM09420_1100LMJ` — https://mars.nasa.gov/mars2020/multimedia/raw-images/index.cfm?mission=mars2020&urlpath=image-of-the-week/week-200

La URL PNG y la ficha individual se conservan también en el catálogo TypeScript y se enlazan desde el panel. La resolución en píxeles no expresa una escala métrica del suelo.

## Evaluación visual

- 700: suelo con diversos fragmentos y superficies fracturadas. Contexto local útil; sin horizonte, escala métrica ni interpretación mineralógica.
- 1000: conjunto de rocas y material fino con sombras. Contexto local útil; no es una panorámica regional.
- 1250: se eligió Navcam con ladera, horizonte y suelo visibles; una parte del rover ocupa la franja inferior, sin dominar la escena.
- 1356: terreno con rocas dispersas y material fino. Se conserva la diferencia entre imagen sol 1356 y waypoint sol 1354.
- Descartada: `ZR0_1250_0777921165_598EBY_N0570000ZCAM00076_1100LMJ` muestra casi exclusivamente cielo.
- Descartadas tras inspección: `NLG_1250_0777921536_850ECM_N0570000NCAM00518_00_2I3J` y `NLG_1250_0777921711_395ECM_N0570000NCAM00518_00_2I3J`, dominadas por cielo.
- Alternativa no elegida: `NLF_1250_0777917031_441ECM_N0570000NCAM02250_01_195J`, terreno e improntas del rover visibles, pero exposición oscura; se prefirió el encuadre Navcam más legible.

## Asociación espacial permitida

Para 700/1000/1250: «Observación de Perseverance del mismo sol y código de sitio/desplazamiento que esta posición histórica. El área fotografiada no está delimitada sobre CTX.»

Para 64_0: «Imagen adquirida dos soles después del registro de esta posición histórica, con el mismo código de sitio/desplazamiento 64_0. El área fotografiada no está delimitada sobre CTX.»

El nombre del producto contiene sol y campos de sitio/desplazamiento (RMC), según la documentación PDS Mastcam-Z, tabla 2-1: https://planetarydata.jpl.nasa.gov/img/data/mars2020/mars2020_mastcamz_sci_calibrated/document/mastcamz_derived_product_sis_v1.4.pdf . Esto no demuestra una coordenada exacta de adquisición en la localización refinada MMGIS, ni la orientación, distancia o huella del área fotografiada. No se asigna a las fotos una huella CTX ni se extraen medidas de obstáculos.

## Derechos y redistribución educativa

La política NASA permite el uso educativo/informativo de su contenido, incluidas páginas web, con reconocimiento de fuente y sin sugerir respaldo institucional: https://www.nasa.gov/nasa-brand-center/images-and-media/ . La política JPL exige crédito específico y distingue material de terceros con restricciones: https://www.jpl.nasa.gov/jpl-image-use-policy/ . El press kit oficial Mars 2020 remite a ambas políticas: https://mars.nasa.gov/system/downloadable_items/45585_mars_2020_landing_press_kit.pdf .

Las fichas de estos productos raw de misión especifican los créditos arriba indicados y no muestran avisos de copyright restrictivo adicionales en la documentación examinada. Se consideran aptos para su reproducción factual educativa en el prototipo y repositorio, conservando créditos y enlaces. No se declara una licencia CC0, MIT ni propiedad del equipo sobre las imágenes; el crédito compartido ASU se conserva tal como aparece. Esta conclusión no usa la política de mosaicos ASU para autorizar productos raw distintos. Cualquier aviso específico posterior prevalece. No se incluyen logos ni se implica certificación o apoyo de NASA/JPL/ASU a CANIS.

Los cuatro archivos web suman 7 205 272 bytes y se cargan solo al seleccionarlos. No se ha medido el rendimiento en una conexión móvil lenta. El módulo está trasplantado sobre una candidata aislada de V1.4.1, base 1dca0c8338bda31122ae26a82d185c73ce743408, pendiente de aprobación para publicar.

## Copias web sin pérdida

| RMC | PNG oficial (bytes) | WebP sin pérdida (bytes) | Dimensiones conservadas |
|---|---:|---:|---|
| 33_366 | 2 288 273 | 1 374 100 | 1648 × 1200 |
| 47_4404 | 2 184 563 | 1 372 930 | 1648 × 1200 |
| 57_0 | 1 957 262 | 1 076 298 | 1288 × 968 |
| 64_0 | 5 291 684 | 3 381 944 | 1648 × 1200 |

Total: 11 721 782 → 7 205 272 bytes (38.53 % menos). Se usó el codificador WebP sin pérdida de Pillow ya instalado (lossless=True, method=1, quality=60 como esfuerzo de compresión, exact=True). En modo sin pérdida ese parámetro no introduce compresión visual con pérdida. Se comprobó igualdad de todos los píxeles RGBA decodificados y las dimensiones de cada PNG/WebP. No se garantiza conservar los metadatos de contenedor PNG: los metadatos documentales están en el catálogo y en esta ficha; las copias web sirven para visualización, no sustituyen productos científicos calibrados PDS. No se ha medido transferencia en una red móvil lenta.

Los marcadores se ocultan durante el trazado y mientras hay un escenario activo, para preservar A/B como tarea principal. Las fotos siguen disponibles desde la lista cuando no se está trazando. El módulo no cambia el encuadre ni los límites del mapa.
