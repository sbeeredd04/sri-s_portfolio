// Build and audit the real exported After Hours coast.
// node scripts/build-after-hours-coast.mjs [--verify-only]
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Box3, Vector3, Raycaster } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, weld, meshopt } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import {
  courts,
  courtPaths,
  courtBenches,
  courtPicnicTables,
  courtBins,
  courtLamps,
  courtViews,
} from "../app/lib/court-layout.mjs";
import {
  cinemaOrigin,
  cinemaScreen,
  cinemaSeats,
  cinemaGarden,
  listeningSeat,
  facingYaw,
  entertainmentPaths,
} from "../app/lib/entertainment-layout.mjs";
import { pavingCells, pavingSize } from "../app/lib/paving-layout.mjs";
const app = fileURLToPath(new URL("../", import.meta.url));
const file = new URL(
  "../public/models/islands/after-hours-coast.glb",
  import.meta.url,
);
const statsFile = new URL(
  "../asset-src/stats/after-hours-coast.json",
  import.meta.url,
);
const input = new URL(
  "../asset-src/stats/after-hours-source-layout.json",
  import.meta.url,
);
const L = 2.8,
  Z = 43;
const rect = (x, z, w, d, yaw = 0) => {
  const c = Math.cos(yaw),
    s = Math.sin(yaw);
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ].map(([a, b]) => [x + c * a + s * b, z - s * a + c * b]);
};
const fp = (name, x, z, w, d, kind = "prop", yaw = 0, height = [L, L + 2]) => ({
  name,
  kind,
  polygon: rect(x, z, w, d, yaw),
  height,
});
const courtFootprints = Object.entries(courts).map(([id, c]) =>
  fp(
    id,
    ...c.center,
    c.width + c.apron * 2,
    c.depth + c.apron * 2,
    "courtApron",
    0,
    [L - 0.007, L + 0.045],
  ),
);
const x0 = cinemaOrigin[0],
  z0 = Z + cinemaOrigin[2];
const cprop = (id, p, w, d, kind, yaw = 0) =>
  fp(id, x0 + p[0], z0 + p[2], w, d, kind, yaw);
const layout = {
  courtFootprints,
  paving: [
    ...pavingCells(courtPaths).map((p, i) =>
      fp(`courtPaver${i}`, p.x, p.z, pavingSize[0], pavingSize[2], "paving"),
    ),
    ...pavingCells([...entertainmentPaths, [[24, 7], [13, 6], 2]]).map((p, i) =>
      fp(
        `entertainmentPaver${i}`,
        p.x,
        p.z + Z,
        pavingSize[0],
        pavingSize[2],
        "paving",
      ),
    ),
  ],
  obstacles: [
    ...courtFootprints,
    ...courtBenches.map((p, i) =>
      fp(
        `courtBench${i}`,
        p.position[0],
        p.position[2],
        2.65,
        1.0,
        "seat",
        p.rotation[1],
      ),
    ),
    ...courtPicnicTables.map((p, i) =>
      fp(
        `courtPicnic${i}`,
        p.position[0],
        p.position[2],
        3.02,
        2.5,
        "seat",
        p.rotation,
      ),
    ),
    ...courtBins.map((p, i) =>
      fp(
        `courtBin${i}`,
        p.position[0],
        p.position[2],
        0.67,
        0.67,
        "prop",
        p.rotation,
      ),
    ),
    ...courtLamps.map((p, i) =>
      fp(`courtLamp${i}`, p[0], p[2], 0.19, 0.19, "prop"),
    ),
    fp("cinemaFullRaisedBase", x0, z0 + 1.5, 6.2, 6, "cinema"),
    ...cinemaSeats.map((p, i) =>
      cprop(`cinemaChair${i}`, p.position, 1.06, 0.96, "seat", p.yaw),
    ),
    ...cinemaGarden.beanbags.map((p, i) =>
      cprop(`cinemaBeanbag${i}`, p.position, 1, 0.92, "seat", p.yaw),
    ),
    cprop("cinemaBooth", cinemaGarden.booth.position, 1.4, 1.2, "cinema"),
    cprop(
      "cinemaCart",
      cinemaGarden.cart.position,
      1.32,
      0.9,
      "cinema",
      cinemaGarden.cart.yaw,
    ),
    fp("existingGardenBench", 5.5, 48.5, 2.65, 1, "seat"),
    ...[-5.5, 3.6, 11.8].map((x, i) =>
      fp(`existingGardenLamp${i}`, x, 48.5, 0.19, 0.19, "prop"),
    ),
    fp(
      "listeningChair",
      listeningSeat.position[0],
      Z + listeningSeat.position[2],
      1.6,
      1.54,
      "seat",
      facingYaw(listeningSeat.position, listeningSeat.target),
    ),
    fp("listeningConsole", -2, 40.4, 4.4, 0.8, "listening"),
    fp("listeningPiano", 1.65, 44.8, 2.2, 1.0, "listening"),
    fp("listeningRecordCrate", -4.1, 45.75, 1.05, 0.85, "listening"),
    fp("listeningTable", -0.3, 44, 1.8, 1.1, "listening"),
  ],
  closeCameras: [
    ...Object.entries(courtViews).flatMap(([id, v]) =>
      [
        [id, v.position],
        [id + "Portrait", v.portrait.position],
      ].map(([n, p]) => ({ id: n, point: [p[0], p[1] + L, p[2]] })),
    ),
    { id: "listening", point: [1.8, L + 2.5, 47.7] },
    { id: "listeningPortrait", point: [-0.8, L + 2.25, 47] },
    { id: "cinema", point: [10, L + 3, 51] },
    { id: "cinemaPortrait", point: [9.2, L + 3.4, 51.5] },
  ],
  notes:
    "Court apron dimensions from SportsCourts.Surface. Snapped paving cells from the production pavingCells function, including the entertainment walking join. Cinema and listening positions retain their original local transforms.",
};
if (!process.argv.includes("--verify-only")) {
  await mkdir(fileURLToPath(new URL("../asset-src/stats/", import.meta.url)), {
    recursive: true,
  });
  await writeFile(input, JSON.stringify(layout, null, 2) + "\n");
  const b = spawnSync(
    "blender",
    [
      "-b",
      "--disable-autoexec",
      "--python-exit-code",
      "1",
      "--python",
      "scripts/blender/build_after_hours_coast.py",
    ],
    {
      cwd: app,
      stdio: "inherit",
      env: { ...process.env, AFTER_HOURS_LAYOUT_PATH: fileURLToPath(input) },
    },
  );
  assert.equal(b.status, 0, "After Hours authoring failed");
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });
  const doc = await io.read(fileURLToPath(file));
  const names = doc
    .getRoot()
    .listNodes()
    .map((n) => n.getName());
  await doc.transform(
    dedup({ propertyTypes: ["Accessor", "Material"] }),
    weld(),
    meshopt({ encoder: MeshoptEncoder, level: "medium", quantizePosition: 16 }),
  );
  assert.deepEqual(
    doc
      .getRoot()
      .listNodes()
      .map((n) => n.getName()),
    names,
  );
  await io.write(fileURLToPath(file), doc);
}
const bytes = await readFile(file),
  stats = JSON.parse(await readFile(statsFile, "utf8"));
