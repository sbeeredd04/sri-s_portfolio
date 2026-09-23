# Website revamp — current state

Updated September 15, 2026. The cumulative request queue is in [REQUEST-QUEUE.md](REQUEST-QUEUE.md). This document describes the current implementation; dated evidence remains in `docs/research`.

## Direction retained from the full conversation

One continuous invented world, with a full-globe overview and a house entered through the same scene. No photographic Earth, separate apartment cut scene, desktop mode, spatial-mode switch or icon dock. Dark glass, glacier blue and lavender, quiet stars, warm interiors, chibi people and more credible materials. Professional work comes first; personality stays part of the narrative.

All places follow real San Francisco time, including DST. Their lighting moods differ. The playground's 5–9 description is a story about Sri's life, not a fictional clock or an access restriction.

## Content and research

- Offseason founding-engineer role, AI personal wellness in downtown SF; ASU CS graduation, 4.0 and entrepreneurship certificate. Experience, research, education and community are available through direct reading controls.
- Personal story includes entrepreneurship, building, the Steve Jobs book, the three-monitor setup, dance, badminton, volleyball, basketball, hiking, cities and trying new hobbies. Sequoia, Sonoma and Catalina are a wish list.
- The listening room includes Sri's original v4 track, Fred again.. and Tollywood. The cinema has Brooklyn Nine-Nine, The Big Bang Theory, Friends, The Fresh Prince of Bel-Air and How I Met Your Mother.
- All 60 public GitHub repositories have a documented disposition in `research/github-coverage-2026-09-15.json`. The library has 61 entries, including team projects, learning work, six early drafts and nine clearly labeled forks. Counts do not imply 61 original products.
- The three Devils Invent projects, AZ Spark/Mine Alliance and Voxel51/VoxelCV are represented with bounded, sourced team/award claims. Original SafeSide slides remain available.
- Chalant is present with only the details Sri has supplied. Exact graduation/employment dates remain unconfirmed. The writing studio is intentionally forthcoming; no posts or audience are invented.

Potential source exposure was found during the audit: findprod contains an embedded API credential; Gymception's tree exposes private-key filenames and database artifacts. The credential was redacted from the research sample, never tested, and those source links are withheld. No key rotation or repository history change has been made. Private-intent sandboxes are not promoted.

## World and close-up interactions

The world radius is 96. Six biomes have separate local stops, contextual narration, a compact chapter route, an index, Work/Résumé shortcuts and an independent `/story` page. Shared terrain coordinates keep the clearings, props, cameras and studio collisions aligned. Capped shoulders avoid the earlier steep path rims.

Five paved routes have cut-stone joints, subtle material variation, curbs and alternating bollards. The surface palette uses linear-space colors and land derived from the authored places and routes, with restrained shore variation. No random Earth-like geography is generated. Eleven decorative residents walk those routes; one uses the visitor's on-device color. They are not a live visitor count. A Take a walk stop follows the local wanderer through the same scene. The shared route clock keeps avatar and camera synchronized; knee/foot poses preserve leg length, turns ease at the route ends, and tapping a resident or choosing Say hello prompts a short wave. The route clock survives hiding and restoring the 3D world. Shirts share the main character's authored fabric shape. Hair-lock roots are capped to remove rear-view pinholes.

The home has three rounded aluminum displays, a keyboard with individual keys, mouse, cables, chair, warm staggered walnut floorboards, upholstered lavender seating, plants and a rain window. The same house and furniture remain mounted through the approach. Displays open projects, current work and music. The mug, book and cushion have bounded Rapier pickup/drop/reset physics; the terrain catches dropped objects.

Project Town contains six selected-project workshops, an iPhone atelier, a hackathon hall and a workbench. All six selected projects have three-step physical/keyboard walkthroughs. Mesa uses an open book with curved pages; the others use framed displays. These are explicitly labeled interactive sketches, not live software sessions or actual research data. Three field notebooks open Food Thought, Nous and the threaded word-count project. Exhibit state survives travel and graphics remounts.

