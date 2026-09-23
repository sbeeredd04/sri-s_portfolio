import test from "node:test";
import assert from "node:assert/strict";
import { worldTime } from "../app/lib/world-time.mjs";

test("SF clock follows DST while the sun stays continuous", () => {
  const before = worldTime(new Date("2026-03-08T09:59:00Z"));
  const after = worldTime(new Date("2026-03-08T10:00:00Z"));
  assert.match(before.label, /1:59.*PST/);
  assert.match(after.label, /3:00.*PDT/);
  assert.ok(Math.abs(after.altitude - before.altitude) < 0.3);
  assert.match(worldTime(new Date("2026-11-01T09:00:00Z")).label, /1:00.*PST/);
});
test("solar light is above the horizon by day and below it at night", () => {
  const noon = worldTime(new Date("2026-06-21T20:10:00Z"));
  const night = worldTime(new Date("2026-06-21T08:00:00Z"));
  assert.ok(noon.altitude > 70 && noon.altitude < 80);
  assert.equal(noon.daylight, 1);
  assert.ok(night.altitude < -20);
  assert.equal(night.daylight, 0);
  for (const value of [noon, night])
    assert.ok(Math.abs(Math.hypot(...value.direction) - 1) < 1e-10);
});
test("sun crosses from east to west and respects winter's lower elevation", () => {
  assert.ok(worldTime(new Date("2026-06-21T16:00:00Z")).direction[0] > 0);
  assert.ok(worldTime(new Date("2026-06-22T01:00:00Z")).direction[0] < 0);
  const winter = worldTime(new Date("2026-12-21T20:10:00Z"));
  assert.ok(winter.altitude > 27 && winter.altitude < 31);
});