assert.deepEqual(
  stats.legacyReservation,
  layout,
  "Existing layout changed; rebuild coast against current coordinates",
);
const json = JSON.parse(
  bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"),
);
assert(json.extensionsUsed.includes("EXT_meshopt_compression"));
assert(
  json.meshes.every((m) =>
    m.primitives.every((p) => p.attributes.COLOR_0 !== undefined),
  ),
);
await MeshoptDecoder.ready;
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
gltf.scene.updateMatrixWorld(true);
const node = (n) => {
  const o = gltf.scene.getObjectByName(n);
  assert(o, `Missing ${n}`);
  return o;
};
node("AfterHours_CoastRoot");
node("AfterHours_Pavilion_DomeDisc");
let triangles = 0,
  primitives = 0;
const colors = new Set();
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry,
    c = g.getAttribute("color");
  assert(c && o.material.vertexColors);
  triangles += (g.index?.count ?? g.attributes.position.count) / 3;
  primitives++;
  for (let i = 0; i < c.count; i++)
    colors.add(
      [c.getX(i), c.getY(i), c.getZ(i)].map((v) => v.toFixed(4)).join(","),
    );
});
for (const [n, p] of Object.entries(stats.anchors)) {
  const q = node(n).getWorldPosition(new Vector3()).toArray();
  assert(
    q.every((v, i) => Math.abs(v - p[i]) < 0.005),
    `Anchor drift ${n}`,
  );
}
function sat(a, b) {
  let overlap = Infinity;
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i],
        q = poly[(i + 1) % poly.length],
        dx = q[0] - p[0],
        dz = q[1] - p[1],
        le = Math.hypot(dx, dz);
      if (le < 1e-8) continue;
      const n = [-dz / le, dx / le],
        f = (v) => v[0] * n[0] + v[1] * n[1],
        aa = a.map(f),
        bb = b.map(f);
      const o =
        Math.min(Math.max(...aa), Math.max(...bb)) -
        Math.max(Math.min(...aa), Math.min(...bb));
      if (o <= 0.021) return 0;
      overlap = Math.min(overlap, o);
    }
  return overlap;
}
function meshTriangles(root) {
  const out = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry,
      p = g.getAttribute("position"),
      index = g.index;
    for (let k = 0; k < (index?.count ?? p.count); k += 3) {
      const tri = [];
      for (let j = 0; j < 3; j++)
        tri.push(
          new Vector3()
            .fromBufferAttribute(p, index ? index.getX(k + j) : k + j)
            .applyMatrix4(o.matrixWorld),
        );
      out.push(tri);
    }
  });
  return out;
}
const defects = [],
  paths = [];
