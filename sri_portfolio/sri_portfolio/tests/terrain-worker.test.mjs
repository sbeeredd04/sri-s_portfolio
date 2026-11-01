import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createTerrainGeometry } from "../app/lib/terrain-geometry.mjs";
import { packTerrain, unpackTerrain } from "../app/lib/terrain-transfer.mjs";
import { runTerrainWorker } from "../app/lib/terrain-preparation.mjs";

test("transferred terrain preserves the exact rendered mesh and contact index", () => {
  const original = createTerrainGeometry();
  const packed = packTerrain(original);
  const received = structuredClone(packed, {
    transfer: Object.values(packed).map((a) => a.buffer),
  });
  assert.equal(packed.position.byteLength, 0);
  const mesh = unpackTerrain(received);
  const hash = createHash("sha256");
  for (const name of ["position", "normal", "uv"])
    hash.update(Buffer.from(mesh.attributes[name].array.buffer));
  hash.update(Buffer.from(mesh.index.array.buffer));
  assert.equal(
    hash.digest("hex"),
    "6ac78d0da87d61110936aafe0388d077eb49dba00727c81f35e3cf5a84126bf8",
  );
  for (const [cell, triangles] of original.userData.refinedCells)
    assert.deepEqual([...mesh.userData.refinedCells.get(cell)], triangles);
  assert.equal(
    mesh.userData.refinedTriangleCount,
    original.userData.refinedTriangleCount,
  );
  assert.equal(
    mesh.attributes.position.array,
    received.position,
    "hydrate without another array copy",
  );
  mesh.dispose();
  original.dispose();
});

test("malformed worker results are rejected before installation", () => {
  assert.throws(() => unpackTerrain({}), /Incomplete/);
});

for (const outcome of [
  "success",
  "error",
  "messageerror",
  "reported-error",
  "timeout",
  "post-throws",
]) {
  test(`worker cleanup after ${outcome}`, async () => {
    let terminated = 0;
    const worker = {
      terminate() {
        terminated++;
      },
      postMessage() {
        if (outcome === "post-throws") throw new Error("failed");
        queueMicrotask(() => {
          if (outcome === "success")
            worker.onmessage({ data: { result: true } });
          if (outcome === "reported-error")
            worker.onmessage({ data: { error: "failed" } });
          if (outcome === "error") worker.onerror({ preventDefault() {} });
          if (outcome === "messageerror") worker.onmessageerror();
        });
      },
    };
    const pending = runTerrainWorker(() => worker, 10);
    if (outcome === "success")
      assert.deepEqual(await pending, { result: true });
    else await assert.rejects(pending);
    assert.equal(terminated, 1);
    assert.equal(worker.onmessage, null);
  });
}
