# Third-party data and software attributions

Sources and rights checked on 2026-11-15. This file distinguishes a data product's rights from the licence of software used to serve it. It does not grant rights to any material whose terms remain unresolved.

## Scientific sources

| Resource | Use | Source and rights |
|---|---|---|
| D-001, Mars 2020 TRN CTX DTM mosaic (20 m) | Derived Float32 DTM, relief and hillshade | Fergason, R. L., Galuszka, D. M., Hare, T. M., Mayer, D. P., and Redding, B. L. (2020), USGS, [DOI 10.5066/P906QQT8](https://doi.org/10.5066/P906QQT8). The [USGS release](https://www.usgs.gov/data/mars-2020-terrain-relative-navigation-ctx-dtm-mosaic) explicitly marks the work CC0 1.0. CTX observations originated with MRO/NASA/JPL-Caltech/MSSS. |
| D-004, Mars 2020 TRN CTX orthorectified image mosaic (6 m) | Derived map tiles | Fergason et al. (2020), USGS, [DOI 10.5066/P9GV1ND3](https://doi.org/10.5066/P9GV1ND3). The [USGS release](https://www.usgs.gov/data/mars-2020-terrain-relative-navigation-context-camera-orthorectified-image-mosaic) explicitly marks the work CC0 1.0. CTX observations originated with MRO/NASA/JPL-Caltech/MSSS. |
| D-005, Mars 2020 Perseverance waypoints | Derived GeoJSON of historical rover positions; 22 source positions are identified as interpolated | Source: [NASA/JPL MMGIS `M20_waypoints.json`](https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json). NASA states that unmarked scientific, engineering and auxiliary data from NASA-led missions are [CC0](https://science.data.nasa.gov/about/license). Mars 2020 is managed by [JPL for NASA](https://www.nasa.gov/solar-system/nasa-adds-return-sample-scientists-to-mars-2020-leadership-team/). The published JSON has no restrictive notice. We therefore apply NASA’s mission-data policy to these operational localization records and their reduced GeoJSON; this is an inference from the policy and provenance, not a licence statement inside the JSON. Credit: NASA/JPL-Caltech. |
| D-002 and D-003, MGS/MOLA MEGDR topography and areoid | Validation only; files are not included in this repository | [NASA PDS Geosciences Node](https://pds-geosciences.wustl.edu/missions/mgs/megdr.html), products `megt90n000eb` and `mega90n000eb`. Cite the PDS archive when describing the validation. |

**D-005 rights assessment (2026-11-15).** The source is served from NASA’s Mars domain as a Mars 2020 MMGIS waypoint layer. Its 708 features contain rover localization fields such as RMC, site, drive, sol and coordinates, which are operational engineering/auxiliary mission data. A search of the complete original JSON found no `license`, `copyright`, `rights`, `terms` or restrictive notice; the public [Mars map landing page](https://mars.nasa.gov/maps/location/?mission=M20) exposed no additional restriction in the page content accessible to this review. NASA’s published policy covers NASA-led mission data of this kind unless marked otherwise, so a separate licence field inside each JSON file is not required. This conclusion concerns the waypoint data, not imagery linked from individual features or the MMGIS software licence.

The local GeoJSON retains all 708 point coordinates and selected mission fields, sorts the records, and omits the source’s panorama links and other fields. It creates no new observed positions; the 22 entries labelled `Interpolated` are already so labelled in NASA’s source. A format conversion and field selection do not impose new restrictions on CC0 source data. Source SHA-256: `BD143EE69241229926ABD373E6305B8BBB326D6B5A7B4A8D6935262696F93DC4`; derived GeoJSON SHA-256: `090BBE266A7D51244CAEEBD1650E47FB0585022EF7F0477654F0ED1301CE1604`. Attribution remains appropriate despite CC0.

The 580 files under `public/data/` are derivatives used by the application. Original GeoTIFF and MOLA products are not bundled. `public/data/manifest.json` records source identifiers, source URLs and file hashes.

NASA Space Apps [2026 participant terms](https://www.spaceappschallenge.org/legal/) require source citations and applicable licence documentation for submitted material. The MIT licence covers only original code and application configuration held by CANIS MAJOR 13; it does not relicense the scientific data or third-party materials listed here.

## Bundled runtime libraries

The following versions and licences come from the `package-lock.json` and the installed packages used for the isolated build. This file retains the licence notices supplied with the direct runtime packages. Build and test tools are listed in `package-lock.json` but are not shipped as source files in this repository.

| Package | Version | Licence | Project |
|---|---:|---|---|
| `leaflet` | 1.9.4 | BSD-2-Clause | [Source](https://github.com/Leaflet/Leaflet) |
| `proj4` | 2.23.0 | MIT | [Source](https://github.com/proj4js/proj4js) |
| `proj4leaflet` | 1.0.2 | BSD-2-Clause | [Source](https://github.com/kartena/Proj4Leaflet) |
| `react` | 19.3.1 | MIT | [Source](https://github.com/facebook/react) |
| `react-dom` | 19.3.1 | MIT | [Source](https://github.com/facebook/react) |

### Licence notices supplied by the packages

#### leaflet

```text
BSD 2-Clause License

Copyright (c) 2010-2023, Volodymyr Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

#### proj4

```text
## Proj4js -- Javascript reprojection library.

Authors:
- Mike Adair madairATdmsolutions.ca
- Richard Greenwood richATgreenwoodmap.com
- Didier Richard didier.richardATign.fr
- Stephen Irons stephen.ironsATclear.net.nz
- Olivier Terral oterralATgmail.com
- Calvin Metcalf cmetcalfATappgeo.com

Copyright (c) 2014, Mike Adair, Richard Greenwood, Didier Richard, Stephen Irons, Olivier Terral and Calvin Metcalf

 Permission is hereby granted, free of charge, to any person obtaining a
 copy of this software and associated documentation files (the "Software"),
 to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included
 in all copies or substantial portions of the Software.

 _THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE._
```

#### proj4leaflet

```text
Copyright (c) 2012, Kartena AB
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

#### react

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

#### react-dom

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
