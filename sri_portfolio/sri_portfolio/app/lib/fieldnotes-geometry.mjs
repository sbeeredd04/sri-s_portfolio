import { BufferGeometry, Float32BufferAttribute } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  fieldnotesBeds,
  fieldnotesCanopy,
  fieldnotesCanopyY,
  fieldnotesChair,
  fieldnotesColumnPoints,
  fieldnotesDesk,
  fieldnotesDisplayFrame,
  fieldnotesMaterialNames,
  fieldnotesPlants,
  fieldnotesReturn,
  fieldnotesTable,
  fieldnotesTerraces,
  fieldnotesWall,
} from "./fieldnotes-layout.mjs";
import { buildFieldnotesPaving } from "./fieldnotes-surface.mjs";

const SOIL = [0.09, 0.055, 0.026];
const LEAF = [0.08, 0.14, 0.065];
const GRASS = [0.12, 0.18, 0.055];

function bucket(colored = false) {
  return { positions: [], normals: [], colors: colored ? [] : null };
}
function addTri(target, a, b, c, normal, color) {
  const len = Math.hypot(normal[0], normal[1], normal[2]) || 1;
  const n = [normal[0] / len, normal[1] / len, normal[2] / len];
  target.positions.push(...a, ...b, ...c);
  for (let i = 0; i < 3; i++) target.normals.push(...n);
  if (target.colors && color)
    for (let i = 0; i < 3; i++) target.colors.push(...color);
}
function addQuad(target, a, b, c, d, direction, color) {
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = c[0] - a[0],
    vy = c[1] - a[1],
    vz = c[2] - a[2];
  let n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  if (Math.hypot(...n) < 1e-10) {
    const wx = d[0] - a[0],
      wy = d[1] - a[1],
      wz = d[2] - a[2];
    n = [vy * wz - vz * wy, vz * wx - vx * wz, vx * wy - vy * wx];
  }
  const align = n[0] * direction[0] + n[1] * direction[1] + n[2] * direction[2];
  if (align >= 0) {
    addTri(target, a, b, c, n, color);
    addTri(target, a, c, d, n, color);
  } else {
    const outward = n.map((v) => -v);
    addTri(target, a, c, b, outward, color);
    addTri(target, a, d, c, outward, color);
  }
}
function addBox(target, cx, cy, cz, hx, hy, hz, color) {
  const x0 = cx - hx,
    x1 = cx + hx,
    y0 = cy - hy,
    y1 = cy + hy,
    z0 = cz - hz,
    z1 = cz + hz;
  addQuad(
    target,
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1],
    [0, 0, 1],
    color,
  );
  addQuad(
    target,
    [x1, y0, z0],
    [x0, y0, z0],
    [x0, y1, z0],
    [x1, y1, z0],
    [0, 0, -1],
    color,
  );
  addQuad(
    target,
    [x0, y1, z1],
    [x1, y1, z1],
    [x1, y1, z0],
    [x0, y1, z0],
    [0, 1, 0],
    color,
  );
  addQuad(
    target,
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
    [0, -1, 0],
    color,
  );
  addQuad(
    target,
    [x1, y0, z1],
    [x1, y0, z0],
    [x1, y1, z0],
    [x1, y1, z1],
    [1, 0, 0],
    color,
  );
  addQuad(
    target,
    [x0, y0, z0],
    [x0, y0, z1],
    [x0, y1, z1],
    [x0, y1, z0],
    [-1, 0, 0],
    color,
  );
}
function toGeometry(target) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(target.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new Float32BufferAttribute(target.normals, 3),
  );
  const uv = [];
  for (let i = 0; i < target.positions.length; i += 3) {
    const ny = Math.abs(target.normals[i + 1]);
    uv.push(
      (Math.abs(target.normals[i]) > 0.5
        ? target.positions[i + 2]
        : target.positions[i]) * 0.35,
      (ny > 0.5 ? target.positions[i + 2] : target.positions[i + 1]) * 0.35,
    );
  }
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  if (target.colors)
    geometry.setAttribute(
      "color",
      new Float32BufferAttribute(target.colors, 3),
    );
  geometry.computeBoundingSphere();
  return geometry;
}
function addCanopy(timber) {
  const { x0, x1, zBack, zFront, thickness } = fieldnotesCanopy;
  const nu = 14,
    nv = 8;
  const at = (u, v, lift) => {
    const x = x0 + (x1 - x0) * u;
    const z = zBack + (zFront - zBack) * v;
    return [x, fieldnotesCanopyY(x, z) + lift, z];
  };
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const u0 = i / nu,
        u1 = (i + 1) / nu,
        v0 = j / nv,
        v1 = (j + 1) / nv;
      addQuad(
        timber,
        at(u0, v0, 0),
        at(u1, v0, 0),
        at(u1, v1, 0),
        at(u0, v1, 0),
        [0, 1, 0],
      );
      addQuad(
        timber,
        at(u0, v0, -thickness),
        at(u0, v1, -thickness),
        at(u1, v1, -thickness),
        at(u1, v0, -thickness),
        [0, -1, 0],
      );
    }
  const fascia = (u0, v0, u1, v1, outward) => {
    const a = at(u0, v0, 0),
      b = at(u1, v1, 0);
    const dx = b[0] - a[0],
      dz = b[2] - a[2];
    const len = Math.hypot(dx, dz) || 1;
    const ox = (-dz / len) * outward * 0.028,
      oz = (dx / len) * outward * 0.028;
    addQuad(
      timber,
      [a[0], a[1] - 0.08, a[2]],
      [b[0], b[1] - 0.08, b[2]],
      [b[0] + ox, b[1] - 0.08, b[2] + oz],
      [a[0] + ox, a[1] - 0.08, a[2] + oz],
      [ox, 0, oz],
    );
    addQuad(
      timber,
      [a[0], a[1], a[2]],
      [b[0], b[1], b[2]],
      [b[0] + ox, b[1], b[2] + oz],
      [a[0] + ox, a[1], a[2] + oz],
      [0, 1, 0],
    );
  };
  for (let i = 0; i < nu; i++) fascia(i / nu, 1, (i + 1) / nu, 1, 1);
  for (let j = 0; j < nv; j++) {
    fascia(0, j / nv, 0, (j + 1) / nv, -1);
    fascia(1, j / nv, 1, (j + 1) / nv, 1);
  }
}
function addCopperDrip(copper) {
  const { x0, x1, zFront } = fieldnotesCanopy;
  const count = 10;
  for (let i = 0; i < count; i++) {
    const u0 = i / count,
      u1 = (i + 1) / count;
    const xA = x0 + (x1 - x0) * u0,
      xB = x0 + (x1 - x0) * u1;
    const yA = fieldnotesCanopyY(xA, zFront) - 0.09,
      yB = fieldnotesCanopyY(xB, zFront) - 0.09;
    addQuad(
      copper,
      [xA, yA - 0.012, zFront + 0.02],
      [xB, yB - 0.012, zFront + 0.02],
      [xB, yB, zFront + 0.02],
      [xA, yA, zFront + 0.02],
      [0, 0, 1],
    );
  }
}
function addWalls(stone) {
  // Continuous top edges meet the curved canopy; no staircase of box caps.
  const segment = (ax, az, bx, bz, nx, nz, thickness, start, end) => {
    const corners = [
      [ax + (nx * thickness) / 2, az + (nz * thickness) / 2],
      [bx + (nx * thickness) / 2, bz + (nz * thickness) / 2],
      [bx - (nx * thickness) / 2, bz - (nz * thickness) / 2],
      [ax - (nx * thickness) / 2, az - (nz * thickness) / 2],
    ];
    const bottom = corners.map(([x, z]) => [x, -0.04, z]);
    const top = corners.map(([x, z]) => [
      x,
      fieldnotesCanopyY(x, z) - fieldnotesCanopy.thickness,
      z,
    ]);
    for (const i of [0, 2, ...(start ? [3] : []), ...(end ? [1] : [])]) {
      const j = (i + 1) % 4;
      const dx = corners[j][0] - corners[i][0],
        dz = corners[j][1] - corners[i][1];
      addQuad(stone, bottom[i], bottom[j], top[j], top[i], [-dz, 0, dx]);
    }
    addQuad(stone, ...top, [0, 1, 0]);
  };
  const w = fieldnotesWall;
  for (let i = 0; i < 28; i++)
    segment(
      w.x0 + ((w.x1 - w.x0) * i) / 28,
      w.z,
      w.x0 + ((w.x1 - w.x0) * (i + 1)) / 28,
      w.z,
      0,
      1,
      w.thickness,
      i === 0,
      i === 27,
    );
  const r = fieldnotesReturn;
  for (let i = 0; i < 12; i++)
    segment(
      r.x,
      r.z0 + ((r.z1 - r.z0) * i) / 12,
      r.x,
      r.z0 + ((r.z1 - r.z0) * (i + 1)) / 12,
      1,
      0,
      r.thickness,
      i === 0,
      i === 11,
    );
}
function roundedBox(target, cx, cy, cz, width, height, depth, radius) {
  const g = new RoundedBoxGeometry(width, height, depth, 2, radius);
  const p = g.getAttribute("position"),
    n = g.getAttribute("normal");
  for (let i = 0; i < p.count; i++) {
    target.positions.push(p.getX(i) + cx, p.getY(i) + cy, p.getZ(i) + cz);
    target.normals.push(n.getX(i), n.getY(i), n.getZ(i));
  }
  g.dispose();
}
function addColumns(charcoal, stone) {
  for (const column of fieldnotesColumnPoints()) {
    const soffit =
      fieldnotesCanopyY(column.x, column.z) - fieldnotesCanopy.thickness;
    const hy = (soffit + 0.02) / 2;
    addBox(
      charcoal,
      column.x,
      hy - 0.02,
      column.z,
      column.size / 2,
      hy,
      column.size / 2,
    );
    addBox(stone, column.x, 0, column.z, 0.11, 0.04, 0.11);
  }
}
function addDesk(timber, ivory) {
  const desk = fieldnotesDesk;
  roundedBox(
    timber,
    desk.x,
    desk.top - 0.02,
    desk.z,
    desk.hx * 2,
    0.04,
    desk.hz * 2,
    0.014,
  );
  for (const sx of [-1, 1])
    for (const sz of [-1, 1])
      addBox(
        timber,
        desk.x + sx * (desk.hx - 0.08),
        0.36,
        desk.z + sz * (desk.hz - 0.06),
        0.035,
        0.36,
        0.035,
      );
  addBox(ivory, desk.x - 0.12, desk.top + 0.008, desk.z, 0.16, 0.004, 0.11);
  addBox(
    ivory,
    desk.x + 0.16,
    desk.top + 0.012,
    desk.z + 0.02,
    0.15,
    0.004,
    0.1,
  );
}
function addChair(charcoal) {
  const chair = fieldnotesChair;
  roundedBox(charcoal, chair.x, 0.44, chair.z + 0.03, 0.46, 0.04, 0.42, 0.016);
  roundedBox(charcoal, chair.x, 0.72, chair.z - 0.32, 0.46, 0.48, 0.04, 0.018);
  for (const sx of [-1, 1])
    for (const sz of [-0.16, 0.2])
      addBox(
        charcoal,
        chair.x + sx * 0.18,
        0.21,
        chair.z + sz,
        0.02,
        0.21,
        0.02,
      );
}
function addDisplay(stone, ivory, copper) {
  const frame = fieldnotesDisplayFrame();
  addBox(
    stone,
    frame.plinth.x,
    frame.plinth.hy,
    frame.plinth.z,
    frame.plinth.hx,
    frame.plinth.hy,
    frame.plinth.hz,
  );
  addBox(
    ivory,
    frame.panel.x,
    frame.panel.y,
    frame.panel.z,
    frame.panel.hx,
    frame.panel.hy,
    frame.panel.hz,
  );
  addBox(
    copper,
    frame.panel.x + frame.panel.hx - 0.004,
    frame.panel.y + frame.panel.hy - 0.012,
    frame.panel.z,
    0.006,
    0.012,
    frame.panel.hz,
  );
}
function addTable(timber, ivory) {
  const table = fieldnotesTable;
  const segments = 14;
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const ring = (radius, y) => [
      [table.x + Math.cos(a0) * radius, y, table.z + Math.sin(a0) * radius],
      [table.x + Math.cos(a1) * radius, y, table.z + Math.sin(a1) * radius],
    ];
    const [a, b] = ring(table.radius, table.top);
    const [c, d] = ring(table.radius, table.top - 0.04);
    addQuad(timber, a, b, d, c, [
      Math.cos((a0 + a1) / 2),
      0,
      Math.sin((a0 + a1) / 2),
    ]);
    addQuad(
      timber,
      [table.x, table.top, table.z],
      a,
      b,
      [table.x, table.top, table.z],
      [0, 1, 0],
    );
    const [e, f] = ring(0.08, table.top - 0.04);
    const [g, h] = ring(0.08, 0);
    addQuad(timber, e, f, h, g, [
      Math.cos((a0 + a1) / 2),
      0,
      Math.sin((a0 + a1) / 2),
    ]);
  }
  const cardZ = table.z - 0.22;
  addBox(ivory, table.x, 0.72, cardZ, 0.25, 0.22, 0.01);
}
function addGarden(garden, stone) {
  for (const bed of fieldnotesBeds) {
    addBox(garden, bed.x, 0.03, bed.z, bed.w / 2, 0.025, bed.d / 2, SOIL);
    const hx = bed.w / 2,
      hz = bed.d / 2;
    addBox(stone, bed.x, 0.045, bed.z - hz, hx, 0.03, 0.035);
    addBox(stone, bed.x, 0.045, bed.z + hz, hx, 0.03, 0.035);
    addBox(stone, bed.x - hx, 0.045, bed.z, 0.035, 0.03, hz);
    addBox(stone, bed.x + hx, 0.045, bed.z, 0.035, 0.03, hz);
  }
  for (const plant of fieldnotesPlants) addFoliage(garden, plant);
}
function addFoliage(target, plant) {
  const blades = plant.kind === "grass" ? 13 : 18;
  for (let i = 0; i < blades; i++) {
    const angle = i * 2.39996;
    const length = plant.r * (0.62 + (Math.sin(i * 13.7) * 0.5 + 0.5) * 0.36);
    const height = plant.kind === "grass" ? 0.38 : 0.48 + (i % 4) * 0.075;
    const width = plant.kind === "grass" ? 0.025 : 0.11;
    const color = (plant.kind === "grass" ? GRASS : LEAF).map(
      (c) => c * (0.78 + (i % 5) * 0.08),
    );
    const at = (t, side) => {
      const radius = length * Math.sin((t * Math.PI) / 2);
      const half = width * Math.sin(t * Math.PI) * side;
      return [
        plant.x + Math.cos(angle) * radius - Math.sin(angle) * half,
        0.055 + height * Math.sin(t * Math.PI * 0.72),
        plant.z + Math.sin(angle) * radius + Math.cos(angle) * half,
      ];
    };
    for (let j = 0; j < 7; j++) {
      const a = at(j / 7, -1),
        b = at(j / 7, 1),
        c = at((j + 1) / 7, 1),
        d = at((j + 1) / 7, -1);
      addQuad(target, a, b, c, d, [0, 1, 0], color);
      addQuad(
        target,
        d,
        c,
        b,
        a,
        [0, -1, 0],
        color.map((v) => v * 0.85),
      );
    }
  }
}

