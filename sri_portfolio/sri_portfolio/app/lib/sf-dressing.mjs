// Street life for the city: sidewalk trees, lamps and hydrants along the
// grid, trees in the parks and a pine forest on the bridge headland. All
// deterministic and budgeted per tier; tests hold every piece off roadways,
// doorsteps and lots.
import {
  STREET,
  grids,
  gridFrame,
  marketSide,
  parks,
  sfLots,
  coastDistance,
  avenueDistance,
} from "./sf-plan.mjs";
import { streetAt } from "./sf-streets.mjs";
import { sfSlope } from "./sf-terrain.mjs";

export const dressingBudget = {
  low: { trees: 40, lamps: 18, hydrants: 0, parkTrees: 14, forest: 24 },
  medium: { trees: 70, lamps: 32, hydrants: 12, parkTrees: 24, forest: 32 },
  high: { trees: 170, lamps: 60, hydrants: 30, parkTrees: 44, forest: 80 },
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Doorways are where stoops meet the sidewalk; keep 1.6 m clear of each.
let doors;
function doorways() {
  if (doors) return doors;
  doors = sfLots().map((lot) => {
    const c = Math.cos(lot.facing),
      s = Math.sin(lot.facing);
    return [lot.x + (lot.depth / 2) * s, lot.z + (lot.depth / 2) * c];
  });
  return doors;
}
const nearDoor = (x, z, r) =>
  doorways().some(([dx, dz]) => Math.hypot(x - dx, z - dz) < r);

// Candidate spots down the kerb side of every sidewalk, stepping `spacing`
// metres and skipping the corners so crossings stay open.
function kerbSpots(spacing, inset, seed) {
  const random = rng(seed),
    out = [];
  const band = STREET.road / 2 + STREET.walk;
  const offset = STREET.road / 2 + inset;
  for (const [name, grid] of Object.entries(grids)) {
    const frame = gridFrame(grid);
    const [pu, pv] = grid.pitch;
    for (const axis of [0, 1]) {
      const pitch = axis ? pv : pu,
        along = axis ? pu : pv;
      for (let k = -7; k <= 7; k++)
        for (const side of [-1, 1])
          for (let t = -200; t < 200; t += spacing) {
            const cross = k * pitch + side * offset;
            const local = t + random() * 0.6;
            // Distance to the nearest crossing street along this sidewalk.
            const corner =
              Math.abs(((((local / along + 0.5) % 1) + 1) % 1) - 0.5) * along;
            if (corner < band + 2.4) continue;
            const [x, z] = axis
              ? frame.toWorld(local, cross)
              : frame.toWorld(cross, local);
            if (marketSide(x, z) > 0 !== (name === "north")) continue;
            if (coastDistance(x, z) < 3 || avenueDistance(x, z) < 3.2) continue;
            if (streetAt(x, z) !== "walk") continue;
            if (sfSlope(x, z) > 0.3) continue;
            out.push({
              x,
              z,
              turn:
                frame.angle +
                (axis ? 0 : Math.PI / 2) +
                (side < 0 ? Math.PI : 0),
            });
          }
    }
  }
  return out;
}

function spread(spots, count) {
  if (spots.length <= count) return spots;
  const step = spots.length / count;
  return Array.from({ length: count }, (_, i) => spots[Math.floor(i * step)]);
}

function parkTrees(seed) {
  const random = rng(seed),
    out = [];
  for (const park of parks.filter((p) => p.lawn && p.id !== "twin-peaks")) {
    for (
      let i = 0;
      i < 40 && out.filter((o) => o.park === park.id).length < 9;
      i++
    ) {
      const x = park.x + (random() * 2 - 1) * (park.half[0] - 2.5),
        z = park.z + (random() * 2 - 1) * (park.half[1] - 2.5);
      // Leave the middle open as a lawn, and Coit's forecourt clear.
      if (
        Math.hypot((x - park.x) / park.half[0], (z - park.z) / park.half[1]) <
        0.55
      )
        continue;
      if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 4.5)) continue;
      // Keep the postcard sightline across Alamo Square to the Ladies open.
      if (park.id === "alamo" && Math.abs(z - park.z) < 5.5) continue;
      out.push({
        x,
        z,
        park: park.id,
        s: 0.85 + random() * 0.35,
        turn: random() * 6.28,
      });
    }
  }
  return out;
}

function forest(seed) {
  const random = rng(seed),
    out = [];
  const presidio = parks.find((p) => p.id === "presidio");
  for (let i = 0; i < 600 && out.length < 90; i++) {
    const x = presidio.x + (random() * 2 - 1) * presidio.half[0],
      z = presidio.z + (random() * 2 - 1) * presidio.half[1];
    if (avenueDistance(x, z) < 5 || coastDistance(x, z) < 4) continue;
    if (out.some((o) => Math.hypot(o.x - x, o.z - z) < 3.4)) continue;
    out.push({
      x,
      z,
      s: 0.7 + random() * 0.5,
      turn: random() * 6.28,
      kind: random() < 0.6 ? "tree-pine-dense" : "tree-fir",
    });
  }
  return out;
}

export function sfDressing(tier = "medium") {
  const budget = dressingBudget[tier] || dressingBudget.medium;
  // Lamps first at a regular pitch, then trees fill between them.
  const lamps = spread(
    kerbSpots(17, 0.3, 23).filter((p) => !nearDoor(p.x, p.z, 1.6)),
    budget.lamps,
  );
  const clear = (list, p, r) =>
    list.some((o) => Math.hypot(o.x - p.x, o.z - p.z) < r);
  const trees = spread(
    kerbSpots(8.5, 0.55, 11).filter(
      (p) => !nearDoor(p.x, p.z, 1.8) && !clear(lamps, p, 2.2),
    ),
    budget.trees,
  );
  const hydrants = spread(
    kerbSpots(29, 0.35, 37).filter(
      (p) =>
        !nearDoor(p.x, p.z, 1.4) &&
        !clear(trees, p, 1.4) &&
        !clear(lamps, p, 1.4),
    ),
    budget.hydrants,
  );
  return {
    trees,
    lamps,
    hydrants,
    parkTrees: spread(parkTrees(51), budget.parkTrees),
    forest: spread(forest(67), budget.forest),
  };
}
