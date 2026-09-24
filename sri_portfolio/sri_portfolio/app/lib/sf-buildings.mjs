// Buildings for every plan lot, merged into a handful of vertex-coloured
// batches so the whole city costs about six draw calls. Styles follow the
// district: bay-windowed Victorians with stoops, garage-level Edwardians,
// brick SoMa warehouses and banded Financial District offices.
import { BufferGeometry, Color, Float32BufferAttribute } from "three";
import { surfaceHeight } from "./world-layout.mjs";
import { landmarkSites, sfLots } from "./sf-plan.mjs";

export const FLOOR = 3.1;
export const SETBACK = 1.2;

const palettes = {
  victorian: [
    "#c99aa9",
    "#93afc6",
    "#d8c38a",
    "#a2bf9c",
    "#e4d8c2",
    "#b39ac3",
    "#d49878",
    "#8fb5b0",
  ],
  edwardian: ["#dcd5c6", "#c6c8c1", "#b5bab5", "#e1d5bd", "#a8b0ae", "#cfc0a8"],
  warehouse: ["#8a5645", "#794c3c", "#a0684f", "#6f6a63", "#9a7a5c"],
  office: ["#bdb6aa", "#8d9197", "#cbc4b6", "#a9a39a"],
};
const trimColor = {
  victorian: "#efe7d8",
  edwardian: "#f2eee6",
  warehouse: "#c9bfae",
  office: "#d7d2c8",
};

