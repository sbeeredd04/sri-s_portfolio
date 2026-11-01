import test from 'node:test';
import assert from 'node:assert/strict';
import { windDirection, windStrength, windGust, advanceWind } from '../app/lib/wind-field.mjs';

test('weather bearings blow downwind and speed is bounded even with missing data', () => {
  for(const [bearing,expected] of [[0,[0,1]],[90,[-1,0]],[180,[0,-1]],[270,[1,0]]]) {
    windDirection(bearing).forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<1e-8));
  }
  assert.equal(windStrength(0),0);
  assert.equal(windStrength(-4),0);
  assert.equal(windStrength(40),1);
  assert.ok(Number.isFinite(windStrength(NaN)));
});

test('travelling gusts stay continuous and never exceed the clearance envelope', () => {
  let changed=false;
  for(let x=-20;x<=20;x+=2) for(let z=-20;z<=20;z+=2) for(let t=0;t<12;t+=.3) {
    const g=windGust(x,z,t);
    assert.ok(g>=.199999 && g<=1.000001);
    assert.ok(Math.abs(g-windGust(x,z,t+.001))<.001);
    changed ||= Math.abs(g-windGust(x,z,t+1))>.1;
  }
  assert.ok(changed);
});

test('pause freezes wind and weather; resume is bounded and direction takes shortest arc', () => {
  const state={time:3,strength:.5,angle:-359*Math.PI/180};
  const initial={...state};
  advanceWind(state,60,14,1,false);
  assert.deepEqual(state,initial);
  advanceWind(state,60,14,1,true);
  assert.ok(state.time<=3.1);
  assert.ok(state.strength>.5 && state.strength<.55);
  assert.ok(Math.abs(state.angle-initial.angle)<.01);
  const frame={time:0,strength:0,angle:0}, slow={...frame};
  for(let i=0;i<60;i++) advanceWind(frame,1/60,4,90);
  for(let i=0;i<30;i++) advanceWind(slow,1/30,4,90);
  assert.ok(Math.abs(frame.time-slow.time)<1e-8);
  assert.ok(Math.abs(frame.strength-slow.strength)<1e-8);
  assert.ok(Math.abs(frame.angle-slow.angle)<1e-8);
});
