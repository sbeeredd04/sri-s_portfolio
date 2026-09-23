import {
  BufferGeometry,
  Euler,
  Float32BufferAttribute,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { cityBatchGeometry } from "./sf-neighborhood.mjs";
import { surfaceHeight } from "./world-layout.mjs";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";
import { wallClock } from "./world-time.mjs";

// Miniature tributes. The plan is not a map, an address, or a workplace.
export const towerSite = {
  x: 29.2,
  z: 3.4,
  width: 8.6,
  depth: 9.2,
  corner: 2.2,
  shaftTop: 26.2,
  crownTop: 30,
};
export const marketSite = {
  x: 27.6,
  z: -33.55,
  length: 23.6,
  depth: 7.4,
  wingHeight: 6.35,
  clockHeight: 17.3,
  towerWidth: 3.8,
};
const eastStreetX = 11.5;
const carriage = 1.4;

export function towerPlanScale(t) {
  const u = Math.max(0, Math.min(1, t));
  return {
    x: 1 - 0.18 * u ** 1.7,
    z: 1 - 0.31 * u ** 1.18,
  };
}

function terrainY(x, z) {
  return Math.min(
    surfaceHeight("studio", x, z),
    renderedSurfaceHeight("studio", x, z),
  );
}
function pad(xs, zs) {
  const samples = xs.flatMap((x) => zs.map((z) => terrainY(x, z)));
  const low = Math.min(...samples);
  const high = Math.max(...samples);
  return {
    low,
    high,
    plinthBottom: low - 0.14,
    plinthTop: high + 0.12,
    foundationBottom: low - 0.72,
  };
}
function boundsOf(x, z, hx, hz) {
  return { minX: x - hx, maxX: x + hx, minZ: z - hz, maxZ: z + hz };
}
function roundedRectPoints(width, depth, radius, cornerSegs, straightSegs) {
  const hx = width / 2,
    hz = depth / 2,
    r = Math.min(radius, hx - 0.04, hz - 0.04),
    ix = hx - r,
    iz = hz - r,
    pts = [];
  const push = (x, z) => {
    const last = pts.at(-1);
    if (!last || Math.hypot(last[0] - x, last[1] - z) > 1e-4) pts.push([x, z]);
  };
  const corner = (cx, cz, a0) => {
    for (let i = 1; i <= cornerSegs; i++) {
      const a = a0 + ((Math.PI / 2) * i) / cornerSegs;
      push(cx + Math.cos(a) * r, cz + Math.sin(a) * r);
    }
  };
  for (let i = 0; i <= straightSegs; i++)
    push(hx, -iz + (2 * iz * i) / straightSegs);
  corner(ix, iz, 0);
  for (let i = 1; i <= straightSegs; i++)
    push(ix - (2 * ix * i) / straightSegs, hz);
  corner(-ix, iz, Math.PI / 2);
  for (let i = 1; i <= straightSegs; i++)
    push(-hx, iz - (2 * iz * i) / straightSegs);
  corner(-ix, -iz, Math.PI);
  for (let i = 1; i <= straightSegs; i++)
    push(-ix + (2 * ix * i) / straightSegs, -hz);
  corner(ix, -iz, Math.PI * 1.5);
  return pts;
}
function ringAt(y, scale, outset = 0) {
  const pts = roundedRectPoints(
    towerSite.width * scale.x + outset * 2,
    towerSite.depth * scale.z + outset * 2,
    towerSite.corner * Math.min(scale.x, scale.z) + outset,
    3,
    4,
  );
  return pts.map(([x, z]) => new Vector3(towerSite.x + x, y, towerSite.z + z));
}
function radialOut(point) {
  return new Vector3(point.x - towerSite.x, 0, point.z - towerSite.z);
}
function pushTri(positions, normals, a, b, c) {
  const n = new Vector3().crossVectors(b.clone().sub(a), c.clone().sub(a));
  if (n.lengthSq() < 1e-12) return;
  n.normalize();
  for (const p of [a, b, c]) {
    positions.push(p.x, p.y, p.z);
    normals.push(n.x, n.y, n.z);
  }
}
function addQuad(positions, normals, a, b, c, d, outward) {
  const n = new Vector3().crossVectors(b.clone().sub(a), d.clone().sub(a));
  if (n.dot(outward) < 0) {
    pushTri(positions, normals, a, d, c);
    pushTri(positions, normals, a, c, b);
  } else {
    pushTri(positions, normals, a, b, c);
    pushTri(positions, normals, a, c, d);
  }
}
function connectRings(positions, normals, lower, upper, skip) {
  for (let i = 0; i < lower.length; i++) {
    const j = (i + 1) % lower.length;
    const mid = lower[i]
      .clone()
      .add(lower[j])
      .add(upper[j])
      .add(upper[i])
      .multiplyScalar(0.25);
    if (skip?.(mid)) continue;
    addQuad(
      positions,
      normals,
      lower[i],
      lower[j],
      upper[j],
      upper[i],
      radialOut(mid),
    );
  }
}
function geometryFrom(positions, normals) {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}
function mergeShell(parts) {
  const geometry = parts.length === 1 ? parts[0] : mergeGeometries(parts);
  if (parts.length > 1) parts.forEach((part) => part.dispose());
  geometry.computeBoundingSphere();
  return geometry;
}
function towerDoor(point, includeBase = false) {
  return (
    point.x < towerSite.x - towerSite.width * 0.28 &&
    Math.abs(point.z - towerSite.z) < 1.18 &&
    point.y < 3.72 &&
    (includeBase || point.y > 0.05)
  );
}
function crownProfile(u) {
  const top = towerPlanScale(1);
  const t = Math.max(0, Math.min(1, u));
  const k = t * (0.7 + 0.3 * t);
  return { x: top.x * (1 - 0.36 * k), z: top.z * (1 - 0.44 * k) };
}
function profilePoint(y, scale, u, outset = 0) {
  const pts = roundedRectPoints(
    towerSite.width * scale.x + outset * 2,
    towerSite.depth * scale.z + outset * 2,
    towerSite.corner * Math.min(scale.x, scale.z) + outset,
    3,
    4,
  );
  const wrapped = ((u % 1) + 1) % 1;
  const f = wrapped * pts.length;
  const i0 = Math.floor(f) % pts.length;
  const i1 = (i0 + 1) % pts.length;
  const t = f - Math.floor(f);
  return new Vector3(
    towerSite.x + pts[i0][0] * (1 - t) + pts[i1][0] * t,
    y,
    towerSite.z + pts[i0][1] * (1 - t) + pts[i1][1] * t,
  );
}
function addRibbon(positions, normals, samples, halfWidth, lift, skip) {
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    const mid = a.clone().add(b).multiplyScalar(0.5);
    if (skip?.(mid)) continue;
    const out = radialOut(mid);
    if (out.lengthSq() < 1e-8) continue;
    out.normalize();
    const side = new Vector3()
      .crossVectors(out, new Vector3(0, 1, 0))
      .normalize()
      .multiplyScalar(halfWidth);
    const proud = out.clone().multiplyScalar(lift);
    addQuad(
      positions,
      normals,
      a.clone().add(proud).sub(side),
      a.clone().add(proud).add(side),
      b.clone().add(proud).add(side),
      b.clone().add(proud).sub(side),
      out,
    );
  }
}
function fanCap(positions, normals, ring, y, upward) {
  const center = new Vector3(towerSite.x, y, towerSite.z);
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i].clone().setY(y);
    const b = ring[(i + 1) % ring.length].clone().setY(y);
    if (upward) pushTri(positions, normals, center, a, b);
    else pushTri(positions, normals, center, b, a);
  }
}
function addLouverBand(positions, normals, y, scale, proud, thick) {
  const outerLo = ringAt(y, scale, proud);
  const outerHi = ringAt(y + thick, scale, proud);
  const innerLo = ringAt(y, scale, 0.002);
  const innerHi = ringAt(y + thick, scale, 0.002);
  connectRings(positions, normals, outerLo, outerHi);
  for (let i = 0; i < outerHi.length; i++) {
    const j = (i + 1) % outerHi.length;
    addQuad(
      positions,
      normals,
      innerHi[i],
      innerHi[j],
      outerHi[j],
      outerHi[i],
      new Vector3(0, 1, 0),
    );
    addQuad(
      positions,
      normals,
      outerLo[i],
      outerLo[j],
      innerLo[j],
      innerLo[i],
      new Vector3(0, -1, 0),
    );
  }
}
function buildTowerShells(base) {
  const shells = {
    towerGlass: [],
    shade: [],
    crown: [],
    pale: [],
    louver: [],
  };
  const steps = 16;
  const rings = [];
  const span = towerSite.crownTop - towerSite.shaftTop;
  const throatU = 0.1;
  for (let i = 0; i <= steps; i++) {
    const y = base + ((towerSite.shaftTop - base) * i) / steps;
    const scale = towerPlanScale((y - base) / (towerSite.shaftTop - base));
    rings.push(ringAt(y, scale));
  }
  for (let i = 1; i <= 3; i++) {
    const u = (throatU * i) / 3;
    rings.push(ringAt(towerSite.shaftTop + span * u, crownProfile(u)));
  }
  const glassP = [],
    glassN = [];
  for (let level = 0; level < rings.length - 1; level++)
    connectRings(glassP, glassN, rings[level], rings[level + 1], towerDoor);
  shells.towerGlass.push(geometryFrom(glassP, glassN));
  const capP = [],
    capN = [];
  const plinthBottom = Math.min(base - 0.52, -0.02);
  const plinthOuter = ringAt(plinthBottom, towerPlanScale(0), 0.18);
  const plinthLip = ringAt(base, towerPlanScale(0), 0.18);
  const plinthInnerTop = ringAt(base, towerPlanScale(0), 0.02);
  for (let i = 0; i < plinthOuter.length; i++) {
    const j = (i + 1) % plinthOuter.length;
    const mid = plinthOuter[i].clone().add(plinthLip[j]).multiplyScalar(0.5);
    if (towerDoor(mid, true)) continue;
    addQuad(
      capP,
      capN,
      plinthOuter[i],
      plinthOuter[j],
      plinthLip[j],
      plinthLip[i],
      radialOut(mid),
    );
    addQuad(
      capP,
      capN,
      plinthInnerTop[i],
      plinthInnerTop[j],
      plinthLip[j],
      plinthLip[i],
      new Vector3(0, 1, 0),
    );
  }
  shells.pale.push(geometryFrom(capP, capN));
  const shadeP = [],
    shadeN = [];
  const floorCount = 14;
  const floorLow = Math.max(base + 3.5, 4.05);
  const floorHigh = towerSite.shaftTop - 0.4;
  for (let f = 0; f < floorCount; f++) {
    const y = floorLow + ((floorHigh - floorLow) * f) / (floorCount - 1);
    const scale = towerPlanScale((y - base) / (towerSite.shaftTop - base));
    const lower = ringAt(y, scale, 0.016);
    const upper = ringAt(y + 0.03, scale, 0.038);
    connectRings(shadeP, shadeN, lower, upper, towerDoor);
    const lip = ringAt(y + 0.03, scale, 0);
    for (let i = 0; i < lip.length; i++) {
      const j = (i + 1) % lip.length;
      const mid = lip[i].clone().add(upper[j]).multiplyScalar(0.5);
      if (towerDoor(mid)) continue;
      addQuad(
        shadeP,
        shadeN,
        lip[i],
        lip[j],
        upper[j],
        upper[i],
        new Vector3(0, 1, 0),
      );
    }
  }
  const mullionU = [
    1 / 29,
    3 / 29,
    8.5 / 29,
    10.5 / 29,
    15 / 29,
    17 / 29,
    22.5 / 29,
    24.5 / 29,
  ];
  for (const u of mullionU) {
    const samples = [];
    for (let i = 0; i <= 16; i++) {
      const y = floorLow + ((towerSite.shaftTop - 0.15 - floorLow) * i) / 16;
      const scale = towerPlanScale((y - base) / (towerSite.shaftTop - base));
      samples.push(profilePoint(y, scale, u, 0));
    }
    addRibbon(shadeP, shadeN, samples, 0.018, 0.05, towerDoor);
  }
  const throat = rings.at(-1);
  const throatInner = ringAt(throat[0].y, crownProfile(throatU), -0.2);
  for (let i = 0; i < throat.length; i++) {
    const j = (i + 1) % throat.length;
    addQuad(
      shadeP,
      shadeN,
      throatInner[i],
      throatInner[j],
      throat[j],
      throat[i],
      new Vector3(0, 1, 0),
    );
  }
  shells.shade.push(geometryFrom(shadeP, shadeN));
  const crownP = [],
    crownN = [];
  let coreBottom = null;
  let coreTop = null;
  let previous = null;
  const coreSteps = 6;
  for (let i = 0; i <= coreSteps; i++) {
    const u = 0.12 + (0.83 * i) / coreSteps;
    const y = towerSite.shaftTop + span * u;
    const ring = ringAt(y, crownProfile(u), -0.2);
    if (i === 0) coreBottom = ring;
    if (i === coreSteps) coreTop = ring;
    if (previous) connectRings(crownP, crownN, previous, ring);
    previous = ring;
  }
  fanCap(crownP, crownN, coreBottom, coreBottom[0].y, false);
  fanCap(crownP, crownN, coreTop, coreTop[0].y, true);
  shells.crown.push(geometryFrom(crownP, crownN));
  const louverP = [],
    louverN = [];
  const louverCount = 22;
  for (let i = 0; i < louverCount; i++) {
    const u = 0.03 + (0.93 * i) / (louverCount - 1);
    const y = towerSite.shaftTop + span * u;
    addLouverBand(
      louverP,
      louverN,
      y,
      crownProfile(u),
      0.018 + 0.04 * u,
      0.016,
    );
  }
  const seamU = [2 / 29, 8.7 / 29, 10.3 / 29, 16.5 / 29, 22.7 / 29, 24.3 / 29];
  for (const u of seamU) {
    const samples = [];
    for (let i = 0; i <= 10; i++) {
      const t = 0.04 + (0.92 * i) / 10;
      const y = towerSite.shaftTop + span * t;
      samples.push(profilePoint(y, crownProfile(t), u, 0.02));
    }
    addRibbon(louverP, louverN, samples, 0.014, 0.07);
  }
  const lidY = towerSite.crownTop - 0.03;
  const lidScale = crownProfile(0.98);
  const lidBot = ringAt(lidY - 0.04, lidScale, 0.02);
  const lidTop = ringAt(lidY, lidScale, 0.02);
  connectRings(louverP, louverN, lidBot, lidTop);
  fanCap(louverP, louverN, lidTop, lidY, true);
  shells.louver.push(geometryFrom(louverP, louverN));
  return shells;
}

