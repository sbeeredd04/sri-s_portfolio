// People on the trail: hikers walking stretches of the winding path and a
// few campers round the fire, in the trail biome's frame.
import { campsite, renderedTrail, trailCenter } from "./valley-layout.mjs";

export const trailLifeBudget = { low: 4, medium: 7, high: 11 };

// A stretch of trail as a polyline, sampled every metre.
function stretch(z0, z1, offset) {
  const points = [];
  const step = z1 > z0 ? 1 : -1;
  for (let z = z0; step > 0 ? z <= z1 : z >= z1; z += step)
    points.push([trailCenter(z) + offset, z]);
  let length = 0;
  for (let i = 1; i < points.length; i++)
    length += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  return { path: points, length };
}

export const campFire = { x: campsite.x, z: campsite.z };
export const campTent = { x: campsite.x + 1.9, z: campsite.z - 1.2, yaw: -0.5 };
export function campers() {
  return [0.3, 3.7, 4.75].map((a) => ({
    x: campFire.x + Math.cos(a) * 1.55,
    z: campFire.z + Math.sin(a) * 1.55,
    yaw: Math.atan2(-Math.cos(a), -Math.sin(a)),
  }));
}

export function trailLife(tier = "medium") {
  const count = trailLifeBudget[tier] ?? trailLifeBudget.medium;
  const start = renderedTrail.start - 1,
    end = renderedTrail.end + 1;
  const span = start - end;
  const hikers = Array.from({ length: count - 3 }, (_, i) => {
    const from = start - ((i * 0.37) % 1) * (span - 10);
    const { path, length } = stretch(
      Math.round(from),
      Math.round(from - 10),
      i % 2 ? 0.22 : -0.22,
    );
    return { path, length, speed: 0.95 + (i % 3) * 0.1 };
  });
  return [...campers(), ...hikers];
}
