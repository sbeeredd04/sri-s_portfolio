# Working on this site

Run `npm install --prefix sri_portfolio/sri_portfolio`, then use `npm run dev` from the repository root. The existing hosting project expects the nested application directory.

Keep content in `app/json/personal.js` and shared app content in `app/components/personal/AppContent.jsx`. The immersive interface and reading view must show the same information. Do not restore duplicate copies of biography or project text.

Keep scene loading separate from the interface. Use local procedural models where practical, share geometry, avoid heavy HDRs, and pause animation while the page is hidden or an information window is open. All destinations must remain accessible with normal buttons and in the reading view.

Run the production build, physics tests, and relevant browser checks before considering a change ready. `tsc --noEmit` currently checks Next.js generated types; most product source is JavaScript, so it is not a substitute for runtime tests.

Preserve source provenance and distinguish confirmed personal facts, public project descriptions, and unverified outcomes. No invented metrics or claims that a personal experiment is a validated production system.
