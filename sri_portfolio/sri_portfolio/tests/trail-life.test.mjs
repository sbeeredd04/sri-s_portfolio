import test from "node:test";
import assert from "node:assert/strict";
import {
  campFire,
  campTent,
  campers,
  trailLife,
  trailLifeBudget,
} from "../app/lib/trail-life.mjs";
import {
  blocksValleyPlanting,
  campsite,
  trailCenter,
} from "../app/lib/valley-layout.mjs";

test("the trail keeps to its budget, with hikers on the path", () => {
  for (const tier of Object.keys(trailLifeBudget)) {
    const people = trailLife(tier);
    assert.equal(people.length, trailLifeBudget[tier]);
    for (const p of people.filter((a) => a.path))
      for (const [x, z] of p.path)
        assert.ok(
          Math.abs(x - trailCenter(z)) < 0.5,
          `hiker off trail at ${x},${z}`,
        );
  }
});

test("campers circle the fire outside the stone ring and clear of the tent", () => {
  for (const c of campers()) {
    const d = Math.hypot(c.x - campFire.x, c.z - campFire.z);
    assert.ok(d > 1 && d < campsite.radius);
    assert.ok(Math.hypot(c.x - campTent.x, c.z - campTent.z) > 1.1);
  }
  assert.ok(
    blocksValleyPlanting(campFire.x, campFire.z),
    "planting would grow in the camp",
  );
});
