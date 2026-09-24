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
    const bytes = statSync(
      new URL("../public/models/" + file, import.meta.url),
    ).size;
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

// picnic-table.glb 2.24 x 3.02 m and trash-can.glb 0.78 x 0.56 m (CATALOG).
test("park furniture stays off the courts and the promenade", async () => {
  const { courtPicnicTables, courtBins, courts, overlapsCourt, courtPaths } =
    await import("../app/lib/court-layout.mjs");
  const pieces = [
    ...courtPicnicTables.map((p) => ({ ...p, half: 1.51 })),
    ...courtBins.map((p) => ({ ...p, half: 0.39 })),
  ];
  for (const {
    position: [x, , z],
    half,
  } of pieces) {
    for (const id of Object.keys(courts))
      assert.ok(
        !overlapsCourt(x, z, half, half, id, courts[id].apron),
        `on ${id}`,
      );
    for (const [[ax, az], [bx, bz], width] of courtPaths) {
      const inX =
        x + half > Math.min(ax, bx) - width / 2 &&
        x - half < Math.max(ax, bx) + width / 2;
      const inZ =
        z + half > Math.min(az, bz) - width / 2 &&
        z - half < Math.max(az, bz) + width / 2;
      assert.ok(!(inX && inZ), `piece at ${x},${z} on a path`);
    }
  }
});
