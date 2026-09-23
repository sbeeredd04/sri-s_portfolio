import {
  blocksValleyPlanting,
  distanceToOverlook,
  inGraniteFootprint,
  inViewpoint,
  overlookSegments,
  renderedTrail,
  trailCenter,
} from "./valley-layout.mjs";

export { overlookSegments, renderedTrail, trailCenter };

export const trailStops = [
  { label: "At the trailhead", point: [trailCenter(9), 9], look: [0, 0] },
  {
    label: "A frame of the valley",
    point: [trailCenter(6), 6],
    look: [-12, -14],
  },
  { label: "Beside the lake", point: [trailCenter(3), 3], look: [-8, -3] },
  {
    label: "Between water and granite",
    point: [trailCenter(-1), -1],
    look: [-14, -14],
  },
  { label: "Under the trees", point: [trailCenter(-5), -5], look: [5, -16] },
];

// Clear the entire crown and a camera shoulder, not just the trunk.
export const trailTrees = Array.from({ length: 42 }, (_, i) => {
  const angle = i * 2.39996,
    radius = 12 + (i % 10) * 0.8;
  let x = Math.sin(angle) * radius,
    z = Math.cos(angle) * radius - 5;
  if (z > 1 && x > -12 && x < 12) z = -z - 10;
  if (x < -3 && x > -15 && z > -12 && z < 5) x = -15.5;
  return { x, z, s: 0.95 + (i % 7) * 0.12 };
}).filter(
  (tree) =>
    !inGraniteFootprint(tree.x, tree.z, 1) &&
    !blocksValleyPlanting(tree.x, tree.z, 1) &&
    !inViewpoint(tree.x, tree.z, 2.3 * tree.s) &&
    Math.abs(tree.x - trailCenter(tree.z)) > 2.3 * tree.s + 1.6 &&
    distanceToOverlook(tree.x, tree.z) > 2.3 * tree.s + 1.6,
);
