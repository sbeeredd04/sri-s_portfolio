// Build and inspect the actual exported GLB through Three's runtime loader.
// node scripts/build-made-studio.mjs [--verify-only]
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  AnimationMixer, Box3, Color, LoopOnce, Vector3,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";

const app = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv.includes("--verify-only")) {
  const built = spawnSync("blender", ["-b", "--disable-autoexec", "--python", "scripts/blender/build_made_studio.py"],
    { cwd: app, stdio: "inherit" });
  assert.equal(built.status, 0, "Blender asset build failed");
}
const file = new URL("../public/models/islands/made-aether.glb", import.meta.url);
const statsFile = new URL("../asset-src/stats/made-aether.json", import.meta.url);
const bytes = await readFile(file);
const stats = JSON.parse(await readFile(statsFile, "utf8"));
assert.equal(bytes.readUInt32LE(0), 0x46546c67, "Expected a binary glTF file");
const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"));
assert.ok(json.extensionsUsed.includes("EXT_meshopt_compression"), "Meshopt extension missing");
assert.ok(json.meshes.every((mesh) => mesh.primitives.every((p) => p.attributes.COLOR_0 !== undefined)),
  "An exported primitive lost its palette color attribute");
await MeshoptDecoder.ready;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const gltf = await new Promise((resolve, reject) => loader.parse(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "", resolve, reject,
));
const root = gltf.scene;
root.updateMatrixWorld(true);
const node = (name) => {
  const found = root.getObjectByName(name);
  assert.ok(found, `Missing exported node ${name}`);
  return found;
};
node("Aether_Root");
node("Aether_DisplayScreen");
for (const name of stats.doorPivots) node(name);
for (const side of ["L", "R"])
  assert.equal(node(`Aether_Door_${side}Inner`).parent.name, `Aether_Door_${side}Outer`,
    "Bifold hierarchy was flattened");
const rounded = (v) => v.map((x) => Math.round(x * 10000) / 10000);
const serialBox = (b) => ({ min: rounded(b.min.toArray()), max: rounded(b.max.toArray()), size: rounded(b.getSize(new Vector3()).toArray()) });
const closedBounds = new Box3().setFromObject(root, true);
const actualAnchors = {};
for (const [name, expected] of Object.entries(stats.anchors)) {
  const point = node(name).getWorldPosition(new Vector3()).toArray();
  assert.ok(point.every((v, i) => Math.abs(v - expected[i]) < .002), `Anchor changed during export: ${name}`);
  actualAnchors[name] = rounded(point);
}
let triangles = 0, primitives = 0, vertexCount = 0;
const colors = new Map();
root.traverse((object) => {
  if (!object.isMesh) return;
  primitives++;
  const g = object.geometry;
  triangles += (g.index?.count ?? g.attributes.position.count) / 3;
  vertexCount += g.attributes.position.count;
  const c = g.getAttribute("color");
  assert.ok(c, `Palette lost in Three loader for ${object.name}`);
  assert.ok(object.material.vertexColors, `Material ignores palette on ${object.name}`);
  for (let i = 0; i < c.count; i++) {
    const rgb = [c.getX(i), c.getY(i), c.getZ(i)];
    colors.set(rgb.map((v) => v.toFixed(6)).join(","), rgb);
  }
});
const paletteChecks = {};
for (const [name, hex] of Object.entries(stats.paletteHex)) {
  const target = new Color(`#${hex}`).toArray();
  const error = Math.min(...Array.from(colors.values(), (rgb) => Math.hypot(...rgb.map((v, i) => v - target[i]))));
  assert.ok(error < .008, `Source palette tone ${name} disappeared (${error})`);
  paletteChecks[name] = +error.toFixed(6);
}
const clip = gltf.animations.find((a) => a.name === "OpenFacade");
assert.ok(clip, `Missing OpenFacade clip; got ${gltf.animations.map((a) => a.name).join(", ")}`);
assert.ok(Math.abs(clip.duration - 1.1) < .005, `Unexpected duration ${clip.duration}`);
for (const name of stats.doorPivots)
  assert.ok(clip.tracks.some((t) => t.name === `${name}.quaternion`), `Missing rotation track ${name}`);
