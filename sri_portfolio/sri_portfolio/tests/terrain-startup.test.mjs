import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  prepareTerrainGeometry,
  createTerrainGeometry,
} from "../app/lib/terrain-geometry.mjs";

test("startup yields to input without changing a vertex, normal, UV or triangle", async () => {
  // A fresh module owns an independent cache, so this is the actual current
  // synchronous build rather than a stale golden hash of an older world.
  const synchronous = (
    await import("../app/lib/terrain-geometry.mjs?sync-baseline")
  ).createTerrainGeometry();
  const fingerprint = (mesh) => {
    const hash = createHash("sha256");
    for (const name of ["position", "normal", "uv"])
      hash.update(Buffer.from(mesh.attributes[name].array.buffer));
    hash.update(Buffer.from(mesh.index.array.buffer));
    return hash.digest("hex");
  };
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
    assert.equal(fingerprint(geometry), fingerprint(synchronous));
    const next = createTerrainGeometry();
    assert.notEqual(next, geometry);
    assert.notEqual(
      next.attributes.position.array,
      geometry.attributes.position.array,
    );
    geometry.dispose();
    assert.equal(
      next.attributes.position.count,
      synchronous.attributes.position.count,
    );
    assert.ok(next.attributes.position.count > 60000);
    synchronous.dispose();
    next.dispose();
  } finally {
    clearInterval(timer);
  }
});
