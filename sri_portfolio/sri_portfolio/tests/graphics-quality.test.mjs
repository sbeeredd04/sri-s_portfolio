import test from 'node:test';
import assert from 'node:assert/strict';
import { graphicsMode, graphicsModes, qualityLevel, declineQuality, requestedTier } from '../app/lib/graphics-quality.mjs';
import { dprSteps } from '../app/lib/device-tier.mjs';

test('graphics preferences validate URL/storage values and retain all four choices',()=>{
  assert.deepEqual(graphicsModes,['auto','low','medium','high']);
  for(const value of ['high','medium','low','auto'])assert.equal(graphicsMode(value),value);
  for(const value of [null,undefined,'ultra','HIGH',''])assert.equal(graphicsMode(value),'auto');
});
test('manual quality keeps both effects tier and pixel budget under sustained pressure',()=>{
  for(const preference of ['low','medium','high']){
    const initial=qualityLevel(null,preference,'low');
    let current=initial;
    for(let i=0;i<30;i++)current=declineQuality(current,3);
    assert.strictEqual(current,initial);
    assert.equal(current.tier,preference);
    assert.equal(current.step,0);
    assert.equal(requestedTier(preference,'low'),preference);
  }
});
test('Auto reduces pixel budget before effects, then bottoms out safely',()=>{
  let level=qualityLevel(null,'auto','high');
  level=declineQuality(level,2);
  assert.equal(level.tier,'high');assert.equal(level.step,1);
  level=declineQuality(level,2);
  assert.equal(level.tier,'high');assert.equal(level.step,dprSteps('high',2).length-1);
  level=declineQuality(level,2);
  assert.equal(level.tier,'medium');assert.equal(level.step,0);
  for(let i=0;i<20;i++)level=declineQuality(level,2);
  assert.equal(level.tier,'low');assert.equal(level.step,0);
});
test('switching a manual setting resets quality, and Auto returns to the device ceiling',()=>{
  let level=qualityLevel(null,'auto','medium');
  for(let i=0;i<10;i++)level=declineQuality(level,2);
  assert.equal(level.tier,'low');
  level=qualityLevel(level,'high','medium');
  assert.equal(level.tier,'high');assert.equal(level.step,0);
  level=qualityLevel(level,'auto','medium');
  assert.equal(level.tier,'medium');assert.equal(level.step,0);
  assert.strictEqual(qualityLevel(level,'auto','medium'),level);
  level=qualityLevel(level,'auto','low');
  assert.equal(level.tier,'low');
});