The entertainment house includes a turntable, speakers, keyboard, record crate, upholstered chair, fireplace, paper pendants, botanical plants and a lake/window view. The pendants respond to a nudge using a damped pendulum. A separate comfort cinema has upholstered, individually aimed seats, a clear side approach, and an authored screen. The physical screen, native Next show control and reading collection share selection state. The listening chair faces the turntable/lake. Music and environment sound require an explicit action; closing music stops the track.

The playground has proportioned badminton (6.1 × 13.4), volleyball (9 × 18) and neighborhood basketball (15 × 11) areas, separate approaches, appropriate marking layouts, four practical lights, and planting outside the playing aprons. Exact snapped paving footprints, all five connecting roads, benches, trees, planting and light poles are checked for clearance. Balls use gravity/release velocity/friction; the shuttle and attached rackets follow solved trajectories. The woodland includes a trailhead character, vegetation, a contained lake and tap ripples. Architecture, foliage and most furnishings remain authored/static geometry, not fully simulated rigid bodies or cloth.

The connection courtyard replaces the wholly closed future plot: a sheltered writing desk, social station, and two facing conversation chairs surround a shared table. Three local stops open writing, socials and collaboration content. Writing is forthcoming; connection links are already usable. The front canopy was opened after browser review showed it hiding the stations.

Nine recovered demonstrations/product links sit beside their project stories: Agentex and Mine Alliance recordings, Aether workspace, Zsh browser simulation, AviSol flight sketch, GitCue, Prom10, OctoDoc and Prismatrix. Players load only on request, use YouTube's privacy-enhanced embed host and unmount on close/filter/navigation. External links remain available. Hosted responses do not imply every external backend or product feature was tested.

`/resume` is a current printable overview using the same experience/project data. It is directly linked from the top navigation, index, work and experience. The original `sri_resume.pdf` is restored unchanged and explicitly labeled an older version. Mine Alliance's recognition links to the team's repository; PosturePro's win is sourced to Sri's original résumé. Exact additional prize categories remain pending.

## Interaction and implementation cleanup

- Removed the superseded portfolio shell, mode switches, window stack, launcher and obsolete assets/configuration. Root commands forward to the retained nested Vercel app root.
- Local Manrope and Bricolage Grotesque fonts and a custom lowercase signature replace the old logo/type treatment. Font and texture provenance remain with the assets.
- Shared material caches own and dispose textures. Workspace preparation begins during camera travel. Persistent lights avoid changing shader-light counts between biomes.
- Small screens have authored cameras, numbered globe markers where necessary, horizontal chapter scrolling and compact landscape controls. Local stop strips keep the selected place visible after travel and resize. Short phones use a larger globe and compact visible markers inside unchanged 44-pixel hit areas. Active close-up facade signs no longer clip behind the header.
- Project URLs expand, scroll and focus the correct story. Closing/travel, changing reading sections or changing a project search/filter removes stale project anchors. Dialog dismissal restores focus; 3D is not required to read anything.
- Lighting selectors now share the rounded selected-state treatment; settings use clear toggle indicators. Motion and showing the 3D world are separate controls.
- The physics cursor falls back to the native cursor for touch, reading, text input, reduced motion and disabled animation. Audio and animation pause when hidden.

## Verification and practical limits

The automated suite has 55 passing tests covering terrain and camera clearance, lakes, route grades, SF time/DST, physics, character reach, project matching/anchors, exhibit hit regions, authored sports contacts and audio lifecycle/preferences. Production builds, `npm run check` and whitespace validation pass. The TypeScript check validates configuration/generated types; the JavaScript UI is covered by the build and browser review.

The earlier cumulative pass exercised desktop, 375×667/390×844 phone portrait and 844×390 landscape. Checked: notebook story/reload, 61-entry rendering, multi-word search, reference filtering, native/physical exhibit selection, local back navigation, focus, hash cleanup, live/day/night with motion paused, original music playback and disposal, environment sound toggling, and real graphics-context loss followed by retry. The [final QA record](research/cumulative-pass-qa-2026-09-15.json) lists the exact reviewed paths; this is not a claim that every possible interaction sequence was exhaustively tested.

