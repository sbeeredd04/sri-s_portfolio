// Inspect camera clearance against every triangle in the shipped showroom.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { AnimationMixer, LoopOnce, Triangle, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "meshoptimizer";
import { aetherView, aetherSite } from "../app/lib/made-stage.mjs";
await MeshoptDecoder.ready;
const bytes = await readFile("public/models/islands/made-aether.glb");
const gltf = await new Promise((resolve, reject) =>
  new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .parse(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      "",
      resolve,
      reject,
    ),
);
const scene = gltf.scene,
  mixer = new AnimationMixer(scene),
  clip = gltf.animations.find((c) => c.name === "OpenFacade");
const action = mixer.clipAction(clip);
action.setLoop(LoopOnce, 1);
action.clampWhenFinished = true;
action.play();
const triangle = new Triangle(),
  nearest = new Vector3();
function triangles() {
  scene.updateMatrixWorld(true);
  const all = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry,
      p = g.attributes.position,
      index = g.index;
    for (let i = 0; i < (index?.count ?? p.count); i += 3) {
      const v = [0, 1, 2].map((k) =>
        new Vector3()
          .fromBufferAttribute(p, index ? index.getX(i + k) : i + k)
          .applyMatrix4(o.matrixWorld),
      );
      all.push(v);
    }
  });
  return all;
}
const closed = triangles();
mixer.setTime(clip.duration);
const open = triangles();
function local(p) {
  const dx = p[0] - aetherSite.center[0],
    dz = p[2] - aetherSite.center[2],
    c = Math.cos(aetherSite.yaw),
    s = Math.sin(aetherSite.yaw);
  return [dx * c - dz * s, p[1] - aetherSite.center[1], dx * s + dz * c];
}
const routes = [false, true].flatMap((portrait) => {
  const eye = (name) => local(aetherView(name, portrait).position);
  const prefix = portrait ? "phone" : "desktop";
  return [
    {
      name: `${prefix} approach`,
      a: eye("outside"),
      b: eye("entry"),
      mesh: closed,
    },
    { name: `${prefix} inside`, a: eye("entry"), b: eye("inside"), mesh: open },
  ];
});
const result = [];
for (const route of routes) {
  let min = Infinity;
  let at = 0;
  for (let i = 0; i <= 100; i++) {
    const eye = new Vector3(...route.a).lerp(new Vector3(...route.b), i / 100);
    for (const vertices of route.mesh) {
      triangle.set(...vertices);
      triangle.closestPointToPoint(eye, nearest);
      const d = eye.distanceTo(nearest);
      if (d < min) {
        min = d;
        at = i / 100;
      }
    }
  }
  assert.ok(
    min > 0.12,
    `${route.name} camera crosses actual rendered geometry: ${min}m at ${at}`,
  );
  result.push({
    route: route.name,
    samples: 101,
    triangles: route.mesh.length,
    cameraSphereRadius: 0.12,
    minimumDistance: min,
    at,
  });
}
await writeFile(
  "asset-src/stats/made-camera-clearance.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
