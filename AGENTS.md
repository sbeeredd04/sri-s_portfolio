# Website quality standard

The full request queue is `docs/REQUEST-QUEUE.md`. Treat new requests as cumulative; use the latest explicit preference to resolve a conflict.

After every major implementation unit, open the actual website in the browser before starting another:

1. Inspect the arrival, close camera, and return journey at desktop and phone sizes. Use screenshots, not only DOM text or build output.
2. Critique proportion, material scale, lighting, contact with the ground, visual hierarchy, readable content, and purposeful detail against Sri's supplied references.
3. Check physical common sense: every path segment and its full width clears playing areas, buildings and seating; chairs face their screen or listening focus; doors have an approach; furniture and props do not intersect.
4. Exercise pointer/touch and keyboard controls, selected state, focus, pause/resume, relevant deep links, and exit. Reading must stay directly accessible.
5. Every object, label, panel and paragraph must serve orientation, interaction, personal narrative or useful content. Remove duplication and unexplained decoration. Keep professional work first.
6. Record concrete defects and fix them; then inspect the changed view again. Mark unresolved visual defects openly in the queue. Passing tests cannot close a visual-quality gate.

Use shared coordinates for geometry, camera, interaction and clearance checks. Tests must inspect the rendered footprint, including local paving and all connecting roads, rather than a convenient subset.

Sri's quality ambition is AAA game-level craft and careful Apple-like UX. Do not claim that the current procedural models meet that ambition, or substitute extra primitive objects for well-designed assets. Improve close-up form and materials while measuring browser cost. Actual older-M1 and physical-phone validation remains distinct from viewport testing.

Keep the one invented world, real SF clock with distinct biome moods, professional-first story, and accessible `/story` route. Do not restore desktop/spatial modes or photographic Earth.
