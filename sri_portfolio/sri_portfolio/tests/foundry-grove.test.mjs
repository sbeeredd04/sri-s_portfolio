import test from "node:test";
import assert from "node:assert/strict";
import {
  foundryGroveTrees,
  GROVE_WALK_CLEARANCE,
} from "../app/lib/foundry-grove.mjs";
import { makeWalkNetwork, nearestWalk } from "../app/lib/walk-network.mjs";
import { regions, worldPoint } from "../app/lib/world-layout.mjs";
import { campusCenter, campusRadii } from "../app/lib/campus-layout.mjs";

const trees = foundryGroveTrees();

test("foundry grove trunks stay clear of every walk", () => {
  const network = makeWalkNetwork();
  const tooClose = trees.filter((t) => {
    const walk = nearestWalk(worldPoint("projects", [t.x, 0, t.z]), network);
    return Math.sqrt(walk.distance) < GROVE_WALK_CLEARANCE + walk.segment.half;
  });
  assert.deepEqual(tooClose, []);
});

test("foundry grove stays on the plateau and off the campus ring", () => {
  const region = regions.find((r) => r.id === "projects");
  const [cx, cz] = region.landCenter;
  const bad = trees.filter(
    (t) =>
      Math.hypot(t.x - cx, t.z - cz) > region.inner - 3 ||
      Math.hypot(t.x - campusCenter.x, t.z - campusCenter.z) <
        campusRadii.eaveOuter + 3,
  );
  assert.deepEqual(bad, []);
});
