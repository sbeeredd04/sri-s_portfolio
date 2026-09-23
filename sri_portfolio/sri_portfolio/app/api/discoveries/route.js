import { savePrivate } from "../../lib/private-inbox.mjs";
import { sameOrigin, discoveryIds } from "../../lib/contact-validation.mjs";
import { boundedJson } from "../../lib/bounded-json.mjs";
export const runtime = "nodejs";
export async function POST(request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const body = await boundedJson(request, 500);
  if (body.status !== 200) return new Response(null, { status: body.status });
  const data = body.data;
  if (!discoveryIds.includes(data?.id))
    return new Response(null, { status: 400 });
  const result = await savePrivate(
    "discoveries",
    { discovery: data.id },
    request,
  );
  return Response.json(
    { recorded: result.status === 201 },
    { status: result.status },
  );
}
