# Deployment

The existing Vercel project `sri-portfolio` in `sbeeredd04s-projects` uses repository root directory `sri_portfolio/sri_portfolio`. The production domain is `https://www.sriujjwalreddy.com`; no DNS change is needed. Root npm scripts forward to the application directory.

1. Install with `npm ci` in the application directory. Run `npm run check`, `npm test`, and `npm run build`.
2. Inspect the real website at desktop and phone widths, including the world, Work, résumé, Fieldnotes, `/story`, keyboard navigation and modal exit.
3. Push a reviewed branch to create a Vercel Git preview. Verify the successful deployment and routes before pushing the reviewed commit to `main`, which triggers production.
4. Verify the production deployment is Ready and check the public custom domain, `/rooms/writing`, `/fieldnotes/preview`, `/story`, `/resume`, metadata and a genuine unknown-route 404.

The repository-local ignored `.vercel/cli` session belongs to the portfolio owner. When CLI inspection is needed from the application directory, use `vercel ... --global-config .vercel/cli --scope sbeeredd04s-projects`. The default machine session can belong to a different workspace. Never commit `.vercel`, `.env*`, tokens or private inbox exports. Avoid a manual deploy from the nested application directory that would apply the project root directory twice; Git deployment uses the configured root correctly.

The world and reading content require no secrets. Optional contact/discovery storage requires server-only `BLOB_READ_WRITE_TOKEN` and `INBOX_RATE_SECRET` in the deployment environment. `GET /api/contact` is a read-only readiness check; no test contact messages need to be sent during a normal release. Vercel analytics and speed insights are optional observational integrations.

Unknown routes return a real 404. `/fieldnotes` redirects to the notebook gallery at `/rooms/writing`; draft/unknown article slugs return 404. The format preview is noindex and excluded from the sitemap. `/resume` is a printable current overview; the old PDF is labeled separately.

Local production can be inspected with `npm run build` then `npm start -- --port 3110`. Viewport checks do not establish physical-phone or older-M1 performance. Unfinished art work stays listed in `REQUEST-QUEUE.md`; publication does not close that backlog.
