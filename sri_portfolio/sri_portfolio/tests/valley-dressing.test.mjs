import test from "node:test";
import assert from "node:assert/strict";
import { valleyDressing, TRAIL_CLEAR } from "../app/lib/valley-dressing.mjs";
import {
  blocksValleyPlanting,
  distanceToOverlook,
  trailCenter,
} from "../app/lib/valley-layout.mjs";

const low = new Set(["rock-small", "stones-pebbles"]);
const dressing = Object.entries(valleyDressing());

test("valley dressing keeps its footprint off the trail and overlook", () => {
  for (const [kind, spots] of dressing)
    for (const s of spots) {
      const clear = low.has(kind) ? TRAIL_CLEAR.low : TRAIL_CLEAR.tall;
      assert.ok(
        Math.abs(s.x - trailCenter(s.z)) >= clear + s.radius,
        `${kind} on trail`,
      );
      assert.ok(
        distanceToOverlook(s.x, s.z) >= 1.4 + s.radius,
        `${kind} on overlook`,
      );
    }
});

test("valley dressing stays out of water and granite", () => {
  for (const [kind, spots] of dressing)
    for (const s of spots)
      assert.ok(!blocksValleyPlanting(s.x, s.z, s.radius), `${kind} blocked`);
});

test("valley dressing pieces do not overlap each other", () => {
  for (const [kind, spots] of dressing)
    spots.forEach((a, i) =>
      spots
        .slice(i + 1)
        .forEach((b) =>
          assert.ok(
            Math.hypot(a.x - b.x, a.z - b.z) >= a.radius + b.radius,
            `${kind} overlap`,
          ),
        ),
    );
});
