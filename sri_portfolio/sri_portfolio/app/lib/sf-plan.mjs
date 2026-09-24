// The home district plan: an invented city laid out the way San Francisco
// reads, in studio tangent metres (+x east, +z north). Two street grids meet
// at a diagonal Market Street that runs from the Ferry Building on the east
// waterfront; the Financial District, North Beach and Telegraph Hill sit
// north of it, SoMa and the Mission south. The three world causeways are the
// city's angled avenues, like Columbus Avenue, and nothing is built on them.
import { regions, regionDistance, WORLD_RADIUS } from "./world-layout.mjs";
import { walkingRoutes, pathSample } from "./world-paths.mjs";
import { sfSlope, sfHills } from "./sf-terrain.mjs";
import { streetAt } from "./sf-streets.mjs";

const studio = regions.find((r) => r.id === "studio");

export const STREET = { road: 4.4, walk: 1.6 };
export const STREET_WIDTH = STREET.road + STREET.walk * 2;

// Market Street leaves the Ferry Building's arcade heading south-west.
export const marketStreet = {
  from: [99, -4],
  direction: [-0.767, -0.641],
  length: 104,
  width: 11,
};
const [mdx, mdz] = marketStreet.direction;
export function marketSide(x, z) {
  // Positive north-west of Market, negative south-east.
  const [fx, fz] = marketStreet.from;
  return (x - fx) * mdz - (z - fz) * mdx;
}

// Landmark placements. Each authored model is placed by its own centre.
export const landmarkSites = {
  ferry: { x: 106, z: -4, rotation: -Math.PI / 2, footprint: [8.4, 24.6] },
  salesforce: { x: 70, z: -46, rotation: 0, footprint: [9.8, 10.4] },
  transamerica: { x: 84, z: -1, base: 11, height: 46 },
  coit: { x: 58, z: 34, radius: 3.7 },
};

export const parks = [
  { id: "alamo", x: -34, z: -29, half: [12, 9], lawn: true },
  { id: "washington", x: 42, z: 20, half: [9, 7], lawn: true },
  { id: "dolores", x: 30, z: -74, half: [12, 9], lawn: true },
  { id: "pioneer", x: 58, z: 34, half: [9, 9], lawn: true },
  // Forested headland on the bridge approach, like the Presidio.
  { id: "presidio", x: -40, z: 26, half: [22, 18], forest: true },
  { id: "twin-peaks", x: -14, z: -84, half: [22, 18], lawn: true },
  // Paved forecourts: the Ferry Building's plaza, Salesforce's park and the
  // pyramid's redwood grove; no street crosses them.
  { id: "ferry-plaza", x: 105, z: -4, half: [7.5, 14.5], plaza: true },
  { id: "transbay", x: 70, z: -46, half: [7, 7], plaza: true },
  // Steiner closes for one block so the Ladies read as one long row.
  { id: "steiner-close", x: -8.4, z: -16, half: [5.3, 4], closed: true },
  { id: "redwood", x: 84, z: -1, half: [7, 7], plaza: true },
];

// The world causeways, sampled across the plateau as avenue centrelines.
export const avenues = walkingRoutes
  .filter((route) => route.from === "studio")
  .map((route) => {
    const points = [];
    for (let t = 0; t <= 0.5; t += 0.01) {
      const sample = pathSample(route, t);
      const n = (sample.position || sample).clone().normalize();
      const d = n.dot(studio.normal);
      const x = (n.dot(studio.east) * WORLD_RADIUS) / d,
        z = (n.dot(studio.north) * WORLD_RADIUS) / d;
      if (regionDistance(studio, x, z) > studio.inner + 4) break;
      points.push([x, z]);
    }
    return { to: route.to, points };
  });

function segmentDistance(x, z, [ax, az], [bx, bz]) {
  const vx = bx - ax,
    vz = bz - az;
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz || 1)),
  );
  return Math.hypot(x - ax - vx * t, z - az - vz * t);
}
export function avenueDistance(x, z) {
  let best = Infinity;
  for (const { points } of avenues)
    for (let i = 1; i < points.length; i++)
      best = Math.min(best, segmentDistance(x, z, points[i - 1], points[i]));
  return best;
}
export function marketDistance(x, z) {
  const [fx, fz] = marketStreet.from;
  return segmentDistance(
    x,
    z,
    [fx, fz],
    [fx + mdx * marketStreet.length, fz + mdz * marketStreet.length],
  );
}
export function inPark(x, z, pad = 0) {
  return parks.find(
    (p) =>
      !p.closed &&
      Math.abs(x - p.x) < p.half[0] + pad &&
      Math.abs(z - p.z) < p.half[1] + pad,
  );
}
export function coastDistance(x, z) {
  return studio.inner - regionDistance(studio, x, z);
}

