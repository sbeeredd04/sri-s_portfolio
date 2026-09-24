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
