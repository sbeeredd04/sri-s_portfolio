# World craft: detailed execution amendments

October 31, 2026. Proposed work, not implemented. This document makes [the main plan](WORLD-CRAFT-PLAN.md) concrete; its amendments take precedence where sequence or scope is more specific. Heavy improvement of the existing portfolio is the default, with selective geographic redesign. Retain the invented globe, SF clock, professional-first content and `/story`.

## Active goal clarification — Sri, October 31
Complete the full website update described in this plan and the supplied portfolio-handoff: biome/world improvements plus selective modern redesign. Individual coastal releases are progress, not completion. Current direction is contemporary architecture, clean materials and crisp lighting, while preserving the invented globe, SF time/climate, professional-first story and direct reading. The handoff's content questions must not be answered with invented personal stories. Current implementation/deployment authorization supersedes its historical access/workflow restrictions.

The composition comparison, whole-world biome rollout and final validation remain open. Before further isolated polish, prioritize a coherent geographic and visual plan for all destinations, with Foundry/professional work first. See REQUEST-QUEUE.md Q92 for the explicit clarification and current status.

## 1. What the repository gives us

The supplied `brunosimon/folio-2025` is the same repository already inspected at `41046b57eeed8d156d9c3fd7fa259900baef7816`. Reuse the existing REA analysis rather than reporting a duplicate scan as new research. A focused extraction of its asset-related module nodes and incident relationships is saved in [rea-asset-focus.json](../research/bruno-world-2026-10-31/rea-asset-focus.json); it is derived static evidence, not a new runtime trace. The original analysis parsed 126 JavaScript files. Source inspection below corroborates what those relationships mean.

Available evidence includes editable Blender resources, exported models, runtime materials, object naming/metadata conventions, region assembly, weather, physics, sound and export/compression scripts. This lets us study how a finished scene is assembled. It does not establish every original modeling decision, asset provenance, unpublished intermediate experiment or exact deployed build.

Adapt the asset contract, shared environmental inputs, instancing, source/export separation, visibility treatment and material-response techniques. Port shader ideas to our current renderer before considering a renderer migration. Create Sri-specific architecture, objects, signage and geography. Any actual copied code/assets must retain applicable notices and provenance; repository-level licensing does not establish every third-party item's origin.

## 2. Why the current world can feel empty or fake

**Measured source clue:** `app/lib/world-layout.mjs` sets radius 450 and `GROW = WORLD_RADIUS / 190`. Its comment explicitly says land envelopes grew while authored content remained unchanged. This increases linear land extents by about 2.37; circular footprint area would scale by about 5.61 where both dimensions follow that factor. That is a geometric implication, not a measured visible-empty-area statistic. It is a strong reason to compare composition before increasing object count or globe radius again.

**Other source-supported risks:** camera lens/offset exceptions, imported assets with different material treatments, and an export pipeline designed to flatten static props. Their visual severity still needs settled screenshots and motion review. Do not label every existing asset defective without inspecting it.

The audit will classify each weak view by cause: oversized or unshaped terrain; weak silhouette; missing middle-distance structure; abrupt surface transition; wrong scale; floating/intersecting contact; inconsistent material/light response; poor camera composition; or missing motion/interaction feedback. Each defect gets a screenshot or timestamp, location, proposed repair and verification view. “Add detail” is not an actionable diagnosis.

## 3. Proposed world composition

Author a top-down plan and globe turntable showing existing destinations, coast shapes, relief, sightlines, paths and no-build areas. Compare a compact-land option against reshaped current extents at the same camera settings. Keep radius 450 during that experiment; change radius only if the comparison demonstrates a better whole journey and preserves physical scale.

**Professional arrival:** the initial globe and destination hierarchy make The Foundry and the direct reading route immediately understandable. Home remains a personal destination; it must not become a mandatory detour before work. The coastal benchmark is a production test area, not a decision to make Home the sole first impression.

**Home and bay:** compose an apartment frontage, clear door approach, a short planted street/promenade and a sheltered bay edge. Give the bridge credible abutments and connections. Layer dry paving, drainage/curb detail, planted bank or retaining edge, wet shore and shallow shelf. Avoid placing a beach under every urban edge: some stretches should be rocky or built waterfront.

**Foundry:** group workshop/exhibit buildings around a useful court or approach rather than stranding objects on an oversized clearing. Establish one main silhouette and visible entrances. Trees and secondary buildings frame views of the work; they must not compete with project content. Routes connect the actual entrance and display locations.

**Outdoors:** compose a ridge, valley and trail with foreground rock, mid-distance forest and a background landform. Trees cluster by slope/moisture and leave route clearances. Granite masses connect into terrain rather than appearing as unrelated boulders on a flat pad.

