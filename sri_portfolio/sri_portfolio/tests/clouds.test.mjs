import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cloudLayer, cloudSteps, cloudRaySegment } from "../app/lib/clouds.mjs";
import { WORLD_RADIUS } from "../app/lib/world-layout.mjs";

test("cloud rays cross the same detached deck from ground, inside and orbit", () => {
  assert.deepEqual(
    cloudRaySegment([0, WORLD_RADIUS + 2, 0], [0, 1, 0]),
    [62, 102],
  );
  assert.deepEqual(
    cloudRaySegment([0, WORLD_RADIUS + 84, 0], [0, 1, 0]),
    [0, 20],
  );
  assert.deepEqual(
    cloudRaySegment([0, WORLD_RADIUS + 84, 0], [0, -1, 0]),
    [0, 20],
  );
  assert.deepEqual(
    cloudRaySegment([0, WORLD_RADIUS + 160, 0], [0, -1, 0]),
    [56, 96],
  );
  assert.equal(
    cloudRaySegment([0, WORLD_RADIUS + 2, 0], [0, -1, 0]),
    null,
    "ground occludes far-side clouds",
  );
  assert.equal(
    cloudRaySegment([0, WORLD_RADIUS + 160, 0], [0, 1, 0]),
    null,
    "space contains no cloud",
  );
});
test("cloud pass has a bounded phone budget and a compact authored noise volume", async () => {
  const volume = await readFile(
    new URL("../public/atmosphere/cloud-noise-64.bin", import.meta.url),
  );
  assert.equal(volume.length, cloudLayer.noiseSize ** 3 * 2);
  assert.ok(volume.length <= 512 * 1024);
  assert.ok(cloudSteps.low <= 10);
  assert.ok(cloudSteps.high <= 24);
  assert.ok(cloudSteps.low < cloudSteps.medium);
  const distinct = new Set(volume);
  assert.ok(
    distinct.size > 100,
    "density volume must retain smooth tonal detail",
  );
});