function addBox(batches, tone, position, size, rotation = [0, 0, 0]) {
  (batches[tone] ||= []).push({ position, size, rotation });
}
function faceBasis(nx, nz) {
  const normal = new Vector3(nx, 0, nz).normalize();
  const xAxis = new Vector3()
    .crossVectors(new Vector3(0, 1, 0), normal)
    .normalize();
  const yAxis = new Vector3().crossVectors(normal, xAxis).normalize();
  return { normal, xAxis, yAxis };
}
function addArch(batches, cx, z, radius, spring, y0, outward, infill = true) {
  const segments = 8;
  const zc = z + outward * 0.12;
  for (let i = 0; i < segments; i++) {
    const a0 = Math.PI - (Math.PI * i) / segments;
    const a1 = Math.PI - (Math.PI * (i + 1)) / segments;
    const am = (a0 + a1) / 2;
    addBox(
      batches,
      "trim",
      [cx + Math.cos(am) * radius, y0 + spring + Math.sin(am) * radius, zc],
      [0.2, radius * (Math.PI / segments) * 1.12, 0.26],
      [0, 0, am - Math.PI / 2],
    );
  }
  if (infill)
    addBox(
      batches,
      iTone(cx),
      [cx, y0 + spring * 0.48, z - outward * 0.28],
      [radius * 1.55, spring * 0.82, 0.04],
    );
}
function iTone(x) {
  return Math.round(x) % 2 === 0 ? "glow" : "glass";
}
function pierXs(centers, pitch) {
  const xs = [centers[0] - pitch / 2];
  for (let i = 0; i < centers.length - 1; i++)
    xs.push((centers[i] + centers[i + 1]) / 2);
  xs.push(centers.at(-1) + pitch / 2);
  return xs;
}
function addFacade(batches, z, outward, base) {
  const half = marketSite.towerWidth / 2;
  const left0 = marketSite.x - marketSite.length / 2 + 0.35;
  const left1 = marketSite.x - half - 0.2;
  const right0 = marketSite.x + half + 0.2;
  const right1 = marketSite.x + marketSite.length / 2 - 0.35;
  const spring = 2.15;
  for (const [x0, x1] of [
    [left0, left1],
    [right0, right1],
  ]) {
    const count = 4;
    const pitch = (x1 - x0) / count;
    const centers = Array.from(
      { length: count },
      (_, i) => x0 + pitch * (i + 0.5),
    );
    const radius = pitch * 0.34;
    for (const x of pierXs(centers, pitch))
      addBox(
        batches,
        "pale",
        [x, base + spring / 2, z + outward * 0.08],
        [Math.min(0.42, pitch * 0.3), spring, 0.36],
      );
    for (const cx of centers)
      addArch(batches, cx, z, radius, spring, base, outward);
    addBox(
      batches,
      "pale",
      [(x0 + x1) / 2, base + spring + radius + 0.28, z + outward * 0.06],
      [x1 - x0, 0.5, 0.32],
    );
  }
  addArch(batches, marketSite.x, z, 1.22, 2.45, base, outward, false);
  for (const side of [-1, 1])
    addBox(
      batches,
      "pale",
      [marketSite.x + side * (half - 0.24), base + 1.95, z + outward * 0.08],
      [0.42, 3.9, 0.4],
    );
}
function addMarketRoof(positions, normals, base) {
  const yE = base + 4.22,
    yR = base + marketSite.wingHeight;
  const half = marketSite.towerWidth / 2 + 0.08;
  const zN = marketSite.z + marketSite.depth / 2 + 0.42;
  const zS = marketSite.z - marketSite.depth / 2 - 0.42;
  for (const [x0, x1] of [
    [marketSite.x - marketSite.length / 2 - 0.15, marketSite.x - half],
    [marketSite.x + half, marketSite.x + marketSite.length / 2 + 0.15],
  ]) {
    const north = [
      new Vector3(x0, yE, zN),
      new Vector3(x1, yE, zN),
      new Vector3(x1, yR, marketSite.z),
      new Vector3(x0, yR, marketSite.z),
    ];
    const south = [
      new Vector3(x0, yR, marketSite.z),
      new Vector3(x1, yR, marketSite.z),
      new Vector3(x1, yE, zS),
      new Vector3(x0, yE, zS),
    ];
    for (const quad of [north, south]) {
      const n = new Vector3()
        .crossVectors(
          quad[1].clone().sub(quad[0]),
          quad[3].clone().sub(quad[0]),
        )
        .normalize();
      if (n.y < 0) n.negate();
      const thick = quad.map((p) => p.clone().addScaledVector(n, -0.08));
      addQuad(positions, normals, quad[0], quad[1], quad[2], quad[3], n);
      addQuad(
        positions,
        normals,
        thick[0],
        thick[3],
        thick[2],
        thick[1],
        n.clone().negate(),
      );
    }
  }
}
function addStreet(batches, along, fixed, from, to, cuts) {
  const step = along === "x" ? 1 : -1;
  for (
    let cursor = from;
    step > 0 ? cursor <= to : cursor >= to;
    cursor += step
  ) {
    const x = along === "x" ? cursor : fixed;
    const z = along === "z" ? cursor : fixed;
    const y = terrainY(x, z);
    addBox(
      batches,
      "asphalt",
      [x, y + 0.025, z],
      along === "x" ? [1.02, 0.05, carriage * 2] : [carriage * 2, 0.05, 1.02],
    );
    for (const side of [-1, 1]) {
      const cx = along === "x" ? x : x + side * (carriage + 0.1);
      const cz = along === "z" ? z : z + side * (carriage + 0.1);
      if (
        cuts.some(
          (cut) =>
            Math.abs(cx - cut[0]) < cut[2] && Math.abs(cz - cut[1]) < cut[3],
        )
      )
        continue;
      addBox(
        batches,
        "paving",
        [cx, y + 0.09, cz],
        along === "x" ? [1.02, 0.16, 0.18] : [0.18, 0.16, 1.02],
      );
    }
  }
}
function clockMarks(batches, origin, basis) {
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const radial = basis.xAxis
      .clone()
      .multiplyScalar(Math.sin(a))
      .addScaledVector(basis.yAxis, Math.cos(a));
    const side = new Vector3().crossVectors(basis.normal, radial).normalize();
    const q = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(side, radial, basis.normal),
    );
    const e = new Euler().setFromQuaternion(q, "XYZ");
    addBox(
      batches,
      "ink",
      origin
        .clone()
        .addScaledVector(radial, 0.58)
        .addScaledVector(basis.normal, 0.03)
        .toArray(),
      [0.045, 0.14, 0.02],
      [e.x, e.y, e.z],
    );
  }
}

