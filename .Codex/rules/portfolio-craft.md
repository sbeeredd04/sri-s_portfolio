# Portfolio craft decisions

- Latest explicit user preference wins: as of 2026-09-22, home is an SF-inspired top-floor apartment, superseding the detached house; use docs/ATLAS-DIRECTION-2026-09-22.md for geography.
- Place references express personal meaning without claiming an exact home address, birthplace or completed trip that Sri has not confirmed.
- Detail destinations are independently addressable reading experiences and 3D entry points into the same content; no WebGL or game action may gate professional information.
- Structural changes use one shared local elevation for render geometry, colliders, walking, cameras and lights; never raise only the visible model.
- Texture Suspense must be local: a loading foliage/sky material must not replace the whole world with a graphics-failure fallback.
- Screenshot verification follows every major unit; passing tests never establish AAA art quality or physical-device performance.

- Home is the personal destination; SF landmarks supply views and atmosphere. Do not restore neighborhood/skyline/market tour chips or city walking routes without a new explicit request.
- World-space HTML labels need a bounded screen size and must clear the actual HUD rectangles. Three.js frame hooks belong above the Html portal, inside the Canvas tree.
- Give a third-person walking camera exclusive ownership: Drei CameraControls can keep updating its camera even when disabled. Unmount the control during walking while retaining its owning rig for the exit transition.
- Walking clearance must reserve rendered canopy crowns, complete gallery slabs and lamp bases as well as path centerlines. Share the coordinates with paving, camera targets and movement boundaries.
- Missing travel evidence means a visit is unconfirmed; it does not justify claiming Sri has never visited. Describe a location as design inspiration without inventing travel history in either direction.
- Watercourse validation must sample the actual terrain triangles across the wet width. An analytic channel profile can still be buried when the globe mesh is coarser than the channel; refine locally and use that topology for ground queries.
- Surface-contact tests must use the renderer's face-culling rules. A DoubleSide test material can falsely pass a platform whose top faces point downward and disappear in the browser.
- A falling water ribbon needs an explicit transverse direction: a vertical segment has no horizontal tangent, so a tangent-derived width can collapse. Validate mesh indices, nonzero width and the whole fall against the rendered cliff.

- Building clearance checks must include world-connecting decks, curbs and lamp footprints in the building's local frame. Local courtyard tests can pass while an incoming bridge crosses the new building.
- A valid walking spawn also needs a clear camera boom and useful initial heading. A garden tree behind a visitor can collapse a phone camera into the avatar even when their feet are on the path.
- Do not consume an initial camera destination until Drei's control ref is attached; its creation can occur after the parent effect. Start the Canvas eye outside the planet to avoid accidental proximity-based entry.
- Project collection context must follow both directions between a reading sheet and standalone page; derive links from the current collection/anchor, not just initial props.
