// Sample the full moving cabin footprint against decoded Home terrain,
// vegetation and architecture, including the two offset hill-line cabins.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { Box3, Raycaster, Vector3 } from 'three';
import { homeCableLanes } from '../app/lib/home-cables.mjs';
import { homeSite } from '../app/lib/home-site.mjs';
import { APARTMENT_LEVEL } from '../app/lib/studio-layout.mjs';
import { worldPoint, WORLD_RADIUS } from '../app/lib/world-layout.mjs';

await MeshoptDecoder.ready;
async function load(name) {
  const bytes = await readFile(new URL(`../public/models/islands/${name}.glb`, import.meta.url));
  const { scene } = await new Promise((yes, no) => new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '', yes, no));
  scene.updateMatrixWorld(true);
  return scene;
}
const [home, architecture, craft] = await Promise.all([
  load('home-landform'), load('home-architecture'), load('bay-craft'),
]);
const cabin = new Box3().setFromObject(craft.getObjectByName('Gondola_Root'));
const origin = worldPoint('studio', [0, 0, 0]);
origin.y -= WORLD_RADIUS;
const ray = new Raycaster(), defects = [];
let minimumClearance = Infinity, samples = 0;
for (const [lane, { line, offset }] of homeCableLanes.entries()) {
  for (let i = 0; i <= 400; i++) {
    const t = i / 400, point = line.getPointAt(t), direction = line.getTangentAt(t);
    const yaw = Math.atan2(direction.x, direction.z);
    point.add(new Vector3(direction.z, 0, -direction.x).normalize().multiplyScalar(offset));
    // BBox plus 10cm includes small wind sway; 5x5 checks face interiors too.
    for (let u = 0; u <= 4; u++) for (let v = 0; v <= 4; v++) {
      const dx = cabin.min.x - .10 + (cabin.max.x - cabin.min.x + .20) * u / 4;
      const dz = cabin.min.z - .10 + (cabin.max.z - cabin.min.z + .20) * v / 4;
      const x = point.x + dx * Math.cos(yaw) + dz * Math.sin(yaw) - origin.x;
      const z = point.z - dx * Math.sin(yaw) + dz * Math.cos(yaw) - origin.z;
      ray.set(new Vector3(x, 80, z), new Vector3(0, -1, 0));
      const hit = ray.intersectObjects([home, architecture], true)[0];
      if (!hit) continue;
      const clearance = point.y - 2.68 + cabin.min.y - hit.point.y;
      minimumClearance = Math.min(minimumClearance, clearance);
      samples++;
      if (clearance < .35) defects.push({ lane, t, name: hit.object.name, clearance });
    }
  }
}
const summit = architecture.getObjectByName('Summit_EntryAnchor').getWorldPosition(new Vector3());
assert(Math.abs(summit.y - homeSite.anchors.Summit_EntryAnchor[1]) < .002);
assert(Math.abs(APARTMENT_LEVEL - summit.y - 3.45) < .002, 'Workspace and collision datum detached from Summit');
console.log(JSON.stringify({ samples, minimumClearance, defects: defects.slice(0, 12), defectCount: defects.length }, null, 2));
assert.equal(defects.length, 0, 'Cable cabin intersects Home terrain, vegetation or architecture');
