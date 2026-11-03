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
} from "../app/lib/valley-layout.mjs";
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
  // Brisk 3 m/s travel covers ~5.8 m after the short acceleration ramp.
  assert.ok(a.distance > 5.65 && a.distance < 6.05);
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
      const local = network.filter((s) => s.world === id &&
        (!s.connection || (t === 0 && route.joinsRoute &&
          s.connection === `${route.joinsRoute.from}:${route.joinsRoute.to}`)));
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
// Rendered trail trees are tree-pine-dense.glb (CATALOG: 4.14 x 4.29 m
// footprint at scale 1) at 0.85 * t.s * (0.9 + (i % 4) * 0.05), as in Landscape.
const PINE_CROWN_RADIUS = 4.29 / 2;
test("trail viewpoints share the actual winding center and full rendered crowns clear the path", () => {
  for (const s of trailStops) assert.equal(s.point[0], trailCenter(s.point[1]));
  for (const [index, t] of trailTrees.entries()) {
    const radius = PINE_CROWN_RADIUS * 0.85 * t.s * (0.9 + (index % 4) * 0.05);
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      const x = t.x + Math.cos(a) * radius,
        z = t.z + Math.sin(a) * radius;
      if (z >= -18.6 && z <= 12)
        assert.ok(
          Math.abs(x - trailCenter(z)) > 1.05,
          `crown of tree ${index} intrudes into trail/camera corridor`,
        );
      if (distanceToOverlook(x, z) < 4)
        assert.ok(
          distanceToOverlook(x, z) > 1.05,
          `crown of tree ${index} intrudes into the overlook spur`,
        );
    }
  }
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
test("every enabled authored trail branch is reachable on foot from the entry", async () => {
  const { outThereWalks } = await import("../app/lib/out-there-walk-runtime.mjs");
  const trailNetwork = network.filter((s) => s.world === "trail" && !s.connection);
  const region = regions.find((r) => r.id === "trail");
  const visited = new Map([["ENTRY", walkStart("trail")]]);
  const pending = new Set(outThereWalks);
  while (pending.size) {
    let progressed = false;
    for (const walk of pending) {
      const [from, to] = walk.id.split("__");
      const start = visited.get(from) || visited.get(to);
      if (!start) continue;
      const destination = visited.has(from) ? to : from;
      const points = visited.has(from) ? walk.points : [...walk.points].reverse();
      const state = { ...start, position: start.position.clone(), velocity: new Vector3(), forward: start.forward.clone(), up: start.up.clone() };
      for (const point of points) {
        const target = region.center.clone().addScaledVector(region.east, point[0]).addScaledVector(region.normal, point[1] + 0.004).addScaledVector(region.north, point[2]);
        for (let frame = 0; frame < 90 && state.position.distanceTo(target) > 0.09; frame++) {
          const desired = target.clone().sub(state.position).normalize();
          advanceWalker(state, desired, 1 / 60, trailNetwork);
        }
        assert.ok(state.position.distanceTo(target) < 0.14, `${walk.id} blocked at ${point.slice(0, 3)}`);
      }
      visited.set(destination, state);
      pending.delete(walk);
      progressed = true;
    }
    assert.ok(progressed, "An enabled trail branch is disconnected from ENTRY");
  }
  assert.ok(visited.has("CAMP") && visited.has("W2"), "camp and lakeside destinations must be reached");
  assert.ok(trailNetwork.every((segment) => segment.authoredPath), "obsolete procedural overlook must not create an invisible path");
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
