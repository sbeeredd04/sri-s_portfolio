# A complete, believable miniature world

Research and implementation plan · October 31, 2026 · proposed, not implemented

Detailed execution amendments: [World composition, asset batches and delivery gates](WORLD-CRAFT-EXECUTION-PLAN.md). This supplement specifies the fuller-world strategy and supersedes the earlier sequencing where more specific.

## Direction

Blend Bruno Simon’s completeness, clear silhouettes, coordinated motion, tactile interactions and controlled presentation with Sri’s existing material realism and personal story. The target is a carefully authored miniature world: believable construction, warm interiors, natural stone and vegetation, readable architecture, and a consistent stylized character. The reference is a craft standard, not a request to reproduce its pink palette, vehicle, typography or game.

Keep the invented spherical world as the atlas. “Full earth view” is interpreted as the existing globe overview, consistent with the standing preference against photographic Earth. Keep the real San Francisco clock, professional-first content, direct reading and `/story`. Preserve all existing destinations and supported content; do not invent personal history to justify scenery.

The scope is the whole environment: geography, ocean, coast, asset families, materials, cameras, weather, motion, physical interaction, sound and visibility. A home-only furnishing pass would not resolve the current world composition.

## What was actually investigated

- Opened the live reference in the in-app browser and inspected the scene. Its keyboard interface failed, so driving continued in a separate Dia tab using native keyboard input.
- Used Up, Down, Left and Right; drove through vegetation and onto the circuit; entered water; used respawn and braking; opened and closed the map with M. A collision triggered the “Knock down the latrine” achievement. Daylight and night appearances were captured. This was a bounded exploration, not a visit to every destination.
- Reviewed Sri’s supplied shoreline, arrival and bowling screenshots. The companion pet and assistant overlay in those screenshots are browser UI, not reference-world assets.
- Examined Bruno’s public source at commit `41046b57eeed8d156d9c3fd7fa259900baef7816`. Its identity has not been compared byte-for-byte with the deployed site.
- Ran REA 4.0.1 with Node 24 against the source tree: 126 JavaScript files parsed, 1,057,244 text bytes read, zero parse failures, zero truncated scopes. The structural graph has 1,081 nodes and 2,581 edges. Graph nodes are not unique source-file counts.
- Ran a REA feature trace seeded by `Game/Weather.js`. REA provides static evidence; it did not capture this browser runtime. Dynamic singleton relationships and generic API candidates still need source interpretation. The 4.0.1 CLI lacks the newer documentation’s `inspect-analysis-view`; compact reports were extracted from saved evidence instead.
- Read the current portfolio camera, weather, asset catalog, Blender build scripts and studio physics. Current globe radius is 450; older radius-96 notes are historical.

Evidence: [illustrated browser report](../research/bruno-world-2026-10-31/REPORT.md) and [compact REA report](../research/bruno-world-2026-10-31/rea-report.json). Original analysis and trace remain in `/tmp/sri-world-research/`; that temporary location is not a durable archive. Screenshots and the compact report are retained beside this plan.

Limits: no physical-phone or older-M1 benchmark; no full auditory evaluation of every sound; no runtime snow/ice/storm verification. Earlier “desk” roof framing was captured too soon after navigation and may have been transit. It is not accepted as proof of a settled-shot defect.

## Findings and how to adapt them

### Models and shading are designed together

Bruno’s source uses a shared palette texture and `MeshDefaultMaterial`, a custom Lambert node material. It combines face-oriented shading, cast shadows, an authored shadow color, terrain-colored bounce near the ground, fog and reveal behavior. The source supplies Blender files and an export/compression workflow. This supports an authored-asset pipeline; it does not establish that every asset came from a single artist or that no outside resources were used.

For Sri: establish a restrained common palette and shared lighting response, while keeping useful wood, stone, fabric and metal detail. Rework the silhouettes and construction of hero objects. Normalize imported assets’ texture scale, color, roughness, edge treatment and proportions. A downloaded realistic plant next to an unfinished façade will still look inconsistent. Headless Blender generation is useful for repeatable structures, UVs, LODs and exports; it is not a substitute for sculpting and composition review.

### Camera discipline contributes directly to asset quality

Bruno uses a 25° perspective lens, radius 15–30, elevated orientation, smoothed focus tracking, and an aspect-ratio distance adjustment. Its foliage placement also assumes that default viewing direction. Those assumptions cannot be copied unchanged onto a freely orbiting sphere.

Sri’s code defaults to 45° desktop and 60° portrait; named portrait shots include 64° at the desk, 78° at exhibits and 84° at the iPhone studio. There are many percentage-based view offsets and fallback distance multipliers. These are source-supported reasons to investigate perspective exaggeration and inconsistent framing, not proof that every shot is defective.

