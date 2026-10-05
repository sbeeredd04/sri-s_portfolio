import { placeStops } from "./place-stops.mjs";

export const PHONE_LAYOUT_QUERY =
  "(max-width: 700px), (max-height: 500px) and (max-width: 1000px)";

// Phones use the authored camera views; first-person controls stay on desktop.
// Keep the cinematic `walk` view: it follows a resident and requires no steering.
export function navigationStop(biome, stop, phone) {
  if (!phone || !(stop.startsWith("roam") || stop.startsWith("street:")))
    return stop;
  const origin = stop.startsWith("roam:") ? stop.slice(5) : null;
  return placeStops[biome]?.some((view) => view.id === origin)
    ? origin
    : "arrival";
}
