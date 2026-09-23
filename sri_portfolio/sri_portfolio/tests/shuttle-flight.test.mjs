import test from "node:test";
import assert from "node:assert/strict";
import { shuttleFlight } from "../app/lib/shuttle-flight.mjs";
test("shuttle reaches both rackets at the intended strike height", () => {
  const start = shuttleFlight(0),
    end = shuttleFlight(1.35);
  assert.equal(start.progress, 0);
  assert.equal(start.height, 1.35);
  assert.equal(end.progress, 1);
  assert.ok(Math.abs(end.height - 1.35) < 1e-10);
});
test("shuttle clears the net and slows horizontally through the flight", () => {
  let previous = -1,
    previousSpeed = Infinity;
  for (let t = 0; t <= 1.35; t += 0.01) {
    const p = shuttleFlight(t);
    assert.ok(p.progress >= previous);
    assert.ok(p.progressVelocity <= previousSpeed);
    previous = p.progress;
    previousSpeed = p.progressVelocity;
    if (p.progress > 0.45 && p.progress < 0.55) assert.ok(p.height > 1.7);
  }
  assert.ok(shuttleFlight(0).verticalVelocity > 0);
  assert.ok(shuttleFlight(1.35).verticalVelocity < 0);
});
