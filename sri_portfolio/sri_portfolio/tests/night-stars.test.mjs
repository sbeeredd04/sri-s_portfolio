import test from 'node:test';
import assert from 'node:assert/strict';
import { starField } from '../app/lib/night-stars.mjs';
import { worldTime } from '../app/lib/world-time.mjs';
import { skyState } from '../app/lib/atmosphere.mjs';
import { presetWeather } from '../app/lib/weather.mjs';

test('the star field covers all viewing directions without foreground stars or a few oversized points', () => {
  const field = starField(), octants = Array(8).fill(0);
  assert.deepEqual(field, starField(), 'camera changes and remounts retain the same sky');
  let bright = 0;
  for (let i = 0; i < field.diameters.length; i++) {
    const [x,y,z] = field.positions.slice(i*3,i*3+3);
    assert(Math.abs(Math.hypot(x,y,z)-900)<1e-8, 'distant shell never crosses the near-world geometry');
    octants[(x>0?1:0)+(y>0?2:0)+(z>0?4:0)]++;
    assert(field.diameters[i] >= 1 && field.diameters[i] < 4, 'no large particle-like stars');
    if(field.diameters[i]>3)bright++;
    assert(field.colors.slice(i*3,i*3+3).every(c=>Number.isFinite(c)&&c>=0&&c<=1));
  }
  assert(octants.every(n=>n>160), 'turning to any quarter of the sky keeps a populated field');
  assert(bright>30&&bright<field.diameters.length*.15, 'bright stars are a restrained minority');
});

test('02:30 SF has a dark navy horizon with no solar glow across every island', () => {
  const solar = worldTime(new Date('2026-11-03T10:30:00Z'));
  const luminance = c=>.2126*c.r+.7152*c.g+.0722*c.b;
  for(const world of ['planet','studio','projects','court','entertainment','trail','future']) {
    const state = skyState({world,daylight:solar.daylight,warmth:solar.warmth,sunHeight:solar.direction[1],weather:presetWeather('clear')});
    const day = skyState({world,daylight:1,warmth:0,sunHeight:.7,weather:presetWeather('clear')});
    assert(luminance(state.horizon)<luminance(day.horizon)*.1, world);
    assert.equal(luminance(state.glow),0, `${world}: no morning glow in deep night`);
    assert(state.horizon.b>state.horizon.r, `${world}: night stays cool behind warm practicals`);
  }
});
