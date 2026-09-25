import test from "node:test";
import assert from "node:assert/strict";
import {
  boardYaw,
  districtSigns,
  signType,
} from "../app/lib/district-signs.mjs";
import { techWalks } from "../app/lib/tech-plan.mjs";
import {
  lakeDistance,
  renderedTrail,
  trailCenter,
} from "../app/lib/valley-layout.mjs";

const segDistance = ([ax, az], [bx, bz], x, z) => {
  const dx = bx - ax,
    dz = bz - az;
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)),
  );
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
};

test("every district sign has its biome's lettering and real destinations", () => {
  for (const [biome, sign] of Object.entries(districtSigns)) {
    assert.ok(signType[biome], `${biome} has no lettering`);
    assert.ok(sign.boards.length >= 2);
    for (const b of sign.boards)
      assert.ok(b.to.every(Number.isFinite), `${b.label} points nowhere`);
  }
});

test("a board's pointed end faces the place it names", () => {
  const sign = { x: 0, z: 0 };
  const yaw = boardYaw(sign, [0, 5]);
  // The board's local +x maps to (cos(-yaw), -sin(-yaw)) under rotation -yaw.
  assert.ok(Math.abs(Math.cos(-yaw)) < 1e-9);
  assert.ok(Math.abs(-Math.sin(-yaw) - 1) < 1e-9);
});

test("the Foundry sign stands beside the walks, not on them", () => {
  const { x, z } = districtSigns.projects;
  for (const [a, b, w] of techWalks)
    assert.ok(segDistance(a, b, x, z) > w / 2 + 0.3, "sign on a walk");
});

test("the trail sign stands off the trail and out of the lake", () => {
  const { x, z } = districtSigns.trail;
  assert.ok(z < renderedTrail.start && z > renderedTrail.end);
  assert.ok(Math.abs(x - trailCenter(z)) > renderedTrail.half + 0.6);
  assert.ok(lakeDistance(x, z) > 1);
});
