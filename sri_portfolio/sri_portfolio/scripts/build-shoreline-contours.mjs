// node scripts/build-shoreline-contours.mjs [--check]
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { Matrix4, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { afterHoursCoastSource } from "../app/lib/authored-island-sites.mjs";
import { fieldnotesCoastSource } from "../app/lib/fieldnotes-coast-site.mjs";
import { homeSite } from "../app/lib/home-site.mjs";
import { madeCampus } from "../app/lib/made-campus-data.mjs";
import { outThereFrame } from "../app/lib/out-there-p11.mjs";
import { outThereLiveSource } from "../app/lib/out-there-site.mjs";
import { regions, WORLD_RADIUS } from "../app/lib/world-layout.mjs";

const cell = 0.125;
const tolerance = 0.12;
const outThereScale = 1 / outThereFrame.unitsPerMetre;
// Solid land and retaining walls. Water stays continuous under supported
// piers, stairs and bridges, so deck and pile silhouettes are not coastlines.
const coasts = [
  ["studio", homeSite.landform, [
    "Home_ContinuousHill", "Home_HarborSeawallCopingAndRail",
    "Home_HarborDressedStone", "Home_HarborPromenade_RetainingEdge",
    "Home_EastLandingWalk_RetainingEdge",
  ]],
  ["projects", madeCampus.source, ["Made_Platform95x80_SeawallCoping", "Made_CampusGroundTop"]],
  ["court", afterHoursCoastSource, ["AfterHours_ContinuousCoast"]],
  ["trail", outThereLiveSource, ["terrain"], outThereScale, -outThereFrame.seaLevel * outThereScale],
  ["future", fieldnotesCoastSource, ["Fieldnotes_BluffAndWaterline", "Fieldnotes_LandSurface"]],
];

async function readCoast([id, source, names, scale = 1, lift = 0]) {
  const bytes = await readFile(new URL(`../public${source.split("?")[0]}`, import.meta.url));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const { scene } = await new Promise((resolve, reject) => new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parse(Uint8Array.from(bytes).buffer, "", resolve, reject));
  scene.updateMatrixWorld(true);
  const region = regions.find((entry) => entry.id === id);
  const placement = new Matrix4().compose(region.center, region.rotation, new Vector3(1, 1, 1));
  const authored = new Matrix4().makeScale(scale, scale, scale).setPosition(0, lift, 0);
  const dry = [], wetEdges = [];
  for (const name of names) {
    const mesh = scene.getObjectByName(name);
    assert(mesh?.isMesh, `Missing ${id} coastal mesh ${name}`);
    const matrix = placement.clone().multiply(authored).multiply(mesh.matrixWorld);
    const { index, attributes: { position } } = mesh.geometry;
    const points = Array.from({ length: position.count }, (_, i) =>
      new Vector3().fromBufferAttribute(position, i).applyMatrix4(matrix));
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const triangle = [0, 1, 2].map((j) => points[index ? index.getX(i + j) : i + j]);
      const polygon = [], intersections = [];
      for (let j = 0; j < 3; j++) {
        const a = triangle[j], b = triangle[(j + 1) % 3];
        const above = a.y >= WORLD_RADIUS;
        if (above) polygon.push([a.x, a.z]);
        if (above !== (b.y >= WORLD_RADIUS)) {
          const t = (WORLD_RADIUS - a.y) / (b.y - a.y);
          const point = [a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t];
          polygon.push(point);
          intersections.push(point);
        }
      }
      if (polygon.length >= 3) dry.push(polygon);
      if (intersections.length === 2) wetEdges.push(intersections);
    }
  }
  return { id, source: source.split("?")[0], sha256, dry, wetEdges };
}

