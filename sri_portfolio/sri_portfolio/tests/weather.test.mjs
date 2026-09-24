import test from "node:test";
import assert from "node:assert/strict";
import {
  fallbackWeather,
  kindFromCode,
  parseOpenMeteo,
  weatherLabel,
  weatherOverride,
} from "../app/lib/weather.mjs";

test("WMO codes map to world weather kinds", () => {
  assert.equal(kindFromCode(0), "clear");
  assert.equal(kindFromCode(3), "overcast");
  assert.equal(kindFromCode(45), "fog");
  assert.equal(kindFromCode(53), "drizzle");
  assert.equal(kindFromCode(63), "rain");
  assert.equal(kindFromCode(81), "rain");
  assert.equal(kindFromCode(95), "storm");
});

test("a live Open-Meteo reply becomes a bounded state", () => {
  const state = parseOpenMeteo({
    current: {
      time: "2026-09-24T12:15",
      temperature_2m: 15.5,
      weather_code: 61,
      cloud_cover: 88,
      precipitation: 2,
      wind_speed_10m: 6,
      wind_direction_10m: 298,
      visibility: 5000,
    },
  });
  assert.equal(state.kind, "rain");
  assert.equal(state.source, "live");
  assert.equal(state.rain, 0.5);
  assert.ok(state.fog > 0.4 && state.fog < 0.6);
  assert.equal(weatherLabel(state), "Rain · 16°C");
});

test("hostile or broken replies clamp or fall back", () => {
  assert.equal(parseOpenMeteo(null), fallbackWeather);
  assert.equal(
    parseOpenMeteo({ current: { weather_code: "x" } }),
    fallbackWeather,
  );
  const wild = parseOpenMeteo({
    current: {
      weather_code: 3,
      cloud_cover: 1e9,
      precipitation: -4,
      wind_speed_10m: NaN,
    },
  });
  for (const key of ["cloud", "rain", "fog"])
    assert.ok(wild[key] >= 0 && wild[key] <= 1, key);
  assert.ok(Number.isFinite(wild.wind));
  assert.equal(weatherLabel(fallbackWeather), "Weather offline · clear sky");
});

test("the review override accepts only known presets", () => {
  assert.equal(weatherOverride("?weather=storm").kind, "storm");
  assert.equal(weatherOverride("?weather=<script>"), null);
  assert.equal(weatherOverride(""), null);
});
