import * as THREE from "three";
import {
  dome,
  graniteForms,
  meadowTufts,
  outdoorsLift,
  overlookDeck,
  overlookElevation,
  ridge,
  talusSpots,
  wall,
  wallFrame,
  wallPoint,
  watercoursePoints,
} from "./valley-layout.mjs";
import { renderedSurfaceHeight } from "./terrain-geometry.mjs";

function geometryFrom(positions, indices, colors) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  if (colors)
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function reverseWinding(geometry) {
  const index = geometry.getIndex().array;
  for (let i = 0; i < index.length; i += 3) {
    const swap = index[i];
    index[i] = index[i + 1];
    index[i + 1] = swap;
  }
  geometry.getIndex().needsUpdate = true;
  geometry.computeVertexNormals();
}
function orient(geometry, scoreAt) {
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  let score = 0;
  for (let i = 0; i < position.count; i++)
    score += scoreAt(position, normal, i);
  if (score < 0) reverseWinding(geometry);
  return geometry;
}
function sheet(nu, nv, sample, rgb) {
  const positions = [],
    colors = [],
    indices = [],
    stride = nu + 1;
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const p = sample(i / nu, j / nv);
      positions.push(p.x, p.y, p.z);
      colors.push(rgb[0], rgb[1], rgb[2]);
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * stride + i;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  return geometryFrom(positions, indices, colors);
}
function mergeGeometries(parts) {
  let vertices = 0,
    indexes = 0;
  for (const part of parts) {
    vertices += part.attributes.position.count;
    indexes += part.index.count;
  }
  const positions = new Float32Array(vertices * 3);
  const colors = new Float32Array(vertices * 3);
  const indices = new Uint32Array(indexes);
  let vertex = 0,
    index = 0;
  for (const part of parts) {
    positions.set(part.attributes.position.array, vertex * 3);
    colors.set(part.attributes.color.array, vertex * 3);
    const source = part.index.array;
    for (let i = 0; i < source.length; i++)
      indices[index++] = source[i] + vertex;
    vertex += part.attributes.position.count;
    part.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  return geometry;
}
function outwardScore(vector) {
  return (position, normal, index) =>
    normal.getX(index) * vector.x + normal.getZ(index) * vector.z;
}

function wallBack(u, v) {
  const face = wallFrame(u, v);
  const depth = wall.thickness * (0.62 + 0.38 * (1 - v));
  const round = Math.sin(u * Math.PI) * 0.28 * (1 - v * 0.5);
  return wallPoint(face.lx - depth - round, face.y, face.lz);
}
function buildWall() {
  const nu = 40,
    nv = 28;
  const out = { x: Math.cos(wall.turn), z: Math.sin(wall.turn) };
  const along = { x: -Math.sin(wall.turn), z: Math.cos(wall.turn) };
  const face = [0.78, 0.75, 0.7];
  const mass = [0.62, 0.6, 0.56];
  const front = orient(
    sheet(nu, nv, (u, v) => wallFrame(u, v), face),
    outwardScore(out),
  );
  const back = orient(
    sheet(nu, nv, (u, v) => wallBack(u, v), mass),
    outwardScore({ x: -out.x, z: -out.z }),
  );
  const cap = (v, rgb, up) =>
    orient(
      sheet(
        nu,
        1,
        (u, side) => (side < 0.5 ? wallFrame(u, v) : wallBack(u, v)),
        rgb,
      ),
      (position, normal, index) => normal.getY(index) * up,
    );
  const end = (u, direction) =>
    orient(
      sheet(
        1,
        nv,
        (side, v) => (side < 0.5 ? wallFrame(u, v) : wallBack(u, v)),
        mass,
      ),
      outwardScore(direction),
    );
  return mergeGeometries([
    front,
    back,
    cap(1, face, 1),
    cap(0, mass, -1),
    end(0, { x: -along.x, z: -along.z }),
    end(1, along),
  ]);
}

function localTo(form, lx, y, lz) {
  const c = Math.cos(form.turn),
    s = Math.sin(form.turn);
  return {
    x: form.x + lx * c - lz * s,
    y,
    z: form.z + lx * s + lz * c,
  };
}
function buildDome() {
  const rings = 22,
    sides = 34;
  const shoulder = sheet(
    sides,
    rings,
    (u, v) => {
      const angle = -2.2 + 4.4 * u;
      const profile = Math.cos(v * Math.PI * 0.5) ** 0.45;
      const y = -0.42 + Math.sin(v * Math.PI * 0.5) ** 0.92 * dome.height;
      const joint = Math.sin(angle * 8 + dome.seed) * 0.035 * profile;
      return localTo(
        dome,
        Math.cos(angle) * dome.width * 0.5 * profile + joint,
        y,
        Math.sin(angle) * dome.depth * 0.5 * profile,
      );
    },
    [0.74, 0.72, 0.67],
  );
  const edge = (v, side) => {
    const angle = side < 0 ? -2.2 : 2.2;
    const profile = Math.cos(v * Math.PI * 0.5) ** 0.45;
    const y = -0.42 + Math.sin(v * Math.PI * 0.5) ** 0.92 * dome.height;
    return {
      y,
      z: Math.sin(angle) * dome.depth * 0.5 * profile,
      x:
        Math.cos(angle) * dome.width * 0.5 * profile +
        Math.sin(angle * 8 + dome.seed) * 0.035 * profile,
    };
  };
  const face = sheet(
    16,
    rings,
    (u, v) => {
      const left = edge(v, -1),
        right = edge(v, 1);
      const z = left.z + (right.z - left.z) * u;
      const y = left.y + (right.y - left.y) * u;
      const seam = left.x + (right.x - left.x) * u;
      const joint =
        Math.sin(u * 18 + v * 9) *
        0.04 *
        Math.sin(v * Math.PI) *
        Math.sin(u * Math.PI);
      return localTo(dome, seam + joint, y, z);
    },
    [0.8, 0.78, 0.73],
  );
  const faceNormal = {
    x: -Math.cos(dome.turn),
    z: -Math.sin(dome.turn),
  };
  return mergeGeometries([
    orient(shoulder, (position, normal, index) => normal.getY(index) + 0.15),
    orient(face, outwardScore(faceNormal)),
  ]);
}
function buildRidge() {
  // A long broken ridgeline with shoulders descending into the valley floor.
  return orient(
    sheet(
      48,
      16,
      (u, v) => {
        const lx = (u * 2 - 1) * 6.65;
        const shoulder = Math.sqrt(Math.max(0, 1 - (lx / 6.75) ** 2));
        const lz = (v * 2 - 1) * ridge.depth * 0.5 * shoulder;
        const crest =
          Math.sin(u * Math.PI) ** 0.45 *
          (0.76 + 0.15 * Math.sin(u * 17) + 0.09 * Math.sin(u * 7));
        const across = Math.sin(v * Math.PI) ** 0.72;
        return localTo(ridge, lx, -0.5 + ridge.height * crest * across, lz);
      },
      [0.67, 0.66, 0.61],
    ),
    (position, normal, index) => normal.getY(index),
  );
}

export function buildGraniteForm(form) {
  if (form.kind === "wall") return buildWall();
  if (form.kind === "dome") return buildDome();
  return buildRidge();
}

export function embedBase(geometry, heightAt, sink = 0.32) {
  const position = geometry.attributes.position;
  let minY = Infinity;
  for (let i = 0; i < position.count; i++)
    minY = Math.min(minY, position.getY(i));
  const threshold = minY + 0.22;
  for (let i = 0; i < position.count; i++) {
    if (position.getY(i) > threshold) continue;
    const target = heightAt(position.getX(i), position.getZ(i)) - sink;
    if (position.getY(i) > target) position.setY(i, target);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildTalusGeometry() {
  const positions = [],
    colors = [],
    indices = [];
  const sides = 8,
    rings = 3;
  for (let j = 0; j <= rings; j++) {
    const v = j / rings;
    const y = v * 0.34;
    const radius = (1 - v * 0.72) * (0.85 + (j % 2) * 0.05);
    for (let i = 0; i <= sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const r = radius * (0.82 + (i % 2) * 0.18);
      positions.push(Math.cos(angle) * r, y, Math.sin(angle) * r * 0.78);
      colors.push(0.68, 0.66, 0.6);
      if (j < rings && i < sides) {
        const a = j * (sides + 1) + i;
        indices.push(
          a,
          a + sides + 1,
          a + 1,
          a + 1,
          a + sides + 1,
          a + sides + 2,
        );
      }
    }
  }
  return geometryFrom(positions, indices, colors);
}

export function buildDeck(heightAt) {
  const deck = overlookDeck();
  const c = Math.cos(deck.turn),
    s = Math.sin(deck.turn);
  const nu = 6,
    nz = 4;
  const positions = [],
    colors = [],
    indices = [];
  const top = [];
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nu; i++) {
      const lx = -deck.hx + (2 * deck.hx * i) / nu;
      const lz = -deck.hz + (2 * deck.hz * j) / nz;
      const x = deck.x + lx * c - lz * s;
      const z = deck.z + lx * s + lz * c;
      top.push({ x, z });
    }
  const deckY = overlookElevation(heightAt);
  top.forEach((p) => {
    positions.push(p.x, deckY, p.z);
    colors.push(0.86, 0.8, 0.7);
  });
  const stride = nu + 1;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * stride + i;
      indices.push(a, a + stride, a + 1, a + 1, a + stride, a + stride + 1);
    }
  const skirt = (a, b) => {
    const base = positions.length / 3;
    for (const p of [a, b]) {
      positions.push(p.x, deckY, p.z, p.x, heightAt(p.x, p.z) - 0.2, p.z);
      colors.push(0.7, 0.66, 0.58, 0.7, 0.66, 0.58);
    }
    indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  };
  for (let i = 0; i < nu; i++) skirt(top[i], top[i + 1]);
  for (let i = 0; i < nu; i++)
    skirt(top[nz * stride + i + 1], top[nz * stride + i]);
  for (let j = 0; j < nz; j++) skirt(top[(j + 1) * stride], top[j * stride]);
  for (let j = 0; j < nz; j++)
    skirt(top[j * stride + nu], top[(j + 1) * stride + nu]);
  return geometryFrom(positions, indices, colors);
}

function perpendiculars(points) {
  return points.map((_, index) => {
    const a = points[Math.max(0, index - 1)],
      b = points[Math.min(points.length - 1, index + 1)];
    const dx = b.x - a.x,
      dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: -dz / len, z: dx / len };
  });
}
const WATER_SKIN = 0.025;
export function buildWaterRibbon() {
  const points = watercoursePoints();
  const ground = points.filter((point) => point.ground);
  const groundSides = perpendiculars(ground);
  let groundIndex = 0;
  const positions = [],
    uvs = [],
    kinds = [],
    fallT = [],
    indices = [];
  const fallCount = points.filter((point) => !point.ground).length;
  points.forEach((point, index) => {
    // A vertical fall has zero horizontal tangent. Its width follows the
    // cliff's ledge, instead of collapsing to zero on straight falling spans.
    const across = point.ground
      ? groundSides[groundIndex++]
      : { x: -Math.sin(wall.turn), z: Math.cos(wall.turn) };
    const edges = [-1, 1].map((sign) => [
      point.x + across.x * sign * point.half,
      point.z + across.z * sign * point.half,
    ]);
    // Ground water rides the drawn terrain, whatever its triangle size. Its
    // surface is level across the channel, so both banks share the higher.
    const level = point.ground
      ? Math.max(
          point.y,
          ...[...edges, [point.x, point.z]].map(
            ([x, z]) =>
              renderedSurfaceHeight("trail", x, z) - outdoorsLift + WATER_SKIN,
          ),
        )
      : point.y;
    for (const [side, [x, z]] of edges.entries()) {
      positions.push(x, level, z);
      uvs.push(side === 0 ? 0 : 1, index / (points.length - 1));
      kinds.push(point.ground ? 0 : 1);
      // 0 at the lip, 1 where the fall meets the pool (foam, mist).
      fallT.push(Math.min(index / Math.max(1, fallCount), 1));
    }
    if (index < points.length - 1) {
      const a = index * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute("flowKind", new THREE.Float32BufferAttribute(kinds, 1));
  geometry.setAttribute("fallT", new THREE.Float32BufferAttribute(fallT, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
export function buildBanks(heightAt) {
  const points = watercoursePoints().filter(
    (point) => point.ground && point.bank > 0,
  );
  const side = perpendiculars(points);
  const positions = [],
    indices = [];
  points.forEach((point, index) => {
    const across = side[index];
    for (const sign of [-1, 1]) {
      positions.push(
        point.x + across.x * sign * point.half,
        point.y,
        point.z + across.z * sign * point.half,
      );
      const ox = point.x + across.x * sign * (point.half + point.bank);
      const oz = point.z + across.z * sign * (point.half + point.bank);
      positions.push(ox, heightAt(ox, oz) - 0.03, oz);
    }
  });
  for (let index = 0; index < points.length - 1; index++) {
    const a = index * 4;
    indices.push(a, a + 4, a + 1, a + 1, a + 4, a + 5);
    indices.push(a + 2, a + 3, a + 6, a + 3, a + 7, a + 6);
  }
  return geometryFrom(positions, indices, null);
}

export function buildTuftGeometry() {
  const positions = [],
    indices = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const x = Math.cos(angle) * 0.09,
      z = Math.sin(angle) * 0.09;
    const base = positions.length / 3;
    positions.push(
      x,
      0,
      z,
      x + Math.cos(angle + 1.2) * 0.07,
      0,
      z + Math.sin(angle + 1.2) * 0.07,
      x * 0.25,
      0.2 + i * 0.025,
      z * 0.25,
    );
    indices.push(base, base + 1, base + 2);
  }
  return geometryFrom(positions, indices, null);
}

export function triangleCount(geometry) {
  const index = geometry.getIndex();
  return index ? index.count / 3 : geometry.attributes.position.count / 3;
}
export function valleyMeshBudget(heightAt) {
  const rocks = graniteForms.map((form) =>
    embedBase(buildGraniteForm(form), heightAt),
  );
  const talus = buildTalusGeometry();
  const deck = buildDeck(heightAt);
  const water = buildWaterRibbon();
  const banks = buildBanks(heightAt);
  const tuft = buildTuftGeometry();
  const total =
    rocks.reduce((sum, geometry) => sum + triangleCount(geometry), 0) +
    triangleCount(talus) * talusSpots().length +
    triangleCount(deck) +
    triangleCount(water) +
    triangleCount(banks) +
    triangleCount(tuft) * meadowTufts().length;
  for (const geometry of [talus, deck, water, banks, tuft, ...rocks])
    geometry.dispose();
  return total;
}
