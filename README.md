# CANIS MAJOR 13 — Martian Exploration Navigator

**NASA Space Apps Challenge 2026 · Challenge: “Interplanetary Survival Guide: Martian Map”**

An interactive 2D web map of the western sector of **Jezero Crater, Mars**. It combines official NASA/USGS orbital data and the historical positions of the Perseverance rover in the Martian coordinate system, and it lets users draw a hypothetical route and inspect its elevation profile.

> **Scope statement.** This is an educational and preliminary scientific-interpretation tool built on orbital data. It is **not** a certified navigation aid, and it does **not** assess safety, traversability, habitability or astronaut mobility. Perseverance positions are historical rover locations, **not** recommended human routes.

**Live demo:** [PENDING: public Vercel URL after deployment] · **User interface language:** Spanish

---

## 1. What it does

- **Martian map in the data's own projection:** `IAU_2015:49910`, equirectangular on the 3,396,190 m Mars sphere. The scale bar is computed with the Martian radius, not Earth's.
- **CTX orthoimage mosaic, 6 m/pixel:** the image basemap, served as tiles.
- **CTX digital terrain model (DTM), 20 m/pixel:** colour-coded elevation, hillshade and elevation readout under the cursor (bilinear interpolation).
- **Perseverance historical positions:** 708 locations, sols 13–2022, each with an information card.
- **Hypothetical route profile:**
  - draw a polyline on the map;
  - get its **horizontal length** (the sum of its segments on the Martian sphere), start, end, minimum and maximum elevation, and cumulative ascent and descent with the sampling interval stated;
  - get the share of the route without DTM data (conservative: a sampling interval crossing the DTM boundary counts in full);
  - see an SVG elevation-versus-distance chart with gaps shown where data are missing.
- **Provenance in the interface:** every layer shows its source, resolution, evidence status and limitations.

## 2. Area covered

- **Jezero “Sector A”:** 77.1605–77.6990° E, 18.2110–18.7212° N (planetocentric), the extent of the official CTX DTM.
- **Area:** 915.6 km² (≈ 30.3 × 30.2 km on the Martian sphere). Inside this extent, every DTM pixel has data.
- **Share of the crater:** about **38 % of the nominal disc** of Jezero (USGS/IAU Gazetteer: centre 18.41° N, 77.69° E; diameter 47.52 km). This covers the western side, with the delta and the inlet channel. The real, non-circular rim has not been evaluated.

## 3. Data sources

