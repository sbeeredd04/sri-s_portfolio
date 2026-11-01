import test from 'node:test';
import assert from 'node:assert/strict';
import {seaHeight,seaBands} from '../app/lib/sea-surface.mjs';
import {advanceWind} from '../app/lib/wind-field.mjs';
test('wave normals derive from a bounded rotating wind field with distant detail filtered out',()=>{
 const max=seaBands.reduce((n,b)=>n+b.amplitude,0);
 for(let x=-6;x<=6;x+=.3) for(let t=0;t<5;t+=.2){
  const h=seaHeight(x,2,t,[1,0],1);
  assert.ok(Math.abs(h)<=max);
  assert.ok(Math.abs(h-seaHeight(-2,x,t,[0,1],1))<1e-10,'rotating wind must rotate wave pattern');
  assert.equal(seaHeight(x,2,t,[1,0],1,2),0,'sub-pixel detail must disappear');
 }
});
test('water phase shares the environment pause and does not fast forward after hidden time',()=>{
 const wind={time:9,strength:.6,angle:1};
 const sample=()=>seaHeight(1,3,wind.time,[Math.sin(wind.angle),Math.cos(wind.angle)],wind.strength);
 const before=sample();advanceWind(wind,60,14,20,false);assert.equal(sample(),before);
 advanceWind(wind,60,14,20,true);assert.ok(wind.time<=9.1);assert.notEqual(sample(),before);
});
