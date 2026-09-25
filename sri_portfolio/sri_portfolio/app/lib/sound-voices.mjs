// The synthesized voices of the world: steady beds (the street hum, a
// crowd's murmur, a fire's breath) and one-shot cues (crackles, applause,
// a cable-car bell, garden chimes, a foghorn). Mixed into SoundEngine, so
// each runs with the engine as `this` and routes to its buses.
export const voices = {
  startHum() {
    const { context } = this;
    const source = context.createBufferSource(),
      low = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = this.noise;
    source.loop = true;
    low.type = "lowpass";
    low.frequency.value = 170;
    low.Q.value = 0.4;
    gain.gain.value = 0.05;
    source.connect(low).connect(gain).connect(this.city);
    source.start();
    this.hum = source;
    this.humGain = gain;
    this.track(source, [source, low, gain]);
  },

  // Voices in a big room: two bands of noise that swell and settle slowly.
  startMurmur() {
    const { context } = this;
    const sources = [];
    for (const [hz, q, level, rate] of [
      [380, 0.9, 0.05, 0.11],
      [1150, 1.3, 0.022, 0.17],
    ]) {
      const source = context.createBufferSource(),
        band = context.createBiquadFilter(),
        gain = context.createGain(),
        swell = context.createOscillator(),
        depth = context.createGain();
      source.buffer = this.noise;
      source.loop = true;
      source.playbackRate.value = 0.93 + sources.length * 0.11;
      band.type = "bandpass";
      band.frequency.value = hz;
      band.Q.value = q;
      gain.gain.value = level;
      swell.frequency.value = rate;
      depth.gain.value = level * 0.35;
      swell.connect(depth).connect(gain.gain);
      source.connect(band).connect(gain).connect(this.hall);
      source.start();
      swell.start();
      this.track(source, [source, band, gain, swell, depth]);
      sources.push(source);
    }
    this.murmur = sources;
  },

  // The steady breath of a small fire under its crackles.
  startRoar() {
    const { context } = this;
    const source = context.createBufferSource(),
      low = context.createBiquadFilter(),
      gain = context.createGain();
    source.buffer = this.noise;
    source.loop = true;
    source.playbackRate.value = 0.7;
    low.type = "lowpass";
    low.frequency.value = 380;
    gain.gain.value = 0.045;
    source.connect(low).connect(gain).connect(this.fire);
    source.start();
    this.roar = source;
    this.track(source, [source, low, gain]);
  },

  // A second's worth of pops and ticks, some bright, some woody.
  crackle(at) {
    const { context } = this;
    const count = 2 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const start = at + Math.random() * 0.95;
      const source = context.createBufferSource(),
        band = context.createBiquadFilter(),
        gain = context.createGain();
      source.buffer = this.noise;
      band.type = "bandpass";
      band.frequency.value = 1400 + Math.random() * 3800;
      band.Q.value = 2.4;
      const level =
        0.012 + Math.random() * (Math.random() < 0.15 ? 0.05 : 0.018);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(level, start + 0.002);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        start + 0.02 + Math.random() * 0.05,
      );
      source.connect(band).connect(gain).connect(this.fire);
      source.start(start, Math.random() * 0.9);
      source.stop(start + 0.09);
      this.track(source, [source, band, gain]);
    }
  },

  // Applause: a few seconds of scattered claps that rise and fall.
  applause(at) {
    const { context } = this;
    const length = 2.6 + Math.random() * 1.6;
    for (let i = 0; i < 70; i++) {
      const t = Math.random() * length,
        swell = Math.sin((t / length) * Math.PI);
      const source = context.createBufferSource(),
        band = context.createBiquadFilter(),
        gain = context.createGain();
      const start = at + t;
      source.buffer = this.noise;
      band.type = "bandpass";
      band.frequency.value = 1500 + Math.random() * 1800;
      band.Q.value = 1.1;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.02 * swell + 0.003, start + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.07);
      source.connect(band).connect(gain).connect(this.hall);
      source.start(start, Math.random() * 0.9);
      source.stop(start + 0.08);
      this.track(source, [source, band, gain]);
    }
  },

  // A cable-car bell: bright partials, struck two or three times.
  bell(at) {
    const { context } = this;
    const strikes = 2 + Math.round(Math.random());
    for (let k = 0; k < strikes; k++)
      for (const [hz, level] of [
        [1180, 0.022],
        [2950, 0.01],
        [5310, 0.004],
      ]) {
        const tone = context.createOscillator(),
          gain = context.createGain();
        const start = at + k * 0.32;
        tone.type = "sine";
        tone.frequency.setValueAtTime(hz, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(level, start + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
        tone.connect(gain).connect(this.city);
        tone.start(start);
        tone.stop(start + 1.15);
        this.track(tone, [tone, gain]);
      }
  },

  // A garden wind chime: a few pentatonic tubes knocked by the breeze.
  chimes(at) {
    const { context } = this;
    const scale = [880, 987.8, 1174.7, 1318.5, 1568, 1760];
    const knocks = 2 + Math.floor(Math.random() * 4);
    for (let k = 0; k < knocks; k++) {
      const hz = scale[Math.floor(Math.random() * scale.length)];
      const start = at + k * (0.18 + Math.random() * 0.35);
      for (const [ratio, level] of [
        [1, 0.012],
        [2.76, 0.004],
      ]) {
        const tone = context.createOscillator(),
          gain = context.createGain();
        tone.type = "sine";
        tone.frequency.setValueAtTime(hz * ratio, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(level, start + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 2.6);
        tone.connect(gain).connect(this.city);
        tone.start(start);
        tone.stop(start + 2.7);
        this.track(tone, [tone, gain]);
      }
    }
  },

  // The two-tone "bee-oh" of a bay foghorn, far off and low-passed.
  foghorn(at) {
    const { context } = this;
    for (const [hz, offset] of [
      [98, 0],
      [82, 1.5],
    ]) {
      const tone = context.createOscillator(),
        low = context.createBiquadFilter(),
        gain = context.createGain();
      const start = at + offset;
      tone.type = "sawtooth";
      tone.frequency.setValueAtTime(hz, start);
      low.type = "lowpass";
      low.frequency.value = 260;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.03, start + 0.25);
      gain.gain.setValueAtTime(0.03, start + 1.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.9);
      tone.connect(low).connect(gain).connect(this.city);
      tone.start(start);
      tone.stop(start + 2);
      this.track(tone, [tone, low, gain]);
    }
  },
};
