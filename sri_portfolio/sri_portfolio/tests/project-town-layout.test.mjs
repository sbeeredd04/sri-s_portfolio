import test from "node:test";
import assert from "node:assert/strict";
import {
  workshops,
  projectWalks,
  projectLamps,
  projectIndexPosition,
} from "../app/lib/project-town-layout.mjs";
import { pavingCells, pavingSize } from "../app/lib/paving-layout.mjs";
import { streetRoutes } from "../app/lib/street-view.mjs";
const crosses = (x, z, hx, hz, p) =>
  Math.abs(x - p.position[0]) < 1.8 + hx &&
  Math.abs(z - p.position[2]) < 1.7 + hz;
test("every external Foundry paving cell clears the workshop footprint", () => {
  for (const stone of pavingCells(projectWalks))
    for (const p of workshops)
      assert.ok(
        !crosses(stone.x, stone.z, pavingSize[0] / 2, pavingSize[2] / 2, p),
        `${p.id} at ${stone.x},${stone.z}`,
      );
});
// The live guided journey uses authored Made geometry and is covered in
// authored-connections.test.mjs. The remaining tests retain the old kit's
// isolated geometry invariants without confusing it with the mounted campus.

test("paving clears lamp bases and the index pedestal", () => {
  for (const stone of pavingCells(projectWalks)) {
    for (const [position, radius] of [
      ...projectLamps.map((p) => [p, 0.22]),
      [projectIndexPosition, 0.85],
    ]) {
      const dx = Math.max(
        0,
        Math.abs(stone.x - position[0]) - pavingSize[0] / 2,
      );
      const dz = Math.max(
        0,
        Math.abs(stone.z - position[2]) - pavingSize[2] / 2,
      );
      assert.ok(
        Math.hypot(dx, dz) > radius,
        `furniture at ${position} intersects paving ${stone.x},${stone.z}`,
      );
    }
  }
});