Use separate authored shot types: atlas, place, activity, detail and walking. Initial lens experiments: 30–40° for place views, 38–50° for interiors/activity, with detail lenses chosen by the object. These are starting hypotheses, not fixed global values. Fit subject bounds to the unobscured viewport using both vertical and horizontal FOV; move and recompose the camera before widening the lens.

### The environment reacts as a connected system

Bruno’s day cycle is four minutes. Seasonal keyframes, day values and deterministic variation feed temperature, humidity, cloudiness and wind; precipitation and freezing derive from those values. The shared wind field affects foliage, grass, water and other effects. The source includes temperature-dependent water ripples/ice and tire friction changes on ice.

Sri already has a typed SF weather state consumed by sky, cloud, rain, sea, grass and sound. Extend that foundation rather than creating independent timers for each effect. Preserve the real SF clock. Local biome profiles control exposure, palette, shelter, moisture response and sound character. They are artistic microclimates, not claimed live weather measurements for Yosemite or Hyderabad. Rain should gradually wet exposed surfaces and change rain/water sound; sheltered interiors remain sheltered. Seasonal variants can be added after the base world works.

### Grass and foliage use economical visual simulation

Bruno’s foliage combines textured planes with adjusted normals and instancing. Grass geometry bends in a shader with height-weighted wind. Terrain data and track textures influence where/how grass appears. This is convincing motion without a rigid body for each leaf or blade.

For Sri: author planting masses first, then render grass in local patches. Add shared gusts, species-specific stiffness, visitor/ball disturbance fields and gradual recovery. Use simplified distant vegetation and retain the same major silhouette across quality tiers. Groundcover must respect full path/court footprints. Trees need trunks, branch structure, crown volume and an intentional base transition.

### The shoreline is a spatial transition

Bruno’s terrain data drives an orange-to-teal-to-deep-blue gradient; its water shader uses terrain data for shore/ripple effects. The supplied images show a sloped bank, readable shallow band, deeper water, broken foam, floating leaves and related shadows. These features make the coast legible even with simplified geometry.

For Sri: define deep water, shallow shelves, wet edge, dry beach/rock, and planting as related terrain zones. Drive wetness, foam, sediment color and vegetation exclusion from the same coast/depth fields. Water normals, foam motion and shoreline sound share wind and exposure. Use calm sheltered bays versus rougher exposed edges. Preserve coast readability from the globe through arrival to close view; do not make foam a uniform luminous outline.

### Visibility protection is part of the asset

`Foliage.js` implements a screen-space reveal around the vehicle: a projected vehicle position and zoom-scaled mask reduce foliage alpha. The inspected code does not establish that every object uses this behavior.

For Sri: every camera shot names its focus subject and relevant occluders. Trees can use a dithered or alpha-tested reveal; selected roofs/walls use authored cutaway groups. Fade only the foreground portion that obstructs the active subject, with depth filtering and hysteresis to prevent popping. Keep collisions stable while visual occluders fade. Preserve needed shadows and interaction visibility; never expose a clickable object while leaving it visually hidden. Test the seated character, monitors, exhibits and walker separately.

### Sound is a material and interaction system

Bruno’s `Audio.js` supports sound groups, variation, force-dependent volume, positional playback and distance attenuation. Bricks and lanterns have explicit brick/metal collision callbacks. Some bench/fence callbacks are commented out in the inspected source, so “every object has its own sound” is a desired quality bar, not a verified universal implementation. Day/night wildlife, wind, rain and waves also read world state. Audio playback was enabled during exploration, but this report does not claim that every sound was heard or assessed.

For Sri: give every interactive asset a sound profile as part of its definition. Examples: ceramic mug on wood, paper/book handling, chair movement, keyboard keys, stone footsteps, grass footsteps, ball bounce on acrylic, racket/shuttle contact, water splash and door/latch action. Use a small recorded or licensed family of variations per material/action, impact strength, spatial position, cooldowns, voice limits and priority. A shared profile can serve many assets; repeated generic UI clicks cannot convey their materials. Static scenery can be intentionally silent while nearby ambience supplies context. Quiet/mute, reduced motion and direct reading remain first-class. Desktop rendered audio checks cannot replace physical-phone/headphone listening.

## World composition before more decoration

Create a new whole-world composition drawing before changing terrain. Organize existing destinations around recognizable coastline shapes, headlands, bays, ridges and valleys. Connect nearby places through believable land and short bridges where suitable. Every junction needs a reason and a legible onward route. Preserve current semantic destinations and their reading links even when positions move.

