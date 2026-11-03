import * as THREE from "three";

// Linear-space sky palettes. Night is moonlit navy rather than black so
// buildings stay readable; each biome gets its own haze character.
const day = {
  zenith: new THREE.Color("#679bbd"),
  horizon: new THREE.Color("#bed5dd"),
  glow: new THREE.Color(1, 0.86, 0.64),
};
const dusk = {
  zenith: new THREE.Color("#8092c2"),
  horizon: new THREE.Color("#ffc18b"),
  glow: new THREE.Color(1, 0.55, 0.26),
};
const night = {
  zenith: new THREE.Color("#142541"),
  horizon: new THREE.Color("#283b58"),
  glow: new THREE.Color(0, 0, 0),
};

// Haze per biome, as optical depth at the framed subject. Density is divided
// by the shot distance so a wide establishing view and a walking view both
// keep the subject clear while their backgrounds recede. The valley is the
// haziest so its granite walls fall back; the city keeps the clearest air.
export const biomeHaze = {
  planet: 0,
  studio: 0.12,
  projects: 0.12,
  court: 0.14,
  entertainment: 0.16,
  trail: 0.16,
  future: 0.14,
};
const MIN_SHOT = 45;

export function fogDensity(world, focusDistance) {
  return (biomeHaze[world] ?? 0.28) / Math.max(MIN_SHOT, focusDistance);
}
// City light pollution warms the night horizon at home only.
const nightTint = {
  studio: new THREE.Color("#393b58"),
  trail: new THREE.Color("#263f4d"),
};

const cloudDeck = {
  zenith: new THREE.Color("#6e8397"),
  horizon: new THREE.Color("#bbcbd0"),
  glow: new THREE.Color(0.7, 0.68, 0.64),
};

// Every supported camera remains in the same inhabited atmosphere. Radial
// altitude is not a departure into space: tangent-plane island positions alone
// can exceed the old fade height, especially in portrait establishing shots.
export function starVisibility(daylight, weather) {
  const dark = 1 - THREE.MathUtils.smoothstep(daylight, 0.01, 0.42);
  const clear = 1 - THREE.MathUtils.smoothstep(weather?.cloud ?? 0, 0.25, 0.95);
  return dark * clear * (1 - (weather?.fog ?? 0)) * (1 - (weather?.rain ?? 0));
}

export function skyState({
  world,
  altitude,
  focusDistance = 100,
  daylight,
  warmth,
  sunHeight,
  weather,
}) {
  const cloud = weather?.cloud ?? 0;
  const rain = weather?.rain ?? 0;
  const mist = weather?.fog ?? 0;
  // Biome mood never invents weather: measured cloud cover controls the deck.
  const deck = cloud * cloud * 0.9;
  const opacity = 1;
  const dayAmount = THREE.MathUtils.clamp(daylight, 0, 1);
  const sunset = THREE.MathUtils.clamp(
    Math.max(warmth, 1 - THREE.MathUtils.smoothstep(sunHeight, 0.02, 0.4)) *
      dayAmount,
    0,
    1,
  );
  const lit = (key) =>
    day[key]
      .clone()
      .lerp(dusk[key], sunset * (key === "zenith" ? 0.5 : 0.8))
      .lerp(cloudDeck[key], deck)
      .multiplyScalar(key === "glow" ? 1 - cloud * 0.7 : 1 - rain * 0.35);
  const nightColor = (key) =>
    key === "horizon" && nightTint[world]
      ? nightTint[world].clone()
      : night[key].clone();
  const twilight = Math.sin(Math.PI * dayAmount) * (1 - deck * 0.8);
  const pick = (key) => nightColor(key).lerp(lit(key), dayAmount)
    .lerp(dusk[key], twilight * (key === "glow" ? 0.12 : 0.9));
  return {
    zenith: pick("zenith"),
    horizon: pick("horizon"),
    glow: pick("glow"),
    day: dayAmount,
    opacity,
    fog:
      fogDensity(world, focusDistance) *
      opacity *
      (0.75 + dayAmount * 0.25) *
      (1 + mist * 3.2 + rain * 1.1),
  };
}
