import test from 'node:test';
import assert from 'node:assert/strict';
import { regions } from '../app/lib/world-layout.mjs';
import { sfLots, landmarkSites } from '../app/lib/sf-plan.mjs';
import { urbanCoverage, streetAt, cityWalkRuns } from '../app/lib/sf-streets.mjs';
const studio=regions.find(r=>r.id==='studio');
test('all rendered lot corners and city walks retain the urban surface',()=>{
  for(const lot of sfLots()){
    const c=Math.cos(lot.facing),s=Math.sin(lot.facing);
    for(const dx of [-lot.width/2,lot.width/2]) for(const dz of [-lot.depth/2,lot.depth/2])
      assert.equal(urbanCoverage(lot.x+c*dx+s*dz,lot.z-s*dx+c*dz),1);
  }
  for(const run of cityWalkRuns()) for(const [x,z] of run)
    assert.equal(urbanCoverage(x,z),1,'walking route lost its ground material');
  for(const site of Object.values(landmarkSites))
    assert.equal(urbanCoverage(site.x,site.z),1,'landmark lost its urban ground');
});
test('the coastal shoulder has no phantom street grid',()=>{
  for(let a=0;a<Math.PI*2;a+=.04){
    const r=studio.inner+12;
    const x=studio.landCenter[0]+Math.cos(a)*r;
    const z=studio.landCenter[1]+Math.sin(a)*r;
    assert.equal(urbanCoverage(x,z),0);
    assert.equal(streetAt(x,z),null);
  }
});
