import test from "node:test";
import assert from "node:assert/strict";
import { Vector3 } from "three";
import { solveArm } from "../app/lib/character-motion.mjs";
import { courts } from "../app/lib/court-layout.mjs";
import {
  basketballPlay,
  volleyballPlay,
  basketTimes,
  volleyTimes,
  basketRim,
  basketballPlayers,
  volleyballPlayers,
  contactWorld,
  PLAYER_SCALE,
  advanceCourtPlay,
  GRAVITY,
} from "../app/lib/court-play.mjs";

const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));

test("both games keep the whole ball above the floor and inside their own court", () => {
  for (const [id, sample, duration, radius] of [
    ["basketball", basketballPlay, basketTimes.duration, 0.12],
    ["volleyball", volleyballPlay, volleyTimes.duration, 0.105],
  ])
    for (let t = 0; t < duration; t += 0.004) {
      const { ball } = sample(t);
      assert.ok(ball.every(Number.isFinite));
      assert.ok(ball[1] - radius >= 0.05 - 1e-8);
      assert.ok(Math.abs(ball[0]) + radius < courts[id].width / 2);
      assert.ok(Math.abs(ball[2]) + radius < courts[id].depth / 2);
    }
});

test("ball positions stay continuous at contacts, bounce, return and loop seams", () => {
  for (const [sample, duration] of [
    [basketballPlay, basketTimes.duration],
    [volleyballPlay, volleyTimes.duration],
  ]) {
    let previous = sample(0).ball;
    for (let t = 0.002; t <= duration * 2; t += 0.002) {
      const ball = sample(t).ball;
      assert.ok(
        distance(ball, previous) < 0.035,
        `${sample.name} discontinuity at ${t}`,
      );
      previous = ball;
    }
  }
});

test("the basketball descends through the actual rim and the ball clears the net exit", () => {
  const at = basketballPlay(basketTimes.rim).ball;
  assert.ok(distance(at, basketRim) < 1e-8);
  assert.ok(basketballPlay(basketTimes.rim - 0.01).ball[1] > at[1]);
  assert.ok(basketballPlay(basketTimes.rim + 0.01).ball[1] < at[1]);
  assert.ok(0.224 - 4 * 0.019 > 0.12, "the ball fits the lower net opening");
  // A rebounder stands beside the falling ball, not directly in its path.
  for (let t = basketTimes.rim; t < basketTimes.floor; t += 0.005) {
    const ball = basketballPlay(t).ball;
    if (ball[1] < 2.05 && ball[1] > 1.1)
      assert.ok(Math.abs(ball[0] - basketballPlayers[1].position[0]) > 0.6);
  }
});

test("every volleyball crossing clears the full height of the net", () => {
  for (let t = volleyTimes.hold; t < volleyTimes.duration; t += 0.001) {
    const ball = volleyballPlay(t).ball;
    if (Math.abs(ball[2]) < 0.12)
      assert.ok(ball[1] - 0.105 > courts.volleyball.net + 0.1);
  }
});

test("unassisted flights use gravity rather than easing at the top of an arc", () => {
  for (const [sample, t] of [
    [basketballPlay, basketTimes.release + 0.5],
    [volleyballPlay, volleyTimes.hold + 0.7],
  ]) {
    const h = 0.001;
    const acceleration =
      (sample(t + h).ball[1] - 2 * sample(t).ball[1] + sample(t - h).ball[1]) /
      h ** 2;
    assert.ok(Math.abs(acceleration + GRAVITY) < 1e-5);
  }
});

test("all authored wrists remain reachable without arm stretching", () => {
  for (const [sample, duration] of [
    [basketballPlay, basketTimes.duration],
    [volleyballPlay, volleyTimes.duration],
  ])
    for (let t = 0; t < duration; t += 0.007)
      for (const pose of sample(t).poses)
        for (const [side, key] of [
          [-1, "left"],
          [1, "right"],
        ]) {
          const arm = solveArm([side * 0.35, 0.85, 0], pose[key], side);
          assert.ok(
            arm.wrist.distanceTo(new Vector3(...pose[key])) < 1e-8,
            `${sample.name}: ${key} at ${t}`,
          );
        }
});

test("volleyball contacts meet the joined hands on both sides", () => {
  for (let i = 0; i < volleyTimes.hits; i++) {
    const sample = volleyballPlay(
      volleyTimes.hold + i * volleyTimes.flight + 1e-8,
    );
    const player = i % 2,
      pose = sample.poses[player];
    const midpoint = pose.left.map((v, j) => (v + pose.right[j]) / 2);
    const world = contactWorld(
      volleyballPlayers[player],
      midpoint,
      (pose.hop - pose.crouch) * PLAYER_SCALE,
    );
    assert.ok(Math.abs(world[0] - sample.ball[0]) < 0.001);
    assert.ok(Math.abs(world[2] - sample.ball[2]) < 0.001);
    assert.ok(
      Math.abs(sample.ball[1] - world[1] - 0.16 * PLAYER_SCALE) < 0.001,
    );
  }
});

test("basketball waits for a hand contact before shooting and returns to dribbling", () => {
  const clock = { time: 0.2, playing: false, pending: false };
  advanceCourtPlay(clock, 0.02, "basketball", true);
  assert.ok(clock.time < basketTimes.gather);
  for (let i = 0; i < 30 && clock.time < basketTimes.gather; i++)
    advanceCourtPlay(clock, 0.02, "basketball");
  assert.equal(clock.time, basketTimes.gather);
  assert.equal(clock.playing, true);
  for (let i = 0; i < 400; i++) advanceCourtPlay(clock, 0.02, "basketball");
  assert.equal(clock.playing, false);
  assert.ok(clock.time < basketTimes.gather);
});

test("paused or invalid frames cannot advance or explode the animation clock", () => {
  const clock = { time: 0.2, pending: false };
  for (const dt of [0, -1, NaN, Infinity])
    advanceCourtPlay(clock, dt, "basketball");
  assert.equal(clock.time, 0.2);
  advanceCourtPlay(clock, 100, "basketball");
  assert.equal(clock.time, 0.25);
});