// Sample the union of all sea-clipped surfaces on a 12.5cm grid.
// Shared edges are covered once; overlapping retaining walls cannot create
// extra copies of the terrain contour. The border is padded with open water.
function gridUnion(polygons) {
  const min = [Infinity, Infinity], max = [-Infinity, -Infinity];
  for (const polygon of polygons) for (const point of polygon) {
    for (let i = 0; i < 2; i++) {
      min[i] = Math.min(min[i], point[i]);
      max[i] = Math.max(max[i], point[i]);
    }
  }
  assert(Math.hypot(Math.max(Math.abs(min[0]), Math.abs(max[0])),
    Math.max(Math.abs(min[1]), Math.abs(max[1]))) < 255, "Contour leaves level bay");
  const [x0, z0] = min.map((value) => Math.floor(value / cell) - 2);
  const width = Math.ceil(max[0] / cell) - x0 + 3;
  const height = Math.ceil(max[1] / cell) - z0 + 3;
  const grid = new Uint8Array(width * height);
  for (const polygon of polygons) {
    const lower = Math.ceil(Math.min(...polygon.map((p) => p[1])) / cell);
    const upper = Math.floor(Math.max(...polygon.map((p) => p[1])) / cell);
    for (let z = lower; z <= upper; z++) {
      const intercepts = [];
      for (let i = 0; i < polygon.length; i++) {
        const a = polygon[i], b = polygon[(i + 1) % polygon.length];
        if ((a[1] <= z * cell) === (b[1] <= z * cell)) continue;
        intercepts.push(a[0] + (b[0] - a[0]) * (z * cell - a[1]) / (b[1] - a[1]));
      }
      if (intercepts.length < 2) continue;
      const left = Math.ceil(Math.min(...intercepts) / cell - 1e-8);
      const right = Math.floor(Math.max(...intercepts) / cell + 1e-8);
      if (left <= right) {
        const row = (z - z0) * width - x0;
        grid.fill(1, row + left, row + right + 1);
      }
    }
  }
  return { grid, width, height, x0, z0 };
}

const signedArea = (points) => points.reduce((sum, [x, z], i) => {
  const [xx, zz] = points[(i + 1) % points.length];
  return sum + x * zz - z * xx;
}, 0) / 2;

function traceRings({ grid, width, height, x0, z0 }) {
  // Edge order is bottom, right, top, left. Split ambiguous diagonal cases
  // around the dry samples, leaving a narrow channel between them.
  const cases = [
    [], [3, 0], [0, 1], [3, 1], [1, 2], [3, 0, 1, 2], [0, 2], [3, 2],
    [2, 3], [2, 0], [0, 1, 2, 3], [2, 1], [1, 3], [1, 0], [0, 3], [],
  ];
  const stride = width * 2;
  const graph = new Map();
  const link = (a, b) => {
    if (!graph.has(a)) graph.set(a, []);
    if (!graph.has(b)) graph.set(b, []);
    graph.get(a).push(b);
    graph.get(b).push(a);
  };
  for (let z = 0; z < height - 1; z++) for (let x = 0; x < width - 1; x++) {
    const i = z * width + x;
    const edges = cases[grid[i] | grid[i + 1] << 1 | grid[i + width + 1] << 2 | grid[i + width] << 3];
    if (!edges.length) continue;
    const base = z * 2 * stride + x * 2;
    const midpoint = [base + 1, base + stride + 2, base + 2 * stride + 1, base + stride];
    for (let e = 0; e < edges.length; e += 2) link(midpoint[edges[e]], midpoint[edges[e + 1]]);
  }
  const rings = [];
  while (graph.size) {
    const start = graph.keys().next().value;
    const ring = [];
    let current = start, previous;
    do {
      const neighbors = graph.get(current);
      assert.equal(neighbors?.length, 2, "Open or branching waterline");
      ring.push([(x0 + (current % stride) / 2) * cell, (z0 + Math.floor(current / stride) / 2) * cell]);
      graph.delete(current);
      const next = neighbors.find((point) => point !== previous);
      previous = current;
      current = next;
    } while (current !== start);
    rings.push(ring);
  }
  return rings;
}

function nearestPoint(point, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const lengthSq = dx * dx + dz * dz;
  const t = lengthSq ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / lengthSq)) : 0;
  return [a[0] + t * dx, a[1] + t * dz];
}
function deviation(point, a, b) {
  const nearest = nearestPoint(point, a, b);
  return Math.hypot(point[0] - nearest[0], point[1] - nearest[1]);
}
function simplify(points, first, last, result) {
  let furthest = -1, error = tolerance;
  for (let i = first + 1; i < last; i++) {
    const d = deviation(points[i], points[first], points[last]);
    if (d > error) {
      furthest = i;
      error = d;
    }
  }
  if (furthest < 0) {
    result.push(points[first]);
    return;
  }
  simplify(points, first, furthest, result);
  simplify(points, furthest, last, result);
}
function contains(ring, [x, z]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [a, b] = [ring[i], ring[j]];
    if ((a[1] > z) !== (b[1] > z) &&
        x < a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])) inside = !inside;
  }
  return inside;
}

