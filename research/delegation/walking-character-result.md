# Walking character result

One visitor walker. No deploy, no commit, no browser pass. Walker controller and network were left untouched.

## Files

- `sri_portfolio/sri_portfolio/app/components/personal/WalkingCharacter.jsx` — new client component

No other app files were edited. `Character.jsx` was not given a walking prop.

## What it is

Default export `WalkingCharacter({ motion, color })`. `motion` is a ref whose `current` is `{ gait, stride }`. The outermost group has no position, rotation, or scale, so main owns the root transform. Local axes are +Y up and +Z facing.

The body reuses `CharacterFace`, `Shirt`, `HikingPack`, `CharacterArm`, and `Shoe`, with the same head placement, neck, and chest card as `Character.jsx`. The jacket color is the `color` prop (default `#7184a6`). The backpack is always on, which marks this figure as the visitor.

Legs do not reuse the rigid trouser tube. Each leg is two cylinders of height `residentLegLength` (0.265), placed on `residentLeg` hip/knee and knee/ankle and oriented with `setFromUnitVectors`. A shared knee sphere covers the bend. `Shoe` is translated so its built-in sole origin follows `residentLeg`'s foot. At `stride === 0` both feet stay at the idle foot height (parent y = 0, sole about 1 mm above the ground) and both wrists return to the standing pose. Arm swing is opposite the legs and stays inside `ARM_LENGTH * 2`. Updates run in `useFrame` (priority -1, before `CharacterArm`) by mutating refs. There is no per-frame `setState` and no extra light.

The hair crown in the existing head rig measures about 1.470 m. An inner scale of about 1.123, taken from the ground, brings that crown to 1.65 m without changing bone length relative to the `residentLeg` endpoints.

## Checks

From `sri_portfolio/sri_portfolio`:

- `npx prettier --write app/components/personal/WalkingCharacter.jsx` — exit 0
- `npm run check` (`tsc --noEmit`) — exit 0

`tsconfig.json` includes `*.ts` and `*.tsx` only, so this `tsc` run does not typecheck the new `.jsx`. Prettier parsed it.

A node check of `residentLeg` across two full gait cycles and strides 0, 0.35, and 1:

- hip–knee and knee–ankle stay within 1e-15 of 0.265
- stride 0 keeps `foot[1]` at 0.035
- wrist reach peaks at about 0.436, under the 0.48 arm limit
- scaled crown is 1.65; scaled sole bottom is about 0.0011

## Limitations

- No browser or phone pass. Do not treat this file as visual acceptance.
- World bone length is `residentLegLength` times the figure scale (about 0.297 m). Segment length does not change with gait, and each segment still spans the `residentLeg` endpoints.
- Shoes stay level with the ground. They translate with the foot and do not pitch with the shin.
- Eyes keep the existing slow blink while standing. Arms, head, and feet are still when stride is 0.
- The height scale is internal. Main should parent this component for path position and heading.
