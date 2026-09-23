import test from "node:test";
import assert from "node:assert/strict";
import { Mesh, MeshBasicMaterial, DoubleSide, Raycaster } from "three";
import {
  createTerrainGeometry,
  renderedSurfaceHeight,
} from "../app/lib/terrain-geometry.mjs";
import { pavingPlacements, pavingSize } from "../app/lib/paving-layout.mjs";
import { courtPaths } from "../app/lib/court-layout.mjs";
import { worldPoint, regions } from "../app/lib/world-layout.mjs";

test("local terrain sampler agrees with raycasts against the complete rendered mesh", () => {
  const geometry = createTerrainGeometry(),
    material = new MeshBasicMaterial({ side: DoubleSide });
  const mesh = new Mesh(geometry, material);
  for (const [id, x, z] of [
    ["court", 22, 13],
    ["court", -20, 13],
    ["studio", 4, 7],
    ["trail", 7, 8],
    ["future", 0, -8],
    ["entertainment", 24, 7],
  ]) {
    const region = regions.find((r) => r.id === id);
    const hits = new Raycaster(
      worldPoint(id, [x, 40, z]),
      region.normal.clone().negate(),
    ).intersectObject(mesh);
    assert.ok(hits.length > 0);
    const expected = hits[0].point.sub(region.center).dot(region.normal);
    assert.ok(
      Math.abs(renderedSurfaceHeight(id, x, z) - expected) < 1e-5,
      `${id}: terrain mismatch`,
    );
  }
  geometry.dispose();
  material.dispose();
});

test("the full playground paving face clears rendered terrain while its foundation remains buried", () => {
  for (const stone of pavingPlacements("court", courtPaths)) {
    const top = stone.y + stone.height / 2,
      bottom = stone.y - stone.height / 2;
    for (let i = 0; i <= 4; i++)
      for (let j = 0; j <= 4; j++) {
        const ground = renderedSurfaceHeight(
          "court",
          stone.x + (i / 4 - 0.5) * pavingSize[0],
          stone.z + (j / 4 - 0.5) * pavingSize[2],
        );
        assert.ok(
          top > ground + 0.01,
          `ground clips tread at ${stone.x},${stone.z}`,
        );
        assert.ok(
          bottom < ground,
          `foundation floats at ${stone.x},${stone.z}`,
        );
      }
  }
});

test("listening-room hills do not lift the sports promenade into stairs", () => {
  for (const stone of pavingPlacements("court", courtPaths)) {
    assert.ok(
      Math.abs(stone.y) < 0.06,
      `paving lifted by a neighboring hill at ${stone.x},${stone.z}`,
    );
    assert.ok(
      Math.abs(stone.y + stone.height / 2) < 0.06,
      `unexpected step at ${stone.x},${stone.z}`,
    );
  }
});
