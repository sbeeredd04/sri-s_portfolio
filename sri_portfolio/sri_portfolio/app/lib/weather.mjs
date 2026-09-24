// Live San Francisco weather as one typed world state. The route parses
// Open-Meteo into it, `?weather=` swaps in a preset, and every consumer
// (sky, clouds, light, rain, sea, grass, sound) reads only these fields.
export const WEATHER_SOURCE = {
  latitude: 37.7749,
  longitude: -122.4194,
  url: "https://api.open-meteo.com/v1/forecast",
  fields: [
    "temperature_2m",
    "weather_code",
    "cloud_cover",
    "precipitation",
    "wind_speed_10m",
    "wind_direction_10m",
    "visibility",
    "is_day",
  ],
};

export function weatherUrl() {
  const { url, latitude, longitude, fields } = WEATHER_SOURCE;
  return `${url}?latitude=${latitude}&longitude=${longitude}&current=${fields.join(",")}&wind_speed_unit=ms`;
}

const labels = {
  clear: "Clear",
  partly: "Partly cloudy",
  overcast: "Overcast",
  fog: "Fog",
  drizzle: "Drizzle",
  rain: "Rain",
  storm: "Thunderstorm",
};
export const weatherKinds = Object.keys(labels);

// Visual intensities per kind: cloud cover, rain rate and fog, 0..1.
const presets = {
  clear: { cloud: 0.05, rain: 0, fog: 0.05, wind: 2 },
  partly: { cloud: 0.45, rain: 0, fog: 0.08, wind: 4 },
  overcast: { cloud: 0.92, rain: 0, fog: 0.2, wind: 5 },
  fog: { cloud: 0.85, rain: 0, fog: 0.9, wind: 3 },
  drizzle: { cloud: 0.95, rain: 0.25, fog: 0.35, wind: 5 },
  rain: { cloud: 1, rain: 0.65, fog: 0.3, wind: 8 },
  storm: { cloud: 1, rain: 1, fog: 0.25, wind: 14 },
};

// WMO 4677 present-weather codes as Open-Meteo reports them. Snow and hail
// are rare in SF and render as rain.
export function kindFromCode(code) {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 95) return "storm";
  if ((code >= 61 && code <= 67) || (code >= 71 && code <= 86)) return "rain";
  return "partly";
}

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const number = (value, fallback, low, high) =>
  typeof value === "number" && Number.isFinite(value)
    ? clamp(value, low, high)
    : fallback;

export function presetWeather(kind, source = "override") {
  const safe = presets[kind] ? kind : "clear";
  return {
    kind: safe,
    label: labels[safe],
    ...presets[safe],
    windDirection: 290,
    temperature: null,
    source,
    observed: null,
  };
}

// Offline, rate-limited or malformed: a labelled clear sky, never a frozen one.
export const fallbackWeather = presetWeather("clear", "fallback");

// Open-Meteo `current` block -> world state. Every field is bounded so a
// hostile or broken upstream cannot push NaN or extreme values into shaders.
export function parseOpenMeteo(json) {
  const current = json?.current;
  if (!current || typeof current !== "object") return fallbackWeather;
  const code = number(current.weather_code, -1, -1, 99);
  if (code < 0) return fallbackWeather;
  const kind = kindFromCode(Math.round(code));
  const base = presets[kind];
  const cloudCover = number(current.cloud_cover, base.cloud * 100, 0, 100);
  const precipitation = number(current.precipitation, 0, 0, 50);
  const visibility = number(current.visibility, 20000, 0, 100000);
  const fogFromVisibility = 1 - clamp((visibility - 800) / 9200, 0, 1);
  return {
    kind,
    label: labels[kind],
    cloud: Math.max(cloudCover / 100, base.cloud * 0.6),
    // 4 mm/h is heavy rain; drizzle codes keep a visible minimum.
    rain: Math.max(clamp(precipitation / 4, 0, 1), base.rain * 0.6),
    fog: Math.max(fogFromVisibility, kind === "fog" ? base.fog : 0),
    wind: number(current.wind_speed_10m, base.wind, 0, 40),
    windDirection: number(current.wind_direction_10m, 290, 0, 360),
    temperature: number(current.temperature_2m, null, -30, 50),
    source: "live",
    observed:
      typeof current.time === "string" ? current.time.slice(0, 16) : null,
  };
}

// `?weather=rain` forces a preset for review; anything else keeps live data.
export function weatherOverride(search) {
  const value = new URLSearchParams(search || "").get("weather");
  return value && presets[value] ? presetWeather(value) : null;
}

export function weatherLabel(state) {
  if (!state) return "Checking the weather";
  if (state.source === "fallback") return "Weather offline · clear sky";
  const temperature =
    typeof state.temperature === "number"
      ? ` · ${Math.round(state.temperature)}°C`
      : "";
  return `${state.label}${temperature}`;
}
