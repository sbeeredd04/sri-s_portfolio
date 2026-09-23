# World redesign · September 16

This is the implementation plan for Sri's cumulative September 16 request. Latest preferences supersede earlier conflicts. Preserve verified content, demonstrations, résumé, real SF time and the existing ambient composition. This document is not a completion claim.

## Experience and map

Five destinations, with six internal camera anchors. Home remains the origin. Play and entertainment occupy one connected, irregular island with two neighborhoods; their local camera stops remain directly accessible. Outdoors connects to this shared island. Home connects to each main destination. Avoid roads across courts, buildings, water features or seats.

- **North / Home:** slate, pale granite, conifers, rain/drizzle, small snow pockets at the northern edge. Warm timber interior; believable human scale; tablet at the working desk. Keep a house, not a separate apartment scene.
- **Made / the Foundry:** replace repetitive town sheds with a brick-and-zinc creative campus: an arcade, project studios, central working court, mobile atelier and hackathon hall. Rust, ivory, ink and brass. Existing project stories/demos stay directly available.
- **After hours:** one long island for badminton, volleyball, basketball, listening room and outdoor cinema. Clay/sand/ink court and promenade materials; amber practical lighting; different room and court moods. A route connects the two neighborhoods. Verified official clips load only on visitor request, with external fallbacks.
- **Out there:** asymmetric forested headland and city waterfront. A small SF-inspired promenade, masonry storefront rhythm, café seating and lookout lead toward the lake/hiking trail. Sandstone/olive/coastal blue. Real places are design references, not invented travel history.
- **Fieldnotes:** a writing-and-connections island with a paper/terracotta pavilion and a small publishing garden. Future posts remain clearly forthcoming. Contact and social access are open now.

Use noncircular coast masks and different land sizes. Do not expand empty grass. Every addition must frame a route, establish a place, carry content, support interaction or create credible everyday activity. Retain the quiet black star background, restoring an existing source and compressing a 4K delivery asset with provenance.

## Build order

1. **World foundations:** distinct terrain palettes/shapes, revised geography/connections, black star backdrop, depth/floor correctness. Review orbit, arrival and close views before proceeding.
2. **Exploration:** optional ground-level street-view nodes with pavement arrows, continuous movement and drag-to-look. Keep direct animated camera stops and exit to orbit. Keyboard and phone equivalents required. Clear interactive cursor/label feedback for DOM and 3D.
3. **People and places:** smaller, more believable facial proportions and detailed skin/hair/clothing; preserve contact rigs. Refine house and tablet; rebuild the project campus; enrich coastal city, shared leisure island and writing courtyard with purposeful architecture/details.
4. **Content and connection:** audit original website/data for omitted useful content; distinct reading palettes; contact composer; original/official show clips with clear playback controls. Shared inbox/discovery feed awaits the user's backend preference; never fake a sent message or a global count.
5. **Personal discoveries:** small local terminal, documented commands and playful secrets tied to Sri. Discoveries update a visitor's list automatically; no fake live AI or execution of arbitrary commands. Shared activity only if real storage is connected.
6. **Sound and touch:** preserve existing score; improve rain with droplets/drizzle; separate music/environment/effects levels and haptic strength. Music defaults enabled, subject to browser autoplay restrictions; remembered mute wins. Defer audible start to an eligible gesture when blocked and label state honestly. Respect page visibility, reduced motion and device capabilities.
7. **Acceptance:** desktop/phone screenshot critique after each major unit; correct physical overlap and visual defects; verify navigation, focus, fallbacks, audio cleanup, discovery persistence, contact behavior, content retention and build/tests. Record real-device and reference-fidelity limits.

## References

- https://presidio.gov/explore/attractions/presidio-tunnel-tops — coastal landscape, transitions, social space.
- https://www.ferrybuildingmarketplace.com/ — waterfront arcade and human-scale city rhythm.
- https://www.nps.gov/yose/planyourvisit/winter.htm — northern seasonal mood.
- Sri's supplied rainy glass cabin, desk, warm/cool lighting and current screenshots — primary visual direction.
- https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay — audible autoplay restrictions.

## Status

Planning and baseline review complete. Implementation pending. Broader Q01–Q21 requirements remain active unless explicitly superseded here.

### Foundation checkpoint

Restored original star photograph as 3840×2564 WebP (1.36 MB); source is the existing repository's `public/background/stars.jpg`, no new licensing claim. Radius 128; play/listening share one terrain plane with offset camera anchors and a continuous elongated coast. Five visible destinations, shared leisure navigation, distinct terrain and reading colors. Fixed shadow bias and raised near-plane precision. Cursor now distinguishes actual scene hits from an inert canvas. Route tests exposed ridge crossings; moved the coast connection to the courts' safe entrance and kept the local leisure promenade outside the play footprints. Anchor/grade contracts now account for two neighborhoods on one tangent plane. Browser review exposed listening-room trees encroaching on the courts after merging; relocated them into the intervening garden. Further street/architecture work remains below.

### Exploration, sound, and private connection checkpoint

Street-view nodes and adjacent pavement arrows now cover all six internal anchors. Eye-height camera, native next/back controls and entry focus are implemented; direct close-up stops remain. Review still needs every path segment and furniture clearance. The initial phone view was tested at 390×844; an inactive in-app tab produced stale captures, so a fresh tab is now used.

The approved `somewhere-soft.mp3` score is unchanged. Sound is armed by default and starts with the first eligible gesture; an explicit mute is persisted. Independent music/environment/effect gains and supported-device haptic strength are available. Rain alone was re-rendered with 720 quiet resonant drops over an 18-second seamless bed. Sensory tests pass.

Vercel Hobby account `sbeeredd04s-projects`, existing project `sri-portfolio`, is connected through a separate ignored CLI session. Created private `sri-portfolio-inbox` in sfo1 and connected development/preview/production environment variables. Real storage verification: authenticated read 200, unauthenticated read 403. Real local contact API verification: 201 delivery, 429 repeat, exact stored test message. Synthetic message and limits removed afterward. No production deployment. The contact composer preserves failed drafts and always offers mailto. Messages and anonymous discovery events have no public read API; owner reviews them through Vercel Storage. Local device discovery collection and safe, authored terminal are implemented; browser validation is ongoing.
