# Navigation polish result

CSS only. No browser check. Prettier passed on both files. No production build.

Gain: Work, Résumé, and Index share one 44px row, with Index the only bordered control. Lose: the Index mark is no longer a large separate glyph, so the pill is quieter. Affects header scanning. Fits the screenshot complaint. Room type sizes on `/story` were left alone.

## Header (`app/styles/experience.css`)

- `.header-links` — row height 44px, gap 8px (4px under 700px).
- `.header-links button, .header-links > a` — `inline-flex`, centered, 44×44 minimum, padding `0 10px` (`8px` inline under 700px), 12px type, `white-space: nowrap`. The résumé link is an anchor, so `min-height` was not applying before.
- `.header-links .index-button` — gap 8px, padding `0 12px`. The 21px menu mark and 18px inner gap are gone.
- `.index-button > span` — `font-size: 1em` so the mark matches the label.
- `.header-links :is(button, a):focus-visible` — 2px `#d7e8ff` outline, 2px offset, 22px radius, so focus does not squash the pill to the global 8px radius.
- `@media (max-width: 700px) .experience-header` — padding 16px, gap 12px. Removed the 11px label shrink.
- `@media (max-width: 600px) .world-clock` — `top: 76px`, `right: 16px`, clear of the shorter header.
- `.reading-index` — vertical margins `clamp(16px, 3vh, 28px) 0 clamp(24px, 4vh, 40px)`.

## Reading rooms (`app/styles/detail-worlds.css`)

Scoped to `.reading-sheet` so `/story` keeps its own padding.

- `.reading-sheet .sheet-bar button:focus-visible` — 2px `currentColor` outline, 1px offset, 20px radius. Offset stays inside the sheet’s `overflow: clip`.
- `.record-progress input` — min-height 44px.
- `.desk-editions button`, `.desk-read`, `.desk-steps button` — min-height 44px. Narrow step row wraps (`flex: 1 1 7rem`) at 12px instead of 11px.
- `.reading-sheet[data-section="work"] .room-sound-controls > summary` — min-height 44px (was 38px).
- Removed the unscoped `.window-content .foundry-heading h2 { font-size: clamp(29px, 3vw, 38px) }` and `.foundry-heading { margin-bottom: 22px }`. The earlier heading size, `clamp(30px, 3.8vw, 48px)`, applies again.
- `@media (max-width: 700px), (max-height: 800px)` — tighter sheet gaps: listening intro, journal intro, foundry heading, continuation, music tastes, archive heading, sound-control margin, sheet bar min-height 52px with 4px block padding. Bar buttons stay 44px.
- `@media (max-width: 700px)` — sheet content and listening room inset `20px 20px 28px`. Music `window-content` padding stays 0; its sound controls and continuation use a 20px side inset.
- `@media (min-width: 701px) and (max-height: 800px)` — vertical padding 20px / 24px; side inset `clamp(28px, 4vw, 48px)` so a wide short window does not stretch the line length.

## Left as they were

Pre-existing `display: none` on `.desk-caption > p`, `.desk-caption .desk-margin-note`, and the edition-button arrow under 700px. Not introduced here.

## Risks

- Index is a quieter pill. It is still the only bordered header control.
- Work titles return to the larger foundry heading size. Check that the title and the heading links still sit on one row at 1280px.
- Header labels do not wrap. A 320px row is estimated to fit; the shell’s `overflow: hidden` will clip it if the font is wider than estimated.
- Phone clock sits just under the header and can still meet the place title.
- Compact sheet bar (52px) plus a 44px close control leaves little room for the focus ring. The ring is inset by 1px so the sheet clip does not eat it.
- `max-height: 800px` also matches a short desktop window, not only a laptop.

## Viewport checks for main

Do not treat this file as visual acceptance.

1. Desktop ~1440×900: Work, Résumé, and Index share one vertical center. Index is not a taller pill. Tab to each control and confirm the focus ring is fully visible. Open Work and confirm the foundry title still clears the heading links.
2. Short laptop ~1280×800 and ~1280×720: open Work, About, and After Hours. Sheet bar lines up with the room inset. Headings are not font-shrunk. Sound summary, desk choices, and the seek control are at least 44px. Escape and return still work.
3. Phone 390×844 and 320×700: header labels are fully visible, not clipped, and at least 44px tall. Clock does not cover the nav or the title. Open Index, Work, and Music. Content inset is about 20px, music padding is not doubled, and `/story` spacing is unchanged.
