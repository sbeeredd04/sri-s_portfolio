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
test("the entire guided Foundry walk clears workshop walls", () => {
  const route = streetRoutes.projects;
  for (let i = 1; i < route.length; i++)
    for (let j = 0; j <= 80; j++)
      for (const p of workshops) {
        const t = j / 80,
          a = route[i - 1].point,
          b = route[i].point;
        assert.ok(
          !crosses(
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            0.25,
            0.25,
            p,
          ),
          `walk enters ${p.id}`,
        );
      }
});

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
