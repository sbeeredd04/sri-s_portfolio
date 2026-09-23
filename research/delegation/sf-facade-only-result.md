# SF facade-only result

Facade geometry only. No browser pass, commit, or integration. Main still owns camera framing, terrain, routes, market-entrance infill, tests, and visual inspection.

Probe: `buildLandmarks()` then `disposeLandmarks()` from `sri_portfolio/sri_portfolio`. No NaN positions. Dispose completed. Peak height 29.970 (limit band 29.4–30.6). Existing footprint test `landmark meshes keep their footprints, a real door and ground contact` passed.

## Counts

13,376 triangles. 40,128 non-indexed position vertices. 36 attribute buffers.

| Geometry | Triangles | Position verts | Attributes | Y range |
| --- | ---: | ---: | --- | --- |
| boxes.stone | 432 | 1,296 | position, normal, uv | -0.83..14.15 |
| boxes.glass | 96 | 288 | position, normal, uv | 0.27..3.17 |
| boxes.trim | 2,364 | 7,092 | position, normal, uv | 2.29..14.31 |
| boxes.glow | 132 | 396 | position, normal, uv | 0.27..2.17 |
| boxes.pale | 408 | 1,224 | position, normal, uv | 0.12..16.22 |
| boxes.ink | 768 | 2,304 | position, normal, uv | 7.38..15.92 |
| boxes.asphalt | 672 | 2,016 | position, normal, uv | 0.00..0.05 |
| boxes.paving | 1,152 | 3,456 | position, normal, uv | 0.00..0.17 |
| shells.towerGlass | 1,056 | 3,168 | position, normal | 0.12..26.58 |
| shells.shade | 1,880 | 5,640 | position, normal | 4.05..26.58 |
| shells.crown | 392 | 1,176 | position, normal | 26.66..29.81 |
| shells.pale | 104 | 312 | position, normal | -0.40..0.12 |
| shells.louver | 3,900 | 11,700 | position, normal | 26.31..29.97 |
| shells.oxide | 20 | 60 | position, normal | 4.27..17.42 |

Prior mesh was 6,836 triangles. Headroom remains under the 20,000 triangle guide.

## Salesforce crown (`buildTowerShells`)

The flat pale roof disk, the ten detached crown uprights, and the rectangular trim slab are gone.

- Glass continues on `crownProfile` for the first tenth of the crown, so the rounded-rectangle wall bends into the crown instead of ending on a flat lid.
- 22 louver bands follow that same taper, each a thin rounded-rectangle fin (outer lip, top, underside), in a new `louver` shell.
- Six slender vertical seams sit on the louver screen.
- A warm-white core (`crown`) is inset 0.2 and closed with caps. It runs inside the louvers, not as an exposed lantern.
- A tapered metal lid closes the top at y 29.97.
- Shaft shade is 14 fine floor lines plus 8 slender mullions. West mullions sit on the door jambs; the opening stays clear. Floor lines skip the door.

`landmarkFinish`: tower glass is cooler (`#7b94a6`, emissive intensity 0.025). Shade is steel (`#617484`, metalness 0.5). Crown is warm white at intensity 0.26 (day factor 0.12) with roughness 0.62. Louvers are aluminum (`#c9d3db`, metalness 0.62, no emissive).

Checked in the probe: louver mean radius falls from 3.69 at the crown base to 2.28 at the lid. Core radius at mid-crown is 3.16, inside the screen.

## Ferry clock shaft (`addClockTowerShaft`)

The blank 10.1-tall pale box is still the shaft mass, so the silhouette and the ground walk are unchanged. The clock housing box, clock mounts, and hands are untouched.

Added on each face, above the hall roof:

- Stone sill, impost, and a five-course cornice that lands just under the clock storey.
- Corner pilasters, a center pier, and two narrow ink panels.
- Twin trim arches (radius 0.58, six voussoirs) with stone jambs and a stepped ink opening.
- A short pier between the arches.

Arch basis determinant is +1. Sampled voussoirs sit on a semicircle from the spring line to the crown. Ink above y 14.4 near the tower is only the existing clock ticks (576 vertices).

## Left for main

Camera exports, streets, market entrance infill, terrain, and browser review of these facades. Denser louvers would still fit under 20,000 triangles if the crown reads too open up close.
