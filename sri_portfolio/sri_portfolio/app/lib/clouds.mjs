import { WORLD_RADIUS } from "./world-layout.mjs";

// Metres in the same world frame as terrain/camera. A detached cloud deck,
// not paint on the ocean. The base clears the city, stage canopy and establishing cameras.
export const cloudLayer = {
  base: WORLD_RADIUS + 64,
  top: WORLD_RADIUS + 104,
  noiseSize: 64,
};
// Grazing rays may add samples within a tier-specific ceiling.
export const cloudSteps = { low: 10, medium: 16, high: 22 };
export const cloudStepLimits = { low: 14, medium: 20, high: 22 };

// Matches the analytic clipping in the cloud shader; no steps are spent in
// the empty space between the viewer and the deck or behind the planet.
export function cloudRaySegment(origin, direction) {
  const sphere = (radius) => {
    const b = origin.reduce((sum, v, i) => sum + v * direction[i], 0);
    const d =
      b * b - origin.reduce((sum, v) => sum + v * v, 0) + radius * radius;
    return d < 0 ? null : [-b - Math.sqrt(d), -b + Math.sqrt(d)];
  };
  const outer = sphere(cloudLayer.top),
    inner = sphere(cloudLayer.base),
    ground = sphere(WORLD_RADIUS);
  if (!outer || outer[1] <= 0) return null;
  let start = Math.max(0, outer[0]),
    end = outer[1];
  if (inner) {
    if (inner[0] > start) end = Math.min(end, inner[0]);
    else if (inner[1] > start) start = inner[1];
  }
  if (ground && ground[0] > 0) end = Math.min(end, ground[0]);
  return end > start ? [start, end] : null;
}
