// Builds the original Fieldnotes kit and verifies the loaded geometry against shared site coordinates.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { Box3, Color, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  fieldnotesArrival, fieldnotesBeds, fieldnotesCameras, fieldnotesDeckHeight,
  fieldnotesObstacles, fieldnotesPaths, fieldnotesTerraces,
} from "../app/lib/fieldnotes-layout.mjs";
import { newsstand, quarterViews } from "../app/lib/fieldnotes-quarter.mjs";
import { regions } from "../app/lib/world-layout.mjs";
import { pathHalfWidth, pathPose, walkingRoutes } from "../app/lib/world-paths.mjs";

const url = (relative) => new URL(`../${relative}`, import.meta.url);
const app = fileURLToPath(url(""));
const source = url("asset-src/authored/fieldnotes/");
const file = url("public/models/islands/fieldnotes-coast.glb");
const statFile = url("asset-src/stats/fieldnotes-coast.json");
const currentBridge = walkingRoutes.find(({ from, to }) => from === "trail" && to === "future");
const future = regions.find(({ id }) => id === "future");
const inverse = future.rotation.clone().invert();
const bridge = [];
for (let i = 0; i <= 100; i++) {
  const t = i / 100;
  for (const side of [-1, -0.5, 0, 0.5, 1]) {
    const p = pathPose(currentBridge, t, side * pathHalfWidth(currentBridge, t), 0.115).position
      .sub(future.center).applyQuaternion(inverse);
    bridge.push(p.toArray());
  }
}
const layout = {
  paths: fieldnotesPaths,
  beds: fieldnotesBeds,
  terraces: fieldnotesTerraces,
  deckY: fieldnotesDeckHeight(),
  obstacles: fieldnotesObstacles(),
  newsstand,
  cameras: [fieldnotesArrival, ...Object.values(fieldnotesCameras), ...quarterViews],
  bridge,
};

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
if (!process.argv.includes("--verify-only")) {
  await mkdir(source, { recursive: true });
  const sourceLayout = new URL("runtime-layout.json", source);
  await writeFile(sourceLayout, JSON.stringify(layout, null, 2) + "\n");
  const args = [
    "-b", "--disable-autoexec", "--python-exit-code", "1", "--python",
    "scripts/blender/build_fieldnotes_coast.py", "--", fileURLToPath(sourceLayout),
  ];
  if (process.argv.includes("--no-preview")) args.push("--no-preview");
  const blender = process.env.BLENDER_BIN || "/Applications/Blender.app/Contents/MacOS/Blender";
  const built = spawnSync(blender, args, { cwd: app, stdio: "inherit" });
  assert.equal(built.status, 0, "Fieldnotes Blender build failed");
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder,
  });
  const doc = await io.read(fileURLToPath(new URL("fieldnotes-coast-raw.glb", source)));
  await doc.transform(weld(), dedup(), prune({ keepLeaves: true, keepExtras: true }),
    meshopt({ encoder: MeshoptEncoder, level: "high" }));
  doc.createExtension(EXTMeshoptCompression).setRequired(true);
  await io.write(fileURLToPath(file), doc);
}
const bytes = await readFile(file);
const stats = JSON.parse(await readFile(statFile, "utf8"));
const manifest = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"));
assert.ok(manifest.extensionsRequired.includes("EXT_meshopt_compression"));
assert.ok(manifest.extensionsUsed.includes("KHR_mesh_quantization"));
assert.ok(!manifest.images?.length, "Unexpected texture image");
const gltf = await new Promise((resolve, reject) => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject,
));
const scene = gltf.scene;
scene.updateMatrixWorld(true);
const node = (name) => {
  const result = scene.getObjectByName(name);
  assert.ok(result, `Missing ${name}`);
  return result;
};
for (const [name, expected] of Object.entries(stats.anchors)) {
  const actual = node(name).getWorldPosition(new Vector3()).toArray();
  assert.ok(actual.every((value, i) => Math.abs(value - expected[i]) < 0.002), `Anchor moved: ${name}`);
}
let triangles = 0;
let draws = 0;
const colors = new Map();
scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  draws++;
  triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
  const color = mesh.geometry.attributes.color;
  assert.ok(color && mesh.material.vertexColors, `Palette lost at ${mesh.name}`);
  for (let i = 0; i < color.count; i++) {
    const rgb = [color.getX(i), color.getY(i), color.getZ(i)];
    colors.set(rgb.map((n) => n.toFixed(6)).join(","), rgb);
  }
});
assert.ok(draws === 9 && triangles < 85000 && bytes.length < 1600000, "Coast over asset budget");
const toneChecks = {};
for (const name of ["cypress", "ice", "lavender", "poppy", "timber", "blade", "amber", "wet"]) {
  const rgb = new Color(`#${stats.paletteHex[name]}`).toArray();
  const error = Math.min(...Array.from(colors.values(), (tone) => Math.hypot(...tone.map((n, i) => n - rgb[i]))));
  assert.ok(error < 0.008, `Palette mismatch: ${name}`);
  toneChecks[name] = +error.toFixed(6);
}

