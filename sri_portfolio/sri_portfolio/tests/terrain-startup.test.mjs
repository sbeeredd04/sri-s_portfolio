import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  prepareTerrainGeometry,
  createTerrainGeometry,
} from "../app/lib/terrain-geometry.mjs";

test("startup yields to input without changing a vertex, normal, UV or triangle", async () => {
  let heartbeats = 0;
  const timer = setInterval(() => heartbeats++, 0);
  try {
    const first = prepareTerrainGeometry();
    assert.equal(
      prepareTerrainGeometry(),
      first,
      "concurrent requests share the build",
    );
    await first;
    assert.ok(heartbeats > 5, `only ${heartbeats} opportunities for input`);
    const geometry = createTerrainGeometry();
    const hash = createHash("sha256");
    for (const name of ["position", "normal", "uv"])
      hash.update(Buffer.from(geometry.attributes[name].array.buffer));
    hash.update(Buffer.from(geometry.index.array.buffer));
    // Captured from the synchronous mesh with the Fieldnotes headland and compact Foundry waterfront.
    assert.equal(
      hash.digest("hex"),
      "f59ff3fd7bb76afed89df69aab5e3711d026fafee95805fdd2f7fa0ce3a000db",
    );
    const next = createTerrainGeometry();
    assert.notEqual(next, geometry);
    assert.notEqual(
      next.attributes.position.array,
      geometry.attributes.position.array,
    );
    geometry.dispose();
    assert.equal(next.attributes.position.count, 149428);
    next.dispose();
  } finally {
    clearInterval(timer);
  }
});