for (const path of stats.newPaths) {
  const tris = meshTriangles(node(path.name)).map((t) =>
    t.map((v) => [v.x, v.z]),
  );
  const projected = tris.filter(
    (t) =>
      Math.abs(
        (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) -
          (t[1][1] - t[0][1]) * (t[2][0] - t[0][0]),
      ) > 1e-6,
  );
  assert(projected.length, `No real triangles ${path.name}`);
  paths.push({ name: path.name, decodedTriangles: projected.length });
  for (const fp of [...layout.obstacles, ...stats.obstacles]) {
    let p = 0;
    for (const tri of projected) p = Math.max(p, sat(tri, fp.polygon));
    if (p)
      defects.push({
        path: path.name,
        obstacle: fp.name,
        overlap: +p.toFixed(3),
      });
  }
}
const legacyObstructions = [];
for (const a of [...layout.obstacles, ...layout.paving])
  for (const b of stats.obstacles) {
    const p = sat(a.polygon, b.polygon);
    if (p)
      legacyObstructions.push({
        legacy: a.name,
        obstacle: b.name,
        overlap: +p.toFixed(3),
      });
  }
const ground = node("AfterHours_ContinuousCoast"),
  ray = new Raycaster();
const at = (x, z) => {
  ray.set(new Vector3(x, 40, z), new Vector3(0, -1, 0));
  return ray.intersectObject(ground, true)[0]?.point.y;
};
const supportDefects = [];
let supportSamples = 0;
for (const a of [
  ...layout.courtFootprints,
  ...layout.paving,
  ...layout.obstacles.filter((x) => x.kind === "cinema"),
]) {
  const ps = [
    ...a.polygon,
    [
      a.polygon.reduce((s, p) => s + p[0], 0) / a.polygon.length,
      a.polygon.reduce((s, p) => s + p[1], 0) / a.polygon.length,
    ],
  ];
  for (const p of ps) {
    const y = at(...p);
    supportSamples++;
    if (y == null || y < L - 0.115 || y > L + 0.007)
      supportDefects.push({ footprint: a.name, point: p, y });
  }
}
const cameraObstructions = [];
for (const c of layout.closeCameras) {
  for (const o of stats.obstacles) {
    if (c.point[1] < o.height[0] || c.point[1] > o.height[1]) continue;
    const poly = rect(c.point[0], c.point[2], 0.66, 0.66);
    const p = sat(poly, o.polygon);
    if (p)
      cameraObstructions.push({
        camera: c.id,
        object: o.name,
        overlap: +p.toFixed(3),
      });
  }
}
for (const p of [...cinemaSeats, ...cinemaGarden.beanbags]) {
  const v = new Vector3(
    cinemaScreen[0] - p.position[0],
    0,
    cinemaScreen[2] - p.position[2],
  ).normalize();
  assert(
    v.dot(new Vector3(Math.sin(p.yaw), 0, Math.cos(p.yaw))) > 0.99999,
    "Existing cinema seat no longer faces screen",
  );
}
const bounds = new Box3().setFromObject(gltf.scene, true),
  round = (v) => v.toArray().map((x) => +x.toFixed(4));
const passed =
  !defects.length &&
  !legacyObstructions.length &&
  !supportDefects.length &&
  !cameraObstructions.length;
Object.assign(stats, {
  triangles,
  primitives,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  bounds: { min: round(bounds.min), max: round(bounds.max) },
  palette: { everyPrimitive: true, uniqueColors: colors.size },
  audit: {
    passed,
    paths,
    legacyPavingCells: layout.paving.length,
    terrainSupportSamples: supportSamples,
    defects,
    legacyObstructions,
    supportDefects,
    cameraObstructions,
  },
});
await writeFile(statsFile, JSON.stringify(stats, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      triangles,
      primitives,
      bytes: bytes.length,
      bounds: stats.bounds,
      audit: stats.audit,
    },
    null,
    2,
  ),
);
assert(passed, "Actual rendered coast clearance or ground support failed");
assert(
  triangles <= 35000,
  `Coast ${triangles} triangles exceed exterior allocation`,
);
assert(
  bytes.length <= 850000,
  `Coast ${bytes.length} bytes exceed exterior allocation`,
);
