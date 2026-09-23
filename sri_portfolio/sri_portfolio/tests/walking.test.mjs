import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import {
  makeWalkNetwork,
  walkStart,
  advanceWalker,
  nearestWalk,
  walkingJoins,
  WALK_RADIUS,
  isWalkingInputTarget,
} from "../app/lib/walk-network.mjs";
import { walkingRoutes, pathPose } from "../app/lib/world-paths.mjs";
import { regions } from "../app/lib/world-layout.mjs";
import {
  trailCenter,
  trailStops,
  trailTrees,
} from "../app/lib/trail-layout.mjs";
import {
  distanceToOverlook,
  overlookPolyline,
} from "../app/lib/valley-layout.mjs";
import { createPineGeometry } from "../app/lib/forest-geometry.mjs";
import { pavingCells, pavingSize } from "../app/lib/paving-layout.mjs";
import { workshops, projectWalks } from "../app/lib/project-town-layout.mjs";
const network = makeWalkNetwork();
test("brisk walking is frame-rate independent, stops smoothly and cannot leave a path", () => {
  const simulate = (hz) => {
    const state = walkStart("court");
    for (let i = 0; i < hz * 2; i++)
      advanceWalker(
        state,
        regions.find((r) => r.id === "court").east,
        1 / hz,
        network,
      );
    return state;
  };
  const a = simulate(30),
    b = simulate(120);
  assert.ok(a.position.distanceTo(b.position) < 0.09);
  assert.ok(a.distance > 7.8 && a.distance < 8.5);
  for (let i = 0; i < 120; i++)
    advanceWalker(a, new Vector3(), 1 / 60, network);
  assert.ok(a.velocity.length() < 0.001);
  const off = regions.find((r) => r.id === "court").north.clone();
  for (let i = 0; i < 400; i++) advanceWalker(a, off, 1 / 60, network);
  const near = nearestWalk(a.position, network);
  assert.ok(
    Math.sqrt(near.distance) <=
      Math.max(0.08, near.segment.half - WALK_RADIUS) + 0.02,
  );
});
test("every causeway and bridge deck belongs to the continuous pedestrian network", () => {
  for (const route of walkingRoutes)
    for (let i = 0; i <= 80; i++) {
      const p = pathPose(route, i / 80, 0, 0.115);
      const n = nearestWalk(p.position, network);
      assert.ok(
        Math.sqrt(n.distance) < 0.06,
        `${route.from} to ${route.to} at ${i}`,
      );
    }
  // Endpoint connections are reachable through nearby local geometry, not an isolated path.
  for (const route of walkingRoutes)
    for (const [t, id] of [
      [0, route.from],
      [1, route.to],
    ]) {
      const point = pathPose(route, t, 0, 0.115).position;
      const local = network.filter((s) => s.world === id && !s.connection);
      assert.ok(
        Math.sqrt(nearestWalk(point, local).distance) < 0.25,
        `${id} path join`,
      );
    }
});
test("apartment walking stays on its own floor; ground routes do not teleport through the building", () => {
  const roof = makeWalkNetwork(true);
  assert.ok(roof.every((s) => s.world === "studio" && s.a.y > 199));
  const outside = walkStart("studio");
  assert.ok(
    outside.position.distanceTo(walkStart("studio", true).position) > 9,
  );
});
test("trail viewpoints share the actual winding center and full rendered crowns clear the path", () => {
  for (const s of trailStops) assert.equal(s.point[0], trailCenter(s.point[1]));
  const model = createPineGeometry(true);
  for (const [index, t] of trailTrees.entries())
    for (const g of Object.values(model)) {
      const positions = g.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const v = new Vector3()
          .fromBufferAttribute(positions, i)
          .multiply(new Vector3(t.s * (0.82 + (index % 4) * 0.065), t.s, t.s))
          .applyAxisAngle(new Vector3(0, 1, 0), index)
          .add(new Vector3(t.x, 0, t.z));
        if (v.z >= -18.6 && v.z <= 12)
          assert.ok(
            Math.abs(v.x - trailCenter(v.z)) > 1.05,
            "crown intrudes into trail/camera corridor",
          );
        if (distanceToOverlook(v.x, v.z) < 4)
          assert.ok(
            distanceToOverlook(v.x, v.z) > 1.05,
            "crown intrudes into the overlook spur",
          );
      }
    }
  Object.values(model).forEach((g) => g.dispose());
});
test("all Foundry paving including new connection clears workshop footprints", () => {
  for (const stone of pavingCells([...projectWalks, ...walkingJoins.projects]))
    for (const p of workshops)
      assert.ok(
        !(
          Math.abs(stone.x - p.position[0]) < 1.8 + pavingSize[0] / 2 &&
          Math.abs(stone.z - p.position[2]) < 1.7 + pavingSize[2] / 2
        ),
        `${p.id} collision`,
      );
});
test("the overlook deck is on the continuous trail", () => {
  const deck = overlookPolyline().at(-1);
  const region = regions.find((item) => item.id === "trail");
  const localOf = (position) => {
    const relative = position.clone().sub(region.center);
    return [relative.dot(region.east), relative.dot(region.north)];
  };
  const state = walkStart("trail");
  const steer = (dx, dz) => {
    const desired = region.east
      .clone()
      .multiplyScalar(dx)
      .add(region.north.clone().multiplyScalar(dz));
    if (desired.lengthSq() > 0) desired.normalize();
    advanceWalker(state, desired, 1 / 60, network);
  };
  for (let i = 0; i < 900; i++) {
    if (localOf(state.position)[1] < -0.7) break;
    steer(0, -1);
  }
  assert.ok(localOf(state.position)[1] < 0, "walker did not reach the spur");
  for (let i = 0; i < 420; i++) {
    const [x, z] = localOf(state.position);
    steer(deck[0] - x, deck[1] - z);
  }
  const [x, z] = localOf(state.position);
  assert.ok(
    Math.hypot(x - deck[0], z - deck[1]) < 1.45,
    `overlook deck not reached (${x.toFixed(2)}, ${z.toFixed(2)})`,
  );
});
test("typing and open dialogs retain keyboard ownership", () => {
  assert.equal(isWalkingInputTarget({ closest: () => ({}) }), true);
  assert.equal(isWalkingInputTarget({ closest: () => null }), false);
  assert.equal(isWalkingInputTarget(null), false);
});

test("Foundry walk clears the complete gallery slabs and district lamps, including connecting paving", async () => {
  const { projectGallerySites, districtLamps } =
    await import("../app/lib/project-town-layout.mjs");
  for (const stone of pavingCells([
    ...projectWalks,
    ...walkingJoins.projects,
  ])) {
    for (const site of Object.values(projectGallerySites))
      assert.ok(
        !(
          Math.abs(stone.x - site.position[0]) <
            site.width / 2 + pavingSize[0] / 2 &&
          Math.abs(stone.z - site.position[2]) <
            site.depth / 2 + pavingSize[2] / 2
        ),
        "paving cuts gallery foundation",
      );
    for (const lamp of districtLamps) {
      const dx = Math.max(0, Math.abs(stone.x - lamp[0]) - pavingSize[0] / 2),
        dz = Math.max(0, Math.abs(stone.z - lamp[2]) - pavingSize[2] / 2);
      assert.ok(Math.hypot(dx, dz) > 0.22, "district lamp blocks walk");
    }
  }
});