**After hours:** retain sports and listening/cinema as distinct activities within the shared region. Use terrain, vegetation and architecture to give each an enclosure; keep complete playing/runoff areas clear. Seating faces its screen or listening focus. Add no ambient crowd merely to increase density.

**Fieldnotes:** a smaller, intentionally quiet garden/writing destination. A clear approach, shaded writing place and bounded planting can feel complete with fewer objects. Preserve truthful unpublished states and existing future-content requirements.

**Ocean and far hemisphere:** evaluate the entire globe, not just the default front view. Give nearby destinations coherent coastal relationships and leave open water where it improves separation and scale. Use depth, underwater shelf silhouettes, weather and restrained distant landforms to make water spatially legible. Do not fill it with arbitrary islands, boats or fabricated personal destinations. New ferry navigation remains optional and outside the first delivery.

## 4. What “fuller” means in each view

Every principal place view should have a readable subject, a supporting middle distance and a resolved background/edge. Use masses first, then useful secondary objects, then small surface detail. Quiet gaps and clear paths are part of the composition.

A bay view might contain a close railing/planting edge, the promenade and apartment as the middle distance, and a headland/bridge as the distant silhouette. A Foundry view might use a planted entrance frame, the active project exhibit, then workshop architecture. These are proposed compositions to test, not claims about current screenshots.

Distribution rules: plant in authored clusters with species/age variation; reduce grass near maintained paths; accumulate modest leaves at sheltered edges; align paving with construction; place lamps at entrances/junctions where illumination helps; place benches at an actual view. Each added object must serve orientation, interaction, narrative or useful environmental structure. No object-count quota or blanket random scatter.

## 5. The first complete asset batch

Build a compact Home-to-bay sample with these families. Counts are initial authoring scope, not mandatory production totals:

- One architectural frontage/entry/roof section, with real wall thickness, trim, construction joints, foundations and grouped cutaways. Preserve or refine current geometry after inspection.
- One promenade kit: straight and corner paving, curb/drain edge, steps or ramp only where grade requires it, and one shore-retaining transition.
- One bench and one lamp family with a few deliberate variants. Bench feet contact paving; the seat faces a view; lamps have credible supports and controlled night intensity.
- Two complementary tree forms, two shrub masses and three grass/groundcover clumps. Include trunks/branches, crown volume, wind weights, ground transitions and simplified distant variants.
- Three rock forms that can combine into a connected bank; dry/wet surface treatment and coherent mineral scale.
- A shallow shelf and bank profile, water-depth field, restrained shoreline foam/ripples and matching localized shore ambience.
- One existing active character/subject refined for scale, contact and camera visibility. Add no car merely because the reference uses one.
- A small interaction set using existing supported objects: footsteps by surface, one material contact and one tactile prop. Include sound variations, reset and mute behavior.

Model and review the hero forms first. Generate optional concept/contact sheets for proportion and palette; bitmap generation is not production geometry. Use existing licensed models where their form fits, then normalize UV scale/materials and reshape them as necessary. Use Blender scripts for repeatable meshes, export and validation; difficult hero silhouettes/character anatomy may require sustained manual modeling or a specialist artist. Do not promise that primitive generation achieves the target.

## 6. Fix the asset pipeline before producing dozens of models

Bruno's `Objects.js` parses physical/body names and collider child names and reads `userData` such as friction/restitution. `World/Areas/Area.js` assembles objects and references, uses mass and region markers, and controls region updates/visibility. The scene file carries useful semantics beyond visible triangles.

Our `scripts/blender/optimize_model.py` currently disables extras, attributes, vertex colors, animations and skins. It is appropriate only for compatible static assets. Sending every future asset through it would discard metadata or deformation inputs needed by the new contract.

Create four explicit export profiles: static scenery; interactive/cutaway props; vegetation; rigged/animated characters. Preserve required hierarchy, pivots, anchors, attributes, skinning and extras where their asset contract requires them. Give foliage a tested attribute convention for stiffness and phase. Store the authoritative contract in a validated manifest, with stable node references into the GLB. Do not rely exclusively on fragile naming heuristics.

Extend the existing `build_catalog.py` provenance, dimensions, LOD and material inventory with the behavior and clearance fields rather than replacing it.

For each asset retain an editable master, source/license record, dimensions/unit convention, local frame, material definitions, visual LODs, full footprint, simple collision proxies, interaction/camera anchors, sound profile and visibility policy. Export deterministically; compare metadata before and after optimization/compression. Run a small import fixture to verify preserved pivots, node references, motion weights and rig behavior. Validate compression with the production loader, not merely a successful CLI exit.

