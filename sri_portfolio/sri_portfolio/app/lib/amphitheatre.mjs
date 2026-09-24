// The Foundry's keynote venue: an open-air amphitheatre in the spirit of a
// Bay Area summer stage. Curved tiers climb away from a stage on the east,
// a white peaked canopy floats over the stage and front rows, and a curved
// wall of fluted cream panels frames one big rounded screen. Coordinates
// are the projects biome's tangent frame (+x east, +z south).
import { rgb } from "./sf-buildings.mjs";

// The stage faces west, toward the plaza; its front edge is at x - depth/2.
export const stage = { x: 50, z: 6.5, width: 16, depth: 6, height: 1.1 };
// Rows are rings around the stage centre; phi 0 looks due west.
export const bowl = {
  inner: 9,
  rows: 8,
  row: 1.15,
  rise: 0.42,
  span: 0.72,
  aisle: 2.2,
};
export const bowlOuter = bowl.inner + bowl.rows * bowl.row;
export const screen = { x: stage.x + 3.2, width: 15, height: 7, y: 5.6 };
export const sideScreens = [-1, 1].map((side) => ({
  x: stage.x - 0.6,
  z: stage.z + side * 10.4,
  y: 7.2,
  width: 6.4,
  height: 3.2,
  // Turned in toward the middle of the bowl.
  yaw: -Math.PI / 2 - side * 0.55,
}));
export const wall = { radius: 9.2, span: 1.38, height: 8.6 };
export const canopy = {
  x0: 39,
  x1: 58,
  z0: -4,
  z1: 17,
  edge: 10.2,
  peaks: [
    { x: 44.5, z: 0.6, lift: 7.5 },
    { x: 44.5, z: 12.4, lift: 7.5 },
    // Behind the fluted wall, so its mast never crosses the screen.
    { x: 56.8, z: 6.5, lift: 8.5 },
  ],
};
export const venueBounds = {
  x0: stage.x - bowlOuter,
  x1: stage.x + wall.radius + 0.6,
  z0: canopy.z0 - 2,
  z1: canopy.z1 + 2.5,
};

const polar = (r, phi) => [
  stage.x - Math.cos(phi) * r,
  stage.z + Math.sin(phi) * r,
];

// Which tier a point stands on, or -1 for the lawn, the aisle or the pit.
export function tierAt(x, z) {
  const dx = stage.x - x,
    dz = z - stage.z;
  const r = Math.hypot(dx, dz);
  if (r < bowl.inner || r >= bowlOuter || dx <= 0) return -1;
  if (Math.abs(Math.atan2(dz, dx)) > bowl.span) return -1;
  if (Math.abs(dz) < bowl.aisle / 2) return -1;
  return Math.floor((r - bowl.inner) / bowl.row);
}
export const tierHeight = (x, z) => {
  const k = tierAt(x, z);
  return k < 0 ? 0 : (k + 1) * bowl.rise;
};
const onStage = (x, z) =>
  Math.abs(x - stage.x) < stage.depth / 2 &&
  Math.abs(z - stage.z) < stage.width / 2;
// Where feet land: a tier, the stage deck, or the ground.
export const standHeight = (x, z) =>
  onStage(x, z) ? stage.height : tierHeight(x, z);
// Whoever is giving the talk, beside the lectern, facing the crowd.
export const speaker = { x: stage.x - 1.6, z: stage.z + 2.6, yaw: -Math.PI / 2 };

// Every seat along every row, front row first, clear of the aisle.
export function seats() {
  const out = [];
  for (let k = 0; k < bowl.rows; k++) {
    const r = bowl.inner + (k + 0.62) * bowl.row;
    const n = Math.floor((2 * bowl.span * r) / 0.82);
    for (let i = 0; i <= n; i++) {
      const phi = -bowl.span + (i / n) * 2 * bowl.span;
      const [x, z] = polar(r, phi * 0.985);
      if (Math.abs(z - stage.z) < bowl.aisle / 2 + 0.3) continue;
      out.push({ x, z, row: k });
    }
  }
  return out;
}

