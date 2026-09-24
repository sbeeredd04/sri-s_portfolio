import test from "node:test";
import assert from "node:assert/strict";
import {
  audience,
  booths,
  browsers,
  hall,
  hallBounds,
  offices,
  plaza,
  strollers,
  techPalms,
  techViews,
  techWalks,
  tools,
} from "../app/lib/tech-plan.mjs";
import { foundryGroveTrees } from "../app/lib/foundry-grove.mjs";
import { inTechFootprint } from "../app/lib/tech-plan.mjs";
import { surfaceHeight } from "../app/lib/world-layout.mjs";
import { placeStops } from "../app/lib/place-stops.mjs";

const segDistance = ([ax, az], [bx, bz], x, z) => {
  const dx = bx - ax,
    dz = bz - az;
  const t = Math.max(
    0,
    Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)),
  );
  return Math.hypot(x - ax - dx * t, z - az - dz * t);
};
const onWalk = (x, z, pad = 0) =>
  techWalks.some(([a, b, w]) => segDistance(a, b, x, z) < w / 2 + pad);

test("the district sits on level ground", () => {
  const sites = [
    [hall.x, hall.z, ...hall.size],
    [plaza.x, plaza.z, plaza.half[0] * 2, plaza.half[1] * 2],
    ...offices.map((o) => [o.x, o.z, ...o.size]),
  ];
  for (const [x, z, w, d] of sites) {
    const heights = [-1, 0, 1].flatMap((a) =>
      [-1, 0, 1].map((b) =>
        surfaceHeight("projects", x + (a * w) / 2, z + (b * d) / 2),
      ),
    );
    assert.ok(
      Math.max(...heights) - Math.min(...heights) < 0.05,
      `${x},${z} is not level`,
    );
  }
});

test("walks enter the hall only through its door", () => {
  const { x0, x1, z0, z1 } = hallBounds;
  for (const [a, b] of techWalks)
    for (let t = 0; t <= 1; t += 0.01) {
      const x = a[0] + (b[0] - a[0]) * t,
        z = a[1] + (b[1] - a[1]) * t;
      const nearWall = Math.abs(x - x0) < 0.5 && z > z0 && z < z1;
      if (nearWall)
        assert.ok(
          Math.abs(z - hall.door.z) < hall.door.width / 2,
          `wall at ${z}`,
        );
      assert.ok(
        !(x > x1 - 0.5 && z > z0 && z < z1),
        "walk through the back wall",
      );
    }
});

test("offices, pylons and palms keep off the walks", () => {
  for (const o of offices)
    for (const [a, b, w] of techWalks)
      for (let t = 0; t <= 1; t += 0.02) {
        const x = a[0] + (b[0] - a[0]) * t,
          z = a[1] + (b[1] - a[1]) * t;
        const inside =
          Math.abs(x - o.x) < o.size[0] / 2 + w / 2 &&
          Math.abs(z - o.z) < o.size[1] / 2 + w / 2;
        assert.ok(!inside, `walk crosses office ${o.id}`);
      }
  for (const t of tools)
    assert.ok(!onWalk(t.x, t.z, 0.4), `pylon ${t.id} on a walk`);
  for (const p of techPalms())
    assert.ok(!onWalk(p.x, p.z, 0.3), `palm at ${p.x},${p.z} on a walk`);
});

test("the audience fills the hall and leaves the aisle open", () => {
  const people = audience("high");
  assert.ok(people.length >= 60);
  for (const p of people) {
    assert.ok(p.x > hallBounds.x0 && p.x < hall.stage.x - hall.stage.depth / 2);
    assert.ok(Math.abs(p.z - hall.door.z) > 1);
  }
  for (const s of strollers("high"))
    for (const [x, z] of s.path)
      assert.ok(
        onWalk(x, z, 1.2) ||
          (Math.abs(x - plaza.x) <= plaza.half[0] &&
            Math.abs(z - plaza.z) <= plaza.half[1]),
        `stroller off the paving at ${x},${z}`,
      );
});

test("grove trees stay out of the district", () => {
  for (const t of foundryGroveTrees())
    assert.ok(!inTechFootprint(t.x, t.z), `tree at ${t.x},${t.z}`);
});

test("the district's stops are listed in the Foundry", () => {
  const ids = placeStops.projects.map((s) => s.id);
  for (const v of techViews) assert.ok(ids.includes(v.id));
});

test("booths line the hall wall without blocking the demo walk", () => {
  for (const b of booths) {
    assert.ok(
      b.z + b.depth / 2 <= hallBounds.z0 + 0.01,
      "booth inside the hall",
    );
    for (const [x, z] of [
      [b.x - b.width / 2, b.z - b.depth / 2],
      [b.x + b.width / 2, b.z - b.depth / 2],
    ])
      assert.ok(!onWalk(x, z), `booth corner on a walk at ${x},${z}`);
  }
  for (const p of browsers("high"))
    assert.ok(onWalk(p.x, p.z), "browser off the walk");
});
