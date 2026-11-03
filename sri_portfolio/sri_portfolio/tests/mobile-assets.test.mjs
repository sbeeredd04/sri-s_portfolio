import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import {
  modelSource,
  startupAssets,
  startupAssetsForTier,
} from "../app/lib/world-assets.mjs";
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

test("phone surface maps preserve complete PBR sets at a bounded GPU size", async () => {
  const { readdir } = await import("node:fs/promises");
  const { default: sharp } = await import("sharp");
  let beforePixels = 0,
    afterPixels = 0;
  const sets = await readdir("public/materials/mobile");
  assert.ok(sets.length >= 18);
  for (const set of sets) {
    for (const map of ["color", "normal", "arm"]) {
      const before = await sharp(
        `public/materials/${set}/${map}.webp`,
      ).metadata();
      const after = await sharp(
        `public/materials/mobile/${set}/${map}.webp`,
      ).metadata();
      assert.ok(after.width <= 512 && after.height <= 512);
      assert.equal(before.width / before.height, after.width / after.height);
      beforePixels += before.width * before.height;
      afterPixels += after.width * after.height;
    }
  }
  assert.ok(afterPixels <= beforePixels / 3);
});

test("lower phone bevel detail keeps transformed geometry footprints intact", async () => {
  const { mergedBoxes } = await import("../app/lib/model-geometry.mjs");
  const items = [
    { size: [10, 3, 4], radius: 0.06, position: [4, 2, 8] },
    {
      size: [5, 1, 2],
      radius: 0.02,
      position: [-2, 4, 5],
      rotation: [0, 0.7, 0],
    },
  ];
  const full = mergedBoxes(items, 2),
    phone = mergedBoxes(items, 1);
  assert.ok(
    phone.attributes.position.count < full.attributes.position.count * 0.5,
  );
  for (const edge of ["min", "max"])
    for (const axis of ["x", "y", "z"])
      assert.ok(
        Math.abs(full.boundingBox[edge][axis] - phone.boundingBox[edge][axis]) <
          0.005,
      );
  full.dispose();
  phone.dispose();
});

test("phone preload matches the maps the phone actually renders", () => {
  const urls = startupAssetsForTier("low");
  assert.ok(urls.includes("/materials/mobile/grass/color.webp"));
  assert.ok(!urls.includes("/materials/grass/color.webp"));
  assert.deepEqual(startupAssetsForTier("high"), startupAssets);
});
