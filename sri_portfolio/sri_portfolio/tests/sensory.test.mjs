import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import {
  sensoryDefaults,
  sensoryPreferences,
  soundMix,
  hapticPulse,
  soundPlaces,
} from "../app/lib/sensory-design.mjs";
import { SoundEngine } from "../app/lib/sound-engine.mjs";

test("saved mute survives and invalid mixer levels are bounded", () => {
  assert.deepEqual(sensoryPreferences(null), sensoryDefaults);
  const prefs = sensoryPreferences({
    enabled: true,
    volume: Infinity,
    music: "false",
    effects: false,
  });
  assert.equal(prefs.volume, 0.42);
  assert.equal(prefs.music, true);
  assert.equal(prefs.effects, false);
  assert.equal(prefs.enabled, true);
  assert.equal(sensoryPreferences({ enabled: false }).enabled, false);
  assert.equal(sensoryPreferences({ musicLevel: NaN }).musicLevel, 1);
  assert.equal(
    soundMix("studio", sensoryPreferences({ environmentLevel: 0 })).environment,
    0,
  );
  assert.equal(
    soundMix("studio", sensoryPreferences({ effectsLevel: 0 })).effects,
    0,
  );
  assert.equal(sensoryPreferences({ volume: 50 }).volume, 1);
  assert.equal(sensoryPreferences({ volume: -1 }).volume, 0);
});

test("score and effects can be muted independently while keeping atmosphere", () => {
  const dry = soundMix("studio", {
    ...sensoryDefaults,
    music: false,
    effects: false,
  });
  assert.equal(dry.score, 0);
  assert.equal(dry.effects, 0);
  assert.ok(dry.environment > 0);
  const normal = soundMix("studio", sensoryDefaults);
  const reading = soundMix("studio", sensoryDefaults, { reading: true });
  const track = soundMix("studio", sensoryDefaults, { music: true });
  assert.ok(reading.score < normal.score / 2);
  assert.ok(reading.environment < normal.environment / 2);
  assert.ok(track.score < normal.score / 20);
  assert.ok(track.environment < normal.environment / 5);
  assert.ok(
    soundMix("court", sensoryDefaults).score <
      soundMix("entertainment", sensoryDefaults).score,
  );
});

test("haptics are brief, opt-in, device-aware and never follow ambient or simulated events", () => {
  const allow = {
    enabled: true,
    supported: true,
    reducedMotion: false,
    hidden: false,
    now: 1000,
    last: 0,
  };
  for (const kind of ["press", "open", "close", "travel", "object"]) {
    assert.ok(hapticPulse(kind, allow) > 0);
    assert.ok(hapticPulse(kind, allow) <= 12);
  }
  for (const kind of [
    "welcome",
    "swish",
    "volley-hit",
    "basket-bounce",
    "hover",
    "thunder",
  ])
    assert.equal(hapticPulse(kind, allow), 0);
  for (const gate of [
    { enabled: false },
    { supported: false },
    { reducedMotion: true },
    { hidden: true },
    { last: 950 },
    { now: NaN },
  ])
    assert.equal(hapticPulse("press", { ...allow, ...gate }), 0);
});

class Param {
  value = 0;
  setValueAtTime(v) {
    this.value = v;
  }
  setTargetAtTime(v) {
    this.value = v;
  }
  linearRampToValueAtTime(v) {
    this.value = v;
  }
  exponentialRampToValueAtTime(v) {
    this.value = v;
  }
  cancelAndHoldAtTime() {}
}
class Node {
  gain = new Param();
  frequency = new Param();
  Q = new Param();
  connect(destination) {
    return destination;
  }
  disconnect() {
    this.disconnected = true;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
    this.onended?.();
  }
}
function context() {
  const ctx = {
    sampleRate: 100,
    currentTime: 1,
    state: "running",
    destination: new Node(),
    sources: [],
    oscillators: [],
  };
  ctx.createGain =
    ctx.createConvolver =
    ctx.createBiquadFilter =
      () => new Node();
  ctx.createDynamicsCompressor = () =>
    Object.assign(
      new Node(),
      Object.fromEntries(
        ["threshold", "knee", "ratio", "attack", "release"].map((k) => [
          k,
          new Param(),
        ]),
      ),
    );
  ctx.createBuffer = (channels, length) => {
    const data = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return { getChannelData: (i) => data[i] };
  };
  ctx.createBufferSource = () => {
    const source = new Node();
    ctx.sources.push(source);
    return source;
  };
  ctx.createOscillator = () => {
    const source = new Node();
    ctx.oscillators.push(source);
    return source;
  };
  ctx.decodeAudioData = async () => ({});
  ctx.resume = async () => {
    ctx.state = "running";
  };
  ctx.suspend = async () => {
    ctx.state = "suspended";
  };
  ctx.close = async () => {
    ctx.state = "closed";
  };
  return ctx;
}
const flush = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

