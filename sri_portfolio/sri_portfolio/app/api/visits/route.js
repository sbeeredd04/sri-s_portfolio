import { sameOrigin } from "../../lib/contact-validation.mjs";
import { countVisit, visitorCount } from "../../lib/visitor-count.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The total, cached briefly at the edge. null means counting is resting.
export async function GET() {
  const count = await visitorCount();
  return Response.json(
    { count },
    {
      headers: {
        "Cache-Control":
          count === null
            ? "no-store"
            : "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}

// One count per visitor per day; the page only posts once a day as well.
export async function POST(request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  const result = await countVisit(request);
  // Resting is not an error for the page: it just shows no number.
  if (!result)
    return Response.json(
      { count: null },
      { headers: { "Cache-Control": "no-store" } },
    );
  return Response.json(result, { headers: { "Cache-Control": "no-store" } });
}
