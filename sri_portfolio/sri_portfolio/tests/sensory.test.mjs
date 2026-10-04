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
import { entranceNotes } from "../app/lib/entrance-sound.mjs";

test("introduction is synchronized, resumes from its offset, and follows the music bus", () => {
  const ctx = context();
  const engine = new SoundEngine(ctx, {
    place: "planet",
    preferences: sensoryDefaults,
  });
  engine.introduction({ playing: true, position: 0 });
  assert.equal(ctx.oscillators.length, entranceNotes.length);
  assert.ok(ctx.oscillators.some((source) => source.frequency.value < 30));
  assert.ok(entranceNotes.some(([at, , duration]) => at + duration > 8));
  engine.introduction({ playing: false, position: 2700 });
  assert.ok(ctx.oscillators.every((source) => source.stopped));
  const previous = ctx.oscillators.length;
  engine.introduction({ playing: true, position: 2700 });
  assert.equal(
    ctx.oscillators.length - previous,
    entranceNotes.filter(([at, , duration]) => at + duration > 2.7).length,
  );
  engine.preferences = { ...sensoryDefaults, music: false };
  engine.mix();
  assert.equal(engine.introBus.gain.value, 0);
  engine.destroy(true);
  assert.ok(ctx.oscillators.every((source) => source.stopped));
});

test("world score is an original compact loop with bass headroom", () => {
  const { metrics } = JSON.parse(
    readFileSync(new URL("../public/audio/world-thread.json", import.meta.url)),
  );
  assert.equal(metrics.beat_seconds, 0.9);
  assert.ok(metrics.seconds > 55);
  assert.ok(metrics.peak_dbfs < -6);
  assert.ok(metrics.loop_boundary_delta < 0.005);
  assert.ok(
    statSync(new URL("../public/audio/world-thread.mp3", import.meta.url))
      .size < 500000,
  );
});

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
  playbackRate = new Param();
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
  pending.get("/audio/world-thread.mp3")();
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
    requests.filter((url) => url.includes("world-thread")).length,
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

test("the keynote hall murmurs and applauds, and only there", () => {
  const engine = new SoundEngine(context(), {
    place: "keynote",
    preferences: sensoryDefaults,
    weather: { kind: "clear", rain: 0, fog: 0 },
  });
  try {
    engine.mix();
    assert.ok(engine.hall.gain.value > 0, "room of people audible");
    assert.ok(engine.murmur?.length, "murmur started");
    assert.equal(engine.city.gain.value, 0, "no street layer indoors");
    engine.applause(0);
    engine.update({ place: "projects" });
    assert.equal(engine.hall.gain.value, 0, "the hall stays in the hall");
  } finally {
    engine.destroy(true);
  }
});

test("the camp fire crackles only at the camp", () => {
  const ctx = context();
  const engine = new SoundEngine(ctx, {
    place: "camp",
    preferences: sensoryDefaults,
    weather: { kind: "clear", rain: 0, fog: 0 },
  });
  try {
    engine.mix();
    assert.ok(engine.fire.gain.value > 0, "fire audible");
    assert.ok(engine.roar, "roar started");
    const before = ctx.sources.length;
    engine.cityCues();
    assert.ok(ctx.sources.length > before, "crackles scheduled");
    engine.update({ place: "trail" });
    assert.equal(engine.fire.gain.value, 0, "fire stays at the camp");
  } finally {
    engine.destroy(true);
  }
});

test("Fieldnotes chimes without the street hum following", () => {
  const ctx = context();
  const engine = new SoundEngine(ctx, {
    place: "studio",
    preferences: sensoryDefaults,
    weather: { kind: "clear", rain: 0, fog: 0 },
  });
  try {
    engine.mix();
    assert.ok(engine.humGain.gain.value > 0, "hum at home");
    engine.update({ place: "future" });
    assert.ok(engine.city.gain.value > 0, "garden bus open");
    assert.equal(engine.humGain.gain.value, 0, "no street hum in the garden");
    const before = ctx.oscillators.length;
    engine.nextCityCue = 0;
    engine.cityCues();
    assert.ok(ctx.oscillators.length > before, "chimes rang");
  } finally {
    engine.destroy(true);
  }
});

test("first interaction has an audible bus before background downloads finish", (t) => {
  const ctx = context();
  const engine = new SoundEngine(ctx, {
    place: "planet",
    preferences: sensoryDefaults,
  });
  t.after(() => engine.destroy(true));
  assert.equal(engine.master.gain.value, sensoryDefaults.volume);
  assert.ok(engine.effects.gain.value > 0);
  engine.cue("press");
  assert.equal(ctx.oscillators.length, 1);
  assert.equal(ctx.oscillators[0].type, "triangle");
  assert.equal(engine.loaded.size, 0);
  ctx.currentTime += 1;
  engine.preferences.enabled = false;
  engine.cue("press");
  assert.equal(
    ctx.oscillators.length,
    1,
    "remembered master mute suppresses interaction sounds",
  );
});

