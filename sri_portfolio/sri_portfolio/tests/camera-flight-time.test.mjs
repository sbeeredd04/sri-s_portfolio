import test from "node:test";
import assert from "node:assert/strict";
import { advanceFlightTime } from "../app/lib/camera-flight-time.mjs";

test("camera trips take the same visible time at 10, 30 and 60 fps", () => {
  for (const fps of [10, 30, 60]) {
    let elapsed = 0;
    for (let n = 0; n < fps * 4; n++)
      elapsed = advanceFlightTime(elapsed, 1 / fps, 4);
    assert.ok(Math.abs(elapsed - 4) < 1e-10, `duration at ${fps} fps`);
  }
});
test("slow foreground frames count fully but never overshoot arrival", () => {
  assert.equal(advanceFlightTime(1, 0.4, 4), 1.4);
  assert.equal(advanceFlightTime(3.9, 0.4, 4), 4);
});
test("motion disabled settles even the longest arrival immediately", () => {
  assert.equal(advanceFlightTime(0, 0.016, 4.8, false), 4.8);
});
test("invalid or negative deltas cannot corrupt or reverse a flight", () => {
  for (const delta of [NaN, Infinity, -1])
    assert.equal(advanceFlightTime(1, delta, 4), 1);
});
