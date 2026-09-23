# Main integration review — provisional, while Cursor is implementing

Do not treat Cursor's static checks as acceptance. First live desktop render at 04:57 SF has a broken waterfall (a gap where ribbon enters the rock), a sheet-like stream outlet, and a visible artificial vertical seam on the dome. Reload after final geometry changes to discard HMR caches before deciding what persists.

Source review concerns to recheck after agent finishes:
- `valleyFloorWeight` currently calls local smooth(edge0,edge1,value) using smooth(value,edge0,edge1); fix convention and meaningful floor-region tests.
- `buildMeadow` currently stores `kept.length` rather than `kept.length / 3` in indexOf; validate every geometry index before rendering.
- `walk-network` overlook segment still uses terrain floor + .031, while `buildDeck` makes a level top at highest footprint sample + .07. Derive visible deck, approach and walking foot height from one source; test actual mesh raycasts.
- Watercourse profile must remain outside rendered rock, reach the actual flat lake level and clear rendered terrain along full width, not only authored points.
- Phone camera still needs actual screenshot acceptance, not only projected bounds. Night/readability and form/material craft are not complete from current preview.

Main owns WorldLighting.jsx; all other corrective edits wait until Cursor stops to avoid overlapping writes.

## Final disposition — September 22

Cursor stopped before main corrections; no overlapping writer remains. Fixed the floor blend convention, dome boundary seam, stable waterfall transverse direction, descending outlet and actual terrain clearance. The invalid meadow indices were initially repaired, then the entire meadow sheet was rejected after screenshot review and removed. Organic color now lives on the existing terrain, with sparse grounded planting.

The overlook, approach and visitor use shared elevations. A FrontSide raycast exposed reversed top-face winding that a DoubleSide check had hidden; corrected it and added a regression. Local channel terrain refinement is shared by the rendered globe and CPU ground queries; wet-channel checks sample its full width. Phone arrival and overlook were recomposed after screenshots, and an obstructing pine canopy moved outside both photo sight lines.

118 tests, TypeScript and production build passed. Actual desktop/phone arrival, close view, walking, reading, pause/resume and return were inspected. Lake discovery still works. This resolves the listed functional defects, not the wider reference-level art ambition: granite form/material refinement, water/shore detail, uniform paths and distant night readability remain in the queue.
