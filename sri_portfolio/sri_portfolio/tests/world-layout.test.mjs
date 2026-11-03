import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import {
  regions,
  worldPoint,
  surfaceHeight,
  planetRadiusAt,
  safeCameraPoint,
  WORLD_RADIUS,
} from "../app/lib/world-layout.mjs";

test("each biome is anchored to the planet and uses the same ground surface", () => {
  for (const region of regions) {
    assert.ok(Math.abs(region.center.dot(region.normal) - WORLD_RADIUS) < 1e-8);
    for (const [x, z] of [
      [0, 0],
      [7, 4],
      [-10, -6],
      [14, 8],
    ]) {
      const p = worldPoint(region.id, [x, surfaceHeight(region.id, x, z), z]);
      assert.ok(
        Math.abs(p.length() - planetRadiusAt(p.clone().normalize())) < 0.005,
        `${region.id}: prop/planet surface mismatch`,
      );
    }
  }
});
test("the house and court clearings stay level under their footprints", () => {
  for (const id of ["studio", "court"])
    for (const [x, z] of [
      [-6, -3],
      [0, 0],
      [6, 4],
    ]) {
      assert.ok(Math.abs(surfaceHeight(id, x, z)) < 0.002);
    }
});
test("camera collision correction stays outside terrain even at the planet center", () => {
  for (const point of [
    new Vector3(),
    new Vector3(0, 20, 0),
    new Vector3(18, 22, 10),
    new Vector3(0, WORLD_RADIUS + 30, 0),
  ]) {
    const safe = safeCameraPoint(point.clone());
    assert.ok(
      safe.length() >= planetRadiusAt(safe.clone().normalize()) + 1.1999,
    );
    if (point.length() > WORLD_RADIUS) assert.ok(safe.distanceTo(point) < 1e-8);
  }
});
// Dry relief now belongs to authored island meshes. The old procedural basins,
// Coit hills and listening ridge must not distort their common sea datum.
test("authored island frames share a level sea without legacy basins or ridges", () => {
  for (const id of [
    "trail",
    "entertainment",
    "court",
    "future",
    "studio",
    "projects",
  ]) {
    for (let x = -35; x <= 35; x += 5)
      for (let z = -30; z <= 30; z += 5) {
        const height = surfaceHeight(id, x, z);
        assert.ok(
          Math.abs(height) < 0.002,
          `${id}: sea distorted at ${x},${z}`,
        );
        const point = worldPoint(id, [x, height, z]);
        assert.ok(
          Math.abs(point.length() - planetRadiusAt(point.clone().normalize())) <
            0.005,
        );
      }
  }
});

test("the shared bay eases continuously back into a spherical world", () => {
  let previousDrop = 0;
  for (let d = 255; d <= 495; d += 2) {
    const direction = new Vector3(d, WORLD_RADIUS, 0).normalize();
    const radius = planetRadiusAt(direction);
    assert.ok(radius >= WORLD_RADIUS && radius <= WORLD_RADIUS / direction.y);
    const blend =
      (WORLD_RADIUS / direction.y - radius) /
      (WORLD_RADIUS / direction.y - WORLD_RADIUS);
    assert.ok(blend >= previousDrop - 1e-10, "bay shoulder folds outward");
    previousDrop = blend;
  }
  for (const direction of [
    new Vector3(600, 450, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, -1, 0),
  ]) {
    assert.equal(planetRadiusAt(direction.normalize()), WORLD_RADIUS);
  }
  const bayEdge = new Vector3(255, WORLD_RADIUS, 0).normalize();
  assert.ok(
    Math.abs(planetRadiusAt(bayEdge) * bayEdge.y - WORLD_RADIUS) < 0.002,
  );
});