Use the ocean to give the world geography: a sheltered SF-inspired bay, shallow coastal shelves, a rocky outdoor inlet, and open-water separation between major masses. Existing bridge/harbor elements should have coherent shore anchors. A small ferry/boat route is an optional later navigation feature only if it improves movement between existing destinations; it requires its own interaction and performance gate. It is not a reason to fabricate a new personal chapter.

Compose dense useful places, quieter connecting landscapes and intentional open water. Review both the visible and far hemispheres. Avoid merely expanding the sphere while leaving the same small destinations stranded on it. Rebalance land area, destination spacing and the globe’s screen size together. Do not pick a new radius until a measured blockout demonstrates a better orbit-to-ground relationship.

Maintain an atlas layer with readable place names, landmarks and current location. Selecting a hidden destination first brings it into view, then descends. Provide Visit and Read directly. Returning restores the previous globe orientation, zoom and selected destination. The atlas is the same world, not another desktop/spatial mode.

## Asset production plan

Blender 5.2.2 LTS is installed. Existing scripts already fetch CC0 assets, process textures, create some original meshes, export GLBs, produce foliage cards and previews, and build a catalog. Reuse this tooling while changing the acceptance standard.

1. **Art specification.** Define material families, scale references, bevel treatment, acceptable texture contrast, plant silhouettes and character proportions. Create reference boards and optional image-generated concept sheets. Concepts are visual targets, not production 3D assets.
2. **Whole-world blockout.** Author land/water masses and routes; place landmark bounds and camera anchors. Review a clay version from the globe and the actual close cameras before detail work.
3. **Hero modeling.** Author or substantially refine the apartment shell/roof/entrance, three-monitor desk setup, chair and seated character; the Foundry landmark/exhibit; granite formations, shoreline and bridge abutments. Preserve useful existing models after inspection. Automated generation produces candidates; close-view craft requires iteration or specialist 3D artist work where needed.
4. **Reusable environment families.** Produce coherent façade modules, paving/curbs, railings, lights, benches, rocks, tree species, shrubs, groundcover and shore transitions. Use deliberate variants, not uniform repetition or arbitrary random scatter.
5. **Surface work.** Create consistent UVs and texel density; bake appropriate normals/AO; keep daylight changes dynamic rather than baking a fixed sun everywhere. Use subtle PBR detail within the common palette. Establish shared material IDs.
6. **Behavior authoring.** Add named collision proxies, interaction anchors, contact points, camera bounds, cutaway groups, wind weights, sound profiles and story associations. A model without these is an unfinished interactive asset.
7. **Export and review.** Keep editable `.blend` masters; export GLB, LODs and simple colliders; use mesh compression and evaluate GPU texture compression with the current renderer. Generate neutral/day/night/close-view renders and an in-browser inspection route. Record source, license, dimensions, bytes, triangles, material/draw-call cost and behavior metadata.

Proposed asset contract: `id`, source/license, local frame and scale, visual/LOD references, material family, footprint, collision shapes, interaction anchors, story link, audio profile, wind response, occlusion groups and quality tiers. The same footprint/frame must drive rendering, navigation, physics and clearance checks.

## Biome briefs

- **Home / SF bay:** warm apartment interior against cool coastal atmosphere; believable façade depth, trim, roof construction and street-to-building contact. Refined desk, chair, character and tactile objects. Bay/bridge composition establishes place without turning the home into a city tour.
- **Foundry / professional work:** cohesive campus/workshop architecture, deliberate exhibit proportions, readable product content and short navigable approaches. Rich planting and paving edges support the work. Professional reading remains the fastest route.
- **Outdoors:** layered granite masses, varied forest structure, trail slopes, an inlet/stream transition and close water/rock contact. Wind, footsteps, waterfall/surf and leaf movement have distinct spatial sources.
- **Sports:** all three existing sports retain their space and identity. Equipment construction, surface scale, net/rim details, ball/shuttle behavior and contact sound receive a coordinated pass. Entire court envelopes and approaches stay clear.
- **After hours:** enclosing architecture/planting, directed seating, warm lamps, tactile listening/cinema props and controlled audio zones. Screens and listening focus remain legible through camera-safe cutaways.
- **Fieldnotes:** a composed garden/writing space with authored paper, desk, planting and quiet sounds. Unpublished content remains visibly unpublished. Future/Hyderabad requirements in the existing queue remain open and must use the same asset standard when implemented.

## Camera and movement specification

Replace scattered camera exceptions with a shared shot schema: subject bounds, target anchor, view direction, lens, composition anchor, UI safe region, minimum/maximum distance, supporting up frame, allowed orbit limits, occlusion policy and return state.

