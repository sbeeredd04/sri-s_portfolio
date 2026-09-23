import { put } from "@vercel/blob";
import { createHmac, randomUUID } from "node:crypto";
export const inboxAvailable = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.INBOX_RATE_SECRET);
// No browser uploads or public read route. Sri reviews these files in Vercel Storage.
export async function savePrivate(kind, payload, request) {
  if (!inboxAvailable())
    return {
      status: 503,
      error: "The inbox is resting. Your draft is safe; use email below.",
    };
  const now = new Date();
  const abortSignal = AbortSignal.timeout(10000);
  const address = request.headers.get("x-forwarded-for") || "local";
  const fingerprint = createHmac("sha256", process.env.INBOX_RATE_SECRET)
    .update(address)
    .digest("hex")
    .slice(0, 24);
  const bucket = Math.floor(
    now.getTime() / (kind === "messages" ? 300000 : 30000),
  );
  // Atomic create-if-absent works across serverless instances. Raw addresses are never stored.
  try {
    await put(
      `limits/${now.toISOString().slice(0, 10)}/${kind}/${fingerprint}-${kind === "discoveries" ? payload.discovery + "-" : ""}${bucket}.json`,
      "{}",
      {
        access: "private",
        abortSignal,
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/json",
      },
    );
  } catch (error) {
    if (error?.message?.includes("This blob already exists"))
      return {
        status: 429,
        error:
          "A moment between messages, please. Try again in five minutes or use email.",
      };
    return {
      status: 503,
      error: "The inbox is resting. Your draft is safe; use email below.",
    };
  }
  try {
    const id = randomUUID();
    await put(
      `${kind}/${now.toISOString().slice(0, 10)}/${id}.json`,
      JSON.stringify({ id, createdAt: now.toISOString(), ...payload }),
      {
        access: "private",
        abortSignal,
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/json",
      },
    );
    return { status: 201, id };
  } catch {
    return {
      status: 503,
      error: "That didn’t reach my inbox. Keep your draft and try email below.",
    };
  }
}