const ray = new Raycaster();
const direction = new Vector3(0, -1, 0);
const vegetation = ["Fieldnotes_Cypress", "Fieldnotes_CoastalDrifts", "Fieldnotes_CourtyardBeds"].map(node);
const land = ["Fieldnotes_LandSurface", "Fieldnotes_BluffAndWaterline"].map(node);
const blade = node("Fieldnotes_SignalBlade");
const pier = node("Fieldnotes_Pier");
const spur = node("Fieldnotes_WestSpur");
const obstacles = [...vegetation, blade, pier];
const terrainHit = (x, z, meshes) => {
  ray.set(new Vector3(x, 30, z), direction);
  return ray.intersectObjects(meshes, false)[0]?.point;
};
function sampleSegment([a, b, width], visit, step = 0.3) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
  const count = Math.ceil(length / step);
  const lanes = Math.ceil(width / 0.25);
  for (let i = 0; i <= count; i++) {
    for (let j = 0; j <= lanes; j++) {
      const s = (j / lanes - 0.5) * (width - 0.04);
      visit(a[0] + dx * i / count - dz / length * s, a[1] + dz * i / count + dx / length * s);
    }
  }
}
let localSamples = 0, spurSamples = 0, pierSamples = 0, bridgeSamples = 0, minBridgeGap = Infinity;
for (const path of layout.paths) sampleSegment(path, (x, z) => {
  assert.ok(!terrainHit(x, z, obstacles), `Object blocks full existing path width at ${x},${z}`);
  const ground = terrainHit(x, z, land);
  assert.ok(ground && ground.y < layout.deckY - 0.012, `Coast covers or misses existing paving at ${x},${z}`);
  localSamples++;
});
for (const path of stats.sharedLayout.newPaths) sampleSegment(path, (x, z) => {
  assert.ok(!terrainHit(x, z, vegetation), `Plant blocks full west spur width at ${x},${z}`);
  // The mitered outer edges may fall a few centimetres inside this straight
  // centerline probe. Ground support is checked even on those shoulders.
  const ground = terrainHit(x, z, land);
  const paving = terrainHit(x, z, [spur]);
  assert.ok(ground && (!paving || paving.y > ground.y - 0.015), `Spur embedded at ${x},${z}`);
  spurSamples++;
});
for (const [x, y, z] of bridge) {
  const ground = terrainHit(x, z, [...land, ...obstacles]);
  if (ground) {
    assert.ok(ground.y < y - 0.012, `Coast intersects the existing crossing at ${x},${y},${z}`);
    minBridgeGap = Math.min(minBridgeGap, y - ground.y);
  }
  bridgeSamples++;
}
for (const terrace of layout.terraces) {
  for (const sideX of [-1, 0, 1]) for (const sideZ of [-1, 0, 1]) {
    const ground = terrainHit(terrace.x + sideX * terrace.width / 2, terrace.z + sideZ * terrace.depth / 2, land);
    assert.ok(ground && ground.y < layout.deckY - 0.012, "Coast intrudes into an existing terrace");
  }
}
for (let z = 13.42; z <= 31.9; z += 0.24) {
  for (const x of [-23.8, -23.4, -23, -22.6, -22.2]) {
    const deck = terrainHit(x, z, [pier]) ?? terrainHit(x, z - 0.009, [pier]) ?? terrainHit(x, z + 0.009, [pier]);
    const ground = terrainHit(x, z, land);
    assert.ok(deck && (!ground || deck.y >= ground.y - 0.02), `Pier walk surface hidden at ${x},${z}`);
    pierSamples++;
  }
}
let cameraRays = 0;
for (const camera of layout.cameras) for (const pose of [camera, camera.portrait].filter(Boolean)) {
  const from = new Vector3(...pose.position);
  const target = new Vector3(...pose.target);
  ray.set(from, target.clone().sub(from).normalize());
  const hit = ray.intersectObjects([...land, ...obstacles], false)[0];
  assert.ok(!hit || hit.distance > from.distanceTo(target) - 0.15, "Fieldnotes asset blocks an existing camera target");
  cameraRays++;
}

const bounds = new Box3().setFromObject(scene, true);
const round = (p) => p.toArray().map((n) => +n.toFixed(4));
Object.assign(stats, {
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  triangles,
  draws,
  bounds: { min: round(bounds.min), max: round(bounds.max) },
  toneChecks,
  geometryVerification: {
    loader: "Three GLTFLoader + MeshoptDecoder",
    localPathSamples: localSamples, westSpurSamples: spurSamples, bridgeSamples, pierSamples, cameraRays,
    minimumRenderedBridgeGapMetres: Number.isFinite(minBridgeGap) ? +minBridgeGap.toFixed(5) : null,
  },
});
await writeFile(statFile, JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify({
  bytes: stats.bytes, triangles, draws, bounds: stats.bounds, geometry: stats.geometryVerification,
}, null, 2));
