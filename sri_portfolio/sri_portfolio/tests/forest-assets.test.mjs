import test from "node:test";
import assert from "node:assert/strict";
import { statSync } from "node:fs";
import { buildGraniteForm } from "../app/lib/granite-geometry.mjs";
import { graniteForms, inGraniteFootprint } from "../app/lib/valley-layout.mjs";
test("scanned and sculpted tree payloads stay inside their browser budgets", () => {
  const limits = {
    "tree-pine-dense.glb": 600000,
    "tree-fir.glb": 1400000,
    "tree-broadleaf.glb": 1700000,
    "tree-small-broadleaf.glb": 1300000,
  };
  for (const [file, limit] of Object.entries(limits)) {
    const bytes = statSync(new URL("../public/models/" + file, import.meta.url)).size;
    assert.ok(bytes < limit, `${file} is ${bytes} bytes`);
  }
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

// Court trees render tree-fir.glb (CATALOG: 6.43 x 6.26 m at scale 1) at
// 0.36 * t.s * (0.9 + (i % 4) * 0.05), as in Landscape.
test("every rendered court-tree bounding footprint clears the playing aprons", async () => {
  const { courtTrees, courts, overlapsCourt } =
    await import("../app/lib/court-layout.mjs");
  courtTrees.forEach((tree, i) => {
    const half = (6.43 / 2) * 0.36 * tree.s * (0.9 + (i % 4) * 0.05);
    for (const id of Object.keys(courts))
      assert.ok(
        !overlapsCourt(tree.x, tree.z, half, half, id, courts[id].apron),
        `tree footprint ${i} enters ${id}`,
      );
  });
});
