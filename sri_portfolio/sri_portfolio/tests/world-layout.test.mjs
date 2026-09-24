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
test("the lake basin lies below the water while its shore stays above it", () => {
  assert.ok(surfaceHeight("trail", -8, -3) < -1);
  assert.ok(surfaceHeight("trail", -1, -3) > -0.02);
});

test("the listening house stays dry while its lake sits in the shared terrain", () => {
  for (const x of [-4.9, 0, 4.9])
    for (const z of [-3.6, 0, 3.6])
      assert.ok(Math.abs(surfaceHeight("entertainment", x, z)) < 0.02);
  assert.ok(surfaceHeight("entertainment", -2, -11) < -0.5);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    assert.ok(
      surfaceHeight(
        "entertainment",
        -2 + Math.cos(a) * 6.7,
        -11 + Math.sin(a) * 6.7,
      ) > -0.08,
    );
  }
});

test("the After Hours headland rejoins the globe before open water", () => {
  const region = regions.find((r) => r.id === "entertainment");
  const z = region.shoreOuter + 6;
  const point = worldPoint("entertainment", [0, surfaceHeight("entertainment", 0, z), z]);
  assert.ok(
    Math.abs(planetRadiusAt(point.clone().normalize()) - WORLD_RADIUS) < 0.02,
    "open water must not inherit an invisible raised terrain shoulder",
  );
});

test("trees on the listening-room ridges stay on the radial terrain", () => {
  assert.ok(surfaceHeight("entertainment", -9, -23) > 4);
  for (let x = -16; x <= 16; x += 2)
    for (let z = -30; z <= -18; z += 2) {
      const point = worldPoint("entertainment", [
        x,
        surfaceHeight("entertainment", x, z),
        z,
      ]);
      assert.ok(
        Math.abs(point.length() - planetRadiusAt(point.clone().normalize())) <
          0.005,
        `ridge mismatch at ${x}, ${z}`,
      );
    }
});
