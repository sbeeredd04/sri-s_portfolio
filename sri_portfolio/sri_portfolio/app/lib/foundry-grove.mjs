// Trees framing the Foundry: an open band between the workshop core and the
// plateau edge, kept clear of every walk, the campus ring and its approach.
import { regions, worldPoint } from "./world-layout.mjs";
import { makeWalkNetwork, nearestWalk } from "./walk-network.mjs";
import { campusCenter, campusRadii } from "./campus-layout.mjs";
import { inTechFootprint } from "./tech-plan.mjs";

export const GROVE_WALK_CLEARANCE = 3;
const CORE = { x: 0, z: 1, radius: 17 };

let cached;
export function foundryGroveTrees() {
  if (cached) return cached;
  const region = regions.find((r) => r.id === "projects");
  const [cx, cz] = region.landCenter;
  const network = makeWalkNetwork();
  const trees = [];
  for (let i = 0; i < 90 && trees.length < 34; i++) {
    const angle = i * 2.39996,
      radius = 19 + ((i * 0.618034) % 1) * (region.inner - 23);
    const x = cx + Math.cos(angle) * radius,
      z = cz + Math.sin(angle) * radius;
    if (Math.hypot(x - CORE.x, z - CORE.z) < CORE.radius) continue;
    if (
      Math.hypot(x - campusCenter.x, z - campusCenter.z) <
      campusRadii.eaveOuter + 3
    )
      continue;
    if (inTechFootprint(x, z)) continue;
    const walk = nearestWalk(worldPoint("projects", [x, 0, z]), network);
    if (
      walk &&
      Math.sqrt(walk.distance) < GROVE_WALK_CLEARANCE + walk.segment.half
    )
      continue;
    trees.push({ x, z, s: 0.9 + (i % 5) * 0.12, turn: i * 2.1 });
  }
  cached = trees;
  return trees;
}