const mixer = new AnimationMixer(root);
const action = mixer.clipAction(clip);
action.setLoop(LoopOnce, 1);
action.clampWhenFinished = true;
action.play();
const sweep = { left: new Box3(), right: new Box3() };
const poseBounds = [];
for (let i = 0; i <= 66; i++) {
  const time = clip.duration * i / 66;
  mixer.setTime(time);
  root.updateMatrixWorld(true);
  const left = new Box3().setFromObject(node("Aether_Door_LOuter"), true);
  const right = new Box3().setFromObject(node("Aether_Door_ROuter"), true);
  sweep.left.union(left);
  sweep.right.union(right);
  if ([0, 33, 66].includes(i)) poseBounds.push({ time: +time.toFixed(4), left: serialBox(left), right: serialBox(right) });
}
const finalLeft = new Box3().setFromObject(node("Aether_Door_LOuter"), true);
const finalRight = new Box3().setFromObject(node("Aether_Door_ROuter"), true);
const openClearWidth = finalRight.min.x - finalLeft.max.x;
assert.ok(openClearWidth > 8.5, `Open panels restrict clear width to ${openClearWidth}m`);
assert.ok(sweep.left.max.x < .12 && sweep.right.min.x > -.12, "Bifold sweep crossed the opposite side");
assert.ok(sweep.left.min.z > 2.75 && sweep.right.min.z > 2.75, "Door sweeps exceed their reserved interior zone");
const size = closedBounds.getSize(new Vector3());
assert.ok(size.x <= 12.05 && size.z <= 11.05, `Architectural footprint changed: ${size.toArray()}`);
assert.ok(closedBounds.min.y >= -.01 && closedBounds.max.y <= 8.43, "Ground pivot or 8.4m height changed");
assert.ok(triangles < 12000, `${triangles} triangles exceed the single-showroom budget`);
assert.ok(bytes.length < 300000, `${bytes.length} bytes exceed the single-showroom budget`);
const display = node("Aether_DisplayScreen");
const displayNormal = new Vector3().fromBufferAttribute(display.geometry.getAttribute("normal"), 0).transformDirection(display.matrixWorld);
assert.ok(displayNormal.z > .99, "Display plane is not facing Three +Z");
assert.ok(display.geometry.getAttribute("uv"), "Display plane lost UVs");
Object.assign(stats, {
  bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
  triangles, primitives, vertexCount, exportedBounds: serialBox(closedBounds),
  exportedAnchors: actualAnchors, animationNames: gltf.animations.map((a) => a.name),
  animationDurationSeconds: +clip.duration.toFixed(5), animationTracks: clip.tracks.map((t) => t.name),
  doorSweepMetres: { left: serialBox(sweep.left), right: serialBox(sweep.right), openClearWidth: +openClearWidth.toFixed(4), poses: poseBounds },
  paletteRoundTrip: { attribute: "COLOR_0", allMeshPrimitivesRetained: true, uniqueColors: colors.size, maximumLinearError: Math.max(...Object.values(paletteChecks)), perColorError: paletteChecks },
  integrity: { loader: "Three GLTFLoader + MeshoptDecoder", hierarchyRetained: true, anchorsRetained: true, clipRetained: true, screenNormal: rounded(displayNormal.toArray()), checkedDoorFrames: 67 },
});
await writeFile(statsFile, JSON.stringify(stats, null, 2) + "\n");
console.log(JSON.stringify({ asset: stats.asset, triangles, bytes: bytes.length, bounds: stats.exportedBounds, animation: clip.name,
  seconds: clip.duration, paletteColors: colors.size, doorSweep: stats.doorSweepMetres, anchors: actualAnchors }, null, 2));
