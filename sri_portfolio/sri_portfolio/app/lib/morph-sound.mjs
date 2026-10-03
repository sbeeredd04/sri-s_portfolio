import { MORPH, morphSettle, skinIdentity } from "./biome-morph.mjs";

// A low foundation, a short tactile decoding rhythm, then a resolved dyad.
// Destination changes the material/timbre, not the musical key of the world.
const materials = {
  studio: { hz: 73.42, filter: 1100, finish: [293.66, 440] },
  projects: { hz: 73.42, filter: 2300, finish: [293.66, 587.33] },
  court: { hz: 65.41, filter: 850, finish: [261.63, 392] },
  trail: { hz: 73.42, filter: 1450, finish: [293.66, 440] },
  future: { hz: 65.41, filter: 1800, finish: [261.63, 523.25] },
};

export function playMorph(engine, biome) {
  const { context, effects } = engine;
  const now = context.currentTime;
  const material = materials[skinIdentity(biome)] || materials.studio;
  const bus = context.createGain();
  bus.connect(effects);
  const sources = [];
  let remaining = 5,
    cancelled = false;
  const own = (source, nodes, start, end) => {
    sources.push(source);
    engine.track(source, nodes);
    const ended = source.onended;
    source.onended = () => {
      ended();
      if (--remaining === 0) bus.disconnect();
    };
    source.start(start);
    source.stop(end);
  };
  const tone = (hz, delay, duration, level) => {
    const source = context.createOscillator();
    const gain = context.createGain();
    const start = now + delay;
    source.type = "sine";
    source.frequency.setValueAtTime(hz, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(level, start + 0.028);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(gain).connect(bus);
    own(source, [source, gain], start, start + duration + 0.02);
  };
  tone(material.hz, 0, 0.85, 0.16);
  tone(material.hz * 2, 0, 0.7, 0.07);

  // One filtered noise voice carries six restrained ticks, not a voice per letter.
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  noise.buffer = engine.noise;
  filter.type = "bandpass";
  filter.Q.value = 0.65;
  filter.frequency.setValueAtTime(material.filter, now);
  filter.frequency.exponentialRampToValueAtTime(
    material.filter * 0.48,
    now + morphSettle / 1000,
  );
  envelope.gain.setValueAtTime(0, now);
  for (let i = 0; i < 6; i++) {
    const at = now + (MORPH.start + i * 88) / 1000;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(0.042 - i * 0.004, at + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.065);
  }
  noise.connect(filter).connect(envelope).connect(bus);
  own(noise, [noise, filter, envelope], now, now + morphSettle / 1000);
  material.finish.forEach((hz, i) =>
    tone(hz, morphSettle / 1000, 0.34, i ? 0.018 : 0.027),
  );

  return () => {
    if (cancelled || remaining === 0) return;
    cancelled = true;
    const at = context.currentTime;
    bus.gain.setTargetAtTime(0, at, 0.008);
    // Cancels future resolve notes as well as the currently audible body.
    sources.forEach((source) => {
      try {
        source.stop(at + 0.035);
      } catch {}
    });
  };
}
