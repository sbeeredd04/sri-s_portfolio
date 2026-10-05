import test from "node:test";
import assert from "node:assert/strict";
import { StreamingScore } from "../app/lib/streaming-score.mjs";
import { FakeAudio } from "./helpers/fake-media.mjs";
function setup() {
  const nodes = [];
  const node = () => {
    const n = {
      gain: { value: 0 },
      connect(to) {
        return to;
      },
      disconnect() {
        this.disconnected = true;
      },
    };
    nodes.push(n);
    return n;
  };
  const context = { createGain: node, createMediaElementSource: node };
  let elements = 0;
  const score = new StreamingScore(context, {}, () => {
    elements++;
    return new FakeAudio();
  });
  return { score, nodes, count: () => elements };
}
test("one native music element survives destination changes without decoding long PCM buffers", async () => {
  const { score, nodes, count } = setup();
  score.select("world-thread", true);
  const playing = score.play();
  assert.equal(
    score.audio.playCalls,
    1,
    "play is synchronous inside the gesture",
  );
  assert.equal(await playing, true);
  await score.play();
  assert.equal(
    score.audio.playCalls,
    1,
    "do not restart an already playing track",
  );
  score.select("paper-light", true);
  await score.play();
  assert.equal(count(), 1);
  assert.equal(score.audio.src, "/audio/paper-light.mp3");
  score.select("paper-light", false);
  assert.equal(score.audio.paused, true);
  assert.equal(await score.play(), false);
  score.select("paper-light", true);
  assert.equal(await score.play(), true);
  score.destroy();
  score.destroy();
  assert.equal(score.audio.src, "");
  assert.equal(score.audio.removed, true);
  assert.ok(nodes.every((n) => n.disconnected));
  assert.equal(await score.play(), false);
});
test("blocked native playback can retry on the next touch using the same player", async () => {
  const { score } = setup();
  score.select("world-thread", true);
  score.audio.play = () => Promise.reject(new Error("NotAllowedError"));
  await assert.rejects(score.play(), /NotAllowedError/);
  score.audio.play = FakeAudio.prototype.play;
  assert.equal(await score.play(), true);
  score.pause();
  assert.equal(await score.play(), true, "foreground return restarts playback");
  score.destroy();
});