Render neutral, daytime, night, wet and close-up previews. Check silhouette and material scale in the actual portfolio light rig. A catalog thumbnail alone cannot approve an asset. Track transferred bytes, draw calls, triangle count and texture residency estimate by active scene and tier.

## 7. Rendering and behavior amendments

Keep physically meaningful roughness, normal detail and scale, but art-direct contrast, saturation, shadow color and atmosphere consistently. Make a common material sample scene with wood, stone, plaster, metal, foliage and water before converting the world. Bruno's palette/Lambert/TSL system is useful evidence; a direct replacement would change our realistic material character and requires renderer compatibility work.

Use a shared coast/depth field for terrain, water appearance, shore wetness, foam and vegetation exclusion. Validate shoreline continuity through LOD changes. Use common wind with species-specific stiffness and local disturbance/recovery. Share exposure/shelter masks between wetness, rain and ambient sound. Keep interior shelter credible and real SF time intact.

Use authored shot bounds and UI-safe framing before adding fade effects. Foliage reveal is depth-filtered around the active subject; building cutaways follow actual roof/wall groups. Fading visual geometry does not remove its collider. Inspect reveal onset/recovery, shadow behavior and interaction visibility during motion.

Give each designed interaction appropriate visual response, physics or animation, and material-specific sound. Static scenery can be intentionally silent. Prioritize nearby meaningful events, cap simultaneous voices, and maintain mute/quiet/reduced-motion behavior. Real rigid-body work is bounded to suitable local-region objects; dense vegetation remains shader-driven.

## 8. Work packages and exit evidence

**A — Baseline and composition.** Record settled and moving desktop/phone-viewport journeys for globe → Foundry → detail → return and Home → bay. Capture comparable reference routes where available. Produce timestamped contact sheets, a whole-globe turntable, keep/refine/rebuild inventory and two land-composition options. Exit: defects are specific and the chosen geography solves them in a clay view. Video/frame capture remains pending; source evidence cannot close this gate.

**B — Asset contract and export proof.** Implement the four profiles and validate one static asset, one interactive prop, one foliage asset and one rigged asset. Exit: attributes/metadata survive the full export-load path; rendering and collider/footprint agree.

**C — Layout and camera.** Prototype the chosen coastline, massing and route geometry; keep all content IDs/deep links. Fit subject bounds; interpolate lens/orientation; sweep camera clearance; restore atlas state. Exit: arrival, settled reading and return work at desktop/portrait/landscape, with full rendered path widths and local paving clearing all uses.

**D — Finished coastal sample.** Integrate the first asset batch, common material treatment, water, wind, one interaction/audio set and visibility protection together. Exit: matched before/after views and motion demonstrate a better complete scene within measured device budgets. Do not defer all sound/weather to a late polish phase; prove the integration here.

**E — Whole-world rollout.** Use the established kit and contract for Foundry first, then Home completion, Outdoors, After hours and Fieldnotes. Recheck the globe after each region so local detail does not break overall composition. Inspect and fix each major unit before beginning the next. This is expansion of proven systems, not independently styled mini-sites.

**F — Completion and release.** Audit every route, close shot, interaction and far-side view; finish cross-region consistency. Test pause/resume, focus, pointer/touch, keyboard, selected state, deep links, exit and direct reading. Measure cold loading, transition stalls and sustained physical-device performance separately. Deploy each completed website change through the existing authorized GitHub/Vercel workflow after its checks and verify the live version. Research-document updates alone do not require deployment.

Do not commit to a calendar estimate before the first hero asset and complete coastal sample establish iteration cost. The main dependency is bespoke visual craft, not simply the number of React components. The existing proposed 60 fps desktop/30 fps physical-phone targets remain hypotheses until measured on agreed hardware.

## 9. Evidence and unresolved work

Confirmed: source-derived asset/material/region contracts; saved REA static analysis; earlier live driving screenshots; current land-envelope growth; static-export metadata loss. Proposed: all geography, asset counts, compositions and delivery packages above. Pending: recorded motion audit, inspection of editable Blender scene contents, exact per-asset provenance, current whole-world visual baseline, implementation and physical-device certification.

Pinned source references:

- [Repository and export workflow](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/readme.md)
- [Object/physics metadata](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Objects.js)
- [Region assembly and visibility](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/World/Areas/Area.js)
- [Shared materials](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/sources/Game/Materials.js)
- [Compression implementation](https://github.com/brunosimon/folio-2025/blob/41046b57eeed8d156d9c3fd7fa259900baef7816/scripts/compress.js)
