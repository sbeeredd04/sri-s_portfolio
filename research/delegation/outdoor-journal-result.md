# Outdoor journal result

One notes unit. No deploy, no commit. Browser QA was left for main.

## Files

- `sri_portfolio/sri_portfolio/app/components/personal/OutdoorJournal.jsx` — new client component
- `sri_portfolio/sri_portfolio/app/components/personal/OutdoorJournal.module.css` — scoped CSS module (Next CSS Modules)
- `sri_portfolio/sri_portfolio/app/components/personal/AppContent.jsx` — import plus `id === "notes"` now renders `<OutdoorJournal />`

No 3D, world, shell, or other CSS files were edited. No audio was added. `RoomSoundControls` stays on `StandaloneRoom`.

The same component is what the modal, `/rooms/notes`, and `/story` already mount through `AppContent`. Layout follows the component’s inline size, not an `expanded` prop.

## What it is

A field journal on warm paper (`#f3eee4`) with forest ink and a rust accent. Masthead is Georgia; body is Manrope (`--font-sans`); small labels use Bricolage (`--font-bricolage`). Wide containers (38rem and up) put the title on the left and a small viewfinder on the right, drop the city column, and place the contour plate on the left of the photography text. Narrower widths stack in one column.

The viewfinder is an inline SVG line drawing, labeled as a line drawing. Landscape, Detail, and Portrait are buttons with `aria-pressed`, a 44px target, a filled mark plus underline for the selected state, and a 2px ink focus ring. Each choice changes the SVG `viewBox` (the crop) and a short note on light and framing. The note is an `aria-live` region. Nothing in the component scrolls.

Copy kept from the previous notes page:

- “I love a new city, a good hike, and seeing something from a different angle.”
- The macOS road-trip paragraph
- Sequoia, Sonoma, Catalina, each marked California · On the wish list
- “Photography is another part of my life.”
- “I’ve taken photographs over the years, and I’ll be bringing a selection here. A place for the world as I’ve seen it.”

Yosemite is a separate line under the wish list: inspiration for the valley in this world, and not a place Sri has been. It is not numbered with the wish list.

The collection-to-come state is a drawn contour plate with crop marks and the caption “Contour study. Drawn for this page.” There are no empty photo cards, remote images, gear, counts, dates, or invented quotes.

## Checks

From `sri_portfolio/sri_portfolio`:

- `npx prettier --write` on the two new files — exit 0
- `npm run check` (`tsc --noEmit`) — exit 0

`tsconfig.json` `include` lists `*.ts` and `*.tsx` only, so this `tsc` run does not typecheck the new `.jsx`. Prettier parsed both new files.

Crop boxes were checked against the drawing’s coordinates so the portrait frame stays on the trees and the detail frame stays on the lit boulder. That is not a screenshot review.

## Limitations

- No browser pass in this unit. Do not treat this file as visual acceptance.
- Better Design tools were not available in this session (the calls were rejected), so the palette and layout follow the brief and the existing font variables.
- Notes modal and `/rooms/notes` still get their sheet chrome from existing global CSS (sage sheet, sheet bar). This unit only paints the journal inside that content area. `/story` keeps the dark reading page; the journal is the paper block.
- Two-column composition depends on container queries. Without them, the page stays a single column and the type falls back to the sizes set before each `clamp()`.
- The viewfinder and plate are illustrations. Sri’s photographs are not on the page yet.
- Parent `window-content` on the modal can still scroll. The journal does not add its own scrollport.

## Viewport checks for main

1. Desktop modal, `/rooms/notes`, and `/story#notes`: paper journal, serif masthead, viewfinder on the right, wish list as a ruled index, contour plate opposite the photography text. Tab to Landscape, Detail, and Portrait. Focus ring stays visible. `aria-pressed` matches the crop. The explanation changes. Escape and the room’s sound control still behave as before.
2. 390px and 320px: one column, no horizontal overflow, buttons wrap instead of clipping, portrait frame stays inside the column.
3. Reduced motion: crop changes with no animation.
4. Yosemite reads as world inspiration, not as a fourth wish or a visited place.
