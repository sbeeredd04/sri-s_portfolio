import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { NodeIO, getBounds } from "@gltf-transform/core";
import { trees, coastalTreeScale } from "../app/lib/fieldnotes-quarter.mjs";
import { buildFieldnotesPaving } from "../app/lib/fieldnotes-surface.mjs";
import { modelSource } from "../app/lib/world-assets.mjs";
import { regions } from "../app/lib/world-layout.mjs";
import {
  walkingRoutes,
  pathPose,
  pathHalfWidth,
} from "../app/lib/world-paths.mjs";
function distance(p, a, b) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    den = dx * dx + dz * dz,
    t = den
      ? Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / den),
        )
      : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
test("coastal tree exports preserve canopy, roots and complete paving clearance at both detail levels", async () => {
  const region = regions.find((r) => r.id === "future"),
    inverse = region.rotation.clone().invert();
  const bridge = walkingRoutes
    .filter((r) => r.from === "future" || r.to === "future")
    .flatMap((route) =>
      Array.from({ length: 201 }, (_, i) => {
        const p = pathPose(route, i / 200, 0, 0)
          .position.clone()
          .sub(region.center)
          .applyQuaternion(inverse);
        return [p.x, p.z, pathHalfWidth(route, i / 200)];
      }),
    );
  const g = buildFieldnotesPaving(),
    p = g.attributes.position;
  for (const [name, budget, maxTris] of [
    ["coastal-tree", 700000, 19000],
    ["compact/coastal-tree", 160000, 3300],
  ]) {
    const path = `public/models/${name}.glb`,
      doc = await new NodeIO().read(path),
      root = doc.getRoot(),
      bounds = getBounds(root.listScenes()[0]);
    assert.ok((await stat(path)).size < budget);
    assert.equal(root.listMaterials().length, 2);
    assert.equal(root.listTextures().length, 0);
    assert.ok(bounds.min[1] > -0.015 && bounds.min[1] < 0.005);
    assert.ok(bounds.max[1] > 4.4 && bounds.max[1] < 4.6);
    let radius = 0,
      tris = 0;
    for (const mesh of root.listMeshes())
      for (const prim of mesh.listPrimitives()) {
        tris += prim.getIndices().getCount() / 3;
        const a = prim.getAttribute("POSITION");
        for (let i = 0; i < a.getCount(); i++) {
          const v = a.getElement(i, []);
          radius = Math.max(radius, Math.hypot(v[0], v[2]));
        }
        if (mesh.getName().includes("foliage"))
          assert.ok(prim.getAttribute("COLOR_0"));
      }
    assert.ok(tris < maxTris, `${tris} triangles`);
    for (const tree of trees) {
      const r = radius * tree.s * coastalTreeScale + 0.12,
        point = [tree.x, tree.z];
      for (const [x, z, half] of bridge)
        assert.ok(
          Math.hypot(tree.x - x, tree.z - z) > r + half,
          "crown intersects full connecting bridge",
        );
      for (let i = 0; i < p.count; i += 3) {
        const t = [0, 1, 2].map((j) => [p.getX(i + j), p.getZ(i + j)]);
        const cross = (a, b) =>
          (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
        const sides = [cross(t[0], t[1]), cross(t[1], t[2]), cross(t[2], t[0])];
        const area =
          (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) -
          (t[1][1] - t[0][1]) * (t[2][0] - t[0][0]);
        assert.ok(
          Math.abs(area) < 1e-8 ||
            !(sides.every((x) => x >= 0) || sides.every((x) => x <= 0)),
        );
        for (let j = 0; j < 3; j++)
          assert.ok(
            distance(point, t[j], t[(j + 1) % 3]) > r,
            `${name} crown at ${tree.x},${tree.z} overlaps paving`,
          );
      }
    }
  }
  assert.equal(
    modelSource("/models/coastal-tree.glb", 1),
    "/models/compact/coastal-tree.glb",
  );
  g.dispose();
});
