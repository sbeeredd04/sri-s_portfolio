// Run from the Next app with node scripts/build-home-landform.mjs [--verify-only].
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Box3, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, meshopt } from "@gltf-transform/functions";

const app = fileURLToPath(new URL("../", import.meta.url));
const glb = new URL(
  "../public/models/islands/home-landform.glb",
  import.meta.url,
);
const statsFile = new URL(
  "../asset-src/stats/home-landform.json",
  import.meta.url,
);
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
if (!process.argv.includes("--verify-only")) {
  const blender = spawnSync(
    "blender",
    [
      "-b",
      "--disable-autoexec",
      "--python-exit-code",
      "1",
      "--python",
      "scripts/blender/build_home_landform.py",
    ],
    { cwd: app, stdio: "inherit" },
  );
  assert.equal(blender.status, 0);
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });
  const doc = await io.read(fileURLToPath(glb));
  await doc.transform(
    weld(),
    meshopt({ encoder: MeshoptEncoder, level: "medium", quantizePosition: 16 }),
  );
  await io.write(fileURLToPath(glb), doc);
}
const bytes = await readFile(glb);
const stats = JSON.parse(await readFile(statsFile, "utf8"));
const architecture = await readFile(
  new URL("../public/models/islands/home-architecture.glb", import.meta.url),
);
assert.equal(
  createHash("sha256").update(architecture).digest("hex"),
  stats.architectureSHA,
  "Home architecture has changed",
);
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const { scene } = await new Promise((resolve, reject) =>
  loader.parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    "",
    resolve,
    reject,
  ),
);
scene.updateMatrixWorld(true);
const named = (name) => {
  const object = scene.getObjectByName(name);
  assert(object, `Missing ${name}`);
  return object;
};
named("Home_LandformRoot");
for (const [name, point] of Object.entries(stats.anchors))
  assert(
    named(name)
      .getWorldPosition(new Vector3())
      .distanceTo(new Vector3(...point)) < 0.004,
  );
let triangles = 0;
let primitives = 0;
scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  primitives++;
  const geometry = mesh.geometry;
  triangles +=
    (geometry.index?.count ?? geometry.attributes.position.count) / 3;
  assert(
    geometry.getAttribute("color") && mesh.material.vertexColors,
    mesh.name,
  );
});
assert(triangles < 27000 && bytes.length < 650000);
const terrain = named("Home_ContinuousHill");
const ray = new Raycaster();
const at = (x, z) => {
  ray.set(new Vector3(x, 75, z), new Vector3(0, -1, 0));
  return ray.intersectObject(terrain, true)[0]?.point.y;
};
const architectureStats = JSON.parse(await readFile(new URL("../asset-src/stats/home-architecture.json", import.meta.url), "utf8"));
const summitFloor = architectureStats.summitFloorHeight;
const supportDefects = [];
let supportSamples = 0;
for (const house of stats.reservations) {
  const [a, b, c, d] = house.boundsXZ;
  for (let i = 0; i <= 8; i++)
    for (let j = 0; j <= 10; j++) {
      const x = a + ((c - a) * i) / 8,
        z = b + ((d - b) * j) / 10,
        y = at(x, z);
      supportSamples++;
      if (y == null || y < house.ground - 0.055 || y > house.ground + 0.03)
        supportDefects.push({ house: house.name, x, z, y });
    }
}
for (let x = -14; x <= 10; x += 1)
  for (let z = -29; z <= -8.4; z += 0.85) {
    const y = at(x, z);
    supportSamples++;
    const expected = summitFloor - (z >= -13.3 ? 1.27 : .22);
    if (
      y == null ||
      y < summitFloor - 1.36 ||
      y > summitFloor - .04 ||
      (z >= -13.3 && Math.abs(y - expected) > 0.09)
    )
      supportDefects.push({ house: "Summit", x, z, y });
  }
