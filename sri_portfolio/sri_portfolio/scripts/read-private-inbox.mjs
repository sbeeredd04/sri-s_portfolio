import { list, get } from "@vercel/blob";
// Owner-only CLI. Credentials stay in ignored .env.local; no public read endpoint.
const kind = process.argv[2] || "discoveries";
if (!["messages", "discoveries"].includes(kind))
  throw new Error("Use messages or discoveries.");
if (!process.env.BLOB_READ_WRITE_TOKEN)
  throw new Error("Load the portfolio project’s development env first.");
const limit = 100;
let cursor;
const records = [];
do {
  const page = await list({
    prefix: `${kind}/`,
    cursor,
    limit,
    abortSignal: AbortSignal.timeout(10000),
  });
  for (const blob of page.blobs) {
    const result = await get(blob.url, {
      access: "private",
      abortSignal: AbortSignal.timeout(10000),
    });
    if (result?.statusCode === 200)
      records.push(await new Response(result.stream).json());
  }
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor && records.length < 500);
records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
process.stdout.write(
  JSON.stringify({ kind, records, partial: Boolean(cursor) }, null, 2) + "\n",
);
