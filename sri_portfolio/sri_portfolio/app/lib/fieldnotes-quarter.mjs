// The garden around the Fieldnotes studio, in the future biome's frame
// (the bridge arrives from -z, the sea lies beyond +z). A newsstand is the
// showcase, one rack per shelf; string lights run round the loop; paper
// planes circle overhead; hedges, trees and a lookout frame the lawn.
import {
  fieldnotesLookoutZ,
  fieldnotesRoute as route,
} from "./fieldnotes-layout.mjs";

// The kiosk stands east of the entry walk, its counter facing the walker.
export const newsstand = {
  x: 2.55,
  z: -7.3,
  yaw: -Math.PI / 2,
  size: [2.8, 1.7],
  height: 2.5,
};

// Lanterns hang in shallow arcs between posts set just outside the loop.
const POST_OFFSET = 1.35;
export function lanternPosts() {
  const x0 = route.west - POST_OFFSET,
    x1 = route.east + POST_OFFSET,
    z0 = route.south - POST_OFFSET,
    z1 = route.north + POST_OFFSET;
  return [
    [x0, z0],
    [(x0 + x1) / 2 - 2.2, z0],
    [x1, z0],
    [x1, (z0 + z1) / 2],
    [x1, z1],
    [(x0 + x1) / 2 - 1.8, z1],
    [x0, z1],
    [x0, (z0 + z1) / 2],
  ];
}
export const LANTERN_HEIGHT = 3.1;
export function lanterns(perSpan = 9, sag = 0.45) {
  const posts = lanternPosts(),
    bulbs = [];
  posts.forEach((a, i) => {
    const b = posts[(i + 1) % posts.length];
    for (let k = 1; k < perSpan; k++) {
      const t = k / perSpan;
      bulbs.push({
        x: a[0] + (b[0] - a[0]) * t,
        y: LANTERN_HEIGHT - 0.12 - Math.sin(t * Math.PI) * sag,
        z: a[1] + (b[1] - a[1]) * t,
        warm: (i * perSpan + k) % 3,
      });
    }
  });
  return bulbs;
}

// Hedges ring the garden, open to the bridge and to the lookout.
export const HEDGE_RADIUS = 13.5;
export function hedges() {
  const pieces = [];
  const count = 40;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = Math.sin(a) * HEDGE_RADIUS,
      z = Math.cos(a) * HEDGE_RADIUS;
    if (Math.abs(x) < 2.6) continue;
    pieces.push({ x, z, yaw: a + Math.PI / 2, length: 2.05 });
  }
  return pieces;
}

export const trees = [
  [-9.5, -6.5, 1.1],
  [9.2, -5.4, 1.0],
  [-10.4, 3.2, 1.2],
  [10.6, 4.4, 1.05],
  [-7.8, 10.2, 0.95],
  [7.4, 10.8, 1.1],
].map(([x, z, s], i) => ({ x, z, s, turn: i * 1.9 }));

// A lookout at the sea edge: a stone wall and a bench facing the water.
export const lookout = {
  x: 0,
  z: fieldnotesLookoutZ,
  width: 6,
  bench: fieldnotesLookoutZ - 0.9,
};

// Paper planes on slow, tilted orbits above the garden.
export const planeBudget = { low: 6, medium: 12, high: 20 };
export function paperPlanes(tier = "medium") {
  const count = planeBudget[tier] ?? planeBudget.medium;
  return Array.from({ length: count }, (_, i) => ({
    radius: 4.5 + ((i * 0.618) % 1) * 7.5,
    height: 4.2 + ((i * 0.382) % 1) * 4.5,
    speed: (0.16 + ((i * 0.27) % 1) * 0.14) * (i % 4 === 0 ? -1 : 1),
    phase: i * 2.399,
    bob: 0.25 + (i % 3) * 0.12,
    cx: ((i % 5) - 2) * 0.8,
    cz: 0.6 + ((i % 3) - 1) * 1.1,
  }));
}
// Position and heading of a plane at time t; heading follows the orbit.
export function planePose(p, t) {
  const a = p.phase + t * p.speed;
  const x = p.cx + Math.cos(a) * p.radius,
    z = p.cz + Math.sin(a) * p.radius;
  const y = p.height + Math.sin(t * 0.9 + p.phase) * p.bob;
  const dir = Math.sign(p.speed) || 1;
  // Planes are modelled nose along +z, so yaw is atan2 of the velocity.
  return {
    x,
    y,
    z,
    yaw: Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir),
    bank: 0.35 * dir,
  };
}

export const quarterViews = [
  {
    id: "newsstand",
    label: "The newsstand",
    position: [-1.4, 1.75, -9.4],
    target: [newsstand.x, 1.45, newsstand.z],
    portrait: {
      position: [-1.1, 1.9, -10.6],
      target: [newsstand.x, 1.45, newsstand.z],
      fov: 70,
    },
    content: "writing",
    prompt: "Fresh off the press",
    hint: "One rack per shelf: things I make, details I notice, and life away from the desk.",
  },
  {
    id: "lookout",
    label: "The lookout",
    // Three-quarters from behind the bench, looking down over the wall so
    // the bench, wall and shore sit in frame with the water beyond.
    position: [4.6, 2.5, lookout.bench - 3.6],
    target: [-0.8, 0.7, lookout.z + 7],
    portrait: {
      position: [2.2, 3.2, lookout.bench - 4.8],
      target: [-0.2, 0.4, lookout.z + 6],
      fov: 70,
    },
    content: "writing",
    prompt: "Somewhere to think it through",
    hint: "A bench, a wall and the water. Most notes start somewhere like this.",
  },
];