export function buildFieldnotesGeometry() {
  const stone = bucket(),
    timber = bucket(),
    charcoal = bucket(),
    copper = bucket(),
    garden = bucket(true);
  const desk = bucket(),
    chair = bucket(),
    pages = bucket(),
    plinth = bucket(),
    panel = bucket(),
    trim = bucket(),
    table = bucket(),
    hello = bucket();
  const terraces = bucket();
  for (const terrace of fieldnotesTerraces)
    addBox(
      terraces,
      terrace.x,
      -0.011,
      terrace.z,
      terrace.width / 2,
      0.033,
      terrace.depth / 2,
    );
  addWalls(stone);
  addColumns(charcoal, stone);
  addCanopy(timber);
  addCopperDrip(copper);
  addDesk(desk, pages);
  addChair(chair);
  addDisplay(plinth, panel, trim);
  addTable(table, hello);
  addGarden(garden, stone);
  return {
    paving: buildFieldnotesPaving(),
    terraces: toGeometry(terraces),
    stone: toGeometry(stone),
    timber: toGeometry(timber),
    charcoal: toGeometry(charcoal),
    copper: toGeometry(copper),
    garden: toGeometry(garden),
    desk: toGeometry(desk),
    chair: toGeometry(chair),
    pages: toGeometry(pages),
    plinth: toGeometry(plinth),
    panel: toGeometry(panel),
    trim: toGeometry(trim),
    table: toGeometry(table),
    hello: toGeometry(hello),
  };
}

export function triangleCount(geometry) {
  const index = geometry.getIndex();
  return index ? index.count / 3 : geometry.getAttribute("position").count / 3;
}

export function fieldnotesMeshBudget(built = buildFieldnotesGeometry()) {
  let triangles = 0,
    bytes = 0;
  for (const geometry of Object.values(built)) {
    triangles += triangleCount(geometry);
    for (const attribute of Object.values(geometry.attributes))
      bytes += attribute.array.byteLength;
    if (geometry.index) bytes += geometry.index.array.byteLength;
  }
  return {
    triangles,
    bytes,
    materials: fieldnotesMaterialNames.length,
  };
}

export function disposeFieldnotes(built) {
  for (const geometry of Object.values(built)) geometry.dispose();
}
