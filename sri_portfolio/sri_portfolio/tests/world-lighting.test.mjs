import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentLightIntensity, illumination, lightModes, resolveWorldLight } from '../app/lib/world-lighting.mjs';
import { presetWeather } from '../app/lib/weather.mjs';

test('every time preview preserves selected weather and the actual clock', () => {
  for (const mode of lightModes) for (const kind of ['clear','overcast','fog','rain']) {
    const weather = presetWeather(kind);
    const live = { label: '8:00 PM PST', daylight: 0.1, warmth: 0.5, direction: [1,0,0] };
    const result = resolveWorldLight(mode,live,weather);
    assert.equal(result.weather,weather);
    assert.equal(result.label,live.label);
    assert.ok(result.daylight >= 0 && result.daylight <= 1);
  }
});

test('overcast trades direct sun for diffuse fill; night keeps practical contrast', () => {
  const clear = illumination(resolveWorldLight('day', null, presetWeather('clear')));
  const cloud = illumination(resolveWorldLight('day', null, presetWeather('overcast')));
  const night = illumination(resolveWorldLight('night', null, presetWeather('overcast')));
  assert.ok(cloud.direct < clear.direct * 0.3);
  assert.ok(cloud.sky > clear.sky && cloud.sky < clear.sky * 1.3);
  assert.ok(night.sky < cloud.sky * 0.4);
  assert.ok(night.practical > cloud.practical * 2);
});

test("clouds shape diffuse and environment energy continuously while clear day and night retain their levels", () => {
  assert.equal(environmentLightIntensity(1, 0), .55);
  const clear = illumination({ daylight: 1, weather: { cloud: 0 } });
  const overcast = illumination({ daylight: 1, weather: { cloud: .92 } });
  assert.equal(clear.sky, .76);
  assert.ok(overcast.sky > .9 && overcast.sky < .94);
  assert.ok(environmentLightIntensity(1, .92) > .37 && environmentLightIntensity(1, .92) < .39);
  let previous = environmentLightIntensity(1, 0);
  for (let sample = 0; sample <= 100; sample++) {
    const cloud = sample / 100;
    assert.equal(environmentLightIntensity(0, cloud), .28);
    assert.equal(illumination({ daylight: 0, weather: { cloud } }).sky, .34);
    const intensity = environmentLightIntensity(1, cloud);
    assert.ok(intensity <= previous && previous - intensity < .005);
    previous = intensity;
  }
});