Travel stages: orient atlas → clear surface → approach place → settle on shot. Interpolate lens and composition offsets with position; keep local moves in the local place frame. Use quaternion orientation transport and bounded roll. Camera collision must sweep a volume including near-plane corners against terrain, roofs, walls and props. Current terrain-radius protection alone cannot establish building clearance.

Authored plateau floors use their actual local frame; curved routes use the supporting surface frame. A radial normal and a plateau normal are not interchangeable. Preserve frame agreement among scene, camera, sound listener, interactions and physics. Walking gets its own follow distance, look-ahead and collision boom. Never move the camera unexpectedly while the user reads.

Occlusion handling is the last layer after choosing a good shot. Roof cutaways should correspond to construction groups, and foliage reveal should preserve enough context for orientation. Test reveal recovery after travel, pause, resize and changing the selected subject.

## Physics, motion and sound architecture

Use real rigid bodies for a bounded set of movable props and sports objects, kinematic character control for walking, and shaders/animation for dense environmental motion. Keep inactive bodies asleep. Use stable stepping/interpolation and reset behavior. Character feet and seated poses need floor/seat contact and matching animation, with IK where it improves contact.

Prefer bounded physics scenes in each biome’s local coordinates, transformed into the globe for rendering. A single global downward gravity vector is wrong around the sphere. Any cross-biome dynamic object needs an explicit frame-transfer policy or radial-gravity implementation; do not let it drift across incompatible simulations.

Use one world condition state for sun, wind, rain, surface wetness and environment audio. Add local shelter and exposure masks. Couple events: an impact produces a bounded physical response and matching sound; walking changes footstep material; wind gusts affect grass, canopy, water and wind audio coherently. Keep weather transitions smoothed and stateful across pause/resume and route changes.

Audio categories: interaction, material contacts, footsteps, localized loops, biome ambience and music. Keep independent user controls and a master limiter. Use prioritization and distance culling so a detailed world remains pleasant. Record/licence sounds explicitly; synthesized UI feedback alone does not cover material realism.

## Delivery sequence and acceptance

### P0 — Baseline and authoring tools

Capture settled desktop/portrait/landscape views and transitions at representative day/night/weather states. Record actual frame time, draw calls, visible triangles, texture memory estimates, transferred bytes and startup stalls. Add a development-only shot/material/occlusion inspector with reproducible conditions. Inventory existing assets by keep/refine/replace. Gate: a reproducible baseline and a whole-world composition drawing.

### P1 — World layout and camera prototype

Block out revised land/ocean/coast shapes and existing destinations. Implement the atlas-return model and subject-based shot fitting using current assets. Fix lens jumps and local/spherical frame handling. Gate: globe, approach, activity and return read coherently on desktop and phone; full-width routes and camera sweeps clear the actual rendered geometry.

### P2 — Finished coastal benchmark scene

Build one small, complete home-to-bay segment: authored ground/coast, water depth/foam, a hero architectural edge, path/bench/light, one tree/shrub/grass family, the active character, occlusion reveal and material-specific audio. This is the visual standard for the rest of the world, not a partial completion claim. Compare identical cameras before/after and neutral/day/night states. Gate: meaningful visual improvement at measured browser cost, including user review of the actual scene.

### P3 — Complete asset families and biomes

Refine Home, Foundry, Outdoors, Sports, After hours and Fieldnotes in bounded units. Reuse the benchmark’s asset/material/behavior contract. Inspect arrival, close view and return before beginning the next unit. Gate: coherent silhouette, material scale, grounded contact and purposeful density in every destination.

### P4 — Integrated environment response

Apply shared gusts, grass disturbance/recovery, wetness, shore behavior, shelter, time-of-day atmosphere and sound mixing across completed biomes. Gate: effects agree with one another, do not obscure content, and behave correctly while paused or reduced-motion is enabled.

### P5 — Interaction and audio completion

Audit each selectable/touchable object and each environmental sound source against its asset contract. Add material-specific variations, distance/impact response, occlusion/cutaway rules and stable reset. Gate: every designed interaction has appropriate visual, physical and audible feedback, or a documented intentional silent response. Reading never requires an interaction puzzle.

### P6 — Performance, accessibility and production

Tune instancing, geometry batching, quality tiers, texture residency, shadow coverage and scene preparation. Start with proposed targets of 60 fps on the reference desktop and a stable 30 fps minimum on the agreed physical phone, then establish realistic per-scene budgets from P0/P2 measurements. These are targets, not current guarantees. Measure sustained physical-device behavior, not just viewport emulation. Preserve focus, pointer/touch, keyboard, pause/resume, reduced motion, deep links and `/story`.

