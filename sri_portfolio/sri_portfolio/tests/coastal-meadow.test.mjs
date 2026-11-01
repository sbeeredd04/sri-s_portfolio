import test from "node:test";
import assert from "node:assert/strict";
import {
  coastalMeadowSeeds,
  meadowSweep,
  meadowExclusions,
} from "../app/lib/coastal-meadow.mjs";
import { grassProfile, grassCount, nearGrassCount } from "../app/lib/grass.mjs";
import { buildFieldnotesPaving } from "../app/lib/fieldnotes-surface.mjs";
import { regions } from "../app/lib/world-layout.mjs";
import {
  walkingRoutes,
  pathPose,
  pathHalfWidth,
} from "../app/lib/world-paths.mjs";
function edgeDistance(p, a, b) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    den = dx * dx + dz * dz;
  if (!den) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(
    0,
    Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / den),
  );
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
}
test("composed meadow keeps full swept blades outside rendered paving, terraces and bridge", () => {
  const profile = grassProfile.future,
    h = profile.height * 1.35 * 1.3;
  const swept =
    h * (0.35 + 0.55) +
    Math.hypot(0.05, 0.035) * (0.6 + h) +
    profile.width * 0.5 * 1.3;
  assert.ok(
    meadowSweep > swept,
    "clearance no longer contains maximum blade deformation",
  );
  const g = buildFieldnotesPaving(),
    p = g.attributes.position,
    triangles = [];
  for (let i = 0; i < p.count; i += 3) {
    const t = [0, 1, 2].map((j) => [p.getX(i + j), p.getZ(i + j)]);
    triangles.push(t);
  }
  const region = regions.find((r) => r.id === "future"),
    inverse = region.rotation.clone().invert();
  const bridge = [];
  for (const route of walkingRoutes.filter(
    (r) => r.from === "future" || r.to === "future",
  ))
    for (let i = 0; i <= 100; i++) {
      const point = pathPose(route, i / 100, 0, 0)
        .position.clone()
        .sub(region.center)
        .applyQuaternion(inverse);
      bridge.push([point.x, point.z, pathHalfWidth(route, i / 100)]);
    }
  const seeds = coastalMeadowSeeds(
    grassCount("future", "high") + nearGrassCount("future", "high"),
    profile.extent,
  );
  assert.deepEqual(seeds, coastalMeadowSeeds(seeds.length / 4, profile.extent));
  for (let i = 0; i < seeds.length; i += 4) {
    const v = [seeds[i] * profile.extent, seeds[i + 1] * profile.extent];
    for (const t of triangles) {
      // Complete projected triangle boundary, including the square paving ends.
      const cross = (a, b) =>
        (b[0] - a[0]) * (v[1] - a[1]) - (b[1] - a[1]) * (v[0] - a[0]);
      const sides = [cross(t[0], t[1]), cross(t[1], t[2]), cross(t[2], t[0])];
      const area =
        (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) -
        (t[1][1] - t[0][1]) * (t[2][0] - t[0][0]);
      assert.ok(
        Math.abs(area) < 1e-8 ||
          !(sides.every((s) => s >= 0) || sides.every((s) => s <= 0)),
        "root on rendered paving",
      );
      for (let j = 0; j < 3; j++)
        assert.ok(
          edgeDistance(v, t[j], t[(j + 1) % 3]) >= meadowSweep - 1e-5,
          "wind sweep intersects paving",
        );
    }
    for (const [x, z, hx, hz] of meadowExclusions)
      assert.ok(
        Math.abs(v[0] - x) >= hx + meadowSweep - 1e-5 ||
          Math.abs(v[1] - z) >= hz + meadowSweep - 1e-5,
      );
    for (const [x, z, half] of bridge)
      assert.ok(
        Math.hypot(v[0] - x, v[1] - z) > half + meadowSweep,
        "meadow intersects connecting bridge",
      );
  }
  g.dispose();
});

test("coastal six-blade tuft keeps the actual triangle budget", async () => {
  const { tuftGeometry } = await import("../app/lib/grass-tuft.mjs");
  const original = tuftGeometry(),
    coastal = tuftGeometry(true);
  assert.equal(original.index.count / 3, 24);
  assert.equal(coastal.index.count / 3, 24);
  assert.equal(coastal.attributes.position.count, 36);
  original.dispose();
  coastal.dispose();
});
