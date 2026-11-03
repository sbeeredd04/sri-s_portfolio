import test from 'node:test';
import assert from 'node:assert/strict';
import { illumination, lightModes, resolveWorldLight } from '../app/lib/world-lighting.mjs';
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
  assert.ok(cloud.sky > clear.sky * 1.4);
  assert.ok(night.sky < cloud.sky * 0.4);
  assert.ok(night.practical > cloud.practical * 2);
});
