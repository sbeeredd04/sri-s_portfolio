import {
  fieldnotesPaths,
  fieldnotesTerraces,
  fieldnotesBeds,
} from "./fieldnotes-layout.mjs";
import { fieldnotesPavingContours } from "./fieldnotes-surface.mjs";
import {
  newsstand,
  lookout,
  lanternPosts,
  trees,
} from "./fieldnotes-quarter.mjs";
// Planted drifts frame the loop and the lookout approach; the central lawn
// remains open. Sizes are ellipse radii, in the same metres as the paths.
export const meadowDrifts = [
  [-8.8, -0.4, 1.35, 4.5, -0.12],
  [7.8, 0.6, 1.3, 4.1, 0.12],
  [-4.6, 8.8, 3, 1.25, -0.35],
  [4.3, 9.5, 2.3, 1.6, 0.3],
  [-4.9, 13.5, 1.8, 2.3, -0.4],
  [4.9, 14.1, 1.8, 2, 0.4],
  [-0.8, 0.6, 1.05, 1.1, 0.1],
  [1.9, -0.05, 0.75, 0.65, 0.2],
  [-7.8, -8.8, 2, 1.1, -0.3],
  [6.7, -8.3, 1.9, 1.3, 0.3],
];
// Includes blade width, root offsets, natural lean and maximum shared wind.
// Must be revised if the future grass profile or blade bending changes.
export const meadowSweep = 0.52;
const contours = fieldnotesPavingContours();
const posts = lanternPosts();
function inside(x, z, poly) {
  let yes = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i],
      b = poly[j];
    if (
      a[1] > z !== b[1] > z &&
      x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
export function meadowPavingClearance(x, z) {
  if (inside(x, z, contours.outer) && !inside(x, z, contours.hole)) return 0;
  let nearest = Infinity;
  for (const poly of [contours.outer, contours.hole])
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)),
      );
      nearest = Math.min(
        nearest,
        Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz),
      );
    }
  return nearest;
}
export const meadowExclusions = [
  ...fieldnotesTerraces.map((p) => [p.x, p.z, p.width / 2, p.depth / 2]),
  ...fieldnotesBeds.map((p) => [p.x, p.z, p.w / 2 + 0.08, p.d / 2 + 0.08]),
  [
    newsstand.x,
    newsstand.z,
    newsstand.size[1] / 2 + 0.1,
    newsstand.size[0] / 2 + 0.1,
  ],
  [lookout.x, lookout.z, 3.1, 0.275],
  [lookout.x, lookout.bench, 1.15, 0.5],
];
export function meadowPathClearance(x, z) {
  return Math.min(
    ...fieldnotesPaths.map(([a, b, w]) => {
      const dx = b[0] - a[0],
        dz = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(
            1,
            ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz),
          ),
        );
      return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t) - w / 2;
    }),
  );
}
export function meadowIsClear(x, z) {
  if (
    meadowPathClearance(x, z) < meadowSweep ||
    meadowPavingClearance(x, z) < meadowSweep
  )
    return false;
  if (
    meadowExclusions.some(
      ([cx, cz, hx, hz]) =>
        Math.abs(x - cx) < hx + meadowSweep &&
        Math.abs(z - cz) < hz + meadowSweep,
    )
  )
    return false;
  if (posts.some(([cx, cz]) => Math.hypot(x - cx, z - cz) < meadowSweep + 0.12))
    return false;
  if (trees.some((t) => Math.hypot(x - t.x, z - t.z) < meadowSweep + 0.25))
    return false;
  return true;
}
export function coastalMeadowSeeds(count, extent) {
  const seeds = new Float32Array(count * 4);
  let state = 71419;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const weights = meadowDrifts.map((d) => d[2] * d[3]);
  const total = weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < count; i++) {
    let accepted = false;
    for (let attempt = 0; attempt < 200 && !accepted; attempt++) {
      let choice = random() * total,
        index = 0;
      while (index < weights.length - 1 && choice > weights[index])
        choice -= weights[index++];
      const [cx, cz, rx, rz, turn] = meadowDrifts[index],
        theta = random() * Math.PI * 2;
      // Dense interiors and feathered margins avoid hard-edged ellipse stamps.
      const r = Math.sqrt(random()) * (0.88 + 0.12 * random()),
        u = Math.cos(theta) * rx * r,
        v = Math.sin(theta) * rz * r;
      const x = cx + u * Math.cos(turn) - v * Math.sin(turn),
        z = cz + u * Math.sin(turn) + v * Math.cos(turn);
      if (
        Math.abs(x) > extent - meadowSweep ||
        Math.abs(z) > extent - meadowSweep ||
        !meadowIsClear(x, z)
      )
        continue;
      seeds.set([x / extent, z / extent, random(), random()], i * 4);
      accepted = true;
    }
    if (!accepted)
      throw new Error("Coastal meadow cannot satisfy its clearance envelope");
  }
  return seeds;
}
