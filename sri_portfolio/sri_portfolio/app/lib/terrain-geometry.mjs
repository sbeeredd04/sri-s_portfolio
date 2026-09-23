import { SphereGeometry, Float32BufferAttribute, Vector3, Ray } from "three";
import {
  WORLD_RADIUS,
  planetRadiusAt,
  regions,
  surfaceHeight,
  worldPoint,
} from "./world-layout.mjs";

export const terrainSegments = { width: 256, height: 160 };
// Refine the outdoor watercourse/lake only. Boundary edges stay on the
// adjacent coarse triangle, avoiding cracks without raising the whole globe LOD.
export function createTerrainGeometry() {
  const { width, height } = terrainSegments;
  const sphere = new SphereGeometry(WORLD_RADIUS, width, height);
  const p = sphere.attributes.position,
    uv = sphere.attributes.uv,
    n = new Vector3();
  const positions = [],
    uvs = Array.from(uv.array);
  for (let i = 0; i < p.count; i++) {
    n.fromBufferAttribute(p, i).normalize().multiplyScalar(planetRadiusAt(n));
    positions.push(n.x, n.y, n.z);
  }
  const trail = regions.find((r) => r.id === "trail"),
    cells = new Set();
  for (let j = 0; j < height; j++)
    for (let i = 0; i < width; i++) {
      n.fromArray(positions, (j * (width + 1) + i) * 3);
      const x = n.dot(trail.east),
        z = n.dot(trail.north);
      if (
        n.dot(trail.normal) > WORLD_RADIUS * 0.96 &&
        x > -20 &&
        x < 3 &&
        z > -20 &&
        z < 8
      )
        cells.add(j * width + i);
    }
  const roots = [],
    index = Array.from(sphere.index.array),
    edgeCounts = new Map();
  const edge = (a, b) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  for (let k = 0; k < index.length; k += 3) {
    const tri = index.slice(k, k + 3);
    const row = Math.min(...tri.map((v) => Math.floor(v / (width + 1))));
    const col = Math.min(...tri.map((v) => v % (width + 1)));
    const cell = row * width + col,
      detailed = cells.has(cell);
    roots.push({ tri, cell, detailed });
    if (detailed)
      for (let e = 0; e < 3; e++) {
        const key = edge(tri[e], tri[(e + 1) % 3]);
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
  }
  const boundaries = new Set(
    [...edgeCounts].filter(([, count]) => count === 1).map(([key]) => key),
  );
  const midpointCache = new Map(),
    refined = new Map(),
    result = [];
  function midpoint(a, b) {
    const key = edge(a, b);
    if (midpointCache.has(key)) return midpointCache.get(key);
    const id = positions.length / 3,
      boundary = boundaries.has(key);
    n.set(
      (positions[a * 3] + positions[b * 3]) / 2,
      (positions[a * 3 + 1] + positions[b * 3 + 1]) / 2,
      (positions[a * 3 + 2] + positions[b * 3 + 2]) / 2,
    );
    if (!boundary) n.normalize().multiplyScalar(planetRadiusAt(n));
    positions.push(n.x, n.y, n.z);
    uvs.push(
      (uvs[a * 2] + uvs[b * 2]) / 2,
      (uvs[a * 2 + 1] + uvs[b * 2 + 1]) / 2,
    );
    midpointCache.set(key, id);
    if (boundary) {
      boundaries.add(edge(a, id));
      boundaries.add(edge(id, b));
    }
    return id;
  }
  function split(a, b, c, level, out) {
    if (!level) {
      out.push(a, b, c);
      return;
    }
    const ab = midpoint(a, b),
      bc = midpoint(b, c),
      ca = midpoint(c, a);
    split(a, ab, ca, level - 1, out);
    split(ab, b, bc, level - 1, out);
    split(ca, bc, c, level - 1, out);
    split(ab, bc, ca, level - 1, out);
  }
  for (const { tri, cell, detailed } of roots) {
    if (!detailed) {
      result.push(...tri);
      continue;
    }
    const out = refined.get(cell) || [];
    const start = out.length;
    split(...tri, 4, out);
    result.push(...out.slice(start));
    refined.set(cell, out);
  }
  sphere.setAttribute("position", new Float32BufferAttribute(positions, 3));
  sphere.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  sphere.deleteAttribute("normal");
  sphere.setIndex(result);
  sphere.computeVertexNormals();
  sphere.userData.refinedCells = refined;
  sphere.userData.refinedTriangleCount = [...refined.values()].reduce(
    (sum, tri) => sum + tri.length / 3,
    0,
  );
  return sphere;
}

// CPU-only vertex data uses precisely the topology and float precision that is
// drawn. Analytic heights alone can put small props through a terrain triangle.
let vertices, refinedCells;
function terrainVertices() {
  if (!vertices) {
    const geometry = createTerrainGeometry();
    vertices = geometry.attributes.position.array;
    refinedCells = geometry.userData.refinedCells;
    geometry.dispose();
  }
  return vertices;
}
export function renderedSurfaceHeight(id, x, z) {
  const region = regions.find((r) => r.id === id);
  const approximate = surfaceHeight(id, x, z);
  const n = worldPoint(id, [x, approximate, z]).normalize();
  const { width, height } = terrainSegments;
  const phi = (Math.atan2(n.z, -n.x) + Math.PI * 2) % (Math.PI * 2);
  const column = Math.floor((phi / (Math.PI * 2)) * width);
  const row = Math.min(
    height - 1,
    Math.floor((Math.acos(n.y) / Math.PI) * height),
  );
  const ray = new Ray(
    worldPoint(id, [x, approximate + 20, z]),
    region.normal.clone().negate(),
  );
  const data = terrainVertices(),
    hit = new Vector3();
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    d = new Vector3();
  let highest = -Infinity;
  // Only adjacent grid cells can meet this short, locally vertical ray.
  for (let j = Math.max(0, row - 2); j <= Math.min(height - 1, row + 2); j++) {
    for (let k = column - 2; k <= column + 2; k++) {
      const i = (k + width) % width;
      const fine = refinedCells.get(j * width + i);
      if (fine) {
        for (let t = 0; t < fine.length; t += 3) {
          a.fromArray(data, fine[t] * 3);
          b.fromArray(data, fine[t + 1] * 3);
          c.fromArray(data, fine[t + 2] * 3);
          if (ray.intersectTriangle(a, b, c, false, hit))
            highest = Math.max(
              highest,
              hit.clone().sub(region.center).dot(region.normal),
            );
        }
        continue;
      }
      a.fromArray(data, (j * (width + 1) + i + 1) * 3);
      b.fromArray(data, (j * (width + 1) + i) * 3);
      c.fromArray(data, ((j + 1) * (width + 1) + i) * 3);
      d.fromArray(data, ((j + 1) * (width + 1) + i + 1) * 3);
      if (ray.intersectTriangle(a, b, d, false, hit))
        highest = Math.max(
          highest,
          hit.clone().sub(region.center).dot(region.normal),
        );
      if (ray.intersectTriangle(b, c, d, false, hit))
        highest = Math.max(
          highest,
          hit.clone().sub(region.center).dot(region.normal),
        );
    }
  }
  return Number.isFinite(highest) ? highest : approximate;
}
