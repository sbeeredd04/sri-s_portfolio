import {
  courts,
  courtPaths,
  courtBenches,
  courtTrees,
  courtPlanting,
  courtLamps,
  overlapsCourt,
} from "../app/lib/court-layout.mjs";
import { pavingCells, pavingSize } from "../app/lib/paving-layout.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  walkingRoutes,
  pathSample,
  pathPose,
  crossingLift,
} from "../app/lib/world-paths.mjs";
import {
  regions,
  planetRadiusAt,
  regionDistance,
} from "../app/lib/world-layout.mjs";

test("walking paths follow the shared ground with orthogonal placement frames", () => {
  for (const route of walkingRoutes)
    for (let i = 0; i <= 40; i++) {
      const pose = pathPose(route, i / 40);
      assert.ok(
        Math.abs(
          pose.position.length() -
            planetRadiusAt(pose.normal) -
            crossingLift(route, i / 40) -
            0.08,
        ) < 1e-8,
      );
      assert.ok(Math.abs(pose.up.dot(pose.forward)) < 1e-8);
      assert.ok(Math.abs(pose.right.dot(pose.forward)) < 1e-8);
      // The two leisure neighborhoods share a tangent plane. A level promenade
      // may be >18° from the radial vector at its far end while staying flat.
      const frames = regions.filter((r) => {
        const local = pose.position
          .clone()
          .sub(r.center)
          .applyQuaternion(r.rotation.clone().invert());
        return regionDistance(r, local.x, local.z) <= r.inner + 1;
      });
      assert.ok(
        Math.max(
          pose.up.dot(pose.normal),
          ...frames.map((r) => pose.up.dot(r.normal)),
        ) > 0.95,
      );
    }
});
test("every connecting road clears all three playing areas with its full width", () => {
  const region = regions.find((r) => r.id === "court");
  const inverse = region.rotation.clone().invert();
  for (const route of walkingRoutes)
    for (let i = 0; i <= 300; i++)
      for (const side of [-1.2, 0, 1.2]) {
        const point = pathSample(route, i / 300, side)
          .position.sub(region.center)
          .applyQuaternion(inverse);
        if (point.y < -1) continue;
        for (const id of Object.keys(courts))
          assert.ok(
            !overlapsCourt(point.x, point.z, 0, 0, id, 0.4),
            `${route.from} → ${route.to} crosses ${id}: ${point.x},${point.z}`,
          );
      }
});
test("all snapped local paving stones clear the playing rectangles", () => {
  for (const p of pavingCells(courtPaths))
    for (const id of Object.keys(courts)) {
      assert.ok(
        !overlapsCourt(p.x, p.z, pavingSize[0] / 2, pavingSize[2] / 2, id, 0.5),
        `local paving crosses ${id}: ${p.x},${p.z}`,
      );
    }
});
test("court aprons, benches and tree crowns have their own space", () => {
  const entries = Object.entries(courts);
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const [id, c] = entries[i];
      assert.ok(
        !overlapsCourt(
          c.center[0],
          c.center[1],
          c.width / 2 + c.apron,
          c.depth / 2 + c.apron,
          entries[j][0],
          entries[j][1].apron,
        ),
        `${id} apron overlaps another court`,
      );
    }
  for (const bench of courtBenches)
    for (const id of Object.keys(courts))
      assert.ok(
        !overlapsCourt(
          bench.position[0],
          bench.position[2],
          0.65,
          0.95,
          id,
          0.4,
        ),
      );
  for (const tree of courtTrees)
    for (const id of Object.keys(courts))
      assert.ok(
        !overlapsCourt(tree.x, tree.z, 2.2 * tree.s, 2.2 * tree.s, id, 0.6),
        `tree canopy overlaps ${id}`,
      );
});

test("court planting and light poles stay clear of every playing apron", () => {
  for (const p of courtPlanting)
    for (const [id, c] of Object.entries(courts))
      assert.ok(
        !overlapsCourt(p.x, p.z, 0.25, 0.25, id, c.apron),
        `plant inside ${id}`,
      );
  for (const [x, , z] of courtLamps)
    for (const [id, c] of Object.entries(courts))
      assert.ok(
        !overlapsCourt(x, z, 0.12, 0.12, id, c.apron),
        `lamp inside ${id}`,
      );
});

test("every island remains reachable from home without redundant ocean crossings", async () => {
  const { connections } = await import("../app/lib/world-paths.mjs");
  const seen = new Set(["studio"]);
  for (let i = 0; i < regions.length; i++)
    for (const [a, b] of connections) {
      if (seen.has(a)) seen.add(b);
      if (seen.has(b)) seen.add(a);
    }
  assert.deepEqual([...seen].sort(), regions.map((r) => r.id).sort());
  assert.equal(connections.length, regions.length - 1);
});

test("rendered slabs, curbs, footings and lamps clear court aprons", async () => {
  const { walkwayPlacements } = await import("../app/lib/world-paths.mjs");
  const region = regions.find((r) => r.id === "court");
  const inverse = region.rotation.clone().invert();
  for (const [kind, objects] of Object.entries(walkwayPlacements()))
    for (const p of objects) {
      const corners = [];
      for (const x of [-0.5, 0.5])
        for (const y of [-0.5, 0.5])
          for (const z of [-0.5, 0.5])
            corners.push(
              p.position
                .clone()
                .addScaledVector(p.right, x * p.size[0])
                .addScaledVector(p.up, y * p.size[1])
                .addScaledVector(p.forward, z * p.size[2])
                .sub(region.center)
                .applyQuaternion(inverse),
            );
      if (Math.max(...corners.map((p) => p.y)) < -1) continue;
      const minX = Math.min(...corners.map((p) => p.x)),
        maxX = Math.max(...corners.map((p) => p.x));
      const minZ = Math.min(...corners.map((p) => p.z)),
        maxZ = Math.max(...corners.map((p) => p.z));
      for (const [id, court] of Object.entries(courts))
        assert.ok(
          !overlapsCourt(
            (minX + maxX) / 2,
            (minZ + maxZ) / 2,
            (maxX - minX) / 2,
            (maxZ - minZ) / 2,
            id,
            court.apron,
          ),
          `${kind} intersects ${id} apron`,
        );
    }
});
