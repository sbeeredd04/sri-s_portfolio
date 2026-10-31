import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldnotesCoastEdges } from '../app/lib/fieldnotes-coast.mjs';
import { regions, surfaceHeight } from '../app/lib/world-layout.mjs';
import { fieldnotesPaths } from '../app/lib/fieldnotes-layout.mjs';
const region=regions.find(r=>r.id==='future');
test('the headland keeps every garden path and its full width on the clearing',()=>{
  for(const [a,b,width] of fieldnotesPaths){
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const nx=-(b[1]-a[1])/length, nz=(b[0]-a[0])/length;
    for(let t=0;t<=1;t+=.025) for(const side of [-1,0,1]){
      const x=a[0]+(b[0]-a[0])*t+nx*width*.5*side;
      const z=a[1]+(b[1]-a[1])*t+nz*width*.5*side;
      const [inner]=fieldnotesCoastEdges(x,z,region.inner,region.outer);
      assert.ok(Math.hypot(x,z)<inner,'paving enters the new coastal slope');
    }
  }
});
test('southern bridge shoulder is preserved and northern land meets the sea before the beacon',()=>{
  for(let z=-55;z<-1;z+=1)
    assert.deepEqual(fieldnotesCoastEdges(0,z,region.inner,region.outer),[region.inner,region.outer]);
  for(let x=-12;x<=12;x+=1){
    const radius=450;
    const ocean=Math.sqrt(radius*radius-x*x-35*35)-radius;
    assert.ok(Math.abs(surfaceHeight('future',x,35)-ocean)<.01,'headland extends into sea channel');
  }
});
