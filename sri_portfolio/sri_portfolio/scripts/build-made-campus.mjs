// node scripts/build-made-campus.mjs [--verify-only]
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Box3, Vector3, Color } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, weld, meshopt } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
const app = fileURLToPath(new URL("../", import.meta.url));
const file = new URL(
  "../public/models/islands/made-campus.glb",
  import.meta.url,
);
const sf = new URL("../asset-src/stats/made-campus.json", import.meta.url);
if (!process.argv.includes("--verify-only")) {
  const b = spawnSync(
    "blender",
    [
      "-b",
      "--disable-autoexec",
      "--python",
      "scripts/blender/build_made_campus.py",
    ],
    { cwd: app, stdio: "inherit" },
  );
  assert.equal(b.status, 0);
  await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready]);
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "meshopt.decoder": MeshoptDecoder,
      "meshopt.encoder": MeshoptEncoder,
    });
  const doc = await io.read(fileURLToPath(file)),
    names = doc
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
    "Optimizer removed semantic nodes",
  );
  await io.write(fileURLToPath(file), doc);
}
const bytes = await readFile(file),
  stats = JSON.parse(await readFile(sf, "utf8"));
assert.equal(bytes.readUInt32LE(0), 0x46546c67);
const json = JSON.parse(
  bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"),
);
assert(json.extensionsUsed.includes("EXT_meshopt_compression"));
assert(
  json.meshes.every((m) =>
    m.primitives.every((p) => p.attributes.COLOR_0 !== undefined),
  ),
  "Palette attribute lost",
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
const found = (name) => {
  const o = gltf.scene.getObjectByName(name);
  assert(o, `Missing semantic node ${name}`);
  return o;
};
found("Made_CampusRoot");
let triangles = 0,
  primitives = 0,
  verts = 0;
const colors = new Map();
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const g = o.geometry;
  triangles += (g.index?.count ?? g.attributes.position.count) / 3;
  primitives++;
  verts += g.attributes.position.count;
  const c = g.getAttribute("color");
  assert(c && o.material.vertexColors, `Lost visible palette: ${o.name}`);
  for (let i = 0; i < c.count; i++) {
    const rgb = [c.getX(i), c.getY(i), c.getZ(i)];
    colors.set(rgb.map((v) => v.toFixed(5)).join(","), rgb);
  }
});
const anchors = {};
for (const [name, p] of Object.entries(stats.anchors)) {
  const a = found(name).getWorldPosition(new Vector3()).toArray();
  assert(
    a.every((v, i) => Math.abs(v - p[i]) < 0.003),
    `Anchor mismatch ${name}: ${a}`,
  );
  anchors[name] = a.map((v) => +v.toFixed(4));
}
for (const studio of stats.studios) {
  const name = studio.name,
    root = found(name + "_Root");
  assert(
    root.position
      .toArray()
      .every((v, i) => Math.abs(v - studio.center[i]) < 0.003),
    `Studio position mismatch ${name}`,
  );
  for (const suffix of [
    "Threshold",
    "EntryCamera",
    "Interior",
    "Hero",
    "Display",
  ])
    found(name + "_" + suffix + "Anchor");
}
const palette = {};
for (const [name, hex] of Object.entries(stats.paletteHex)) {
  const target = new Color("#" + hex).toArray();
  const e = Math.min(
    ...[...colors.values()].map((c) =>
      Math.hypot(...c.map((v, i) => v - target[i])),
    ),
  );
  if (e < 0.008) palette[name] = +e.toFixed(6);
}
assert(Object.keys(palette).length >= 25, "Unusually sparse exported palette");
assert(
  triangles + stats.externalAether.triangles <= 70000,
  `Combined ${triangles + 7138} >70k tris`,
);
const aetherBytes = (
  await readFile(
    new URL("../public/models/islands/made-aether.glb", import.meta.url),
  )
).length;
const combinedBytes = bytes.length + aetherBytes;
assert(
  combinedBytes <= 1200000,
  `Combined campus and Aether ${combinedBytes} bytes exceed 1.2MB`,
);
// Convex SAT covers every complete rendered segment, not centreline samples.
function penetration(a, b) {
  let min = Infinity;
  for (const poly of [a, b])
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i],
        q = poly[(i + 1) % poly.length],
        dx = q[0] - p[0],
        dz = q[1] - p[1],
        len = Math.hypot(dx, dz);
      if (len < 1e-7) continue;
      const n = [-dz / len, dx / len],
        aa = a.map((v) => v[0] * n[0] + v[1] * n[1]),
        bb = b.map((v) => v[0] * n[0] + v[1] * n[1]);
      const overlap =
        Math.min(Math.max(...aa), Math.max(...bb)) -
        Math.max(Math.min(...aa), Math.min(...bb));
      if (overlap <= 0.025) return 0;
      min = Math.min(min, overlap);
    }
  return min;
}
const defects = [],
  renderedGeometryProof = [];