// Seats and stage as merged boxes; `frameAt(x, z, yaw)` returns a box
// builder in that local frame (local +z along the yaw direction).
export function buildAmphitheatre(frameAt) {
  const tier = rgb("#cfc9bd"),
    tierEdge = rgb("#b6afa3"),
    seat = rgb("#46597a"),
    cream = rgb("#efe7d6"),
    creamShade = rgb("#ddd2bd"),
    black = rgb("#1b1d20"),
    truss = rgb("#3a3d42"),
    lamp = rgb("#fff1d6");
  for (let k = 0; k < bowl.rows; k++) {
    const r0 = bowl.inner + k * bowl.row,
      rm = r0 + bowl.row / 2,
      top = (k + 1) * bowl.rise;
    const n = Math.ceil((2 * bowl.span * rm) / 1.3);
    const step = (2 * bowl.span) / n;
    for (let i = 0; i < n; i++) {
      const phi = -bowl.span + (i + 0.5) * step;
      const [x, z] = polar(rm, phi);
      if (Math.abs(z - stage.z) < bowl.aisle / 2 + 0.4) continue;
      const box = frameAt(x, z, Math.atan2(x - stage.x, z - stage.z));
      const length = step * (r0 + bowl.row) + 0.04;
      // Tiers start below grade so the curved ground never shows a gap.
      box("stone", tier, [0, (top - 0.3) / 2, 0], [length, top + 0.3, bowl.row]);
      box("stone", tierEdge, [0, top - 0.03, -bowl.row / 2 + 0.04], [length, 0.06, 0.08]);
      box("paint", seat, [0, top + 0.22, 0.12], [length * 0.94, 0.44, 0.5]);
      box("paint", seat, [0, top + 0.52, 0.4], [length * 0.94, 0.5, 0.08]);
    }
  }
  // The stage, a black apron step and the lectern.
  const s = frameAt(stage.x, stage.z, Math.PI / 2);
  s("paint", black, [0, stage.height / 2, 0], [stage.width, stage.height, stage.depth]);
  // A paved pit between the stage and the front row.
  s("stone", rgb("#b3b0aa"), [0, 0.015, -stage.depth / 2 - 3.2], [stage.width + 3, 0.03, 6.4]);
  s("paint", rgb("#2a2c30"), [0, 0.35, -stage.depth / 2 - 0.35], [stage.width * 0.6, 0.7, 0.7]);
  s("paint", rgb("#2c2e31"), [-4.2, stage.height + 0.55, -1.2], [0.8, 1.1, 0.6]);
  s("lit", rgb("#ffb59e"), [0, stage.height + 0.02, -stage.depth / 2 + 0.1], [stage.width, 0.04, 0.12], 0, true);
  // The screen's frame: a dark bezel behind the rounded panel.
  const f = frameAt(screen.x + 0.2, stage.z, Math.PI / 2);
  f("paint", black, [0, screen.y, 0], [screen.width + 0.4, screen.height + 0.4, 0.3]);
  f("paint", black, [0, (screen.y - screen.height / 2) / 2, 0.3], [screen.width * 0.9, screen.y - screen.height / 2, 0.4]);
  // Fluted cream panels on a curve round the back of the stage.
  const ribs = Math.round((2 * wall.span * wall.radius) / 0.34);
  for (let i = 0; i <= ribs; i++) {
    const a = -wall.span + (i / ribs) * 2 * wall.span;
    const x = stage.x + Math.cos(a) * wall.radius * 0.62,
      z = stage.z + Math.sin(a) * wall.radius;
    const out = i % 2 ? 0.08 : 0;
    const box = frameAt(x, z, Math.atan2(Math.cos(a) / 0.62, Math.sin(a)));
    box("stone", i % 2 ? cream : creamShade, [0, wall.height / 2 - 0.4, out], [0.36, wall.height + 0.8, 0.24]);
  }
  // Side screen housings on slim towers.
  for (const ss of sideScreens) {
    const box = frameAt(ss.x, ss.z, ss.yaw);
    box("paint", black, [0, ss.y, -0.12], [ss.width + 0.3, ss.height + 0.3, 0.2]);
    box("paint", truss, [0, (ss.y - ss.height / 2) / 2, -0.3], [0.35, ss.y - ss.height / 2, 0.35]);
  }
  // A lighting truss across the front of the stage, lamps along it.
  const t = frameAt(stage.x - 2.6, stage.z, Math.PI / 2);
  for (const y of [9.1, 9.7])
    t("paint", truss, [0, y, 0], [stage.width + 5, 0.14, 0.14]);
  for (let z = -(stage.width + 4) / 2; z <= (stage.width + 4) / 2; z += 1.8)
    t("lit", lamp, [z, 8.85, 0], [0.32, 0.32, 0.32], 0, true);
  for (const side of [-1, 1])
    t("paint", truss, [side * ((stage.width + 5) / 2), 4.85, 0], [0.3, 9.7, 0.3]);
}

// The canopy membrane: a grid over the canopy rectangle, lifted into peaks
// and pulled into scalloped edges between the anchor posts.
export function canopyHeight(x, z) {
  let h = canopy.edge;
  for (const p of canopy.peaks)
    h += p.lift * Math.exp(-Math.hypot(x - p.x, z - p.z) / 3.1);
  return h;
}
export function canopySurface(nx = 44, nz = 52) {
  const { x0, x1, z0, z1 } = canopy;
  const positions = [],
    indices = [];
  const bays = 4,
    sag = 1.3;
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const u = i / nx,
        v = j / nz;
      let x = x0 + (x1 - x0) * u,
        z = z0 + (z1 - z0) * v;
      // Edges curve inward between posts, the way cable-edged fabric does.
      const inX = Math.sin(Math.PI * ((v * bays) % 1)) * sag;
      const inZ = Math.sin(Math.PI * ((u * bays) % 1)) * sag;
      const edgeX = Math.min(u, 1 - u) * 2,
        edgeZ = Math.min(v, 1 - v) * 2;
      x += (u < 0.5 ? 1 : -1) * inX * Math.max(0, 1 - edgeX * 4);
      z += (v < 0.5 ? 1 : -1) * inZ * Math.max(0, 1 - edgeZ * 4);
      // Edges between posts ride a little higher than at the posts.
      const lift =
        Math.max(inX * (edgeX < 0.05 ? 1 : 0), inZ * (edgeZ < 0.05 ? 1 : 0)) *
        0.6;
      positions.push(x, canopyHeight(x, z) + lift, z);
    }
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i,
        b = a + 1,
        c = a + nx + 1,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  const posts = [];
  for (let k = 0; k <= 4; k++)
    for (const [px, pz] of [
      [x0 + ((x1 - x0) * k) / 4, z0],
      [x0 + ((x1 - x0) * k) / 4, z1],
      ...(k > 0 && k < 4
        ? [
            [x0, z0 + ((z1 - z0) * k) / 4],
            [x1, z0 + ((z1 - z0) * k) / 4],
          ]
        : []),
    ])
      // No post may stand in the aisle.
      if (Math.abs(pz - stage.z) > 1.5 || px > stage.x)
        posts.push({ x: px, z: pz, height: canopyHeight(px, pz) });
  const masts = canopy.peaks.map((p) => ({
    x: p.x,
    z: p.z,
    height: canopyHeight(p.x, p.z) + 1.4,
  }));
  return { positions, indices, posts, masts };
}
