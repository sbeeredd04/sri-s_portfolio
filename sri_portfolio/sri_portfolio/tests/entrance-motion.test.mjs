import test from "node:test";
import assert from "node:assert/strict";
import {
  playEntrance,
  ENTRANCE_DURATION,
} from "../app/lib/entrance-motion.mjs";

function fixture(reduced = false) {
  const animations = [];
  const listeners = new Map();
  const mediaListeners = new Map();
  const media = {
    matches: reduced,
    addEventListener: (k, fn) => mediaListeners.set(k, fn),
    removeEventListener: (k) => mediaListeners.delete(k),
  };
  const doc = {
    hidden: false,
    timeline: { currentTime: 100 },
    addEventListener: (k, fn) => listeners.set(k, fn),
    removeEventListener: (k) => listeners.delete(k),
  };
  const animate = (frames, options) => {
    assert.ok(
      frames.every(
        (frame) =>
          !("offset" in frame) || (frame.offset >= 0 && frame.offset <= 1),
      ),
    );
    const animation = {
      frames,
      options,
      state: "running",
      onfinish: null,
      cancel() {
        this.state = "idle";
      },
      finish() {
        this.state = "finished";
        this.onfinish?.();
      },
      pause() {
        this.state = "paused";
      },
      play() {
        this.state = "running";
      },
    };
    animations.push(animation);
    return animation;
  };
  return {
    root: { animate, querySelector: () => ({ animate }) },
    media,
    doc,
    animations,
    listeners,
    mediaListeners,
  };
}
function withBrowser(t, reduced = false) {
  const f = fixture(reduced);
  t.mock.method(globalThis, "matchMedia", () => f.media);
  t.mock.property(globalThis, "document", f.doc);
  return f;
}
// Node has no window globals; restore them after this module finishes.
const originalMedia = globalThis.matchMedia;
const originalDocument = globalThis.document;
globalThis.matchMedia = () => {};
globalThis.document = {};
test.after(() => {
  if (originalMedia) globalThis.matchMedia = originalMedia;
  else delete globalThis.matchMedia;
  if (originalDocument) globalThis.document = originalDocument;
  else delete globalThis.document;
});

test("intro is bounded and an early entry resolves it exactly once", (t) => {
  const f = withBrowser(t);
  let completed = 0;
  const player = playEntrance(f.root, () => completed++);
  assert.ok(
    f.animations.every(
      (a) => (a.options.delay || 0) + a.options.duration <= ENTRANCE_DURATION,
    ),
  );
  assert.ok(f.animations.every((a) => a.startTime === 100));
  player.finish();
  player.finish();
  assert.equal(completed, 1);
  assert.equal(f.listeners.size, 0);
  player.cancel();
  assert.ok(f.animations.every((a) => a.state === "idle"));
});
test("background tabs freeze and resume the whole score together", (t) => {
  const f = withBrowser(t);
  const player = playEntrance(f.root, () => {});
  f.doc.hidden = true;
  f.listeners.get("visibilitychange")();
  assert.ok(f.animations.every((a) => a.state === "paused"));
  f.doc.hidden = false;
  f.listeners.get("visibilitychange")();
  assert.ok(f.animations.every((a) => a.state === "running"));
  player.cancel();
  assert.equal(f.listeners.size, 0);
  assert.equal(f.mediaListeners.size, 0);
});
test("reduced motion skips the score and a changed preference resolves it", (t) => {
  const f = withBrowser(t, true);
  let completed = 0;
  playEntrance(f.root, () => completed++);
  assert.equal(f.animations.length, 0);
  assert.equal(completed, 1);
  f.media.matches = false;
  const player = playEntrance(f.root, () => completed++);
  f.mediaListeners.get("change")({ matches: true });
  assert.equal(completed, 2);
  player.cancel();
});
