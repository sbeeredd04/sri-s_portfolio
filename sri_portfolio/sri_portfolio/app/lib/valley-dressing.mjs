// Ground dressing for the valley: scanned CC0 boulders, shrubs, saplings,
// stumps and stones. Deterministic so tests can prove every piece stays off
// the trail, the water, the granite and the framed viewpoints.
import {
  blocksValleyPlanting,
  distanceToOverlook,
  inViewpoint,
  lake,
  trailCenter,
  wallFrame,
  wallOutward,
} from "./valley-layout.mjs";
import { regions } from "./world-layout.mjs";

// Clear distance from the trail centreline for anything a walker could trip
// on; low stones may sit closer, like a real path edge.
export const TRAIL_CLEAR = { tall: 2.1, low: 1.3 };

// Footprint radius per asset at scale 1 (CATALOG bounds / 2).
export const dressingRadius = {
  "boulder-granite": 1.26,
  "boulder-lichen": 0.92,
  "shrub-sapling": 0.82,
  "sapling-pine": 0.39,
  "tree-stump": 0.8,
  "rock-small": 0.16,
  "stones-pebbles": 0.07,
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const trail = regions.find((r) => r.id === "trail");
const [cx, cz] = trail.landCenter;

function clear(x, z, radius, low) {
  if (Math.hypot(x - cx, z - cz) > trail.inner - 2 - radius) return false;
  if (blocksValleyPlanting(x, z, radius + 0.15)) return false;
  if (
    Math.abs(x - trailCenter(z)) <
    (low ? TRAIL_CLEAR.low : TRAIL_CLEAR.tall) + radius
  )
    return false;
  if (distanceToOverlook(x, z) < 1.4 + radius) return false;
  if (!low && inViewpoint(x, z, radius)) return false;
  return true;
}

function scatter(kind, count, seed, { low = false, scale, near }) {
  const random = rng(seed),
    out = [];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const [ax, az, spread] = near(random);
    const a = random() * Math.PI * 2,
      r = Math.sqrt(random()) * spread;
    const x = ax + Math.cos(a) * r,
      z = az + Math.sin(a) * r;
    const s = scale[0] + random() * (scale[1] - scale[0]);
    const radius = dressingRadius[kind] * s;
    if (!clear(x, z, radius, low)) continue;
    if (
      out.some((o) => Math.hypot(o.x - x, o.z - z) < (o.radius + radius) * 1.1)
    )
      continue;
    out.push({ x, z, s, radius, turn: random() * Math.PI * 2 });
  }
  return out;
}

// Anywhere on the valley floor.
const meadow = (random) => [
  cx + (random() - 0.5) * 36,
  cz + (random() - 0.5) * 36,
  1,
];
// A band along either side of the trail.
const trailSide = (reach) => (random) => {
  const z = 11 - random() * 29;
  const side = random() < 0.5 ? -1 : 1;
  return [trailCenter(z) + side * (2.4 + random() * reach), z, 0.6];
};
// The lake's shore ring.
const shore = (random) => {
  const a = random() * Math.PI * 2,
    r = lake.radius + 0.35 + random() * 0.5;
  return [lake.x + Math.cos(a) * r, lake.z + Math.sin(a) * r, 0.2];
};
// Rockfall at the foot of the wall.
const wallToe = (random) => {
  const p = wallFrame(0.1 + random() * 0.8, 0.04),
    n = wallOutward(),
    out = 1.8 + random() * 2.4;
  return [p.x + n.x * out, p.z + n.z * out, 0.8];
};

let cached;
export function valleyDressing() {
  if (cached) return cached;
  cached = {
    "boulder-granite": [
      ...scatter("boulder-granite", 5, 11, {
        scale: [0.55, 0.95],
        near: wallToe,
      }),
      ...scatter("boulder-granite", 4, 12, {
        scale: [0.45, 0.8],
        near: trailSide(3),
      }),
    ],
    "boulder-lichen": scatter("boulder-lichen", 8, 13, {
      scale: [0.4, 0.85],
      near: (r) => (r() < 0.5 ? trailSide(4)(r) : meadow(r)),
    }),
    "shrub-sapling": scatter("shrub-sapling", 16, 14, {
      scale: [0.6, 1.05],
      near: meadow,
    }),
    "sapling-pine": scatter("sapling-pine", 12, 15, {
      scale: [0.8, 1.4],
      near: meadow,
    }),
    "tree-stump": scatter("tree-stump", 3, 16, {
      scale: [0.45, 0.6],
      near: meadow,
    }),
    "rock-small": scatter("rock-small", 36, 17, {
      low: true,
      scale: [1.4, 3],
      near: (r) => (r() < 0.7 ? trailSide(1.2)(r) : shore(r)),
    }),
    "stones-pebbles": scatter("stones-pebbles", 40, 18, {
      low: true,
      scale: [2, 4.5],
      near: shore,
    }),
  };
  return cached;
}
