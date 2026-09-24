// People on the city's sidewalks: walkers pacing a block between corners,
// and small groups standing in the plazas and parks. Deterministic.
import {
  STREET,
  grids,
  gridFrame,
  marketSide,
  coastDistance,
  parks,
} from "./sf-plan.mjs";
import { streetAt } from "./sf-streets.mjs";
import { sfSlope } from "./sf-terrain.mjs";

export const crowdBudget = { low: 14, medium: 32, high: 56 };

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const walkable = (x, z) =>
  streetAt(x, z) === "walk" && coastDistance(x, z) > 3 && sfSlope(x, z) < 0.3;

function sidewalkRuns() {
  const runs = [];
  const band = STREET.road / 2 + STREET.walk;
  const offset = STREET.road / 2 + STREET.walk / 2;
  for (const [name, grid] of Object.entries(grids)) {
    const frame = gridFrame(grid);
    const [pu, pv] = grid.pitch;
    for (const axis of [0, 1]) {
      const pitch = axis ? pv : pu,
        along = axis ? pu : pv;
      for (let k = -7; k <= 7; k++)
        for (const side of [-1, 1])
          for (let c = -8; c <= 8; c++) {
            const cross = k * pitch + side * offset;
            const t0 = c * along + band + 0.8,
              t1 = (c + 1) * along - band - 0.8;
            const at = (t) =>
              axis ? frame.toWorld(t, cross) : frame.toWorld(cross, t);
            const a = at(t0),
              b = at(t1),
              m = at((t0 + t1) / 2);
            if (
              [a, b, m].some(
                ([x, z]) => marketSide(x, z) > 0 !== (name === "north"),
              )
            )
              continue;
            if (![a, b, m].every(([x, z]) => walkable(x, z))) continue;
            runs.push([a, b]);
          }
    }
  }
  return runs;
}

function gatherings(random) {
  const out = [];
  for (const id of ["ferry-plaza", "washington", "dolores", "alamo"]) {
    const park = parks.find((p) => p.id === id);
    if (!park) continue;
    // Off to one side, keeping each park's middle and sightlines open.
    const side = random() < 0.5 ? -1 : 1;
    const cx = park.x + (random() - 0.5) * park.half[0],
      cz = park.z + side * park.half[1] * (0.55 + random() * 0.2);
    const size = 2 + Math.floor(random() * 2);
    for (let i = 0; i < size; i++) {
      const a = (i / size) * Math.PI * 2 + random() * 0.4;
      // Stand in a loose circle, facing its middle.
      out.push({
        x: cx + Math.cos(a) * 0.75,
        z: cz + Math.sin(a) * 0.75,
        yaw: Math.atan2(-Math.cos(a), -Math.sin(a)),
      });
    }
  }
  return out;
}

export function sfCrowd(tier = "medium") {
  const random = rng(2024);
  const count = crowdBudget[tier] || crowdBudget.medium;
  const runs = sidewalkRuns();
  const groups = gatherings(random).slice(0, Math.floor(count * 0.35));
  const walkers = [];
  for (
    let i = 0;
    walkers.length < count - groups.length && i < runs.length * 3;
    i++
  ) {
    const run = runs[Math.floor(random() * runs.length)];
    const [[ax, az], [bx, bz]] = run;
    const lane = (random() - 0.5) * 0.9;
    const dx = bx - ax,
      dz = bz - az,
      len = Math.hypot(dx, dz);
    const nx = -dz / len,
      nz = dx / len;
    walkers.push({
      path: [
        [ax + nx * lane, az + nz * lane],
        [bx + nx * lane, bz + nz * lane],
      ],
      length: len,
      speed: 1.05 + random() * 0.45,
    });
  }
  return [...walkers, ...groups];
}
