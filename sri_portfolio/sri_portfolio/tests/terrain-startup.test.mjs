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
    // Captured from the synchronous mesh with the authored northern headland.
    assert.equal(
      hash.digest("hex"),
      "80078ccfa42341a0675bcf7f322877bd2a5835f38fecfaec531b1f3323e87882",
    );
    const next = createTerrainGeometry();
    assert.notEqual(next, geometry);
    assert.notEqual(
      next.attributes.position.array,
      geometry.attributes.position.array,
    );
    geometry.dispose();
    assert.equal(next.attributes.position.count, 143130);
    next.dispose();
  } finally {
    clearInterval(timer);
  }
});
