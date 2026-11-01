import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  coastalCoverAt,
  coastalCoverPixels,
  coastalGround,
} from "../app/lib/coastal-ground.mjs";
import { trees } from "../app/lib/fieldnotes-quarter.mjs";
test("shipped ground mask matches shared planting and paths without runtime baking", async () => {
  const { data, info } = await sharp("public/materials/coastal-cover.png")
    .raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(info.width, coastalGround.size);
  assert.equal(info.channels, 4);
  assert.deepEqual(new Uint8Array(data), coastalCoverPixels());
  for (const tree of trees) assert.equal(coastalCoverAt(tree.x, tree.z)[1], 1);
  assert.deepEqual(coastalCoverAt(30, 30), [0, 0, 0]);
  assert.ok(
    coastalCoverAt(-6.35, 0)[2] > 0.7,
    "path border must follow the shared west walk",
  );
  assert.equal(
    coastalCoverAt(0, -2)[1],
    0,
    "seating lawn must not acquire a tree-soil disk",
  );
});
