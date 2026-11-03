import { fallbackWeather } from "./weather.mjs";

export const lightModes = ["live", "day", "dusk", "night"];

// Time previews change the sun, never the measured/selected weather or clock.
export function resolveWorldLight(mode, live, weather) {
  const presets = {
    day: { daylight: 1, direction: [-0.72, 0.56, 0.41], warmth: 0.18 },
    dusk: { daylight: 0.48, direction: [-0.91, 0.16, 0.41], warmth: 1 },
    night: { daylight: 0, direction: [0, -1, 0], warmth: 0 },
  };
  return {
    ...live,
    ...(presets[mode] || {
      daylight: live?.daylight ?? 0,
      direction: live?.direction || [0, -1, 0],
      warmth: live?.warmth || 0,
    }),
    weather: weather || fallbackWeather,
  };
}

// Cloud cover exchanges directional light for broad sky fill. Keep the floor
// low at night so amber practicals illuminate surfaces instead of disappearing
// against an equally bright blue wash. All intensities are scene-linear.
export function illumination({ daylight, weather }, interior = false) {
  const d = Math.max(0, Math.min(1, daylight));
  const cloud = weather?.cloud ?? 0;
  const rain = weather?.rain ?? 0;
  const diffuse = cloud * cloud;
  return {
    direct: (0.48 * (1 - d) + 3.1 * d * (1 - diffuse * 0.92)) *
      (interior ? 0.6 : 1),
    sky: (0.34 + d * (0.42 + diffuse * 0.55)) *
      (1 - rain * 0.18) * (interior ? 0.58 : 1),
    ambient: (0.035 + d * 0.045) * (interior ? 0.6 : 1),
    practical: Math.min(1, 0.14 + (1 - d) * 0.86 + diffuse * 0.16),
  };
}