function snapToWaterline(ring, wetEdges) {
  // The union determines topology. Refine edge positions against the actual
  // sea-plane slice, removing the shadow of overhanging coping.
  return ring.map((point) => {
    let best = Infinity, nearest;
    for (const [a, b] of wetEdges) {
      const candidate = nearestPoint(point, a, b);
      const dx = point[0] - candidate[0], dz = point[1] - candidate[1];
      const distance = dx * dx + dz * dz;
      if (distance < best) {
        best = distance;
        nearest = candidate;
      }
    }
    return nearest.map((value) => +value.toFixed(3));
  }).filter((point, i, all) => {
    const previous = all[(i + all.length - 1) % all.length];
    return point[0] !== previous[0] || point[1] !== previous[1];
  });
}

function exterior(dry, wetEdges, id) {
  const rings = traceRings(gridUnion(dry)).sort((a, b) => Math.abs(signedArea(b)) - Math.abs(signedArea(a)));
  assert(rings.length, `Missing ${id} waterline`);
  // Holes include mesh seams and inland dips. Suppress them, while keeping
  // a genuinely separate coastal mass if it is larger than 2m².
  return rings.filter((ring, i) => Math.abs(signedArea(ring)) >= 2 &&
    !rings.slice(0, i).some((outer) => contains(outer, ring[0]))).map((ring) => {
    if (signedArea(ring) < 0) ring.reverse();
    // Home's weathered masonry is several overlapping open surfaces. Keep
    // the connected union at its short harbor joins, where nearest-segment
    // snapping would jump between the hill and discontinuous stone faces.
    const points = id === "studio" ? ring : snapToWaterline(ring, wetEdges);
    const opposite = Math.floor(points.length / 2);
    const outline = [];
    simplify(points, 0, opposite, outline);
    simplify([...points, points[0]], opposite, points.length, outline);
    return outline;
  });
}

const result = [];
for (const item of coasts) {
  const { id, source, sha256, dry, wetEdges } = await readCoast(item);
  for (const [ring, points] of exterior(dry, wetEdges, id).entries()) {
    const errors = [];
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const steps = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 0.25);
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        const error = wetEdges.reduce((best, [p, q]) => Math.min(best, deviation(point, p, q)), Infinity);
        errors.push(error);
      }
    }
    errors.sort((a, b) => a - b);
    const max = errors.at(-1);
    const p95 = errors[Math.floor(errors.length * 0.95)];
    assert(p95 <= 0.10, `${id}: shoreline p95 error ${p95}m`);
    // The Home promenade retaining cap projects locally past the true slice.
    assert(max <= (id === "studio" ? 0.67 : 0.16), `${id}: maximum shoreline error ${max}m`);
    result.push({ id, ring, source, sha256, points });
    console.log(id, ring, points.length, "points, area", Math.round(signedArea(points)),
      "distance to decoded sea-plane intersection, p95 / max", p95.toFixed(3), max.toFixed(3));
  }
}
const contents = "// Generated by scripts/build-shoreline-contours.mjs.\n" +
  "// World X/Z metres. Each loop is CCW, implicitly closed, with water on its right.\n" +
  `export const shorelineSeaHeight = ${WORLD_RADIUS};\n` +
  "export const shorelines = [\n" +
  result.map(({ points, ...metadata }) =>
    `  { ...${JSON.stringify(metadata)}, points: [\n` +
    points.reduce((lines, point, i) => {
      if (i % 8 === 0) lines.push("    ");
      lines[lines.length - 1] += JSON.stringify(point) + ",";
      return lines;
    }, []).join("\n") + "\n  ] },"
  ).join("\n") + "\n];\n";
const output = new URL("../app/lib/shoreline-contours.mjs", import.meta.url);
if (process.argv.includes("--check")) assert.equal(await readFile(output, "utf8"), contents);
else await writeFile(output, contents);
