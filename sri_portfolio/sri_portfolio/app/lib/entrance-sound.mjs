// An original D-minor/add9 phrase. Chapter downbeats share the visual score's
// 900ms meter; the low D resolves as the travelling mark becomes Sri's period.
// Web Audio schedules the whole phrase on its audio clock, not JS timers.
export const entranceNotes = [
  [0, 36.71, 8.2, 0.24],
  [0, 73.42, 8.2, 0.09],
  [0, 146.83, 8.5, 0.045],
  [0, 220, 8.5, 0.035],
  [0.12, 293.66, 3.2, 0.045],
  [0.9, 82.41, 3.5, 0.08],
  [1.04, 329.63, 2.8, 0.04],
  [1.8, 87.31, 3.5, 0.08],
  [1.94, 349.23, 2.8, 0.04],
  [2.7, 65.41, 3.5, 0.08],
  [2.86, 392, 2.8, 0.04],
  [3.6, 73.42, 3.5, 0.08],
  [3.76, 440, 2.8, 0.045],
  [4.65, 36.71, 4.1, 0.22],
  [4.65, 27.5, 4.1, 0.07],
  [4.7, 146.83, 3.8, 0.055],
  [4.84, 220, 3.7, 0.045],
  [5, 293.66, 3.5, 0.04],
  [5.25, 587.33, 3.2, 0.025],
];

export function playEntranceSound(engine, position = 0) {
  const { context } = engine;
  const offset = Math.max(0, position / 1000);
  const bus = context.createGain();
  bus.gain.value = 1;
  bus.connect(engine.introBus);
  const sources = [];
  for (const [at, hz, duration, level] of entranceNotes) {
    if (at + duration <= offset) continue;
    const elapsed = Math.max(0, offset - at);
    const start = context.currentTime + Math.max(0, at - offset);
    const length = duration - elapsed;
    const source = context.createOscillator(),
      gain = context.createGain();
    source.type = hz < 100 || duration > 3 ? "sine" : "triangle";
    source.frequency.value = hz;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(
      level * Math.pow(0.0001 / level, elapsed / duration),
      start + Math.min(hz < 100 ? 0.18 : 0.12, length / 3),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    source.connect(gain).connect(bus);
    source.start(start);
    source.stop(start + length + 0.01);
    engine.track(source, [source, gain]);
    sources.push(source);
  }
  let cancelled = false;
  return (release = 0.18) => {
    if (cancelled) return;
    cancelled = true;
    // The final chord rings into the music; interruption still gets a soft exit.
    bus.gain.setTargetAtTime(0, context.currentTime, release / 4);
    for (const source of sources) {
      try {
        source.stop(context.currentTime + release);
      } catch {}
    }
    setTimeout(() => bus.disconnect(), release * 1000 + 50);
  };
}
