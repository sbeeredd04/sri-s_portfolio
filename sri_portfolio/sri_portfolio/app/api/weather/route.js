import {
  fallbackWeather,
  parseOpenMeteo,
  weatherUrl,
} from "../../lib/weather.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIVE_SECONDS = 600;

// Keyless Open-Meteo, cached 10 minutes upstream and at the edge. Any failure
// answers 200 with the labelled fallback so the sky never waits on it.
export async function GET() {
  try {
    const response = await fetch(weatherUrl(), {
      next: { revalidate: LIVE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
    const text = await response.text();
    if (text.length > 20000) throw new Error("Open-Meteo reply too large");
    const state = parseOpenMeteo(JSON.parse(text));
    return Response.json(state, {
      headers: {
        "Cache-Control":
          state.source === "live"
            ? `public, s-maxage=${LIVE_SECONDS}, stale-while-revalidate=300`
            : "no-store",
      },
    });
  } catch {
    return Response.json(fallbackWeather, {
      headers: { "Cache-Control": "no-store" },
    });
  }
}
