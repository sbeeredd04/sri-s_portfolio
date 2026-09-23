# Sri’s personal website

A personal website for Sri Ujjwal Reddy: Founding Engineer at Offseason, curious builder, photographer, dancer, sports player, and music maker.

The website is one connected 3D world with a guided chapter route, local places to explore, and a direct content index. Visit a San Francisco-inspired apartment, the Foundry, After hours, a Yosemite-inspired valley, or the Fieldnotes garden. Contextual reading rooms have independent addresses under `/rooms`; `/story` contains the same content without WebGL. Fieldnotes adds an illustrated notebook gallery and a structured article format for future posts.

## Run locally

Requires Node.js 20.9 or newer.

```sh
npm install --prefix sri_portfolio/sri_portfolio
npm run dev
```

Open http://localhost:3000. Root commands forward to the application directory so the existing Vercel project root can stay intact.

```sh
npm run build
npm run check
npm test
```

## Where things live

- `sri_portfolio/sri_portfolio/app/page.js`: route entry point.
- `app/components/personal/`: site sections, 3D worlds, and music player.
- `app/json/personal.js`: curated project facts, personal history, and toolkit.
- `app/globals.css`: responsive visual system and reduced-motion styles.
- `app/layout.js`: local font, metadata, and analytics.
- `app/opengraph-image.jsx`, `app/icon.svg`, `app/robots.js`, `app/sitemap.js`: sharing and discovery.
- `public/music/v4.mp3`: Sri’s original music, played only on request.
- `app/lib/fieldnotes.mjs`: published article manifest; see `docs/FIELDNOTES-PUBLISHING.md`.
- `docs/REQUEST-QUEUE.md`: cumulative requests, verified checkpoints and remaining craft work.
- `docs/research/`: local source inventories and review records; not served as application assets.

Paths beginning with `app/` or `public/` above are relative to the application directory.

## Content rules

Use plain language and verify claims. Employment, education, hobbies, and aspirations were confirmed directly by Sri on September 14, 2026. Project summaries are grounded in public repository descriptions and READMEs. A repository’s README establishes what the project describes, not independent proof of usage, results, or individual contribution. Do not add numerical outcomes, unverified current roles, or claim forks as original work.

New content about Offseason must come from Sri or public sources. Private company repositories are not source material for this site.

## Performance and accessibility

The reading route renders all text independently of WebGL. Three.js is dynamically imported by the environment shell; Rapier loads on studio entry for the book, mug, and cushion. The animation driver requests up to 30 frames per second; camera, control, and active physics updates can request additional frames. Scene animation pauses while a reading sheet is open or the document is hidden. A paused scene renders on demand. Device pixel ratio is capped at 1.5. Scenes use local procedural geometry and generated textures, with no external model or HDR download. Graphics failure switches to a still environment with a retry and keeps reading content available.

Reduced-motion preferences and Save-Data disable animation by default. Visitors can pause animation or turn off the 3D world in View & sound. Normal links and buttons provide access to the content, the reading route supports native page scrolling, and Sri’s original music plays on request. Environmental audio can start after a browser-permitted gesture; remembered sound and level preferences are respected.

## Deployment

The existing app is configured for Vercel with root directory `sri_portfolio/sri_portfolio`. Build with `npm run build`. Reading and the world need no secrets. The optional private contact/discovery inbox uses server-only Vercel Blob credentials and an HMAC rate-limit secret; email remains the fallback. The public domain remains `www.sriujjwalreddy.com`; a DNS change is unnecessary for the redesign itself.

See `docs/DEPLOYMENT.md` for the release workflow and `docs/REQUEST-QUEUE.md` for completed checks and the ongoing art backlog. The current publication format preview is explicitly not a published blog post.

`check` validates the Next.js TypeScript configuration and generated types; the interface is JavaScript and is verified through builds and browser checks. Tests cover ball collisions, shuttle flight, Rapier prop collisions, shared planet terrain, camera ground clearance, WebGL support detection, and lake containment. Viewport checks do not establish old-M1 hardware performance.
