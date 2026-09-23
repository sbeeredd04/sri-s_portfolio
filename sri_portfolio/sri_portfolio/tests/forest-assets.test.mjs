import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { createPineGeometry } from "../app/lib/forest-geometry.mjs";
import { buildGraniteForm } from "../app/lib/granite-geometry.mjs";
import { graniteForms, inGraniteFootprint } from "../app/lib/valley-layout.mjs";
test("pine geometry and asset payload stay inside their browser budgets", () => {
  for (const detailed of [true, false]) {
    const g = createPineGeometry(detailed);
    let triangles = 0;
    for (const mesh of Object.values(g)) {
      triangles += mesh.attributes.position.count / 3;
      for (const value of mesh.attributes.position.array)
        assert.ok(Number.isFinite(value));
      assert.equal(mesh.attributes.uv.count, mesh.attributes.position.count);
      mesh.dispose();
    }
    assert.ok(triangles < (detailed ? 3000 : 1200));
  }
  const bytes = ["bark.webp", "needles.webp"].reduce(
    (sum, file) =>
      sum +
      statSync(new URL("../public/materials/pine/" + file, import.meta.url))
        .size,
    0,
  );
  assert.ok(bytes < 100000);
});
test("the granite exclusion mask encloses every rendered vertex", () => {
  for (const form of graniteForms) {
    const g = buildGraniteForm(form),
      p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      assert.ok(Number.isFinite(p.getY(i)));
      assert.ok(
        inGraniteFootprint(p.getX(i), p.getZ(i)),
        `unreserved granite at ${p.getX(i)},${p.getZ(i)}`,
      );
    }
    g.dispose();
  }
});

test("every rendered court-tree bounding footprint clears the playing aprons", async () => {
  const { courtTrees, courts, overlapsCourt } =
    await import("../app/lib/court-layout.mjs");
  for (const detailed of [true, false]) {
    const assets = createPineGeometry(detailed);
    courtTrees.forEach((tree, i) => {
      let minX = Infinity,
        maxX = -Infinity,
        minZ = Infinity,
        maxZ = -Infinity;
      for (const geometry of Object.values(assets)) {
        const p = geometry.attributes.position;
        for (let v = 0; v < p.count; v++) {
          const localX = p.getX(v) * tree.s * (0.82 + (i % 4) * 0.065),
            localZ = p.getZ(v) * tree.s;
          const x = tree.x + localX * Math.cos(i) + localZ * Math.sin(i);
          const z = tree.z - localX * Math.sin(i) + localZ * Math.cos(i);
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        }
      }
      for (const id of Object.keys(courts))
        assert.ok(
          !overlapsCourt(
            (minX + maxX) / 2,
            (minZ + maxZ) / 2,
            (maxX - minX) / 2,
            (maxZ - minZ) / 2,
            id,
            courts[id].apron,
          ),
          `tree footprint ${i} enters ${id}`,
        );
    });
    Object.values(assets).forEach((g) => g.dispose());
  }
});