test("late asset loads cannot restore the sound of a place the visitor already left", async (t) => {
  const pending = new Map(),
    requests = [];
  t.mock.method(globalThis, "fetch", (url) => {
    requests.push(url);
    return new Promise((resolve) =>
      pending.set(url, () =>
        resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }),
      ),
    );
  });
  const ctx = context(),
    engine = new SoundEngine(ctx, {
      place: "planet",
      preferences: sensoryDefaults,
      weather: { kind: "storm", rain: 0 },
    });
  t.after(() => engine.destroy(true));
  assert.equal(
    requests.length,
    0,
    "assets should not fetch in the constructor",
  );
  const loading = engine.prepare();
  engine.update({ place: "trail" });
  pending.get("/audio/lakeside.mp3")();
  pending.get("/audio/shoreline.mp3")();
  pending.get("/audio/somewhere-soft.mp3")();
  await flush();
  pending.get("/audio/open-air.mp3")();
  await loading;
  await flush();
  assert.equal(engine.loops.get("open-air").gain.gain.value, 0);
  assert.ok(engine.loops.get("lakeside").gain.gain.value > 0);
  assert.equal(engine.weather.gain.value, 1);
  engine.update({ reading: true });
  assert.ok(engine.weather.gain.value < 0.5);
  engine.update({ place: "planet", weather: { kind: "clear", rain: 0 } });
  assert.equal(engine.loops.get("lakeside").gain.gain.value, 0);
  assert.equal(
    engine.weather.gain.value,
    0,
    "thunder must fade once the storm passes",
  );
  await engine.prepare();
  assert.equal(
    requests.filter((url) => url.includes("somewhere-soft")).length,
    1,
  );
});

test("muting during a load cannot create late audio sources", async (t) => {
  let release;
  t.mock.method(
    globalThis,
    "fetch",
    () =>
      new Promise((resolve) => {
        release = () =>
          resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) });
      }),
  );
  const ctx = context(),
    engine = new SoundEngine(ctx, {
      place: "studio",
      preferences: { ...sensoryDefaults, music: false },
    });
  const loading = engine.prepare();
  engine.destroy(true);
  release();
  await loading;
  assert.equal(ctx.sources.length, 0);
  assert.equal(ctx.state, "closed");
  assert.equal(engine.abort.signal.aborted, true);
});

test("a semantic cue and the click fallback sound once, and effects respect mute", (t) => {
  const ctx = context(),
    engine = new SoundEngine(ctx, {
      place: "planet",
      preferences: sensoryDefaults,
    });
  t.after(() => engine.destroy(true));
  engine.cue("open");
  const count = ctx.oscillators.length;
  engine.cue("press");
  assert.equal(ctx.oscillators.length, count);
  ctx.currentTime += 0.1;
  engine.cue("press");
  assert.equal(ctx.oscillators.length, count + 1);
  engine.preferences = { ...sensoryDefaults, effects: false };
  ctx.currentTime += 0.2;
  engine.cue("travel");
  assert.equal(ctx.oscillators.length, count + 1);
});

test("hidden audio suspends and destruction closes the entire graph", async (t) => {
  const ctx = context(),
    engine = new SoundEngine(ctx, {
      place: "planet",
      preferences: sensoryDefaults,
    });
  t.after(() => engine.destroy(true));
  engine.cue("travel");
  await engine.setHidden(true);
  assert.equal(engine.master.gain.value, 0);
  await new Promise((resolve) => setTimeout(resolve, 110));
  assert.equal(ctx.state, "suspended");
  await engine.setHidden(false);
  assert.equal(ctx.state, "running");
  assert.ok(engine.master.gain.value > 0);
  engine.destroy(true);
  assert.equal(ctx.state, "closed");
  assert.ok(ctx.oscillators.every((node) => node.stopped));
  assert.ok(engine.owned.every((node) => node.disconnected));
});

