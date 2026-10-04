import test from "node:test";
import assert from "node:assert/strict";
import { sampleSceneStartup } from "../app/lib/scene-startup.mjs";
const sample = (state, now, changes = {}) =>
  sampleSceneStartup(state, {
    now,
    pending: false,
    surface: true,
    lighting: true,
    ...changes,
  });
test("a few frames cannot reveal a scene before terrain, lighting and pending assets settle", () => {
  for (const missing of [
    { pending: true },
    { surface: false },
    { lighting: false },
  ]) {
    let state;
    for (let now = 0; now < 10000; now += 16)
      state = sample(state, now, missing);
    assert.equal(state.ready, false);
    state = sample(state, 10000);
    assert.equal(state.ready, false);
    for (let now = 10016; now <= 10600; now += 16) state = sample(state, now);
    assert.equal(state.ready, true);
  }
});
test("a late asset or shader hitch restarts the quiet window", () => {
  let state;
  for (let now = 0; now <= 400; now += 16) state = sample(state, now);
  state = sample(state, 416, { pending: true });
  for (let now = 432; now <= 800; now += 16) state = sample(state, now);
  assert.equal(state.ready, false);
  state = sample(state, 1050);
  assert.equal(state.ready, false);
  for (let now = 1066; now < 1580; now += 16) state = sample(state, now);
  assert.equal(state.ready, true);
});
test("a consistently slow GPU does not wait forever for fast frames", () => {
  let state;
  for (let now = 0; now <= 3200; now += 200) state = sample(state, now);
  assert.equal(state.ready, true);
});
