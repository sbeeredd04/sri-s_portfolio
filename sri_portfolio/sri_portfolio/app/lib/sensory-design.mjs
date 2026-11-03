export const sensoryDefaults = {
  volume: 0.42,
  enabled: true,
  musicLevel: 1,
  environmentLevel: 1,
  effectsLevel: 1,
  hapticStrength: 0.5,
  music: true,
  effects: true,
  haptics: false,
};
export const soundPlaces = {
  planet: {
    track: "world-thread",
    label: "A little further out",
    description: "Deep warm bass, open chords, and a slow melodic pulse.",
    bed: "open-air",
    level: 0.16,
    score: 0.65,
  },
  studio: {
    track: "world-thread",
    label: "The city outside",
    description:
      "Streets humming below, a cable-car bell, a foghorn when the fog is in.",
    bed: "open-air",
    level: 0.4,
    score: 0.48,
    city: true,
  },
  bay: {
    track: "shoreline",
    label: "Air above the bay",
    description: "Open air and a soft musical thread across the water.",
    bed: "open-air",
    level: 0.3,
    score: 0.42,
  },
  projects: {
    track: "workbench",
    label: "A quiet kind of momentum",
    description: "Open air and a gentle musical thread between ideas.",
    bed: "open-air",
    level: 0.24,
    score: 0.55,
  },
  keynote: {
    track: "workbench",
    label: "A full house",
    description: "A room of people between talks, and applause now and then.",
    bed: "quiet-room",
    level: 0.34,
    score: 0.36,
    hall: true,
  },
  camp: {
    track: "shoreline",
    label: "Round the fire",
    description:
      "A small fire breathing and popping, and the valley going quiet.",
    bed: "lakeside",
    level: 0.36,
    score: 0.3,
    fire: true,
  },
  entertainment: {
    track: "world-thread",
    label: "After hours",
    description: "Warm room tone and soft chords. Settle in for a while.",
    bed: "quiet-room",
    level: 0.26,
    score: 0.72,
  },
  court: {
    track: "world-thread",
    label: "One more game",
    description: "Open air, a bounce, a return. The music takes a step back.",
    bed: "open-air",
    level: 0.3,
    score: 0.3,
  },
  trail: {
    track: "shoreline",
    label: "By the water",
    description: "A quiet shore, soft air, and nowhere to rush.",
    bed: "lakeside",
    level: 0.47,
    score: 0.42,
  },
  future: {
    track: "paper-light",
    label: "Good things ahead",
    description: "A little air, a wind chime, and an unfinished thought.",
    chimes: true,
    bed: "open-air",
    level: 0.18,
    score: 0.62,
  },
};

// A shared musical family, with a different arrangement and material in each room.
const detailRooms = {
  work: [
    "At the workbench",
    "A quiet pulse, soft keys, space to follow an idea.",
    "workbench",
    "quiet-room",
    0.15,
    0.65,
    1.12,
  ],
  journey: [
    "People & places",
    "Warm, unhurried keys beneath the story.",
    "paper-light",
    "quiet-room",
    0.12,
    0.55,
    0.9,
  ],
  about: [
    "A personal journal",
    "Soft felt keys, a little rain beyond the page.",
    "paper-light",
    "rain-window",
    0.23,
    0.62,
    0.94,
  ],
  music: [
    "The listening room",
    "Warm chords and room air. Your chosen track takes the lead.",
    "somewhere-soft",
    "quiet-room",
    0.13,
    0.68,
    0.82,
  ],
  cinema: [
    "Before the opening scene",
    "A low, spacious score. Clips have the room to themselves.",
    "blue-hour",
    "quiet-room",
    0.1,
    0.52,
    0.75,
  ],
  notes: [
    "Through my lens",
    "Slow, open chords beside the water.",
    "shoreline",
    "lakeside",
    0.28,
    0.58,
    1.04,
  ],
  writing: [
    "Between the lines",
    "Warm keys and quiet air, kept low while you read.",
    "paper-light",
    "open-air",
    0.12,
    0.48,
    0.92,
  ],
  contact: [
    "A conversation starts here",
    "Warm keys, kept low while you write.",
    "paper-light",
    "quiet-room",
    0.1,
    0.42,
    1,
  ],
  socials: [
    "Around the internet",
    "A gentle pulse between conversations.",
    "workbench",
    "open-air",
    0.12,
    0.48,
    1.08,
  ],
  skills: [
    "The tools behind it",
    "A steady, understated rhythm for the technical details.",
    "workbench",
    "quiet-room",
    0.12,
    0.52,
    1.16,
  ],
  discoveries: [
    "A hidden corner",
    "A little space and a few things to find.",
    "blue-hour",
    "open-air",
    0.14,
    0.5,
    1.2,
  ],
  index: [
    "Choose a direction",
    "The world’s familiar musical thread, softly in the background.",
    "somewhere-soft",
    "open-air",
    0.1,
    0.45,
    1,
  ],
};
for (const [
  id,
  [label, description, track, bed, level, score, pitch],
] of Object.entries(detailRooms)) {
  soundPlaces[`room-${id}`] = {
    label,
    description,
    track,
    bed,
    level,
    score,
    pitch,
  };
}

