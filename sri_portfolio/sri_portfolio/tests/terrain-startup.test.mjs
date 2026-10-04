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
    // Captured from the complete synchronous mesh before this scheduling change.
    assert.equal(
      hash.digest("hex"),
      "ad6b057d3d0b08f949721897f36cd49d34f87fd57d1efacd9d403b689a5627ad",
    );
    const next = createTerrainGeometry();
    assert.notEqual(next, geometry);
    assert.notEqual(
      next.attributes.position.array,
      geometry.attributes.position.array,
    );
    geometry.dispose();
    assert.equal(next.attributes.position.count, 143004);
    next.dispose();
  } finally {
    clearInterval(timer);
  }
});
