import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import { modelSource, startupAssets } from "../app/lib/world-assets.mjs";
import { cloudSteps, cloudStepLimits } from "../app/lib/clouds.mjs";

await MeshoptDecoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
for (const name of [
  "tree-broadleaf",
  "tree-small-broadleaf",
  "tree-fir",
  "tree-pine-dense",
]) {
  test(`${name}: compact file preserves the authored LOD1 footprint, topology and alpha materials`, async () => {
    const src = `/models/${name}.glb`,
      compact = modelSource(src, 1);
    const before = await io.read(`public${src}`),
      after = await io.read(`public${compact}`);
    const node = (doc) =>
      doc
        .getRoot()
        .listNodes()
        .find((n) => n.getName() === `${name}_LOD1`);
    assert.ok(
      after
        .getRoot()
        .listNodes()
        .every((n) => !n.getName().endsWith("_LOD0")),
    );
    assert.deepEqual(node(before).getMatrix(), node(after).getMatrix());
    const originals = node(before).getMesh().listPrimitives();
    const outputs = node(after).getMesh().listPrimitives();
    assert.equal(outputs.length, originals.length);
    for (let i = 0; i < outputs.length; i++) {
      for (const semantic of originals[i].listSemantics()) {
        assert.deepEqual(
          outputs[i].getAttribute(semantic).getArray(),
          originals[i].getAttribute(semantic).getArray(),
        );
      }
      // Meshopt may cyclically rotate a triangle's indices, preserving both
      // topology and winding. Compare oriented triangles, not that encoding.
      const triangles = (indices) => {
        const out = [];
        for (let j = 0; j < indices.length; j += 3) {
          const t = Array.from(indices.slice(j, j + 3));
          const start = t.indexOf(Math.min(...t));
          out.push([t[start], t[(start + 1) % 3], t[(start + 2) % 3]]);
        }
        return out;
      };
      assert.deepEqual(
        triangles(outputs[i].getIndices().getArray()),
        triangles(originals[i].getIndices().getArray()),
      );
      assert.equal(
        outputs[i].getMaterial().getAlphaMode(),
        originals[i].getMaterial().getAlphaMode(),
      );
    }
    assert.ok(
      after
        .getRoot()
        .listTextures()
        .every((t) => t.getSize().every((n) => n <= 512)),
    );
    assert.ok(
      (await stat(`public${compact}`)).size <
        (await stat(`public${src}`)).size * 0.65,
    );
    assert.equal(modelSource(src, 0), src);
  });
}
test("first-view preloads and phone cloud work have explicit budgets", () => {
  assert.ok(!startupAssets.some((s) => s.includes("stars-4k")));
  assert.ok(
    startupAssets
      .filter((s) => s.endsWith(".glb"))
      .every((s) => s.includes("/compact/")),
  );
  assert.equal(
    modelSource("/models/desk-wooden.glb", 1),
    "/models/desk-wooden.glb",
  );
  assert.ok(cloudSteps.low <= cloudStepLimits.low);
  assert.ok(cloudStepLimits.low < cloudStepLimits.medium);
});