export function marketClockMounts(y) {
  const { x, z, towerWidth } = marketSite;
  const offset = towerWidth / 2 + 0.08;
  return [
    [0, 0, 1, z + offset],
    [0, 0, -1, z - offset],
    [1, 0, 0, x + offset],
    [-1, 0, 0, x - offset],
  ].map(([nx, , nz, plane]) => {
    const basis = faceBasis(nx, nz);
    const position = new Vector3(x, y, z).addScaledVector(basis.normal, offset);
    if (Math.abs(nx) > 0.5) position.x = plane;
    else position.z = plane;
    const q = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(basis.xAxis, basis.yAxis, basis.normal),
    );
    return {
      position: position.toArray(),
      quaternion: q,
    };
  });
}
export function clockHandRadians(date) {
  const { hour, minute } = wallClock(date);
  const hours = (hour % 12) + minute / 60;
  return {
    hour: (-hours * Math.PI) / 6,
    minute: (-minute * Math.PI) / 30,
  };
}

export function landmarkLayout() {
  const towerPad = pad(
    [towerSite.x - towerSite.width / 2, towerSite.x + towerSite.width / 2],
    [towerSite.z - towerSite.depth / 2, towerSite.z + towerSite.depth / 2],
  );
  const marketPad = pad(
    [
      marketSite.x - marketSite.length / 2,
      marketSite.x + marketSite.length / 2,
    ],
    [marketSite.z - marketSite.depth / 2, marketSite.z + marketSite.depth / 2],
  );
  const towerWest = towerSite.x - towerSite.width / 2;
  const marketNorth = marketSite.z + marketSite.depth / 2;
  const roadZ = marketNorth + 1.45 + carriage;
  return {
    towerPad,
    marketPad,
    roadZ,
    tower: boundsOf(
      towerSite.x,
      towerSite.z,
      towerSite.width / 2 + 0.28,
      towerSite.depth / 2 + 0.28,
    ),
    market: boundsOf(
      marketSite.x,
      marketSite.z,
      marketSite.length / 2 + 0.5,
      marketSite.depth / 2 + 0.55,
    ),
    carriageways: [
      boundsOf(eastStreetX, -8, carriage, 16),
      boundsOf((13.2 + 23.4) / 2, towerSite.z, (23.4 - 13.2) / 2, carriage),
      boundsOf(eastStreetX, (-23 + -39) / 2, carriage, (39 - 23) / 2),
      boundsOf((13 + 40) / 2, roadZ, (40 - 13) / 2, carriage),
    ],
    approaches: [
      boundsOf(
        (21.6 + towerWest) / 2,
        towerSite.z,
        (towerWest - 21.6) / 2,
        1.35,
      ),
      boundsOf(
        marketSite.x,
        (marketNorth + roadZ - carriage) / 2,
        1.7,
        Math.abs(marketNorth - (roadZ - carriage)) / 2,
      ),
    ],
  };
}

