// Rebuild and verify the actual quantized, compressed Bay backdrop.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { Box3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const path = (name) => new URL(`../${name}`, import.meta.url);
const app = fileURLToPath(path(""));
const file = path("public/models/islands/bay-backdrop.glb");
const statFile = path("asset-src/stats/bay-backdrop.json");

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
if (!process.argv.includes("--verify-only")) {
  const blender = process.env.BLENDER_BIN || "/Applications/Blender.app/Contents/MacOS/Blender";
  const built = spawnSync(blender, [
    "-b", "--disable-autoexec", "--python-exit-code", "1", "--python",
    "scripts/blender/build_bay_backdrop.py",
  ], { cwd: app, stdio: "inherit" });
  assert.equal(built.status, 0, "Blender backdrop build failed");
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder,
  });
  const raw = path("asset-src/authored/bay-backdrop/bay-backdrop-raw.glb");
  const doc = await io.read(fileURLToPath(raw));
  await doc.transform(weld(), dedup(), prune({ keepExtras: true }),
    meshopt({ encoder: MeshoptEncoder, level: "high" }));
  doc.createExtension(EXTMeshoptCompression).setRequired(true);
  await io.write(fileURLToPath(file), doc);
}

const bytes = await readFile(file);
const header = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"));
assert.ok(header.extensionsRequired.includes("EXT_meshopt_compression"));
assert.ok(header.extensionsUsed.includes("KHR_mesh_quantization"));
assert.ok(!header.images?.length, "Backdrop must stay texture-free");
const gltf = await new Promise((resolve, reject) => new GLTFLoader()
  .setMeshoptDecoder(MeshoptDecoder).parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject,
  ));
gltf.scene.updateMatrixWorld(true);
let draws = 0;
let triangles = 0;
gltf.scene.traverse((mesh) => {
  if (!mesh.isMesh) return;
  draws++;
  triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3;
  assert.ok(mesh.geometry.attributes.color && mesh.material.vertexColors, `Palette lost in ${mesh.name}`);
});
assert.ok(triangles <= 6000 && draws === 5 && bytes.length < 100000);
const bounds = new Box3().setFromObject(gltf.scene, true);
assert.ok(bounds.min.y < 0 && bounds.max.y < 30);
assert.ok(bounds.max.z < -200 && bounds.min.z > -265);
const rounded = (v) => v.toArray().map((n) => +n.toFixed(4));
const stats = JSON.parse(await readFile(statFile, "utf8"));
const landmarks = {};
for (const name of stats.landmarkNames) {
  const node = gltf.scene.getObjectByName(name);
  assert.ok(node, `Missing ${name}`);
  const b = new Box3().setFromObject(node, true);
  assert.ok(b.max.y > 20 && b.min.x > 43);
  landmarks[name] = { min: rounded(b.min), max: rounded(b.max) };
}
Object.assign(stats, {
  bytes: bytes.length, triangles, draws,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  bounds: { min: rounded(bounds.min), max: rounded(bounds.max) },
  landmarks,
});
await writeFile(statFile, JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify(stats, null, 2));
