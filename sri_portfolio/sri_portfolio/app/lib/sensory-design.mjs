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
    label: "A little further out",
    description: "Soft chords, a little air, room to wander.",
    bed: "open-air",
    level: 0.16,
    score: 0.65,
  },
  studio: {
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
  entertainment: {
    label: "After hours",
    description: "Warm room tone and soft chords. Settle in for a while.",
    bed: "quiet-room",
    level: 0.26,
    score: 0.72,
  },
  court: {
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
    description: "A little air and an unfinished thought.",
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
    "An unwritten page",
    "Sparse keys and quiet air for an unfinished thought.",
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
    effects: preferences.effects
      ? (music ? 0.3 : 0.92) * (preferences.effectsLevel ?? 1)
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

export const glassCues = {
  ripple: { notes: [659.25, 440], spacing: 0.09, duration: 0.42, gain: 0.018 },
  press: { notes: [220], spacing: 0, duration: 0.065, gain: 0.038 },
  object: { notes: [587.33, 880], spacing: 0.022, duration: 0.14, gain: 0.025 },
  open: { notes: [440, 659.25], spacing: 0.055, duration: 0.26, gain: 0.035 },
  close: { notes: [440, 293.66], spacing: 0.03, duration: 0.16, gain: 0.023 },
  travel: {
    notes: [293.66, 440, 587.33],
    spacing: 0.075,
    duration: 0.38,
    gain: 0.027,
  },
  welcome: {
    notes: [293.66, 440, 659.25],
    spacing: 0.16,
    duration: 0.65,
    gain: 0.03,
  },
};