function addBelfryArch(batches, nx, nz, along, y0) {
  const basis = faceBasis(nx, nz);
  const radius = 0.58;
  const spring = 1.88;
  const segments = 6;
  const face = (marketSite.towerWidth - 0.2) / 2;
  const origin = new Vector3(marketSite.x, y0 + spring, marketSite.z)
    .addScaledVector(basis.normal, face + 0.12)
    .addScaledVector(basis.xAxis, along);
  for (let i = 0; i < segments; i++) {
    const am = Math.PI - (Math.PI * (i + 0.5)) / segments;
    const radial = basis.xAxis
      .clone()
      .multiplyScalar(Math.cos(am))
      .addScaledVector(basis.yAxis, Math.sin(am));
    const tangent = basis.xAxis
      .clone()
      .multiplyScalar(-Math.sin(am))
      .addScaledVector(basis.yAxis, Math.cos(am))
      .normalize();
    const xDir = new Vector3().crossVectors(tangent, basis.normal).normalize();
    const q = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeBasis(xDir, tangent, basis.normal),
    );
    const e = new Euler().setFromQuaternion(q, "XYZ");
    addBox(
      batches,
      "trim",
      origin.clone().addScaledVector(radial, radius).toArray(),
      [0.15, radius * (Math.PI / segments) * 1.18, 0.18],
      [e.x, e.y, e.z],
    );
  }
  for (const side of [-1, 1]) {
    const pos = new Vector3(marketSite.x, y0 + spring * 0.5, marketSite.z)
      .addScaledVector(basis.normal, face + 0.09)
      .addScaledVector(basis.xAxis, along + side * radius);
    addBox(
      batches,
      "stone",
      pos.toArray(),
      Math.abs(nx) > 0.5 ? [0.16, spring, 0.14] : [0.14, spring, 0.16],
    );
  }
  const putVoid = (y, height, span) => {
    const pos = new Vector3(marketSite.x, y, marketSite.z)
      .addScaledVector(basis.normal, face + 0.03)
      .addScaledVector(basis.xAxis, along);
    addBox(
      batches,
      "ink",
      pos.toArray(),
      Math.abs(nx) > 0.5 ? [0.04, height, span] : [span, height, 0.04],
    );
  };
  putVoid(y0 + spring * 0.5, spring, radius * 1.9);
  const fan = 4;
  for (let i = 0; i < fan; i++) {
    const h0 = (radius * i) / fan;
    const h1 = (radius * (i + 1)) / fan;
    const mid = (h0 + h1) / 2;
    const half = Math.sqrt(Math.max(0, radius * radius - mid * mid));
    putVoid(y0 + spring + mid, h1 - h0 + 0.02, Math.max(0.08, half * 1.84));
  }
}
function addClockTowerShaft(batches, base) {
  const width = marketSite.towerWidth - 0.2;
  const face = width / 2;
  addBox(
    batches,
    "pale",
    [marketSite.x, base + 8.85, marketSite.z],
    [width, 10.1, width],
  );
  const band = (y, height, extra, tone) =>
    addBox(
      batches,
      tone,
      [marketSite.x, base + y, marketSite.z],
      [width + extra, height, width + extra],
    );
  band(7.02, 0.15, 0.12, "stone");
  band(10.28, 0.16, 0.24, "trim");
  band(13.22, 0.14, 0.2, "stone");
  band(13.44, 0.18, 0.44, "trim");
  band(13.7, 0.2, 0.66, "trim");
  band(13.96, 0.14, 0.4, "stone");
  band(14.14, 0.1, 0.22, "trim");
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addBox(
        batches,
        "stone",
        [
          marketSite.x + sx * (face - 0.02),
          base + 10.15,
          marketSite.z + sz * (face - 0.02),
        ],
        [0.36, 6.36, 0.36],
      );
    }
  }
  for (const [nx, nz] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]) {
    const basis = faceBasis(nx, nz);
    const place = (along, y, height, span, depth, proud, tone) => {
      const pos = new Vector3(marketSite.x, base + y, marketSite.z)
        .addScaledVector(basis.normal, face + proud)
        .addScaledVector(basis.xAxis, along);
      addBox(
        batches,
        tone,
        pos.toArray(),
        Math.abs(nx) > 0.5 ? [depth, height, span] : [span, height, depth],
      );
    };
    for (const along of [-0.72, 0.72])
      place(along, 8.58, 2.64, 0.4, 0.04, 0.028, "ink");
    place(0, 8.58, 2.64, 0.16, 0.14, 0.08, "stone");
    place(0, 11.28, 1.55, 0.16, 0.15, 0.09, "stone");
    for (const along of [-0.72, 0.72])
      addBelfryArch(batches, nx, nz, along, base + 10.36);
  }
}

