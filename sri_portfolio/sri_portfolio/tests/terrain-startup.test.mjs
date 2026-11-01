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
    // Captured from the synchronous mesh with the Fieldnotes headland and Foundry northwest inlet.
    assert.equal(
      hash.digest("hex"),
      "6ac78d0da87d61110936aafe0388d077eb49dba00727c81f35e3cf5a84126bf8",
    );
    const next = createTerrainGeometry();
    assert.notEqual(next, geometry);
    assert.notEqual(
      next.attributes.position.array,
      geometry.attributes.position.array,
    );
    geometry.dispose();
    assert.equal(next.attributes.position.count, 146120);
    next.dispose();
  } finally {
    clearInterval(timer);
  }
});
