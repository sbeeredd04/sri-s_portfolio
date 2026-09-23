# Yosemite valley unit — integration result, September 22

Cursor Grok 4.7 xhigh authored the shared valley layout, wall/dome/ridge geometry, waterfall/stream/banks, lookout, planting exclusions, camera definitions and trail-network spur. The first session lost its connection before landscape edits; a retry produced the implementation and passed 18 focused checks. Main stopped the retry after its coding/static-review phase, before a final report, to perform the integration corrections below. No Cursor production build or deployment ran.

Main review found and corrected:
- Reversed smoothstep arguments in the valley-floor blend.
- Invalid meadow vertex indices. The subsequent visible sheet was also rejected as geometric patches, and removed in favor of organic terrain color and sparse grounded planting.
- A vertically collapsing waterfall ribbon, rock intersection near the lip, an overly raised/straight stream, mismatched dome seam, and a cylinder-like rear ridge.
- Terrain triangles wider than the wet channel, which buried the stream. Added local refinement with shared rendered height queries and coarse-edge continuity; did not globally increase world LOD.
- Invisible lookout top due to reversed face winding, and walking feet not sharing the platform elevation. Corrected winding and added a shared ramp/platform height.
- A tree directly obscuring the waterfall in the photography view. Reserved full crown clearance for arrival/overlook sight lines.
- Phone arrival/overlook composition, and walking entry from the selected overlook.
- Existing trail night-light coverage and stale Foundry gallery practical-light coordinates (main-owned WorldLighting.jsx).

Geometry measurements: 9,337 valley triangles (forms, stone lookout, talus instances, water/banks and tuft instances; excludes existing forest/planting); four valley material batches. Refined terrain patch has 25,088 triangles; entire planet terrain is 106,398 triangles, 2,370,452 attribute/index bytes. Valley plus refined patch is 34,425 triangles, under the 35k unit budget. These are static geometry metrics, not measured physical-device performance. No new textures or shadow lights.

Browser acceptance: actual screenshots at 1280×800 and 390×844; live SF night and temporary day preview; arrivals, close waterfall/lake, overlook, walking on the visible platform/path, reading/Escape/focus return, pause/resume and world return. Lake click produced the discovery. Saved mute/levels retained, Motion restored on and lighting restored to Live SF. Final observed runtime log since 12:38Z has no warnings or errors. /story and /rooms/notes checks and final build are recorded in the main research log/queue.

Remaining art concerns: granite still has broad procedural faces and a regular crown; water still needs richer shore/foam/reflection treatment; paths look too uniform; overall night-world buildings remain too dark. These models are an authored miniature, not an exact Yosemite map or evidence of Sri's travel, and do not meet the user's AAA aspiration. Physical phone/M1/audio/haptic validation remains open. The full request queue is not complete.