export function buildLandmarks() {
  const layout = landmarkLayout();
  const batches = {};
  const { towerPad, marketPad, roadZ } = layout;
  const shells = buildTowerShells(towerPad.plinthTop);
  addBox(
    batches,
    "stone",
    [towerSite.x, (towerPad.foundationBottom - 0.04) / 2, towerSite.z],
    [
      towerSite.width - 0.9,
      -0.04 - towerPad.foundationBottom,
      towerSite.depth - 0.9,
    ],
  );
  addBox(
    batches,
    "glass",
    [
      towerSite.x - towerSite.width / 2 - 0.55,
      towerPad.plinthTop + 1.7,
      towerSite.z,
    ],
    [0.06, 2.7, 1.7],
  );
  addBox(
    batches,
    "trim",
    [
      towerSite.x - towerSite.width / 2 - 0.72,
      towerPad.plinthTop + 3.55,
      towerSite.z,
    ],
    [1.35, 0.1, 2.7],
  );
  addBox(
    batches,
    "glow",
    [towerSite.x - 1.2, towerPad.plinthTop + 1.6, towerSite.z],
    [1.4, 0.9, 1.5],
  );
  addBox(
    batches,
    "stone",
    [
      marketSite.x,
      (marketPad.foundationBottom + marketPad.plinthTop) / 2,
      marketSite.z,
    ],
    [
      marketSite.length + 0.4,
      marketPad.plinthTop - marketPad.foundationBottom,
      marketSite.depth + 0.4,
    ],
  );
  const northZ = marketSite.z + marketSite.depth / 2;
  const southZ = marketSite.z - marketSite.depth / 2;
  addFacade(batches, northZ, 1, marketPad.plinthTop);
  addFacade(batches, southZ, -1, marketPad.plinthTop);
  const west = marketSite.x - marketSite.length / 2;
  const doorHalf = 0.68;
  for (const [z0, z1] of [
    [southZ + 0.25, marketSite.z - doorHalf],
    [marketSite.z + doorHalf, northZ - 0.25],
  ])
    addBox(
      batches,
      "pale",
      [west + 0.18, marketPad.plinthTop + 2.05, (z0 + z1) / 2],
      [0.36, 4.1, Math.abs(z1 - z0)],
    );
  addBox(
    batches,
    "pale",
    [west + 0.18, marketPad.plinthTop + 3.55, marketSite.z],
    [0.36, 1.15, doorHalf * 2],
  );
  addBox(
    batches,
    "glass",
    [west - 0.02, marketPad.plinthTop + 1.45, marketSite.z],
    [0.06, 2.2, 1.15],
  );
  addBox(
    batches,
    "pale",
    [
      marketSite.x + marketSite.length / 2 - 0.18,
      marketPad.plinthTop + 2.15,
      marketSite.z,
    ],
    [0.36, 4.3, marketSite.depth - 0.4],
  );
  const half = marketSite.towerWidth / 2;
  addClockTowerShaft(batches, marketPad.plinthTop);
  addBox(
    batches,
    "pale",
    [marketSite.x, marketPad.plinthTop + 15.15, marketSite.z],
    [marketSite.towerWidth + 0.2, 1.9, marketSite.towerWidth + 0.2],
  );
  const clockY = marketPad.plinthTop + 15.15;
  for (const [nx, nz] of [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ]) {
    const basis = faceBasis(nx, nz);
    const origin = new Vector3(
      marketSite.x,
      clockY,
      marketSite.z,
    ).addScaledVector(basis.normal, half + 0.12);
    clockMarks(batches, origin, basis);
  }
  const roofP = [],
    roofN = [];
  addMarketRoof(roofP, roofN, marketPad.plinthTop);
  const capBase = marketPad.plinthTop + 16.15;
  const apex = new Vector3(
    marketSite.x,
    marketPad.plinthTop + marketSite.clockHeight,
    marketSite.z,
  );
  const cap = [
    [half + 0.15, half + 0.15],
    [-half - 0.15, half + 0.15],
    [-half - 0.15, -half - 0.15],
    [half + 0.15, -half - 0.15],
  ].map(
    ([dx, dz]) => new Vector3(marketSite.x + dx, capBase, marketSite.z + dz),
  );
  for (let i = 0; i < 4; i++) {
    const a = cap[i],
      b = cap[(i + 1) % 4];
    const wound = new Vector3().crossVectors(
      b.clone().sub(a),
      apex.clone().sub(a),
    );
    const mid = a
      .clone()
      .add(b)
      .add(apex)
      .multiplyScalar(1 / 3);
    const outward = new Vector3(
      mid.x - marketSite.x,
      0.2,
      mid.z - marketSite.z,
    );
    if (wound.dot(outward) < 0) pushTri(roofP, roofN, a, apex, b);
    else pushTri(roofP, roofN, a, b, apex);
  }
  shells.oxide = [geometryFrom(roofP, roofN)];

  const towerCuts = [[eastStreetX + carriage + 0.1, towerSite.z, 1.4, 2.1]];
  const marketCuts = [
    [eastStreetX + carriage + 0.1, roadZ, 1.6, 2.2],
    [marketSite.x, roadZ - carriage - 0.1, 2.2, 1.2],
  ];
  addStreet(batches, "x", towerSite.z, 13.5, 23.5, [
    [14.2, towerSite.z + carriage + 0.1, 1.6, 0.5],
    [14.2, towerSite.z - carriage - 0.1, 1.6, 0.5],
    ...towerCuts,
  ]);
  addStreet(batches, "z", eastStreetX, -23, -39, [
    [eastStreetX + carriage + 0.1, roadZ, 0.6, 2.2],
  ]);
  addStreet(batches, "x", roadZ, 13.5, 40.5, marketCuts);
  addBox(
    batches,
    "paving",
    [
      (21.4 + (towerSite.x - towerSite.width / 2)) / 2,
      terrainY(23, towerSite.z) + 0.05,
      towerSite.z,
    ],
    [towerSite.x - towerSite.width / 2 - 21.4, 0.08, 3.1],
  );
  addBox(
    batches,
    "paving",
    [
      marketSite.x,
      terrainY(marketSite.x, northZ + 0.8) + 0.05,
      (northZ + roadZ - carriage) / 2,
    ],
    [3.4, 0.08, Math.abs(northZ - (roadZ - carriage))],
  );
  addBox(
    batches,
    "paving",
    [(13.05 + west) / 2, terrainY(14.4, marketSite.z) + 0.05, marketSite.z],
    [west - 13.05, 0.08, 2.2],
  );
  const overlookNorth = southZ + 0.05;
  const overlookSouth = -40.45;
  const overlookZ = (overlookNorth + overlookSouth) / 2;
  addBox(
    batches,
    "paving",
    [27, terrainY(27, overlookZ) + 0.04, overlookZ],
    [18.5, 0.08, Math.abs(overlookSouth - overlookNorth)],
  );
  addBox(
    batches,
    "stone",
    [27, terrainY(27, -40.55) + 0.42, -40.55],
    [18.2, 0.9, 0.28],
  );
  addBox(
    batches,
    "stone",
    [17.8, terrainY(17.8, -39.2) + 0.42, -39.2],
    [0.28, 0.9, 2.8],
  );
  addBox(
    batches,
    "stone",
    [36.2, terrainY(36.2, -39.2) + 0.42, -39.2],
    [0.28, 0.9, 2.8],
  );

  const boxes = Object.fromEntries(
    Object.entries(batches).map(([tone, items]) => [
      tone,
      cityBatchGeometry(items),
    ]),
  );
  const shellGeometry = Object.fromEntries(
    Object.entries(shells).map(([tone, parts]) => [tone, mergeShell(parts)]),
  );
  return { boxes, shells: shellGeometry, layout };
}
export function disposeLandmarks(model) {
  for (const geometry of Object.values(model.boxes)) geometry.dispose();
  for (const geometry of Object.values(model.shells)) geometry.dispose();
}