// Two grids: north of Market squared to the compass, south of it squared to
// Market itself, with 7.6 m streets between blocks.
export const grids = {
  north: { origin: [-17, 10], pitch: [30, 26], angle: 0 },
  south: {
    origin: marketStreet.from,
    pitch: [30, 28],
    angle: Math.atan2(mdz, mdx),
  },
};
export function gridFrame(grid) {
  const c = Math.cos(grid.angle),
    s = Math.sin(grid.angle);
  return {
    toWorld: (u, v) => [
      grid.origin[0] + u * c - v * s,
      grid.origin[1] + u * s + v * c,
    ],
    toGrid: (x, z) => {
      const dx = x - grid.origin[0],
        dz = z - grid.origin[1];
      return [dx * c + dz * s, -dx * s + dz * c];
    },
    angle: grid.angle,
  };
}

export function district(x, z) {
  const north = marketSide(x, z) > 0;
  // Towers crowd both sides of Market near the waterfront, as in Transbay.
  if (x > 58 && z < 18 && marketDistance(x, z) < 46) return "fidi";
  if (!north) return x > 36 ? "soma" : "mission";
  if (z > 22 && x > 36) return "northbeach";
  if (z > 22) return "russian";
  return "western";
}

const blocked = (x, z, pad) =>
  coastDistance(x, z) < 5 + pad ||
  avenueDistance(x, z) < 3.4 + pad ||
  marketDistance(x, z) < marketStreet.width / 2 + 1 + pad ||
  inPark(x, z, pad) ||
  landmarkClash(x, z, pad) ||
  inLadiesRow(x, z, pad);