export function soundDestination(biome, section, detail) {
  if (!section) return biome;
  const id = section === "music" && detail === "shows" ? "cinema" : section;
  return soundPlaces[`room-${id}`] ? `room-${id}` : biome;
}

export function sensoryPreferences(value) {
  const v = value && typeof value === "object" ? value : {};
  return {
    ...Object.fromEntries(
      ["musicLevel", "environmentLevel", "effectsLevel", "hapticStrength"].map(
        (key) => [
          key,
          typeof v[key] === "number" && Number.isFinite(v[key])
            ? Math.max(0, Math.min(1, v[key]))
            : sensoryDefaults[key],
        ],
      ),
    ),
    volume:
      typeof v.volume === "number" && Number.isFinite(v.volume)
        ? Math.max(0, Math.min(1, v.volume))
        : sensoryDefaults.volume,
    ...Object.fromEntries(
      ["music", "effects", "haptics", "enabled"].map((key) => [
        key,
        typeof v[key] === "boolean" ? v[key] : sensoryDefaults[key],
      ]),
    ),
  };
}

export function soundMix(
  place,
  preferences,
  { reading = false, music = false } = {},
) {
  const p = soundPlaces[place] || soundPlaces.planet;
  const focus = reading ? 0.45 : 1;
  return {
    master: preferences.volume,
    score: preferences.music
      ? p.score * focus * (music ? 0 : 1) * (preferences.musicLevel ?? 1)
      : 0,
    environment:
      p.level * focus * (music ? 0 : 1) * (preferences.environmentLevel ?? 1),
    // The 0–100% effects control spans the full, stronger interaction mix.
    // Master volume, music ducking and the output limiter still apply.
    effects: preferences.effects
      ? 2 * (music ? 0.3 : 1) * (preferences.effectsLevel ?? 1)
      : 0,
  };
}

const tactileDurations = {
  ripple: 7,
  press: 5,
  object: 7,
  open: 9,
  close: 5,
  travel: 12,
};
export function hapticPulse(
  kind,
  {
    enabled,
    supported,
    reducedMotion,
    hidden,
    now,
    strength = 0.5,
    last = -Infinity,
  },
) {
  if (
    !enabled ||
    !supported ||
    reducedMotion ||
    hidden ||
    !Number.isFinite(now) ||
    now - last < 90
  )
    return 0;
  // Ambient events, simulated ball contacts and hover never vibrate the device.
  return tactileDurations[kind]
    ? Math.round(
        tactileDurations[kind] * Math.max(0, Math.min(2, strength * 2)),
      )
    : 0;
}

// Warm, rounded feedback: a low body plus a quieter audible harmonic.
// Small speakers retain the gesture without relying on inaudible sub-bass.
export const interactionCues = {
  type: {
    notes: [220],
    spacing: 0,
    attack: 0.012,
    duration: 0.065,
    gain: 0.017,
  },
  hover: {
    notes: [196],
    spacing: 0,
    attack: 0.018,
    duration: 0.1,
    gain: 0.012,
  },
  reveal: {
    notes: [196, 293.66],
    spacing: 0.065,
    attack: 0.026,
    duration: 0.36,
    gain: 0.03,
  },
  ripple: {
    notes: [293.66, 196],
    spacing: 0.085,
    attack: 0.028,
    duration: 0.46,
    gain: 0.02,
  },
  press: {
    notes: [130.81, 261.63],
    weights: [1, 0.24],
    spacing: 0,
    attack: 0.016,
    duration: 0.22,
    gain: 0.13,
  },
  object: {
    notes: [174.61, 261.63],
    spacing: 0.04,
    attack: 0.022,
    duration: 0.28,
    gain: 0.055,
  },
  open: {
    notes: [196, 293.66],
    spacing: 0.065,
    attack: 0.025,
    duration: 0.38,
    gain: 0.05,
  },
  close: {
    notes: [196, 130.81],
    spacing: 0.045,
    attack: 0.02,
    duration: 0.3,
    gain: 0.045,
  },
  travel: {
    notes: [146.83, 220, 293.66],
    spacing: 0.09,
    attack: 0.03,
    duration: 0.48,
    gain: 0.035,
  },
  welcome: {
    notes: [146.83, 220, 329.63],
    spacing: 0.16,
    attack: 0.035,
    duration: 0.72,
    gain: 0.035,
  },
};
