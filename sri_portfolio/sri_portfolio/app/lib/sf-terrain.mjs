// San Francisco relief for the home plateau, in studio tangent metres with
// +x east and +z north. The hills are tributes placed by feel, not survey:
// Telegraph Hill under Coit Tower in the north-east, Russian Hill west of
// it, Alamo Square's rise beside the Painted Ladies, and Twin Peaks as open
// grassland in the south-west. Everything else stays level. world-layout
// eases the relief out before the coast so the shoreline never climbs.

export const sfHills = [
  // Telegraph's crest is capped into Pioneer Park's level lawn for Coit.
  { id: "telegraph", x: 58, z: 34, height: 11, sigma: 11, crest: 10 },
  { id: "russian", x: 18, z: 44, height: 8, sigma: 14 },
  { id: "alamo", x: -34, z: -29, height: 3.2, sigma: 9 },
  { id: "twin-peaks", x: -18, z: -88, height: 15, sigma: 14 },
  { id: "twin-peaks-north", x: -8, z: -76, height: 11, sigma: 11 },
];

// Level ground that must stay exactly flat: the apartment and its landing.
const flats = [{ x: 0, z: 2, radius: 12, feather: 10 }];

const smooth = (value, low, high) => {
  const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};

// A smooth minimum, so a capped crest has no crease at its rim.
function softCap(value, cap, k) {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (cap - value)) / k));
  return value * h + cap * (1 - h) - k * h * (1 - h);
}

export function sfTerrainHeight(x, z) {
  let height = 0;
  for (const hill of sfHills) {
    const dx = x - hill.x,
      dz = z - hill.z;
    const r = Math.hypot(dx, dz);
    // Gaussian relief with a compact foot, so level streets stay level.
    const rise =
      hill.height *
      Math.exp(-(r * r) / (2 * hill.sigma * hill.sigma)) *
      (1 - smooth(r, hill.sigma * 2, hill.sigma * 2.8));
    height += hill.crest ? softCap(rise, hill.crest, 0.35) : rise;
  }
  if (height < 0.001) return 0;
  for (const flat of flats)
    height *= smooth(
      Math.hypot(x - flat.x, z - flat.z),
      flat.radius,
      flat.radius + flat.feather,
    );
  return height;
}

export function sfCoastFade(coastDistance, inner) {
  return 1 - smooth(coastDistance, inner - 22, inner - 3);
}

// Surface slope (rise over run) for placing stairs instead of streets.
export function sfSlope(x, z) {
  const e = 0.5;
  return Math.hypot(
    (sfTerrainHeight(x + e, z) - sfTerrainHeight(x - e, z)) / (2 * e),
    (sfTerrainHeight(x, z + e) - sfTerrainHeight(x, z - e)) / (2 * e),
  );
}
