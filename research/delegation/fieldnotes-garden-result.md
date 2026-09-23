# Fieldnotes publishing garden — delegate result

Cursor Grok 4.7 xhigh implemented the bounded Future Studio replacement. This is not a visual acceptance. Main still needs to inspect desktop and phone arrival, close cameras, walking, and reading/return.

## What changed

The rectangular gazebo is now a small asymmetric publishing garden with three destinations: a shaded writing alcove (desk, chair, coming-soon sign), a low public-work display, and two facing conversation chairs. Photography stays on the outdoor overlook. Copy stays coming-soon: no posts, dates, followers, or outcomes. Writing, socials, and contact still open from the same three stop ids.

The shared route in `fieldnotes-layout.mjs` drives the walk network, the continuous stone path, street points, and the portrait/desktop cameras. The old future `walkingJoins` grid and the local path into the chairs are gone, so `WalkingPaths` no longer draws a second stone ribbon here. Paving starts at local z = -7.7, just north of the incoming bridge curb (northernmost measured corner z = -7.75). The path top matches the bridge walking surface. Future land radii were left at inner 10 / outer 22 because the furnishings and path already sit on level ground. World radius remains 190.

On-foot spawn is the bridge approach `[0, -7.2]`, facing north into the garden. `ExperienceShell` was not edited. Stop-specific foot entries would also need `WorldScene`, which this unit does not own.

## Files

- `sri_portfolio/sri_portfolio/app/lib/fieldnotes-layout.mjs` (new)
- `sri_portfolio/sri_portfolio/app/lib/fieldnotes-surface.mjs` (new)
- `sri_portfolio/sri_portfolio/app/lib/fieldnotes-geometry.mjs` (new)
- `sri_portfolio/sri_portfolio/app/components/personal/FutureStudio.jsx`
- `sri_portfolio/sri_portfolio/app/lib/place-stops.mjs` (future stops only)
- `sri_portfolio/sri_portfolio/app/lib/street-view.mjs` (future route only)
- `sri_portfolio/sri_portfolio/app/lib/walk-network.mjs` (future path, floor, spawn)
- `sri_portfolio/sri_portfolio/app/components/personal/CameraRig.jsx` (future arrival)
- `sri_portfolio/sri_portfolio/tests/fieldnotes-garden.test.mjs` (new)

Not changed: `ExperienceShell`, `WorldScene`, `world-layout.mjs`, lighting, planet surface, story copy, CSS, writing/contact content, audio.

## Measurements

- Added architectural/landscape triangles: **1,371**
- Geometry bytes: **135,900**
- New material families: **6** (stone, timber, charcoal, copper, ivory, garden)
- Parts: paving 64, stone 288, timber 568, charcoal 24, copper 20, garden 119, desk 60, chair 72, pages 24, plinth 12, panel 12, trim 12, table 84, hello card 12
- Existing `LoungeChair` and `Sign` are retained and are not in that triangle count
- No new lights, downloaded assets, or transmission
- Deck height equals the trail→future walk surface at the landing; the mesh bottom is buried at y = -0.02

## Checks run here

- `node --test tests/fieldnotes-garden.test.mjs` — 9 passed
- `node --test tests/walking.test.mjs` — 8 passed
- `npm run check` — passed
- Full `npm test` and production build were left for main, as requested in the review note

## Unresolved

- No browser screenshots in this unit. Proportion, eave light, chair-to-path step, and close-up timber are unreviewed.
- The roof is a coarse folded timber shell (about 568 triangles including fascia), not a finished architectural model.
- The stone path is one extruded ribbon. It meets the bridge with a few centimetres of plan gap so the decks do not occupy the same footprint.
- The courtyard sits on the level terrain, about a deck-thickness below the raised path. The lounge chairs use the existing model and rest on that grade.
- Planting is four small border clumps inside two beds. Main should judge whether that reads as a garden or as too little.
- Default walking entry is only the bridge approach. The writing, social, and conversation stops do not yet choose their own on-foot starts.