| Dataset | Mission / instrument | Producer and identifier | Use in the app | Licence / credit |
|---|---|---|---|---|
| Mars 2020 TRN CTX DTM mosaic, 20 m (`JEZ_ctx_B_soc_008_DTM_MOLAtopography_DeltaGeoid_20m_Eqc_latTs0_lon0`) | MRO / CTX (stereo) | USGS Astrogeology, Fergason et al. (2020), DOI [10.5066/P906QQT8](https://doi.org/10.5066/P906QQT8) | Elevation, hillshade, profile | [CC0 1.0](https://www.usgs.gov/data/mars-2020-terrain-relative-navigation-ctx-dtm-mosaic) (USGS) |
| Mars 2020 TRN CTX orthorectified image mosaic, 6 m (`JEZ_ctx_B_soc_008_orthoMosaic_6m_Eqc_latTs0_lon0`) | MRO / CTX | USGS Astrogeology, Fergason et al. (2020), DOI [10.5066/P9GV1ND3](https://doi.org/10.5066/P9GV1ND3) | Image basemap | [CC0 1.0](https://www.usgs.gov/data/mars-2020-terrain-relative-navigation-context-camera-orthorectified-image-mosaic) (USGS) |
| Perseverance waypoints (`M20_waypoints.json`, MMGIS) | Mars 2020 | NASA/JPL, [mars.nasa.gov MMGIS](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json) | Historical rover positions (context only) | NASA-led mission auxiliary data under the [NASA CC0 policy](https://science.data.nasa.gov/about/license); credit NASA/JPL-Caltech |
| MOLA MEGDR topography and areoid (`megt90n000eb`, `mega90n000eb`) | MGS / MOLA | NASA PDS Geosciences Node | **Validation only** (vertical-reference check); not displayed | [NASA PDS Geosciences Node](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html); validation only, files not redistributed here |

- USGS explicitly marks both CTX releases CC0 1.0. The project audit recorded matching source-file SHA-256 hashes. This snapshot contains derived products, not the original GeoTIFFs.
- The CTX orthomosaic is the Lander Vision System (LVS) map that USGS published for Mars 2020 Terrain-Relative Navigation during landing. The DTM supported its orthorectification. We make **no** claim that this DTM was used for surface navigation.

## 4. Methodology (summary)

1. **Data validation:** official files with SHA-256 hashes recorded; projection, extent and NoData checked with GDAL 3.13.3. Original files are never modified.
2. **Derived products:** an internal Python/GDAL preprocessing script produced:
   - XYZ tiles of the orthomosaic (native zoom 5 = 6 m; zooms 0–4 are averaged);
   - colour-relief and hillshade images of the DTM;
   - a Float32 binary of the DTM;
   - a manifest with methods and hashes.
   The preprocessing script and original GeoTIFFs are **not** in this selected repository. Regenerating the derivatives from originals requires those separate materials.
3. **Vertical reference:** a comparison with MOLA suggests elevations relative to a MOLA-compatible areoid. The exact reference model and absolute accuracy of the CTX DTM are not established; independent review remains pending.
4. **Route profile:**
   - each straight segment of the drawn polyline is split into equal steps of at most 10 m;
   - elevation is sampled by bilinear interpolation of the DTM, **with no filtering or smoothing**;
   - length is the sum of great-circle segment lengths on the 3,396,190 m sphere;
   - the reported share without DTM information counts a whole sampling interval when either end lacks data;
   - results were checked against an independent GDAL computation on the original GeoTIFF.
5. **Software tests:** 42 automated tests (projection, elevation sampling, geodesy, profile, data parsing, interface text), lint and type checks.

## 5. Limitations

- **Resolution:** 20 m/pixel (DTM) and 6 m/pixel (image). Rocks, steps and local slopes are not resolved, and the profile is not an exact measurement of the real terrain.
- **Cumulative ascent and descent** depend on the sampling interval and on DTM noise. A 40 m comparison is shown for this reason.
- **Possible offset of 30–40 m** east-west between DTM and orthomosaic content: not demonstrated and not corrected.
- **Vertical reference:** the exact areoid model of the CTX DTM and its absolute accuracy are not documented.
- **Perseverance heights** (`elev_geoid`) agree with the DTM (median −1.06 m). This is consistency, not independent validation, because MMGIS does not document how those heights are derived.
- **Data types:** optical imagery and topography are integrated. Thermal, spectral, atmospheric, radiation and chemical measurements are not.
- **Coverage:** Sector A only, not the whole crater.
- **Verification:** visual checks were done by one AI agent using automated browser tests (desktop and emulated mobile). No user testing has been carried out.

## 6. Run locally

Tested with Node.js 24.12.0 and npm 11.6.2. The 580 derived data files are included in `public/data/`; `.gitattributes` preserves their bytes.

```bash
npm ci
npm run dev       # local development server
npm run lint
npm test          # 42 automated tests
npx tsc -b        # typecheck
npm run build     # static output in dist/
```

The compiled site uses relative paths and must be served by an HTTP server; opening `dist/index.html` directly as a local file is unsupported. For Vercel, set the repository root as the project root. `vercel.json` selects Vite, runs `npm run build`, and serves `dist/`. A live Vercel deployment has not yet been tested.

## 7. Repository structure

- `src/`, `tests/`: application and automated tests.
- `public/data/`: 580 derived files (CTX tiles, DTM products, manifest, Perseverance waypoints).
- `README.md`, `THIRD_PARTY_ATTRIBUTIONS.md`: project documentation and source credits.
- `package-lock.json`, `vite.config.ts`, `vercel.json`, `.gitattributes`: reproducible installation, build and deployment configuration.

Project preparation began before the 2026 hackathon. This public repository is a selected snapshot of V1, not a complete development history. Most application text is in Spanish.

## 8. Use of artificial intelligence (transparency statement)

- **Development assistants:** this project was developed by a team of two beginner programmers with substantial help from AI assistants:
  - **Claude Code (Anthropic):** research on data sources, data validation scripts, application code, tests and documentation;
  - **Codex (OpenAI):** independent technical audits and repository integration.
- **Human decisions:** every step that changed data, code or the public repository was authorised by the project director.
- **No AI in the application:** the app contains no AI model and calls no external service.
- **Scientific data provenance:** the displayed scientific inputs come from the sources listed above and were transformed into local derived products. The 22 source positions marked as interpolated are not presented as measured positions.
- **How we used it:** AI outputs were treated as proposals and checked against official metadata, independent GDAL computations and automated tests. Claims that only one agent checked are labelled as such here.

## 9. Team and licence

- **Team:** two members. The public name of the Project Lead and specific member roles remain to be confirmed. NASA Space Apps Challenge 2026, Piura, Peru.
- **Code licence:** [MIT](LICENSE), Copyright (c) 2026 CANIS MAJOR 13, applies only to original team-owned code and application configuration. Scientific data and third-party materials retain their separate terms.
- **Data and dependencies:** see §3 and [third-party attributions](THIRD_PARTY_ATTRIBUTIONS.md). The D-005 rights rationale and transformation are documented in the third-party attributions.

---

### Resumen en español

Mapa web 2D del sector occidental del cráter Jezero (Sector A, 915,6 km²). Combina datos orbitales oficiales de NASA y USGS (CTX: imagen de 6 m y DTM de 20 m) con las posiciones históricas de Perseverance, y permite dibujar un recorrido hipotético y ver su perfil de elevación.

Herramienta educativa y de apoyo preliminar a la interpretación científica. **No** es navegación certificada y **no** evalúa seguridad, transitabilidad ni movilidad de astronautas. Desarrollado con ayuda de asistentes de IA (Claude Code y Codex), bajo la supervisión del director del proyecto; la aplicación no incluye IA.