for (const path of stats.renderedPaving) {
  let triangles2D = path.segments;
  if (!path.reservationOnly) {
    triangles2D = [];
    const points = [];
    found(path.name).traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry,
        p = g.getAttribute("position"),
        index = g.index;
      for (let k = 0; k < (index?.count ?? p.count); k += 3) {
        const tri = [];
        for (let j = 0; j < 3; j++) {
          const v = new Vector3()
            .fromBufferAttribute(p, index ? index.getX(k + j) : k + j)
            .applyMatrix4(o.matrixWorld);
          tri.push([v.x, v.z]);
          points.push([v.x, v.z]);
        }
        const area = Math.abs(
          (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) -
            (tri[1][1] - tri[0][1]) * (tri[2][0] - tri[0][0]),
        );
        if (area > 0.00001) triangles2D.push(tri);
      }
    });
    for (const p of path.segments.flat())
      assert(
        points.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.012),
        `Rendered path corner lost ${path.name}: ${p}; nearest ${Math.min(...points.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])))}`,
      );
    renderedGeometryProof.push({
      name: path.name,
      renderedTriangles: triangles2D.length,
      allAuthoredCornersFoundInExport: true,
    });
  }
  for (const fp of stats.footprints) {
    if (fp.name === path.owner) continue;
    if (
      path.isPlaza &&
      ["filmSet", "seat", "planter", "prop"].includes(fp.kind)
    )
      continue;
    for (let i = 0; i < triangles2D.length; i++) {
      const overlap = penetration(triangles2D[i], fp.polygon);
      if (overlap)
        defects.push({
          path: path.name,
          renderedTriangle: i,
          obstacle: fp.name,
          kind: fp.kind,
          penetrationMetres: +overlap.toFixed(3),
        });
    }
  }
}
const obstacleOverlaps = [];
for (let i = 0; i < stats.footprints.length; i++)
  for (let j = i + 1; j < stats.footprints.length; j++) {
    const a = stats.footprints[i],
      b = stats.footprints[j],
      p = penetration(a.polygon, b.polygon);
    if (
      p &&
      Math.min(a.height[1], b.height[1]) - Math.max(a.height[0], b.height[0]) >
        0.025
    )
      obstacleOverlaps.push({
        a: a.name,
        b: b.name,
        penetrationMetres: +p.toFixed(3),
      });
  }
const bounds = new Box3().setFromObject(gltf.scene, true),
  round = (v) => v.toArray().map((x) => +x.toFixed(4));
Object.assign(stats, {
  triangles,
  combinedWithAetherTriangles: triangles + stats.externalAether.triangles,
  combinedWithAetherBytes: combinedBytes,
  bytes: bytes.length,
  sha256: createHash("sha256").update(bytes).digest("hex"),
  primitives,
  vertexCount: verts,
  bounds: { min: round(bounds.min), max: round(bounds.max) },
  exportedAnchors: anchors,
  paletteRoundTrip: {
    allPrimitives: true,
    uniqueColors: colors.size,
    presentTones: palette,
  },
  integrity: {
    loader: "Three GLTFLoader + MeshoptDecoder",
    semanticNamesRetained: true,
    anchorsRetained: true,
    studioTransformsRetained: true,
  },
  clearanceAudit: {
    method:
      "Convex SAT actual exported paving triangle footprints (full widths, every ribbon/connection)  against rotated building, seating, planter and prop footprints; owner threshold contact allowed; set furnishings allowed within plaza",
    defects,
    obstacleOverlaps,
    renderedGeometryProof,
    passed: !defects.length && !obstacleOverlaps.length,
  },
});
await writeFile(sf, JSON.stringify(stats, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      triangles,
      combined: triangles + 7138,
      bytes: bytes.length,
      palette: colors.size,
      bounds: stats.bounds,
      clearance: stats.clearanceAudit,
    },
    null,
    2,
  ),
);
assert(
  !defects.length && !obstacleOverlaps.length,
  "Full rendered-footprint clearance gate failed; see stats",
);

// A validated asset publication must invalidate the live GLB cache too.
const runtimeFile = new URL("../app/lib/made-campus-data.mjs", import.meta.url);
const runtime = await readFile(runtimeFile, "utf8");
await writeFile(runtimeFile, runtime.replace(/made-campus\.glb\?v=[a-f0-9]+/, `made-campus.glb?v=${stats.sha256.slice(0,16)}`));
