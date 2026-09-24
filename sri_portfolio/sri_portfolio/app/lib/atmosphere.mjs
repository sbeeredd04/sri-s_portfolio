import * as THREE from "three";

// Linear-space sky palettes. Night is moonlit navy rather than black so
// buildings stay readable; each biome gets its own haze character.
const day = {
  zenith: new THREE.Color(0.09, 0.25, 0.62),
  horizon: new THREE.Color(0.6, 0.72, 0.86),
  glow: new THREE.Color(1, 0.86, 0.64),
};
const dusk = {
  zenith: new THREE.Color(0.12, 0.14, 0.34),
  horizon: new THREE.Color(0.95, 0.52, 0.3),
  glow: new THREE.Color(1, 0.55, 0.26),
};
const night = {
  zenith: new THREE.Color(0.003, 0.006, 0.018),
  horizon: new THREE.Color(0.035, 0.05, 0.09),
  glow: new THREE.Color(0.12, 0.16, 0.26),
};

// Haze per biome, as optical depth at the framed subject. Density is divided
// by the shot distance so a wide establishing view and a walking view both
// keep the subject clear while their backgrounds recede. The valley is the
// haziest so its granite walls fall back; the city keeps the clearest air.
export const biomeHaze = {
  planet: 0,
  studio: 0.17,
  projects: 0.17,
  court: 0.22,
  entertainment: 0.24,
  trail: 0.27,
  future: 0.24,
};
const MIN_SHOT = 45;

export function fogDensity(world, focusDistance) {
  return (biomeHaze[world] ?? 0.28) / Math.max(MIN_SHOT, focusDistance);
}
// City light pollution warms the night horizon at home only.
const nightTint = {
  studio: new THREE.Color(0.07, 0.06, 0.08),
  trail: new THREE.Color(0.025, 0.045, 0.06),
};

// Share of the day sky replaced by marine-layer grey: the city is overcast.
export const overcast = { studio: 0.62 };
const cloudDeck = {
  zenith: new THREE.Color(0.34, 0.37, 0.41),
  horizon: new THREE.Color(0.58, 0.6, 0.62),
  glow: new THREE.Color(0.7, 0.68, 0.64),
};

// The sky fades in as the camera descends toward the surface; from orbit the
// planet is seen against space, near the ground it has an atmosphere.
export const SKY_FADE = [70, 150];

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
  // The city keeps some marine layer even on a clear day; live cover adds
  // to it everywhere.
  const deck = Math.max((overcast[world] || 0) * 0.6, cloud * cloud * 0.9);
  const opacity =
    world === "planet"
      ? 0
      : 1 - THREE.MathUtils.smoothstep(altitude, SKY_FADE[0], SKY_FADE[1]);
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
  const pick = (key) => nightColor(key).lerp(lit(key), dayAmount);
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
