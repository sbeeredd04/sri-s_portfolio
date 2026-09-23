import { inboxAvailable, savePrivate } from "../../lib/private-inbox.mjs";
import { sameOrigin, validateMessage } from "../../lib/contact-validation.mjs";
import { boundedJson } from "../../lib/bounded-json.mjs";
export const runtime = "nodejs";
export function GET() {
  return Response.json(
    { available: inboxAvailable() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "Please send this from the website." },
      { status: 403 },
    );
  const body = await boundedJson(request, 16000);
  if (body.status !== 200)
    return Response.json(
      {
        error: "Please check your message and keep it under 3,000 characters.",
      },
      { status: body.status },
    );
  const payload = validateMessage(body.data);
  if (!payload)
    return Response.json(
      { error: "Please check your name, email and message." },
      { status: 400 },
    );
  const result = await savePrivate("messages", payload, request);
  return Response.json(result, {
    status: result.status,
    headers: { "Cache-Control": "no-store" },
  });
}