After each completed website change passes its visual and functional gates, deploy through the existing GitHub/Vercel workflow with the signed-in owner and verify the live version. This research/plan introduces no application change and requires no production deployment.

## Implementation map

- `CameraRig.jsx`, `place-stops.mjs`, `camera-limits.mjs`: shot model, framing, transition and clearance.
- `world-layout.mjs` and biome layout modules: shared coordinates, geography, supporting surfaces, paths and anchors.
- `WorldScene.jsx`, `WorldLighting.jsx`, `AtmosphereSky.jsx`, `PostEffects.jsx`: rendering, material/light consistency and quality budgets.
- `weather.mjs`, `useWeather.jsx`, grass/foliage/water components: unified environment response and local exposure.
- `StudioPhysics.jsx`, walking/sports components: bounded physics, contact and reset behavior.
- Existing sound hooks/engine: asset sound profiles, spatial/impact response, variations and voice management. Inventory exact entry points before implementation.
- `scripts/blender/`, model catalog and model loaders: editable asset pipeline, variants, metadata, LODs and inspection.

## Decisions and risks

Recommended visual direction: stylized realism with authored shapes and controlled photographic material detail. Retain React Three Fiber/Three.js and the existing app. Prototype the shared shading approach within the current renderer; Bruno’s WebGPU/TSL code is not a drop-in replacement for the current WebGL pipeline. A renderer migration is a separate decision only if measurements or required effects justify it.

The main production risks are insufficient bespoke model craft, whole-world geography changes breaking shared coordinates, foliage overdraw, excessive material/draw calls, expensive transparency and audio clutter. More objects or more shader effects alone do not pass the quality gate. Physical-device access remains necessary to certify the desired experience.

If adapting substantial code, preserve Bruno’s MIT notice. His `license.md` and site identify MIT, while package metadata says ISC; preserve provenance and resolve that discrepancy before redistributing copied portions. Prefer original Sri-specific models and content. Any third-party asset/audio retains its own licensing record.

## Primary source index

All code links below are pinned to the inspected commit; findings are source evidence unless separately marked observed above.

- [Camera and tracking](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/View.js)
- [Map: day/night texture, player position and destination respawn](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Map.js)
- [Palette and materials](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Materials.js)
- [Shadows, ground bounce and fog](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Materials/MeshDefaultMaterial.js)
- [Weather](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Weather.js), [day cycle](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Cycles/DayCycles.js), [seasonal cycle](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Cycles/YearCycles.js)
- [Foliage and screen-space reveal](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/World/Foliage.js), [grass](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/World/Grass.js), [wind](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Wind.js)
- [Terrain/depth color](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Terrain.js), [water](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/World/WaterSurface.js)
- [Audio](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Audio.js), [object and collider extraction](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Objects.js)
- [Blender/export workflow](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/readme.md), [source resources](https://github.com/brunosimon/folio-2025/tree/41046b57eeed8d156d9c3fd7fa259900baef7816/resources)
- [REA repository](https://github.com/morluto/rea), [REA JavaScript workflow](https://github.com/morluto/rea/blob/23de10bb2849cdce8ddbe70504aa7cc57de75a98/docs/javascript-application-workflows.md)


## Motion evidence and scope clarification — October 31

Sri emphasizes reviewing video frames to understand temporal craft, with heavy improvement of the existing portfolio as the default scope. Redesign world layout where composition, navigation or coastal geography requires it; retain successful places, personal narrative, invented globe, accessible reading and real SF time. A wholesale replacement is not assumed.

Before implementation, extend the reference and current-site baseline with short recorded sequences where capture is available, plus timestamped contact sheets: arrival and settling; close approach and return; moving behind foliage; entering/exiting grass; crossing the shoreline; collision and recovery. Review representative frames and the full sequence together. Record camera position/framing changes, occlusion onset and recovery, ground contact, vegetation bend/recovery, shoreline continuity and lighting continuity. Capture input and viewport context so sequences can be repeated. Separate settled-view defects from transitional frames; a single flight frame cannot establish a final-camera defect.

Keep motion evidence distinct from performance measurements: screenshots alone do not establish frame pacing, and source code does not establish perceived animation or sound quality. Pair browser frame-time measurements with visual playback; audit audio by listening where available. Compare desktop and phone viewport journeys, retaining separate physical-device gates. REA traces explain likely mechanisms and dependencies; they do not substitute for recorded runtime evidence.

Deliverable for this additional baseline: annotated before/reference sequences, concrete defects with timestamps, and retain/refine/rebuild decisions for each affected area. This temporal review is planned, not completed by the existing still-image report.