test("the original ambient assets retain headroom and fit within one megabyte", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../public/audio/provenance.json", import.meta.url)),
  );
  let bytes = 0;
  for (const [name, audio] of Object.entries(manifest.metrics)) {
    assert.ok(audio.peak_dbfs < -6);
    const size = statSync(
      new URL(`../public/audio/${name}.mp3`, import.meta.url),
    ).size;
    assert.equal(size, audio.bytes);
    bytes += size;
  }
  assert.ok(bytes < 1024 * 1024);
});

test("detail rooms choose their own music, and closing returns to the biome", async () => {
  const { soundDestination, soundPlaces } =
    await import("../app/lib/sensory-design.mjs");
  for (const id of [
    "work",
    "journey",
    "about",
    "music",
    "notes",
    "writing",
    "contact",
    "socials",
    "skills",
    "discoveries",
    "index",
  ]) {
    const room = soundDestination("studio", id);
    assert.ok(soundPlaces[room].track);
    assert.ok(
      statSync(
        new URL(
          `../public/audio/${soundPlaces[room].track}.mp3`,
          import.meta.url,
        ),
      ).size > 0,
    );
  }
  assert.equal(soundDestination("studio", "music", "shows"), "room-cinema");
  assert.equal(soundDestination("trail", null, "shows"), "trail");
  assert.notEqual(
    soundPlaces["room-work"].track,
    soundPlaces["room-about"].track,
  );
  const foreground = soundMix("room-cinema", sensoryDefaults, {
    reading: true,
    music: true,
  });
  assert.equal(foreground.score, 0);
  assert.equal(foreground.environment, 0);
});

test("late room scores stay silent after leaving and independent music mute wins", async (t) => {
  const pending = new Map();
  t.mock.method(
    globalThis,
    "fetch",
    (url) =>
      new Promise((resolve) =>
        pending.set(url, () =>
          resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }),
        ),
      ),
  );
  const engine = new SoundEngine(context(), {
    place: "room-work",
    preferences: sensoryDefaults,
    reading: true,
  });
  t.after(() => engine.destroy(true));
  const load = engine.prepare();
  engine.update({ place: "room-about" });
  for (const name of ["quiet-room", "rain-window", "paper-light"])
    pending.get(`/audio/${name}.mp3`)();
  await flush();
  pending.get("/audio/workbench.mp3")();
  await load;
  await flush();
  assert.equal(engine.loops.get("workbench").gain.gain.value, 0);
  assert.equal(engine.loops.get("quiet-room").gain.gain.value, 0);
  assert.ok(engine.loops.get("paper-light").gain.gain.value > 0);
  engine.update({ preferences: { ...sensoryDefaults, music: false } });
  assert.equal(engine.loops.get("paper-light").gain.gain.value, 0);
  assert.ok(engine.loops.get("rain-window").gain.gain.value > 0);
  engine.update({ music: true });
  assert.equal(engine.loops.get("rain-window").gain.gain.value, 0);
});

test("room arrangements are small, loopable assets with headroom", () => {
  const manifest = JSON.parse(
    readFileSync(new URL("../public/audio/room-scores.json", import.meta.url)),
  );
  let bytes = 0;
  for (const [name, track] of Object.entries(manifest.metrics)) {
    assert.ok(track.peak_dbfs < -10);
    assert.ok(track.loop_boundary_delta < 0.01);
    assert.equal(
      statSync(new URL(`../public/audio/${name}.mp3`, import.meta.url)).size,
      track.bytes,
    );
    bytes += track.bytes;
  }
  assert.ok(bytes < 450000);
});

test("home plays the city, not a permanent storm", () => {
  assert.equal(soundPlaces.studio.bed, "open-air");
  const engine = new SoundEngine(context(), {
    place: "studio",
    preferences: sensoryDefaults,
    weather: { kind: "clear", rain: 0, fog: 0 },
  });
  engine.mix();
  assert.ok(engine.city.gain.value > 0, "street layer audible at home");
  assert.equal(engine.weather.gain.value, 0, "no thunder on a clear day");
  engine.update({ place: "trail" });
  assert.equal(engine.city.gain.value, 0, "street layer stays home");
  engine.destroy(true);
});
