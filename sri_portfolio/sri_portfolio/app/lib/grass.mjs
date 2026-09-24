// Per-biome grass character. Colours are sRGB hex. Extents stay
// inside each region's level floor so blades never reach the shoreline.
export const grassProfile = {
  // Yosemite-inspired meadow: tall, sun-dried tips over green bases.
  trail: {
    extent: 26,
    height: 0.62,
    width: 0.045,
    base: "#3d4a22",
    tip: "#9aa552",
    dry: "#d8b774",
    fade: 110,
  },
  // Mown park turf around the courts.
  court: {
    extent: 30,
    height: 0.16,
    width: 0.03,
    base: "#2f4a1f",
    tip: "#6f9a3f",
    dry: "#a3a85a",
    fade: 90,
  },
  // Campus lawns and courtyard.
  projects: {
    extent: 34,
    height: 0.2,
    width: 0.032,
    base: "#32481f",
    tip: "#789b45",
    dry: "#b0a462",
    fade: 100,
  },
  // Garden meadow with some height and seed heads.
  future: {
    extent: 20,
    height: 0.38,
    width: 0.04,
    base: "#394a23",
    tip: "#8ca04c",
    dry: "#cdb27a",
    fade: 80,
  },
};

// Tufts (three blades each).
const budget = { low: 6000, medium: 22000, high: 60000 };

export function grassCount(biome, tier) {
  const profile = grassProfile[biome];
  if (!profile) return 0;
  // Scale with area so small gardens are as dense as the valley.
  const area = Math.min(1, (profile.extent * profile.extent) / (30 * 30));
  return Math.round((budget[tier] ?? 0) * Math.max(0.45, area));
}

// Dense near-field layer that follows the view (half-width, metres).
export const NEAR_EXTENT = 9;
const nearBudget = { low: 0, medium: 12000, high: 36000 };
export function nearGrassCount(biome, tier) {
  return grassProfile[biome] ? nearBudget[tier] ?? 0 : 0;
}
