import test from "node:test";
import assert from "node:assert/strict";
import { Box3, Vector3 } from "three";
import { shippedModel } from "./helpers/authored-model.mjs";

async function modelStats(name) {
  const { scene, bytes } = await shippedModel(`/models/${name}.glb`);
  const materials = new Set();
  let triangles = 0;
  scene.traverse((node) => {
    if (!node.isMesh) return;
    for (const material of Array.isArray(node.material)
      ? node.material
      : [node.material])
      materials.add(material);
    triangles +=
      (node.geometry.index?.count ?? node.geometry.attributes.position.count) /
      3;
  });
  const size = new Box3().setFromObject(scene).getSize(new Vector3());
  return {
    material_count: materials.size,
    triangles,
    bytes: bytes.length,
    dimensions_m: { width: size.x, height: size.y },
  };
}
import {
  blocksValleyPlanting,
  inViewpoint,
  redwoodBenchmark,
  renderedTrail,
  trailCenter,
} from "../app/lib/valley-layout.mjs";
import { valleyDressing } from "../app/lib/valley-dressing.mjs";

test("the authored redwood stays clear of the complete rendered trail width", () => {
  const tree = redwoodBenchmark;
  let nearest = Infinity;
  for (
    let z = Math.max(renderedTrail.end, tree.z - tree.crownRadius);
    z <= Math.min(renderedTrail.start, tree.z + tree.crownRadius);
    z += 0.025
  ) {
    nearest = Math.min(
      nearest,
      Math.hypot(tree.x - trailCenter(z), tree.z - z),
    );
  }
  const fullPathClearance =
    tree.crownRadius + renderedTrail.half + tree.trailMargin;
  assert.ok(
    nearest > fullPathClearance,
    `redwood crown is ${nearest.toFixed(2)}m from the trail; ${fullPathClearance.toFixed(2)}m is required`,
  );
  assert.ok(tree.rootRadius < tree.crownRadius);
  assert.equal(
    inViewpoint(tree.x, tree.z, tree.crownRadius),
    false,
    "the benchmark should frame rather than block the waterfall sightline",
  );
  for (const spots of Object.values(valleyDressing()))
    for (const spot of spots)
      assert.ok(
        Math.hypot(spot.x - tree.x, spot.z - tree.z) >
          tree.rootRadius + spot.radius,
        `dressing intersects the redwood root envelope at ${spot.x},${spot.z}`,
      );
});

test("the redwood benchmark is a compact authored mesh with mature scale", async () => {
  const stats = await modelStats("redwood-hero");
  assert.equal(stats.material_count, 1);
  assert.ok(stats.triangles < 8000, `${stats.triangles} triangles`);
  assert.ok(stats.bytes < 300_000, `${stats.bytes} bytes`);
  assert.ok(stats.dimensions_m.height > 11 && stats.dimensions_m.height < 13);
  assert.ok(stats.dimensions_m.width > 6 && stats.dimensions_m.width < 8);
});

test("eight authored ferns make a clear, compact vignette around the redwood", async () => {
  const fernStats = await modelStats("forest-fern");
  const ferns = valleyDressing()["forest-fern"];
  assert.equal(ferns.length, 8);
  for (const fern of ferns) {
    const fromTree = Math.hypot(
      fern.x - redwoodBenchmark.x,
      fern.z - redwoodBenchmark.z,
    );
    assert.ok(
      fromTree > redwoodBenchmark.rootRadius + fern.radius + 0.15,
      `fern intersects buttress roots at ${fern.x.toFixed(2)},${fern.z.toFixed(2)}`,
    );
    assert.ok(
      Math.abs(fern.x - trailCenter(fern.z)) > 2.1 + fern.radius,
      `fern enters the full-width walking clearance at ${fern.x.toFixed(2)},${fern.z.toFixed(2)}`,
    );
    assert.equal(
      blocksValleyPlanting(fern.x, fern.z, fern.radius + 0.15),
      false,
      `fern intersects water, rock, the overlook, campsite or roots at ${fern.x.toFixed(2)},${fern.z.toFixed(2)}`,
    );
    assert.equal(inViewpoint(fern.x, fern.z, fern.radius), false);
  }
  for (let i = 0; i < ferns.length; i++)
    for (let j = i + 1; j < ferns.length; j++)
      assert.ok(
        Math.hypot(ferns[i].x - ferns[j].x, ferns[i].z - ferns[j].z) >
          ferns[i].radius + ferns[j].radius,
      );
  assert.equal(fernStats.material_count, 1);
  assert.equal(fernStats.triangles, 640);
  assert.ok(fernStats.bytes < 30_000);
  assert.ok(fernStats.dimensions_m.width > 0.8);
  assert.ok(fernStats.dimensions_m.height > 0.35);
});