function landmarkClash(x, z, pad) {
  const { ferry, salesforce, transamerica, coit } = landmarkSites;
  const box = (site, [hx, hz]) =>
    Math.abs(x - site.x) < hx / 2 + 1.5 + pad &&
    Math.abs(z - site.z) < hz / 2 + 1.5 + pad;
  return (
    box(ferry, [ferry.footprint[0] + 6, ferry.footprint[1]]) ||
    box(salesforce, salesforce.footprint) ||
    box(transamerica, [transamerica.base + 3, transamerica.base + 3]) ||
    Math.hypot(x - coit.x, z - coit.z) < coit.radius + 4 + pad ||
    // The apartment and its front walk.
    (Math.abs(x) < 9.5 + pad && z > -7 - pad && z < 11 + pad)
  );
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const lotSpec = {
  western: { width: [5.6, 7.4], floors: [2, 3], style: "victorian" },
  russian: { width: [5.8, 7.6], floors: [2, 4], style: "edwardian" },
  northbeach: { width: [5.6, 7.2], floors: [2, 3], style: "edwardian" },
  mission: { width: [5.8, 7.8], floors: [2, 3], style: "victorian" },
  soma: { width: [10, 14], floors: [3, 5], style: "warehouse" },
  fidi: { width: [9, 13], floors: [8, 16], style: "office" },
};

// Every lot fronts a street: a north row and a south row per block, with a
// rear-yard strip between them.
function blockLots(frame, gridName, i, j, random) {
  const grid = grids[gridName];
  const [pu, pv] = grid.pitch;
  const u0 = i * pu + STREET_WIDTH / 2,
    u1 = (i + 1) * pu - STREET_WIDTH / 2;
  const v0 = j * pv + STREET_WIDTH / 2,
    v1 = (j + 1) * pv - STREET_WIDTH / 2;
  const lots = [];
  const depth = Math.min(9.5, (v1 - v0) / 2 - 0.3);
  for (const side of [1, -1]) {
    let u = u0;
    while (u < u1 - 4) {
      const [cx, cz] = frame.toWorld((u0 + u1) / 2, (v0 + v1) / 2);
      const kind = district(cx, cz);
      const spec = lotSpec[kind];
      const width = Math.min(
        u1 - u,
        spec.width[0] + random() * (spec.width[1] - spec.width[0]),
      );
      if (width < 4.2) break;
      const lu = u + width / 2,
        lv = side > 0 ? v1 - depth / 2 : v0 + depth / 2;
      const [x, z] = frame.toWorld(lu, lv);
      const floors =
        spec.floors[0] +
        Math.floor(random() * (spec.floors[1] - spec.floors[0] + 1));
      const corners = [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([a, b]) =>
        frame.toWorld(lu + (a * width) / 2, lv + (b * depth) / 2),
      );
      const clear = corners.every(([px, pz]) => !blocked(px, pz, 0));
      const steep = corners.some(([px, pz]) => sfSlope(px, pz) > 0.42);
      if (clear && !steep)
        lots.push({
          x,
          z,
          width: width - 0.08,
          depth,
          // Facing out of the block toward its street.
          // A house's front is its local +z; yaw -angle maps that onto +v.
          facing: -frame.angle + (side > 0 ? 0 : Math.PI),
          floors,
          style: spec.style,
          district: kind,
          paint: random(),
          detail: random(),
        });
      u += width;
    }
  }
  return lots;
}

let cachedLots;
export function sfLots() {
  if (cachedLots) return cachedLots;
  const random = rng(4242);
  const lots = [];
  for (const [name, grid] of Object.entries(grids)) {
    const frame = gridFrame(grid);
    for (let i = -6; i <= 6; i++)
      for (let j = -6; j <= 6; j++) {
        const [cx, cz] = frame.toWorld(
          (i + 0.5) * grid.pitch[0],
          (j + 0.5) * grid.pitch[1],
        );
        if (coastDistance(cx, cz) < 4) continue;
        const north = marketSide(cx, cz) > 0;
        if ((name === "north") !== north) continue;
        lots.push(...blockLots(frame, name, i, j, random));
      }
  }
  lots.push(...paintedLadies());
  lots.push(...downtownInfill(lots, random));
  cachedLots = lots;
  return lots;
}

// Downtown towers fill the odd corners that Market's diagonal cuts from
// the grid blocks, each squared to Market and clear of every street.
function downtownInfill(existing, random) {
  const out = [];
  const size = 8;
  const yaw = -Math.atan2(mdz, mdx) + Math.PI / 2;
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const footprint = (x, z, grow = 0) =>
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
      [0, 0],
    ].map(([a, b]) => {
      const lx = (a * (size + grow)) / 2,
        lz = (b * (size + grow)) / 2;
      return [x + lx * c + lz * s, z - lx * s + lz * c];
    });
  const taken = [...existing];
  for (let x = 56; x <= 118; x += 2.5)
    for (let z = -70; z <= 18; z += 2.5) {
      if (district(x, z) !== "fidi") continue;
      const corners = footprint(x, z);
      if (corners.some(([px, pz]) => blocked(px, pz, 0))) continue;
      if (corners.some(([px, pz]) => streetAt(px, pz) !== null)) continue;
      if (
        taken.some(
          (lot) =>
            Math.hypot(lot.x - x, lot.z - z) <
            (Math.max(lot.width, lot.depth) + size) / 2 + 0.6,
        )
      )
        continue;
      const lot = {
        x,
        z,
        width: size,
        depth: size,
        facing: yaw,
        floors: 9 + Math.floor(random() * 9),
        style: "office",
        district: "fidi",
        // Entered from a forecourt rather than a kerb.
        infill: true,
        paint: random(),
        detail: random(),
      };
      out.push(lot);
      taken.push(lot);
    }
  return out;
}

// Pastel Victorians across Steiner Street from Alamo Square, facing the
// park the way the postcard row does.
const ladiesRow = (() => {
  const park = parks.find((p) => p.id === "alamo");
  // Fronts meet the sidewalk of the grid street along the park's east side.
  const x = grids.north.origin[0] + STREET_WIDTH / 2 + 9.5 / 2 + 0.05;
  return {
    x,
    z0: park.z - park.half[1] + 0.2,
    // Runs north past the closed block, stopping short of home.
    z1: -8,
  };
})();
function inLadiesRow(x, z, pad) {
  return (
    Math.abs(x - ladiesRow.x) < 5 + pad &&
    z > ladiesRow.z0 - pad &&
    z < ladiesRow.z1 + pad
  );
}
export function paintedLadies() {
  const { x, z0, z1 } = ladiesRow;
  const count = Math.floor((z1 - z0) / 5.3);
  const width = (z1 - z0) / count;
  return Array.from({ length: count }, (_, i) => ({
    x,
    z: z0 + width * (i + 0.5),
    width: width - 0.08,
    depth: 9.5,
    facing: -Math.PI / 2,
    floors: 3,
    style: "victorian",
    district: "western",
    paint: i / count,
    detail: 0.9,
    ladies: true,
  }));
}

export const hillCrests = Object.fromEntries(sfHills.map((h) => [h.id, h]));
