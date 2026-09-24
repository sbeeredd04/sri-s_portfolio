import test from "node:test";
import assert from "node:assert/strict";
import {
  audience,
  booths,
  browsers,
  offices,
  plaza,
  strollers,
  techPalms,
  techViews,
  techWalks,
  tools,
} from "../app/lib/tech-plan.mjs";
import {
  bowl,
  bowlOuter,
  canopyHeight,
  canopySurface,
  screen,
  stage,
  tierAt,
  tierHeight,
} from "../app/lib/amphitheatre.mjs";
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
    [stage.x - bowlOuter / 2 + 1.5, stage.z, bowlOuter + 3, 24],
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

test("walks reach the stage up the aisle, never across the tiers", () => {
  for (const [a, b] of techWalks)
    for (let t = 0; t <= 1; t += 0.01) {
      const x = a[0] + (b[0] - a[0]) * t,
        z = a[1] + (b[1] - a[1]) * t;
      assert.equal(tierAt(x, z), -1, `walk over a tier at ${x},${z}`);
      assert.ok(x < stage.x - stage.depth / 2, "walk onto the stage");
    }
  assert.ok(onWalk(stage.x - bowl.inner + 1, stage.z), "no walk to the front");
});

test("the canopy clears the screen, the side screens and the truss", () => {
  assert.ok(canopyHeight(screen.x, stage.z) > screen.y + screen.height / 2 + 2.5);
  assert.ok(canopyHeight(stage.x - 2.6, stage.z - 10) > 10);
  for (const p of canopySurface().posts)
    assert.equal(tierAt(p.x, p.z) >= 0 && Math.abs(p.z - stage.z) < 1.5, false);
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

test("the audience fills the tiers, faces the stage, and leaves the aisle open", () => {
  const people = audience("high");
  assert.ok(people.length >= 100);
  for (const p of people) {
    assert.ok(tierAt(p.x, p.z) >= 0, `standing off the tiers at ${p.x},${p.z}`);
    assert.ok(tierHeight(p.x, p.z) > 0);
    const toStage = Math.atan2(stage.x - p.x, stage.z - p.z);
    assert.ok(Math.abs(p.yaw - toStage) < 0.2, "turned away from the stage");
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

test("booths stand clear of the bowl without blocking the demo walk", () => {
  for (const b of booths) {
    for (const [x, z] of [
      [b.x - b.width / 2, b.z + b.depth / 2],
      [b.x + b.width / 2, b.z + b.depth / 2],
      [b.x, b.z + b.depth / 2],
    ])
      assert.ok(
        Math.hypot(x - stage.x, z - stage.z) > bowlOuter + 0.3 ||
          Math.abs(Math.atan2(z - stage.z, stage.x - x)) > bowl.span,
        `booth inside the bowl at ${x},${z}`,
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
