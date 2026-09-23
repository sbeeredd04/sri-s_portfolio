import { WORLD_RADIUS } from "./world-layout.mjs";

export const SKY_RADIUS = 32;

// Responsive overview framing can place the eye farther away on a narrow
// phone. Allow a little room beyond that view while keeping the whole planet
// and its tallest landmarks inside the far plane, even with a biome target.
export function cameraLimits(overviewDistance) {
  const maxDistance = Math.max(WORLD_RADIUS * 5, overviewDistance * 1.5);
  return {
    maxDistance,
    far: Math.max(1200, maxDistance + WORLD_RADIUS * 3),
  };
}
