import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import {
  bridgeGeometry,
  bridgePoint,
  cableHeight,
  bayRoute,
} from "../app/lib/bay-bridge.mjs";
import {
  bayCrossing,
  crossingLift,
  pathPose,
} from "../app/lib/world-paths.mjs";
import { WORLD_RADIUS } from "../app/lib/world-layout.mjs";

test("crossing ramps meet shore paths continuously and keep the deck above water", () => {
  assert.equal(crossingLift(bayRoute, 0), 0);
  assert.equal(crossingLift(bayRoute, 1), 0);
  for (let i = 1; i <= 500; i++) {
    const t = i / 500,
      a = crossingLift(bayRoute, t),
      b = crossingLift(bayRoute, t - 0.002);
    assert.ok(
      Math.abs(a - b) / (0.002 * bayRoute.length) < 0.23,
      "approach gradient",
    );
    if (t >= 0.43 && t <= 0.74)
      assert.ok(
        bridgePoint(t).length() > WORLD_RADIUS + 3,
        "deck clears ocean",
      );
  }
});
test("suspension cable descends to anchors and clears the headroom at midspan", () => {
  const {
    start,
    end,
    towers: [a, b],
  } = bayCrossing;
  assert.ok(Math.abs(cableHeight(start) - 1.1) < 1e-8);
  assert.ok(Math.abs(cableHeight(end) - 1.1) < 1e-8);
  for (const t of [a, b]) assert.ok(Math.abs(cableHeight(t) - 12.4) < 1e-8);
  assert.equal(cableHeight((a + b) / 2), 3.5);
});
test("the full structural geometry clears the pedestrian envelope and stays within its render budget", () => {
  const { geometries } = bridgeGeometry();
  let triangles = 0;
  // Test every rendered vertex, not just centerline members. On this curved
  // world use the nearest path frame, then check lateral + vertical clearance.
  const frames = Array.from({ length: 241 }, (_, i) =>
    pathPose(
      bayRoute,
      bayCrossing.start + ((bayCrossing.end - bayCrossing.start) * i) / 240,
    ),
  );
  for (const geometry of Object.values(geometries)) {
    const p = geometry.attributes.position;
    triangles += p.count / 3;
    for (let i = 0; i < p.count; i++) {
      const v = new Vector3().fromBufferAttribute(p, i);
      let frame = frames[0],
        distance = Infinity;
      for (const f of frames) {
        const along = Math.abs(v.clone().sub(f.position).dot(f.forward));
        if (along < distance) {
          distance = along;
          frame = f;
        }
      }
      const delta = v.clone().sub(frame.position),
        y = delta.dot(frame.normal),
        x = Math.abs(delta.dot(frame.right));
      assert.ok(
        !(y > 0.12 && y < 2.2 && x < 1.39),
        `structure obstructs walking: lateral ${x}, height ${y}`,
      );
    }
    geometry.dispose();
  }
  assert.ok(triangles < 14000, `${triangles} triangles`);
  assert.equal(Object.keys(geometries).length, 4);
});

test("bridge walking stays on its own deck route and does not jump into the apartment", async () => {
  const { streetRoutes, streetRange } =
    await import("../app/lib/street-view.mjs");
  const indices = streetRoutes.studio
    .map((n, i) => (n.group === "bay" ? i : -1))
    .filter((i) => i >= 0);
  assert.equal(indices.length, 5);
  assert.equal(streetRange("studio", "street:0").end, indices[0] - 1);
  for (const i of indices) {
    const node = streetRoutes.studio[i],
      range = streetRange("studio", `street:${i}`);
    assert.equal(range.start, indices[0]);
    assert.equal(range.end, indices.at(-1));
    const point = new Vector3(...node.worldPosition),
      up = new Vector3(...node.up);
    assert.ok(Math.abs(up.length() - 1) < 1e-8);
    assert.ok(
      point.length() > WORLD_RADIUS + 2,
      "camera foot must stay on the raised crossing",
    );
    assert.ok(
      point.distanceTo(new Vector3(...node.worldLook)) < 5,
      "look toward the next deck section",
    );
  }
});
