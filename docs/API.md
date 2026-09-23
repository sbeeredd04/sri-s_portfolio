# API surface

The world, projects and Fieldnotes are authored at build time. There is no public inbox-read API and no browser API key. Previous chat, embeddings, Pinecone, Gemini and EmailJS integrations belong to the retired site.

- `GET /api/contact`: returns `{ available: boolean }` from server-side configuration, with `no-store`. It does not disclose credential values or prove storage writes succeed.
- `POST /api/contact`: accepts a name (80 characters), email (254) and message (3,000), plus a honeypot field. Requires a matching Origin and limits the JSON request to 16 KB. Saves a private Blob record, never emails automatically. Status 201 means stored; 400/403/413 reject invalid requests, 429 rate limits, and 503 exposes an email fallback while retaining the visitor's draft.
- `POST /api/discoveries`: accepts only known discovery IDs in a 500-byte JSON body and a matching Origin. Local discovery progress works independently; configured shared records contain a discovery ID and timestamp, not a visitor profile.

The private inbox requires `BLOB_READ_WRITE_TOKEN` and `INBOX_RATE_SECRET` as server-only environment variables. Atomic private marker files limit messages to one per five-minute address bucket and discoveries to one per ID per 30-second bucket. Raw addresses are not stored; marker paths contain a keyed, truncated HMAC. Markers/records are not automatically pruned: review storage usage and retention as traffic grows.

Sri can review records in the Vercel Blob dashboard or use `scripts/read-private-inbox.mjs messages` / `discoveries` with the configured private token loaded locally. The CLI outputs personal contact details: keep its output private. There is no CMS or automatic LinkedIn publishing. See `FIELDNOTES-PUBLISHING.md` for article authoring.
