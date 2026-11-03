import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { weld, meshopt } from "@gltf-transform/functions";

const app = fileURLToPath(new URL("../", import.meta.url));
const glb = new URL("../public/models/islands/bay-craft.glb", import.meta.url);
const statsFile = new URL("../asset-src/stats/bay-craft.json", import.meta.url);
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
      "scripts/blender/build_bay_craft.py",
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
let triangles = 0,
  primitives = 0;
const bounds = {};
for (const name of stats.roots) {
  const node = named(name);
  assert(node.getWorldPosition(new Vector3()).length() < 0.001);
  node.traverse((o) => {
    if (!o.isMesh) return;
    triangles +=
      (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    primitives++;
    assert(o.geometry.getAttribute("color") && o.material.vertexColors);
  });
  const box = new Box3().setFromObject(node, true);
  bounds[name] = {
    min: box.min.toArray(),
    max: box.max.toArray(),
    size: box.getSize(new Vector3()).toArray(),
  };
}
assert(triangles <= 8000 && primitives <= 8 && bytes.length <= 185000);
assert(bounds.Ferry_Root.min[1] < 0 && bounds.Sailboat_Root.min[1] < 0);
assert(bounds.Ferry_Root.size[2] > 10.8 && bounds.Ferry_Root.size[2] < 11.3);
assert(
  bounds.Sailboat_Root.size[2] > 3.9 && bounds.Sailboat_Root.size[2] < 4.2,
);
for (const [name, point] of Object.entries(stats.anchors))
  assert(
    named(name)
      .getWorldPosition(new Vector3())
      .distanceTo(new Vector3(...point)) < 0.003,
  );
Object.assign(stats, {
  bytes: bytes.length,
  triangles,
  primitives,
  bounds,
  sha256: createHash("sha256").update(bytes).digest("hex"),
});
await writeFile(statsFile, JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify(stats, null, 2));
