import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { shorelineSeaHeight, shorelines } from "../app/lib/shoreline-contours.mjs";
import { regions, surfaceHeight, WORLD_RADIUS } from "../app/lib/world-layout.mjs";

const turn = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

test("shoreline loops are generated from the current decoded coasts within the sea-plane tolerances", () => {
  execFileSync(process.execPath, [
    fileURLToPath(new URL("../scripts/build-shoreline-contours.mjs", import.meta.url)),
    "--check",
  ]);
});

test("external shoreline ribbons have five simple, consistently oriented loops on the level bay", () => {
  assert.equal(shorelineSeaHeight, WORLD_RADIUS);
  assert.deepEqual(shorelines.map(({ id }) => id).sort(), ["court", "future", "projects", "studio", "trail"]);
  assert.ok(shorelines.reduce((count, { points }) => count + points.length, 0) < 1000);
  for (const { id, points } of shorelines) {
    const { center } = regions.find((region) => region.id === id);
    assert.equal(new Set(points.map((point) => point.join(","))).size, points.length);
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      area += a[0] * b[1] - a[1] * b[0];
      assert.equal(surfaceHeight(id, a[0] - center.x, a[1] - center.z), 0);
      for (let j = i + 2; j < points.length; j++) {
        if (!i && j === points.length - 1) continue;
        const c = points[j], d = points[(j + 1) % points.length];
        assert.ok(turn(a, b, c) * turn(a, b, d) >= 0 ||
          turn(c, d, a) * turn(c, d, b) >= 0, `${id}: crossed segments ${i} and ${j}`);
      }
    }
    assert.ok(area > 0, `${id}: water belongs to the right of the closed ring`);
  }
});
