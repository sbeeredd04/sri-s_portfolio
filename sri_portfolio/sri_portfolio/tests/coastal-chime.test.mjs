import test from 'node:test';
import assert from 'node:assert/strict';
import {createChimeState,stepChime,chimeAudibility,chimeAnchor,coastalChime} from '../app/lib/coastal-chime.mjs';
import {NodeIO,getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {fieldnotesPaths} from '../app/lib/fieldnotes-layout.mjs';
function run(fps,strength,direction=[1,0]){const state=createChimeState();let hits=0;for(let i=1;i<=fps*60;i++)if(stepChime(state,1/fps,i/fps,strength,direction))hits++;return {state,hits};}
test('chime contacts follow wind, stay bounded and freeze without catch-up',()=>{
 assert.equal(run(60,0).hits,0);
 assert.equal(run(60,1,[Math.cos(Math.PI/6),.5]).hits,0,"swinging through a gap must not invent a tube collision");
 const normal=run(60,.28),storm=run(60,1);
 assert.ok(normal.hits>0 && storm.hits>=normal.hits);
 assert.ok(storm.hits<92);
 for(const fps of [30,120])assert.ok(Math.abs(run(fps,.28).hits-normal.hits)<=1);
 const before={...normal.state};stepChime(normal.state,20,80,1,[0,1],false);assert.deepEqual(normal.state,before);
 stepChime(normal.state,20,60.1,1,[0,1]);assert.ok(Math.hypot(normal.state.x,normal.state.z)<=.401);
 assert.equal(chimeAudibility(24),0);assert.equal(chimeAudibility(0),1);
});
test('exported instrument hangs beneath its support and outside full walking widths',async()=>{
 const doc=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read('public/models/coastal-chime.glb');
 const b=getBounds(doc.getRoot().listScenes()[0]),p=chimeAnchor();
 assert.ok(b.max[1]<=.001 && b.min[1]>=-.73);
 assert.ok(b.max[0]<=.141 && b.min[0]>=-.141);
 for(const [a,z,w] of fieldnotesPaths){
  const dx=z[0]-a[0],dz=z[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[2]-a[1])*dz)/(dx*dx+dz*dz)));
  assert.ok(Math.hypot(p[0]-a[0]-dx*t,p[2]-a[1]-dz*t)>w/2+coastalChime.radius,'hanging instrument enters a walking corridor');
 }
 for(let i=0;i<6;i++)assert.ok(doc.getRoot().listNodes().some(n=>n.getName()===`tube_${i}`));
});
