import test from "node:test";
import assert from "node:assert/strict";
import {
  residentJourney,
  residentLeg,
  residentLegLength,
  residentRoutePose,
  wandererCamera,
} from "../app/lib/resident-motion.mjs";
import { planetRadiusAt } from "../app/lib/world-layout.mjs";

test("walking knees retain leg length and feet clear the path", () => {
  const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
  for (let phase = 0; phase < Math.PI * 4; phase += 0.03) {
    for (const stride of [0, 0.2, 1]) {
      const leg = residentLeg(phase, stride);
      assert.ok(
        Math.abs(distance(leg.hip, leg.knee) - residentLegLength) < 1e-9,
      );
      assert.ok(
        Math.abs(distance(leg.knee, leg.ankle) - residentLegLength) < 1e-9,
      );
      assert.ok(leg.foot[1] >= 0.035);
      if (Math.sin(phase) <= 0) assert.equal(leg.foot[1], 0.035);
    }
  }
});

test("residents slow and turn continuously at route ends", () => {
  for (const phase of [0, 0.5, 1]) {
    const before = residentJourney(phase - 1e-5),
      after = residentJourney(phase + 1e-5);
    assert.ok(Math.abs(before.progress - after.progress) < 1e-6);
    assert.ok(Math.cos(before.heading - after.heading) > 0.999);
    assert.ok(residentJourney(phase).stride < 1e-12);
  }
  for (let i = 0; i < 100; i++) {
    const p = residentJourney(i / 100);
    assert.ok(p.progress >= 0.08 && p.progress <= 0.92);
  }
});

test("the guided walk follows the same avatar without crossing the ground", () => {
  for (let time = 0; time < 320; time += 0.4) {
    const { pose } = residentRoutePose(time, 10);
    const view = wandererCamera(time);
    assert.ok(Math.abs(view.target.distanceTo(pose.position) - 0.9) < 1e-9);
    assert.ok(
      view.position.length() >=
        planetRadiusAt(view.position.clone().normalize()) + 1.19,
    );
    assert.ok(view.up.dot(pose.normal) > 0.999);
    const next = wandererCamera(time + 1 / 30);
    assert.ok(view.position.distanceTo(next.position) < 0.15);
  }
});
