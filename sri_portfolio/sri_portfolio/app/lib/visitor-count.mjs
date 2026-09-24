// A visitor counter on the existing private Blob store. Each visitor counts
// once a day: a create-if-absent marker keyed by a keyed hash of the address
// (never the raw address), then an optimistic ifMatch increment of a single
// counter blob, retried on conflict. Without storage it reports null.
import { createHmac } from "node:crypto";
import { BlobPreconditionFailedError, get, put } from "@vercel/blob";

const COUNTER = "counters/visitors.json";
const RETRIES = 4;

// Only production counts, so local runs and previews never inflate it.
export const countingAvailable = () =>
  process.env.VERCEL_ENV === "production" &&
  Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.INBOX_RATE_SECRET);

export function parseCount(text) {
  try {
    const value = JSON.parse(text)?.count;
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}

async function readCounter(signal) {
  const result = await get(COUNTER, {
    access: "private",
    useCache: false,
    abortSignal: signal,
  });
  if (!result || result.statusCode !== 200) return { count: 0, etag: null };
  const text = await new Response(result.stream).text();
  return { count: parseCount(text), etag: result.blob.etag };
}

export async function visitorCount() {
  if (!countingAvailable()) return null;
  try {
    return (await readCounter(AbortSignal.timeout(4000))).count;
  } catch {
    return null;
  }
}

function markerPath(request, now) {
  const address =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const day = now.toISOString().slice(0, 10);
  const fingerprint = createHmac("sha256", process.env.INBOX_RATE_SECRET)
    .update(`${day}:${address}`)
    .digest("hex")
    .slice(0, 24);
  return `visits/${day}/${fingerprint}.json`;
}

// Returns { count, counted } or null when counting is unavailable.
export async function countVisit(request) {
  if (!countingAvailable()) return null;
  const signal = AbortSignal.timeout(8000);
  try {
    await put(markerPath(request, new Date()), "{}", {
      access: "private",
      abortSignal: signal,
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
  } catch (error) {
    // Already counted today: report the total without incrementing.
    if (error?.message?.includes("already exists"))
      return { count: (await readCounter(signal)).count, counted: false };
    return null;
  }
  for (let attempt = 0; attempt < RETRIES; attempt++) {
    const { count, etag } = await readCounter(signal);
    try {
      await put(COUNTER, JSON.stringify({ count: count + 1 }), {
        access: "private",
        abortSignal: signal,
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        ...(etag ? { ifMatch: etag } : {}),
      });
      return { count: count + 1, counted: true };
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError)) return null;
    }
  }
  return null;
}