function clips(tri, bounds) {
  const [x0, z0, x1, z1] = bounds;
  const rect = [
    [x0, z0],
    [x1, z0],
    [x1, z1],
    [x0, z1],
  ];
  for (const p of [tri, rect])
    for (let i = 0; i < p.length; i++) {
      const a = p[i],
        b = p[(i + 1) % p.length],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz);
      if (len < 1e-8) continue;
      const dot = ([x, z]) => (-dz * x + dx * z) / len,
        u = tri.map(dot),
        v = rect.map(dot);
      if (
        Math.min(Math.max(...u), Math.max(...v)) -
          Math.max(Math.min(...u), Math.min(...v)) <
        0.022
      )
        return false;
    }
  return true;
}
const pathDefects = [];
let projectedTriangles = 0;
const dressingFootprints = [];
for (const name of ["Home_HillsideCoastalScrub", "Home_HillsideSandstone", "Home_PaintedLadiesStoopGardens", "Home_WaterfrontBenches"]) {
  named(name).traverse((mesh) => {
    if (!mesh.isMesh) return;
    const { index } = mesh.geometry;
    const position = mesh.geometry.getAttribute("position");
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      const points = [0, 1, 2].map((j) =>
        new Vector3()
          .fromBufferAttribute(position, index ? index.getX(i + j) : i + j)
          .applyMatrix4(mesh.matrixWorld),
      );
      const bounds = new Box3().setFromPoints(points);
      dressingFootprints.push({
        name,
        rect: [bounds.min.x, bounds.min.z, bounds.max.x, bounds.max.z],
      });
    }
  });
}
for (const path of stats.paths) {
  const mesh = named(path.name),
    g = mesh.geometry,
    p = g.attributes.position,
    index = g.index;
  const collisions = new Set();
  for (let i = 0; i < (index?.count ?? p.count); i += 3) {
    const tri = [0, 1, 2]
      .map((j) =>
        new Vector3()
          .fromBufferAttribute(p, index ? index.getX(i + j) : i + j)
          .applyMatrix4(mesh.matrixWorld),
      )
      ;
    // Probe the full rendered trail, including both edges and face interiors.
    // A centerline-only grade check cannot detect hovering path shoulders.
    if (["Home_SummitTrail", "Home_SummitDoorWalk"].includes(path.name)) {
      const probes = [...tri, tri[0].clone().add(tri[1]).add(tri[2]).multiplyScalar(1/3)];
      for (const point of probes) {
        const ground = at(point.x, point.z);
        const gap = point.y - ground;
        supportSamples++;
        if (ground == null || gap < -.025 || gap > .19)
          supportDefects.push({ path: path.name, x: point.x, z: point.z, gap });
      }
    }
    const footprint = tri.map((v) => [v.x, v.z]);
    projectedTriangles++;
    for (const house of stats.reservations)
      if (clips(footprint, house.boundsXZ)) collisions.add(house.name);
    for (const oak of stats.oaks) {
      const [x, , z] = oak.center;
      if (clips(footprint, [x - 0.25, z - 0.25, x + 0.25, z + 0.25]))
        collisions.add(oak.name);
    }
    for (const { name, rect } of dressingFootprints)
      if (clips(footprint, rect)) collisions.add(name);
  }
  for (const house of collisions) pathDefects.push({ path: path.name, house });
}
const pathGrades = stats.paths.map(({ name, centerline }) => {
  const slopes = centerline.slice(1).map(([x, y, z], index) => {
    const [px, py, pz] = centerline[index];
    return (
      (Math.atan2(Math.abs(y - py), Math.hypot(x - px, z - pz)) * 180) / Math.PI
    );
  });
  return { name, maxSlopeDegrees: +Math.max(...slopes).toFixed(1) };
});
const bounds = new Box3().setFromObject(scene, true);
Object.assign(stats, {
  triangles,
  primitives,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() },
  audit: {
    supportSamples,
    pathGrades,
    projectedTriangles,
    supportDefects,
    pathDefects,
    passed: !supportDefects.length && !pathDefects.length,
  },
});
await writeFile(statsFile, JSON.stringify(stats, null, 2) + "\n");
console.log(
  JSON.stringify(
    { triangles, primitives, bytes: bytes.length, audit: stats.audit },
    null,
    2,
  ),
);
assert(stats.audit.passed, "Home support or full-width route check failed");

// Publish the same decoded coordinates that were just verified. Runtime walking,
// workspace physics, camera targets and cable stations consume this contract.
const siteFile = new URL("../app/lib/home-site.mjs", import.meta.url);
const previous = await readFile(siteFile, "utf8");
const cameras = previous.slice(previous.indexOf("export const homeArrival"));
const site = {
  landform: `/models/islands/home-landform.glb?v=${stats.sha256.slice(0,16)}`,
  architecture: `/models/islands/home-architecture.glb?v=${architectureStats.sha256.slice(0,16)}`,
  anchors: { ...stats.anchors, ...architectureStats.exportedAnchors },
  walks: stats.paths.map(({ name, centerline, width }) => ({ name, points: centerline, width })),
};
await writeFile(siteFile, "// Generated by scripts/build-home-landform.mjs after decoded mesh validation.\nexport const homeSite = " + JSON.stringify(site, null, 2) + ";\n" + cameras);
