import test from "node:test";
import assert from "node:assert/strict";
import { courtCrowd, courtCrowdBudget } from "../app/lib/court-crowd.mjs";
import { courtPaths, overlapsCourt } from "../app/lib/court-layout.mjs";

test("the court crowd stays within its tier budget", () => {
  for (const tier of Object.keys(courtCrowdBudget))
    assert.equal(courtCrowd(tier).length, courtCrowdBudget[tier]);
});

test("spectators stand off the courts and walkers keep to the promenade", () => {
  const [[ax, az], [bx], width] = courtPaths[0];
  for (const a of courtCrowd("high")) {
    if (a.path)
      for (const [x, z] of a.path) {
        assert.ok(Math.abs(z - az) < width / 2, "walker off the promenade");
        assert.ok(x >= ax && x <= bx);
      }
    else
      for (const id of ["badminton", "volleyball", "basketball"])
        assert.ok(
          !overlapsCourt(a.x, a.z, 0.3, 0.3, id, 0.4),
          `spectator on ${id}`,
        );
  }
});

test("court crowd soles match the shipped terrace and actual promenade paving", async () => {
  const { shippedModel } = await import("./helpers/authored-model.mjs");
  const { Raycaster, Vector3 } = await import("three");
  const { pavingPlacements, pavingSize } =
    await import("../app/lib/paving-layout.mjs");
  const { courtPaths } = await import("../app/lib/court-layout.mjs");
  const { scene } = await shippedModel("/models/islands/after-hours-coast.glb");
  const terrain = scene.getObjectByName("AfterHours_ContinuousCoast");
  scene.updateMatrixWorld(true);
  const paving = pavingPlacements("court", courtPaths);
  for (const agent of courtCrowd("high")) {
    if (!agent.path) {
      const hit = new Raycaster(
        new Vector3(agent.x, 10, agent.z),
        new Vector3(0, -1, 0),
      ).intersectObject(terrain)[0];
      assert.ok(hit);
      assert.ok(Math.abs(2.8 + agent.groundOffset - hit.point.y) < 0.001);
    } else {
      const [a, b] = agent.path;
      for (let t = 0; t <= 1; t += 0.05) {
        const x = a[0] + (b[0] - a[0]) * t,
          z = a[1] + (b[1] - a[1]) * t;
        const cell = paving.find(
          (p) =>
            Math.abs(p.x - x) <= pavingSize[0] / 2 &&
            Math.abs(p.z - z) <= pavingSize[2] / 2,
        );
        // The small authored joints between pavers remain visible.
        if (cell)
          assert.ok(
            Math.abs(agent.groundOffset - (cell.y + cell.height / 2)) < 0.001,
          );
      }
    }
  }
});
