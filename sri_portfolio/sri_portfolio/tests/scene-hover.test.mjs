import test from "node:test";
import assert from "node:assert/strict";
import { emptyHover, nextHover } from "../app/lib/scene-hover.mjs";

const hit = (mesh, instanceId) => ({
  eventObject: { uuid: "interactive-group" }, object: { uuid: mesh },
  instanceId, pointerType: "mouse",
});

test("a late exit from another mesh cannot clear the current target", () => {
  const first = hit("left-screen"), second = hit("right-screen");
  let state = nextHover(emptyHover, "Read work", first);
  state = nextHover(state, "Open music", second);
  assert.equal(nextHover(state, "", first), state);
  assert.equal(nextHover(state, "", second), emptyHover);
});

test("instanced neighbors own their individual hover and repeated hits are stable", () => {
  const first = hit("neighbors", 0), second = hit("neighbors", 1);
  let state = nextHover(emptyHover, "Say hello", first);
  state = nextHover(state, "Say hello", second);
  assert.equal(nextHover(state, "", first), state);
  assert.equal(nextHover(state, "Say hello", second), state);
});

test("scene exit and touch clear hover, and descriptive hints need not promise a click", () => {
  const event = hit("court-ball");
  let state = nextHover(emptyHover, "Take a shot", event);
  state = nextHover(state, "Watch the return pass", event, "auto");
  assert.equal(state.cursor, "auto");
  assert.equal(nextHover(state, ""), emptyHover);
  assert.equal(nextHover(state, "Take a shot", { ...event, pointerType: "touch" }), emptyHover);
});
