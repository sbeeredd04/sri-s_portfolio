import test from "node:test";
import assert from "node:assert/strict";
import {
  dprSteps,
  chooseTier,
  lowerTier,
  raiseTier,
  tierSettings,
} from "../app/lib/device-tier.mjs";
import { fogDensity, skyState, biomeHaze } from "../app/lib/atmosphere.mjs";
import { grassCount, grassProfile } from "../app/lib/grass.mjs";
import { regions } from "../app/lib/world-layout.mjs";

test("software renderers and low-memory devices get the light tier", () => {
  assert.equal(chooseTier({ renderer: "Google SwiftShader" }), "low");
  assert.equal(chooseTier({ renderer: "Apple M2", memory: 2 }), "low");
  assert.equal(chooseTier({ renderer: "ANGLE (Apple, Apple M1)", saveData: true }), "low");
});

test("phones never start at full detail", () => {
  const phone = { coarse: true, width: 390, height: 844, renderer: "Apple GPU" };
  assert.equal(chooseTier({ ...phone, cores: 6 }), "medium");
  assert.equal(chooseTier({ ...phone, cores: 4 }), "low");
});

test("capable desktops get full detail at near-native density", () => {
  assert.equal(
    chooseTier({ renderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)", cores: 12 }),
    "high",
  );
  assert.equal(tierSettings.high.dpr[1], 1.75);
  assert.equal(tierSettings.low.ao, false);
});

test("a struggling frame sheds pixels before it sheds a tier", () => {
  assert.deepEqual(dprSteps("high", 2), [1.75, 1.5, 1.25]);
  assert.deepEqual(dprSteps("medium", 3), [1.5, 1.25, 1]);
  assert.deepEqual(dprSteps("low", 1), [1, 0.75]);
});

test("runtime monitor never climbs above the starting ceiling", () => {
  assert.equal(lowerTier("low"), "low");
  assert.equal(raiseTier("low", "medium"), "medium");
  assert.equal(raiseTier("medium", "medium"), "medium");
});

test("haze keeps the framed subject clear at every shot distance", () => {
  for (const world of Object.keys(biomeHaze)) {
    if (world === "planet") continue;
    for (const distance of [8, 45, 120, 260]) {
      const depth = fogDensity(world, distance) * Math.max(distance, 1);
      const hidden = 1 - Math.exp(-depth * depth);
      assert.ok(hidden < 0.2, `${world} at ${distance}m hides ${hidden}`);
    }
  }
});

test("orbit view has no fog and no sky shell", () => {
  const state = skyState({ world: "planet", altitude: 300, daylight: 1, warmth: 0, sunHeight: 0.6 });
  assert.equal(state.opacity, 0);
  assert.equal(state.fog, 0);
});

test("grass stays inside each island and scales with the device tier", () => {
  for (const [biome, profile] of Object.entries(grassProfile)) {
    const region = regions.find((r) => r.id === biome);
    assert.ok(region, biome);
    assert.ok(profile.extent <= region.outer - 2, `${biome} extent ${profile.extent}`);
    assert.ok(grassCount(biome, "high") > grassCount(biome, "medium"));
    assert.ok(grassCount(biome, "medium") > grassCount(biome, "low"));
  }
  assert.equal(grassCount("studio", "high"), 0);
});
