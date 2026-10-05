import test from "node:test";
import assert from "node:assert/strict";
import {
  listenForAudioActivation,
  tryAudioAutoplay,
} from "../app/lib/audio-activation.mjs";
import { sensoryPreferences } from "../app/lib/sensory-design.mjs";

test("first mouse, touch, pen and keyboard interactions start on browser-eligible events", () => {
  const handlers = new Map();
  const target = {
    addEventListener(name, handler, capture) {
      assert.equal(capture, true);
      handlers.set(name, handler);
    },
    removeEventListener(name, handler, capture) {
      assert.equal(handlers.get(name), handler);
      assert.equal(capture, true);
      handlers.delete(name);
    },
  };
  let starts = 0;
  const cleanup = listenForAudioActivation(target, () => starts++);
  const emit = (type, values) =>
    handlers.get(type)({ type, isTrusted: true, ...values });
  for (const pointerType of ["touch", "pen"]) {
    emit("pointerdown", { pointerType });
    assert.equal(starts, pointerType === "touch" ? 0 : 1);
    emit("pointerup", { pointerType });
  }
  assert.equal(starts, 2);
  emit("pointerdown", { pointerType: "mouse" });
  emit("pointerup", { pointerType: "mouse" });
  assert.equal(starts, 3);
  emit("keydown", { key: "Enter" });
  emit("keydown", { key: " " });
  assert.equal(starts, 5);
  emit("keydown", { key: "Escape" });
  emit("pointerdown", { pointerType: "mouse", isTrusted: false });
  assert.equal(starts, 5);
  cleanup();
  assert.equal(handlers.size, 0);
});

test("first visits enable sound while explicitly saved quiet stays quiet", () => {
  assert.equal(sensoryPreferences(null).enabled, true);
  assert.equal(sensoryPreferences({}).enabled, true);
  assert.equal(sensoryPreferences({ enabled: false }).enabled, false);
});

test("permitted autoplay may start asynchronously without closing its context", async () => {
  const context = {
    state: "suspended",
    async resume() {
      await Promise.resolve();
      this.state = "running";
    },
    async close() {
      this.state = "closed";
    },
  };
  assert.equal(await tryAudioAutoplay(context), true);
  assert.equal(context.state, "running");
});

test("blocked and rejected autoplay close promptly so a first gesture can retry", async () => {
  for (const resume of [
    () => new Promise(() => {}),
    async () => {
      throw new Error("NotAllowedError");
    },
  ]) {
    const context = {
      state: "suspended",
      resume,
      async close() {
        this.state = "closed";
      },
    };
    assert.equal(await tryAudioAutoplay(context, 5), false);
    assert.equal(context.state, "closed");
  }
});

test("iOS playback session survives overlapping starts and is restored on final cleanup", async () => {
  const { acquirePlaybackSession } =
    await import("../app/lib/audio-activation.mjs");
  const navigator = { audioSession: { type: "auto" } };
  const releaseAutoplay = acquirePlaybackSession(navigator);
  const releaseGesture = acquirePlaybackSession(navigator);
  assert.equal(navigator.audioSession.type, "playback");
  releaseAutoplay();
  releaseAutoplay();
  assert.equal(navigator.audioSession.type, "playback");
  releaseGesture();
  assert.equal(navigator.audioSession.type, "auto");
});

test("playback session gracefully tolerates unsupported browsers and preserves other session owners", async () => {
  const { acquirePlaybackSession } =
    await import("../app/lib/audio-activation.mjs");
  assert.doesNotThrow(() => acquirePlaybackSession({})());
  const navigator = {
    audioSession: {
      get type() {
        return "ambient";
      },
      set type(_) {
        throw new Error("Unsupported");
      },
    },
  };
  assert.doesNotThrow(() => acquirePlaybackSession(navigator)());
  const other = { audioSession: { type: "auto" } };
  const release = acquirePlaybackSession(other);
  other.audioSession.type = "play-and-record";
  release();
  assert.equal(other.audioSession.type, "play-and-record");
});
