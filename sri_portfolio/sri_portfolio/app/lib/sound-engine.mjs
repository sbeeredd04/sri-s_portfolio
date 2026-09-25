import {
  glassCues,
  soundMix,
  soundPlaces,
  sensoryPreferences,
} from "./sensory-design.mjs";
import { voices } from "./sound-voices.mjs";

function soften(parameter, value, now, time = 0.65) {
  if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
  else {
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(parameter.value, now);
  }
  parameter.setTargetAtTime(value, now, time);
}

const RAIN_BED = "rain-window";

// One audio graph, with independently mixed atmosphere, score, and touch cues.
// Audible playback starts from an eligible gesture; a remembered mute wins.
export class SoundEngine {
  constructor(
    context,
    {
      place,
      preferences,
      reading = false,
      music = false,
      weather = null,
      onError = () => {},
    },
  ) {
    this.context = context;
    this.place = place;
    this.preferences = sensoryPreferences(preferences);
    this.focus = { reading, music };
    this.weatherState = weather;
    this.onError = onError;
    this.disposed = false;
    this.hidden = false;
    this.loaded = new Map();
    this.loops = new Map();
    this.nodes = new Set();
    this.abort = new AbortController();
    this.lastCue = -Infinity;
    this.master = context.createGain();
    this.master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -8;
    limiter.knee.value = 6;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.005;
    limiter.release.value = 0.18;
    this.master.connect(limiter).connect(context.destination);
    this.effects = context.createGain();
    this.effects.connect(this.master);
    this.weather = context.createGain();
    this.weather.gain.value = 0;
    this.weather.connect(this.master);
    // The city at home: a filtered street hum plus occasional bells and,
    // in fog, a foghorn. Synthesised, so it costs no download.
    this.city = context.createGain();
    this.city.gain.value = 0;
    this.city.connect(this.master);
    // The keynote crowd: a full house murmuring, and now and then applause.
    this.hall = context.createGain();
    this.hall.gain.value = 0;
    this.hall.connect(this.master);
    // A campfire on the trail: a low roar and scattered crackles.
    this.fire = context.createGain();
    this.fire.gain.value = 0;
    this.fire.connect(this.master);
    // A small diffused tail softens cues without making navigation echo.
    const room = context.createConvolver(),
      wet = context.createGain();
    const impulse = context.createBuffer(
      2,
      Math.floor(context.sampleRate * 0.65),
      context.sampleRate,
    );
    let seed = 4561;
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 16807) % 2147483647;
        data[i] =
          ((seed / 2147483647) * 2 - 1) *
          Math.exp((-i / context.sampleRate) * 10);
      }
    }
    room.buffer = impulse;
    wet.gain.value = 0.12;
    this.effects.connect(room).connect(wet).connect(this.master);
    this.noise = context.createBuffer(
      1,
      context.sampleRate,
      context.sampleRate,
    );
    const noise = this.noise.getChannelData(0);
    for (let i = 0; i < noise.length; i++) {
      seed = (seed * 16807) % 2147483647;
      noise[i] = (seed / 2147483647) * 2 - 1;
    }
    this.owned = [
      this.master,
      limiter,
      this.effects,
      this.weather,
      this.city,
      this.hall,
      this.fire,
      room,
      wet,
    ];
    this.nextCityCue = context.currentTime + 6;
    this.cityClock = setInterval(() => this.cityCues(), 1000);
    this.thunder = setInterval(() => {
      // Thunder only when SF actually has a storm overhead.
      if (
        this.weatherState?.kind === "storm" &&
        !this.hidden &&
        !this.disposed &&
        context.state === "running" &&
        !this.focus.music
      )
        this.noiseCue(65, 5.5, 0.065, 1.8, this.weather);
    }, 31000);
  }

  async loop(name) {
    if (this.loaded.has(name)) return this.loaded.get(name);
    const pending = (async () => {
      const response = await fetch(`/audio/${name}.mp3`, {
        signal: this.abort.signal,
      });
      if (!response.ok) throw new Error("The atmosphere could not load.");
      const data = await response.arrayBuffer();
      if (this.disposed) return;
      const buffer = await this.context.decodeAudioData(data);
      if (this.disposed) return;
      const source = this.context.createBufferSource(),
        gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.value = 0;
      source.connect(gain).connect(this.master);
      this.loops.set(name, { source, gain });
      source.start();
      this.mix();
    })();
    this.loaded.set(name, pending);
    return pending;
  }

  // Live rain layers the rain bed over any outdoor place.
  rainLevel() {
    const rain = this.weatherState?.rain ?? 0;
    return rain > 0.05 ? Math.min(1, 0.35 + rain) : 0;
  }

  async prepare() {
    const profile = soundPlaces[this.place] || soundPlaces.planet;
    await Promise.all([
      this.loop(profile.bed),
      this.rainLevel() ? this.loop(RAIN_BED) : Promise.resolve(),
      this.preferences.music
        ? this.loop(profile.track || "somewhere-soft")
        : Promise.resolve(),
    ]);
    if (!this.disposed) this.mix();
  }

  update({
    place = this.place,
    preferences = this.preferences,
    reading = this.focus.reading,
    music = this.focus.music,
    weather = this.weatherState,
  } = {}) {
    if (this.disposed) return;
    this.place = place;
    this.weatherState = weather;
    this.preferences = sensoryPreferences(preferences);
    this.focus = { reading, music };
    this.mix();
    this.prepare().catch((error) => {
      if (!this.disposed) this.onError(error);
    });
  }

  mix() {
    if (this.disposed) return;
    const now = this.context.currentTime;
    const levels = soundMix(this.place, this.preferences, this.focus);
    const profile = soundPlaces[this.place] || soundPlaces.planet;
    const bed = profile.bed;
    const score = profile.track || "somewhere-soft";
    soften(this.master.gain, this.hidden ? 0 : levels.master, now, 0.15);
    soften(this.effects.gain, levels.effects, now, 0.06);
    // Even an already-rumbling storm follows departure and reading/music focus.
    soften(
      this.weather.gain,
      this.weatherState?.kind === "storm"
        ? levels.environment / (profile.level || 0.3)
        : 0,
      now,
    );
    const cityLevel =
      profile.city || profile.chimes ? levels.environment / profile.level : 0;
    soften(this.city.gain, cityLevel, now);
    if (profile.city && cityLevel && !this.hum) this.startHum();
    // The street hum belongs to the city; the bus also carries garden chimes.
    if (this.humGain) soften(this.humGain.gain, profile.city ? 0.05 : 0, now);
    const hallLevel = profile.hall ? levels.environment / profile.level : 0;
    soften(this.hall.gain, hallLevel, now);
    if (hallLevel && !this.murmur) this.startMurmur();
    const fireLevel = profile.fire ? levels.environment / profile.level : 0;
    soften(this.fire.gain, fireLevel, now);
    if (fireLevel && !this.roar) this.startRoar();
    const rain = this.rainLevel();
    for (const [name, { gain }] of this.loops)
      soften(
        gain.gain,
        name === score
          ? levels.score
          : name === bed
            ? Math.max(levels.environment, name === RAIN_BED ? rain * 0.5 : 0)
            : name === RAIN_BED
              ? (levels.environment / (profile.level || 0.3)) * rain * 0.45
              : 0,
        now,
      );
  }

  track(source, nodes) {
    this.nodes.add(source);
    source.onended = () => {
      this.nodes.delete(source);
      for (const node of nodes) node.disconnect();
    };
  }

  noiseCue(
    frequency,
    duration,
    level,
    attack = 0.007,
    destination = this.effects,
  ) {
    const { context } = this;
    const now = context.currentTime;
    const source = context.createBufferSource(),
      filter = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = this.noise;
    source.loop = duration > 1;
    filter.type = frequency < 100 ? "lowpass" : "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.65;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(gain).connect(destination);
    source.start();
    source.stop(now + duration + 0.02);
    this.track(source, [source, filter, gain]);
  }

  cityCues() {
    const { context } = this;
    const profile = soundPlaces[this.place] || soundPlaces.planet;
    if (
      !(profile.city || profile.hall || profile.fire || profile.chimes) ||
      this.hidden ||
      this.disposed ||
      context.state !== "running" ||
      this.focus.music ||
      !this.preferences.effects
    )
      return;
    const now = context.currentTime;
    // The fire crackles every second; the other places cue now and then.
    if (profile.fire) return this.crackle(now + 0.05);
    if (now < this.nextCityCue) return;
    if (profile.chimes) {
      this.chimes(now + 0.05);
      this.nextCityCue = now + 9 + Math.random() * 16;
      return;
    }
    if (profile.hall) {
      this.applause(now + 0.05);
      this.nextCityCue = now + 34 + Math.random() * 36;
      return;
    }
    const foggy = (this.weatherState?.fog ?? 0) > 0.3;
    if (foggy && Math.random() < 0.45) this.foghorn(now + 0.05);
    else this.bell(now + 0.05);
    this.nextCityCue = now + 24 + Math.random() * 30;
  }

  cue(kind) {
    const { context } = this;
    if (
      this.disposed ||
      this.hidden ||
      context.state !== "running" ||
      !this.preferences.effects
    )
      return;
    const now = context.currentTime;
    if (now - this.lastCue < 0.065) return;
    this.lastCue = now;
    if (["swish", "volley-hit", "basket-bounce", "ball-catch"].includes(kind)) {
      this.noiseCue(
        kind === "swish" ? 4200 : kind === "basket-bounce" ? 290 : 850,
        kind === "swish" ? 0.23 : 0.12,
        kind === "swish" ? 0.025 : 0.08,
      );
      if (kind !== "basket-bounce") return;
      kind = "press";
    }
    const cue = glassCues[kind] || glassCues.press;
    cue.notes.forEach((hz, i) => {
      const source = context.createOscillator(),
        gain = context.createGain();
      const start = now + i * cue.spacing;
      source.type = "sine";
      const pitch = (soundPlaces[this.place] || soundPlaces.planet).pitch || 1;
      source.frequency.setValueAtTime(hz * pitch, start);
      if (kind === "press")
        source.frequency.exponentialRampToValueAtTime(
          130 * pitch,
          start + cue.duration,
        );
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(
        cue.gain / (1 + i * 0.3),
        start + 0.009,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, start + cue.duration);
      source.connect(gain).connect(this.effects);
      source.start(start);
      source.stop(start + cue.duration + 0.02);
      this.track(source, [source, gain]);
    });
  }

  async setHidden(hidden) {
    if (this.disposed) return;
    this.hidden = hidden;
    clearTimeout(this.suspendTimer);
    if (hidden) {
      soften(this.master.gain, 0, this.context.currentTime, 0.015);
      this.suspendTimer = setTimeout(() => {
        if (this.hidden && !this.disposed)
          this.context.suspend().catch(this.onError);
      }, 90);
    } else {
      await this.context.resume();
      if (!this.disposed && !this.hidden) this.mix();
    }
  }

  destroy(immediate = false) {
    if (this.disposed) return;
    this.disposed = true;
    clearInterval(this.thunder);
    clearInterval(this.cityClock);
    clearTimeout(this.suspendTimer);
    this.abort.abort();
    const dispose = () => {
      for (const source of this.nodes) {
        try {
          source.stop();
        } catch {}
      }
      for (const { source, gain } of this.loops.values()) {
        try {
          source.stop();
        } catch {}
        source.disconnect();
        gain.disconnect();
      }
      for (const node of this.owned) node.disconnect();
      this.loops.clear();
      this.loaded.clear();
      this.nodes.clear();
      this.context.close().catch(() => {});
    };
    if (immediate || this.context.state !== "running") dispose();
    else {
      soften(this.master.gain, 0, this.context.currentTime, 0.025);
      setTimeout(dispose, 140);
    }
  }
}

Object.assign(SoundEngine.prototype, voices);