The following performance samples predate the enlarged courts, cinema and connection courtyard, and are not a current performance guarantee. The cut-stone geometry change reduced the settled home sample from about 1.418 million to 837 thousand submitted triangles before the final floor/seating detail. The scene held approximately 30 fps on this M4 Pro with the 30 Hz animation driver. A prior first trip in this pass still had a 136 ms long task. Samples are development measurements under variable browser load, not GPU timings or proof of old-M1 performance. The final 1280×800, DPR-1 development sample measured 470 calls, approximately 907 thousand triangles, 3.6 ms CPU/frame and 30.3 fps at home. The eight-second first-entry capture still recorded one 127 ms long task. These samples use a different viewport/DPR from the earlier comparison. An upstream Rapier initialization deprecation warning remains; it is not suppressed. See [the upstream report](https://github.com/dimforge/rapier/issues/811).

## Remaining gates

- Continue comparing close-up art, especially exterior vegetation and environmental depth, with Sri's supplied references. The site is still an authored stylized world; reference-level realism is not claimed complete.
- Connect true anonymous visitor presence after the expired InsForge account can be reconnected. The live-versus-historical preference and login confirmation are pending. No invented online counts are shown.
- Obtain Chalant purpose/stage/repository and the outstanding personal dates. Resolve the exposed-source concerns before promoting those repository links.
- Test first-entry behavior and sustained performance on an actual older M1 and physical phones. Viewport tests do not substitute for hardware testing.
- Spotify account data, future LinkedIn/blog connections, production publication and DNS/subdomains remain future work. No deployment, DNS mutation, push or LinkedIn update has occurred.

## House and authentic artwork — September 15

The house now has joined framing, a lower roof and ceiling, standing seams, walnut cladding, a framed glass facade with an open entrance and a solid plinth. A personal photograph replaces the generic wall symbol. A pendant lights the photo/credenza area and a coffee table serves the sofa without blocking it. The house is visible on arrival; The desk and On my desk lead inside the same building.

The Steve Jobs book uses the Simon & Schuster cover with the Albert Watson credit intact; its original ratio is used by the 3D model and About Me card. All five comfort shows use official distributor artwork in their collection and cinema. GitHub/LinkedIn profile links and Spotify identification use official marks. Assets are local, about 0.5 MB total, with source URLs and hashes recorded. No invented logos replace unavailable authoritative assets.

Browser critique caught and fixed book overhang, placeholder GPU texture resizing, duplicate arrival controls, phone framing, doorway glazing overlap and undersized landscape cinema art. Physics checks now cover book edge clearance and the coffee table. Reference-level interior/character art and real-device performance remain open.


### Basketball and volleyball play · 2026-09-15

Added court-local ballistic practice sequences, synchronized reachable wrists, sports shorts/socks, bending knees, ball materials, a diamond basketball net and volleyball antennae. Basketball includes dribble/gather/shot/rebound/return; volleyball has a serve and two-sided rally. Physical-player and native controls share requests, with no stacked impulses or teleporting replays. Busy controls preserve keyboard focus. Quiet opt-in court cues are scoped to the selected sport. Badminton is retained. Removed the unused free-drag ball component/simulator and superseded tests. Browser review covers 1280×800 and 390×844, pointer/keyboard actions, pause/resume, sound toggle, and return journeys; detail is in the court-play review record.

### Atmosphere and touch · 2026-09-15

Added a soft original score and four synthesized environmental textures, lazily loaded after Listen to this world. Home rain, outdoor shore/air and a warm after-hours mix share gentle navigation and object cues. The sound engine handles travel crossfades, reading/music ducking, hidden-page suspension, load cancellation and disposal. Sri’s own v4 remains separately attributed and takes precedence. No third-party music or samples were added.

View & sound now offers volume, score, interaction sounds and optional supported-phone haptics; motion/view controls remain accessible in a disclosure. Saved preferences do not enable autoplay. Press compression and native controls provide tactile visual feedback, with reduced-motion fallbacks. Browser critique fixed phone panel layering and verified scroll reachability, keyboard focus, quiet reloads, music playback and return journeys. Eight sensory tests bring the suite to 55. Physical vibration, headphone/speaker listening, and broader reference-level artwork remain review items.
