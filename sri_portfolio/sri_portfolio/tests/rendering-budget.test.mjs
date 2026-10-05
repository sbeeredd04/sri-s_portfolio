import test from "node:test";
import assert from "node:assert/strict";
import {
  dprSteps,
  sampleFramePressure,
  chooseTier,
  lowerTier,
  raiseTier,
  tierSettings,
} from "../app/lib/device-tier.mjs";
import { fogDensity, skyState, biomeHaze } from "../app/lib/atmosphere.mjs";
import { grassCount, grassProfile, nearGrassCount } from "../app/lib/grass.mjs";
import { regions } from "../app/lib/world-layout.mjs";

test("software renderers and low-memory devices get the light tier", () => {
  assert.equal(chooseTier({ renderer: "Google SwiftShader" }), "low");
  assert.equal(chooseTier({ renderer: "Apple M2", memory: 2 }), "low");
  assert.equal(
    chooseTier({ renderer: "ANGLE (Apple, Apple M1)", saveData: true }),
    "low",
  );
});

test("phones never start at full detail", () => {
  const phone = {
    coarse: true,
    width: 390,
    height: 844,
    renderer: "Apple GPU",
  };
  assert.equal(chooseTier({ ...phone, cores: 6 }), "low");
  assert.equal(
    chooseTier({
      coarse: true,
      width: 1366,
      height: 1024,
      renderer: "Apple M4",
      cores: 10,
    }),
    "low",
  );
  assert.equal(chooseTier({ ...phone, cores: 4 }), "low");
});

test("desktop defaults leave headroom for interaction", () => {
  assert.equal(
    chooseTier({
      renderer: "ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro)",
      cores: 12,
    }),
    "medium",
  );
  assert.equal(tierSettings.high.dpr[1], 1.75);
  assert.equal(tierSettings.low.ao, false);
});

test("a struggling frame sheds pixels before it sheds a tier", () => {
  assert.deepEqual(dprSteps("high", 2), [1.75, 1.5, 1.25]);
  assert.deepEqual(dprSteps("medium", 3), [1.5, 1.25, 1]);
  assert.deepEqual(dprSteps("low", 1), [1]);
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
  const state = skyState({
    world: "planet",
    altitude: 300,
    daylight: 1,
    warmth: 0,
    sunHeight: 0.6,
  });
  assert.equal(state.opacity, 0);
  assert.equal(state.fog, 0);
});

test("grass stays inside each island and scales with the device tier", () => {
  for (const [biome, profile] of Object.entries(grassProfile)) {
    const region = regions.find((r) => r.id === biome);
    assert.ok(region, biome);
    assert.ok(
      profile.extent <= region.outer - 2,
      `${biome} extent ${profile.extent}`,
    );
    assert.ok(grassCount(biome, "high") > grassCount(biome, "medium"));
    assert.ok(grassCount(biome, "medium") > grassCount(biome, "low"));
  }
  assert.equal(grassCount("studio", "high"), 0);
});

test("grass stays within a close-view triangle budget, including the near layer", () => {
  for (const biome of Object.keys(grassProfile)) {
    assert.ok(
      (grassCount(biome, "low") + nearGrassCount(biome, "low")) * 24 <= 30000,
    );
    assert.ok(
      (grassCount(biome, "medium") + nearGrassCount(biome, "medium")) * 24 <=
        180000,
    );
    assert.ok(
      (grassCount(biome, "high") + nearGrassCount(biome, "high")) * 24 <=
        480000,
    );
  }
});

test("frame pressure distinguishes isolated stalls from sustained overload", () => {
  const sample = (frames) =>
    frames.reduce((sample, dt) => sampleFramePressure(sample, dt), {
      elapsed: 0,
      slow: 0,
    });
  for (const fps of [30, 4, 0.5]) {
    const s = sample(Array(180).fill(1 / fps));
    assert.ok(s.slow / s.elapsed > 0.7, `${fps}fps must trigger recovery`);
  }
  const s = sample([3, ...Array(180).fill(1 / 60)]);
  assert.ok(s.slow / s.elapsed < 0.7, "one shader stall must not drop quality");
});

test("clear weather does not force a marine layer over Home", () => {
  const conditions = {
    altitude: 10,
    focusDistance: 45,
    daylight: 1,
    warmth: 0,
    sunHeight: 0.8,
    weather: { cloud: 0, rain: 0, fog: 0 },
  };
  const home = skyState({ ...conditions, world: "studio" });
  const foundry = skyState({ ...conditions, world: "projects" });
  assert.deepEqual(home.zenith.toArray(), foundry.zenith.toArray());
  const overcast = skyState({
    ...conditions,
    world: "studio",
    weather: { cloud: 1, rain: 0, fog: 0 },
  });
  assert.ok(
    Math.hypot(
      ...home.zenith.toArray().map((v, i) => v - overcast.zenith.toArray()[i]),
    ) > 0.1,
  );
});

test("automatic rendering keeps at least one pixel per CSS pixel", () => {
  for (const tier of ["low", "medium", "high"])
    for (const ratio of [1, 1.25, 2, 3])
      assert.ok(dprSteps(tier, ratio).every((dpr) => dpr >= 1));
});

test("30 fps mobile pacing does not trigger the overload detector", () => {
  assert.equal(tierSettings.low.fps, 30);
  assert.deepEqual(dprSteps("low", 3), [1]);
  const run = (dt) =>
    Array(240)
      .fill(dt)
      .reduce((s, d) => sampleFramePressure(s, d, 30), { elapsed: 0, slow: 0 });
  assert.equal(run(1 / 30).slow, 0);
  assert.ok(run(1 / 12).slow / run(1 / 12).elapsed > 0.7);
});