class Batch {
  constructor() {
    this.p = [];
    this.n = [];
    this.c = [];
  }
  geometry() {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(this.p, 3));
    g.setAttribute("normal", new Float32BufferAttribute(this.n, 3));
    g.setAttribute("color", new Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
}

const FACES = [
  [
    [1, 0, 0],
    [
      [1, -1, -1],
      [1, 1, -1],
      [1, 1, 1],
      [1, -1, 1],
    ],
  ],
  [
    [-1, 0, 0],
    [
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, 1, -1],
      [-1, -1, -1],
    ],
  ],
  [
    [0, 1, 0],
    [
      [-1, 1, -1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
    ],
  ],
  [
    [0, -1, 0],
    [
      [-1, -1, 1],
      [-1, -1, -1],
      [1, -1, -1],
      [1, -1, 1],
    ],
  ],
  [
    [0, 0, 1],
    [
      [1, -1, 1],
      [1, 1, 1],
      [-1, 1, 1],
      [-1, -1, 1],
    ],
  ],
  [
    [0, 0, -1],
    [
      [-1, -1, -1],
      [-1, 1, -1],
      [1, 1, -1],
      [1, -1, -1],
    ],
  ],
];

// A builder in one lot's frame: origin at the lot centre on its ground,
// local +z toward the street, rotated by the lot's yaw.
function frame(batches, x, y, z, yaw) {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  const world = (lx, ly, lz) => [
    x + lx * c + lz * s,
    y + ly,
    z - lx * s + lz * c,
  ];
  const turn = (nx, nz) => [nx * c + nz * s, -nx * s + nz * c];
  return function box(
    tone,
    color,
    [cx, cy, cz],
    [sx, sy, sz],
    spin = 0,
    bottom = false,
  ) {
    const b = batches[tone];
    const cs = Math.cos(spin),
      ss = Math.sin(spin);
    const col = color;
    for (const [[nx, ny, nz], quad] of FACES) {
      if (ny < 0 && !bottom) continue;
      const lnx = nx * cs + nz * ss,
        lnz = -nx * ss + nz * cs;
      const [wnx, wnz] = turn(lnx, lnz);
      const pts = quad.map(([a, bb, d]) => {
        const px = (a * sx) / 2,
          pz = (d * sz) / 2;
        return world(
          cx + px * cs + pz * ss,
          cy + (bb * sy) / 2,
          cz - px * ss + pz * cs,
        );
      });
      for (const i of [0, 1, 2, 0, 2, 3]) {
        b.p.push(...pts[i]);
        b.n.push(wnx, ny, wnz);
        b.c.push(col.r, col.g, col.b);
      }
    }
  };
}

const colorCache = new Map();
const rgb = (hex) => {
  if (!colorCache.has(hex)) colorCache.set(hex, new Color(hex));
  return colorCache.get(hex);
};
const shade = (hex, k) => rgb(hex).clone().multiplyScalar(k);

function lotGround(lot) {
  const c = Math.cos(lot.facing),
    s = Math.sin(lot.facing);
  const heights = [-1, 1].flatMap((a) =>
    [-1, 1].map((b) => {
      const lx = (a * lot.width) / 2,
        lz = (b * lot.depth) / 2;
      return surfaceHeight(
        "studio",
        lot.x + lx * c + lz * s,
        lot.z - lx * s + lz * c,
      );
    }),
  );
  return { low: Math.min(...heights), high: Math.max(...heights) };
}

function windowTone(lot, f, k) {
  const h =
    Math.sin((lot.x * 12.9 + lot.z * 78.2 + f * 37.7 + k * 11.3) * 43.1) * 0.5 +
    0.5;
  return h > 0.72 ? "lit" : "glass";
}

function rowHouse(box, lot, ground, detail) {
  const style = lot.style;
  const palette = palettes[style];
  const paint = rgb(
    palette[Math.floor(lot.paint * palette.length) % palette.length],
  );
  const trim = rgb(lot.ladies ? "#f4ecdc" : trimColor[style]);
  const w = lot.width,
    d = lot.depth - SETBACK;
  const front = lot.depth / 2 - SETBACK;
  const raised = style === "victorian" ? 1.1 : 0.15;
  const base = ground.high - ground.low;
  const floors = lot.floors;
  const top = raised + floors * FLOOR;
  const zc = front - d / 2;
  // Foundation reaching down the slope, then the painted body.
  box(
    "stone",
    shade("#8f8b84", 1),
    [0, (raised - base - 0.4) / 2, zc],
    [w, raised + base + 0.4, d],
    0,
    true,
  );
  box(
    "paint",
    paint,
    [0, raised + (floors * FLOOR) / 2, zc],
    [w, floors * FLOOR, d],
  );
  const bayLeft = lot.detail > 0.5;
  const bayW = Math.min(3.1, w * 0.46);
  const bayX = (bayLeft ? -1 : 1) * (w / 2 - bayW / 2 - 0.25);
  const doorX = -bayX * 0.9;
  // Angled bay stack: a projecting body with a front light and two 45° cheeks.
  const bayFloor0 = style === "edwardian" ? 1 : 0;
  for (let f = bayFloor0; f < floors; f++) {
    const y = raised + f * FLOOR + FLOOR / 2;
    box("paint", paint, [bayX, y, front + 0.35], [bayW - 0.9, FLOOR, 0.7]);
    box(
      windowTone(lot, f, 0),
      rgb("#30414d"),
      [bayX, y + 0.15, front + 0.71],
      [bayW - 1.3, 1.75, 0.04],
    );
    box("paint", trim, [bayX, y - 0.8, front + 0.73], [bayW - 1.1, 0.12, 0.1]);
    if (detail)
      for (const side of [-1, 1]) {
        box(
          "paint",
          paint,
          [bayX + side * (bayW / 2 - 0.3), y, front + 0.3],
          [0.62, FLOOR, 0.62],
          (side * Math.PI) / 4,
        );
        box(
          windowTone(lot, f, side + 2),
          rgb("#30414d"),
          [bayX + side * (bayW / 2 - 0.2), y + 0.15, front + 0.43],
          [0.42, 1.65, 0.04],
          (side * Math.PI) / 4,
        );
      }
    // Flat-front sash window beside the bay.
    if (f > 0 || style !== "edwardian") {
      box("paint", trim, [doorX, y + 0.15, front + 0.03], [1.25, 2.05, 0.08]);
      box(
        windowTone(lot, f, 5),
        rgb("#30414d"),
        [doorX, y + 0.15, front + 0.075],
        [1.0, 1.8, 0.03],
      );
    }
    box(
      "paint",
      trim,
      [0, raised + (f + 1) * FLOOR - 0.08, front + 0.02],
      [w + 0.06, 0.16, 0.12],
    );
  }
  if (style === "edwardian") {
    // Street-level garage under the bay, the entry up a short flight.
    box("paint", trim, [bayX, 1.25, front + 0.04], [2.9, 2.5, 0.1]);
    box("door", rgb("#4a4d4f"), [bayX, 1.15, front + 0.09], [2.6, 2.3, 0.04]);
  }
  // Entry: recessed door, stoop down to the sidewalk.
  const doorY = raised + 1.15;
  box(
    "door",
    rgb(lot.detail > 0.7 ? "#5a3b2e" : "#3f4f55"),
    [doorX, doorY, front + 0.04],
    [1.05, 2.25, 0.06],
  );
  box("paint", trim, [doorX, doorY + 1.25, front + 0.1], [1.45, 0.22, 0.24]);
  const steps = Math.max(1, Math.round(raised / 0.18));
  for (let i = 0; i < steps; i++) {
    const h = raised - i * (raised / steps);
    box(
      "stone",
      rgb("#a39d93"),
      [doorX, h / 2 - 0.02, front + 0.2 + i * (SETBACK / steps)],
      [1.3, h, SETBACK / steps + 0.02],
    );
  }
  // Cornice with brackets, and a false-front parapet.
  box("paint", trim, [0, top + 0.18, front + 0.2], [w + 0.2, 0.36, 0.6]);
  if (detail)
    for (let bx = -w / 2 + 0.4; bx <= w / 2 - 0.3; bx += 0.85)
      box("paint", trim, [bx, top - 0.12, front + 0.2], [0.14, 0.28, 0.4]);
  const parapet = style === "victorian" ? 0.9 : 0.5;
  box(
    "paint",
    paint,
    [0, top + 0.36 + parapet / 2, front - 0.06],
    [w, parapet, 0.18],
  );
  if (style === "victorian" && detail)
    box(
      "paint",
      trim,
      [0, top + 0.4 + parapet + 0.18, front - 0.06],
      [w * 0.36, 0.36, 0.22],
    );
  box(
    "roof",
    rgb("#3c4146"),
    [0, top + 0.05, zc - 0.1],
    [w - 0.1, 0.1, d - 0.2],
  );
}

function warehouse(box, lot, ground) {
  const brick = rgb(palettes.warehouse[Math.floor(lot.paint * 5) % 5]);
  const trim = rgb(trimColor.warehouse);
  const w = lot.width,
    d = lot.depth - 0.4,
    front = lot.depth / 2 - 0.4;
  const base = ground.high - ground.low;
  const top = lot.floors * 3.6;
  box(
    "stone",
    rgb("#7d7872"),
    [0, (0.3 - base) / 2, front - d / 2],
    [w, base + 0.3, d],
    0,
    true,
  );
  box("paint", brick, [0, top / 2, front - d / 2], [w, top, d]);
  const bays = Math.max(2, Math.floor(w / 2.6));
  for (let f = 0; f < lot.floors; f++)
    for (let k = 0; k < bays; k++) {
      const x = -w / 2 + (k + 0.5) * (w / bays);
      const y = f * 3.6 + 1.9;
      box("paint", trim, [x, y - 1.05, front + 0.06], [1.9, 0.14, 0.14]);
      box(
        f === 0 && k === 1 ? "door" : windowTone(lot, f, k),
        rgb("#2c3a42"),
        [x, y, front + 0.03],
        [1.7, f === 0 ? 2.8 : 2.1, 0.04],
      );
    }
  box("paint", trim, [0, top + 0.25, front + 0.1], [w + 0.14, 0.5, 0.32]);
  box(
    "roof",
    rgb("#34383c"),
    [0, top + 0.05, front - d / 2],
    [w - 0.1, 0.1, d - 0.1],
  );
  if (lot.detail > 0.6) {
    // Rooftop water tank on legs.
    box(
      "door",
      rgb("#5e4a3a"),
      [w * 0.2, top + 2.1, front - d * 0.6],
      [1.6, 1.8, 1.6],
    );
    box(
      "stone",
      rgb("#55595c"),
      [w * 0.2, top + 0.6, front - d * 0.6],
      [1.3, 1.2, 1.3],
    );
  }
}

function office(box, lot, ground) {
  const stone = rgb(palettes.office[Math.floor(lot.paint * 4) % 4]);
  const w = lot.width,
    d = lot.depth - 0.4,
    zc = lot.depth / 2 - 0.4 - d / 2;
  const base = ground.high - ground.low;
  const floors = lot.floors;
  const curtain = lot.detail > 0.55;
  box("stone", stone, [0, (0.2 - base) / 2, zc], [w, base + 0.2, d], 0, true);
  // Two-storey podium, then a banded or curtain-walled shaft with a setback crown.
  box("stone", stone, [0, 3.4, zc], [w, 6.8, d]);
  box("lit", rgb("#3a4a55"), [0, 2.2, zc + d / 2 + 0.01], [w - 1.2, 3.4, 0.04]);
  const shaftW = w - 1,
    shaftD = d - 1;
  for (let f = 0; f < floors; f++) {
    const y = 6.8 + f * 3.4;
    if (curtain) {
      box("curtain", rgb("#4f6b7d"), [0, y + 1.7, zc], [shaftW, 3.4, shaftD]);
      box(
        "stone",
        stone,
        [0, y + 0.05, zc],
        [shaftW + 0.08, 0.12, shaftD + 0.08],
      );
    } else {
      box(
        windowTone(lot, f, 1) === "lit" ? "lit" : "curtain",
        rgb("#3b4c58"),
        [0, y + 1.9, zc],
        [shaftW - 0.1, 2.3, shaftD - 0.1],
      );
      box("stone", stone, [0, y + 0.55, zc], [shaftW, 1.1, shaftD]);
    }
  }
  const top = 6.8 + floors * 3.4;
  if (curtain)
    for (let x = -shaftW / 2; x <= shaftW / 2 + 0.01; x += 1.5)
      box(
        "stone",
        stone,
        [x, (6.8 + top) / 2, zc + shaftD / 2 + 0.05],
        [0.12, top - 6.8, 0.12],
      );
  box("stone", stone, [0, top + 1.2, zc], [shaftW - 2, 2.4, shaftD - 2]);
}

// Transamerica: a tapering four-sided spire with its two elevator wings,
// banded by floor so the pale concrete reads at a distance.
function pyramid(box, ground) {
  const { base, height } = landmarkSites.transamerica;
  const bands = 30;
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands;
    const size = base * (1 - t0 * 0.9);
    const y = ground + t0 * height;
    const h = height / bands;
    box(
      i % 2 ? "paint" : "glass",
      i % 2 ? rgb("#e7e3da") : rgb("#56646c"),
      [0, y + h / 2, 0],
      [size, h, size],
    );
  }
  for (const side of [-1, 1])
    box(
      "paint",
      rgb("#e2ddd3"),
      [side * base * 0.2, ground + height * 0.78, 0],
      [1.8, height * 0.18, base * 0.22],
    );
  box("paint", rgb("#ece8df"), [0, ground + height + 4, 0], [0.7, 8, 0.7]);
  box(
    "stone",
    rgb("#8d8980"),
    [0, ground + 0.3, 0],
    [base + 1.5, 0.6, base + 1.5],
  );
}

export const cityTones = [
  "paint",
  "stone",
  "glass",
  "lit",
  "curtain",
  "door",
  "roof",
];

export function buildCity({ detail = true } = {}) {
  const batches = Object.fromEntries(cityTones.map((t) => [t, new Batch()]));
  let lots = 0;
  for (const lot of sfLots()) {
    const ground = lotGround(lot);
    const box = frame(batches, lot.x, ground.high, lot.z, lot.facing);
    if (lot.style === "office") office(box, lot, ground);
    else if (lot.style === "warehouse") warehouse(box, lot, ground);
    else rowHouse(box, lot, ground, detail);
    lots++;
  }
  const t = landmarkSites.transamerica;
  pyramid(frame(batches, t.x, 0, t.z, 0), surfaceHeight("studio", t.x, t.z));
  const geometries = Object.fromEntries(
    Object.entries(batches)
      .filter(([, b]) => b.p.length)
      .map(([tone, b]) => [tone, b.geometry()]),
  );
  return { geometries, lots };
}