test("micro sounds never swallow a click and rapid typing stays bounded", (t) => {
  const ctx = context();
  const engine = new SoundEngine(ctx, {
    place: "studio",
    preferences: sensoryDefaults,
  });
  t.after(() => engine.destroy(true));
  engine.cue("type");
  const typed = ctx.oscillators.length;
  for (let i = 0; i < 30; i++) engine.cue("type");
  assert.equal(ctx.oscillators.length, typed);
  engine.cue("press");
  assert.equal(ctx.oscillators.length, typed + 1);
});

test("travel has low body, finite sources, and follows the effects mute", (t) => {
  const ctx = context();
  const engine = new SoundEngine(ctx, {
    place: "planet",
    preferences: sensoryDefaults,
  });
  t.after(() => engine.destroy(true));
  engine.cue("travel");
  assert.ok(ctx.oscillators.some((node) => node.frequency.value < 100));
  assert.ok(ctx.oscillators.every((node) => node.stopped));
  const count = ctx.oscillators.length;
  engine.preferences.effects = false;
  ctx.currentTime += 2;
  engine.cue("welcome");
  assert.equal(ctx.oscillators.length, count);
});

// Unlike the basic fake, this clock keeps scheduled notes alive until onended.
function scheduledContext() {
  const ctx = context();
  for (const method of ["createOscillator", "createBufferSource"]) {
    const create = ctx[method];
    ctx[method] = () => {
      const node = create();
      node.start = (at) => {
        node.startsAt = at;
      };
      node.stop = (at = ctx.currentTime) => {
        node.stopsAt = at;
      };
      return node;
    };
  }
  return ctx;
}

test("morph sound follows the decode score, has a bass octave and a bounded voice count", () => {
  const ctx = scheduledContext();
  const engine = new SoundEngine(ctx, {
    place: "studio",
    preferences: sensoryDefaults,
  });
  engine.cue("morph", { destination: "projects" });
  assert.equal(ctx.oscillators.length, 4);
  assert.equal(ctx.sources.length, 1);
  assert.ok(ctx.oscillators[0].frequency.value < 100);
  assert.equal(
    ctx.oscillators[1].frequency.value,
    ctx.oscillators[0].frequency.value * 2,
  );
  assert.equal(ctx.oscillators[2].startsAt, ctx.currentTime + 0.72);
  assert.ok(
    [...ctx.oscillators, ...ctx.sources].every(
      (n) => n.stopsAt <= ctx.currentTime + 1.1,
    ),
  );
  const count = ctx.oscillators.length;
  engine.cue("press"); // Bubbling click must not double the score.
  assert.equal(ctx.oscillators.length, count);
  [...ctx.oscillators, ...ctx.sources].forEach((n) => n.onended());
  assert.equal(engine.nodes.size, 0);
  engine.destroy(true);
});

test("rapid biome changes cancel the old resolution; pause and effects mute cancel pending notes", async () => {
  const ctx = scheduledContext();
  const engine = new SoundEngine(ctx, {
    place: "studio",
    preferences: sensoryDefaults,
  });
  engine.prepare = async () => {};
  engine.cue("morph", { destination: "projects" });
  const first = [...ctx.oscillators, ...ctx.sources];
  ctx.currentTime += 0.02; // Faster than the ordinary click rate limit.
  engine.cue("morph", { destination: "court" });
  assert.ok(first.every((n) => n.stopsAt <= ctx.currentTime + 0.04));
  assert.equal(ctx.oscillators.length, 8);
  engine.cue("cancel-morph");
  assert.ok(ctx.oscillators.every((n) => n.stopsAt <= ctx.currentTime + 0.04));
  ctx.currentTime += 1;
  engine.cue("morph", { destination: "trail" });
  engine.update({ preferences: { ...sensoryDefaults, effects: false } });
  assert.ok(ctx.oscillators.every((n) => n.stopsAt <= ctx.currentTime + 0.04));
  const mutedCount = ctx.oscillators.length;
  engine.cue("morph", { destination: "future" });
  assert.equal(ctx.oscillators.length, mutedCount);
  engine.update({ preferences: sensoryDefaults });
  engine.cue("morph", { destination: "future" });
  await engine.setHidden(true);
  assert.ok(ctx.oscillators.every((n) => n.stopsAt <= ctx.currentTime + 0.04));
  engine.destroy(true);
});
