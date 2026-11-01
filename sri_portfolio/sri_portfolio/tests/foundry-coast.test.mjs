import test from 'node:test';
import assert from 'node:assert/strict';
import { foundryCoastEdges } from '../app/lib/foundry-coast.mjs';
import { regions, surfaceHeight, WORLD_RADIUS } from '../app/lib/world-layout.mjs';
import { projectWalks, workshops, projectGallerySites } from '../app/lib/project-town-layout.mjs';
import { pavingCells, pavingSize } from '../app/lib/paving-layout.mjs';
import { buildTechDistrict } from '../app/lib/tech-buildings.mjs';
import { venueBounds } from '../app/lib/amphitheatre.mjs';
const r=regions.find(r=>r.id==='projects');
function check(x,z,label){
 const dx=x-r.landCenter[0],dz=z-r.landCenter[1];
 const [edge]=foundryCoastEdges(dx,dz,r.inner,r.outer);
 const distance=Math.hypot(dx,dz);
 if(distance<r.inner){
   assert.ok(distance<edge,`${label} enters new coastal slope at ${x},${z}`);
   assert.ok(Math.abs(surfaceHeight('projects',x,z))<.015,`${label} loses level ground`);
 } else {
   // The far east venue already extends onto the old shoulder. This change
   // must preserve that foundation, not misrepresent it as originally level.
   assert.deepEqual(foundryCoastEdges(dx,dz,r.inner,r.outer),[r.inner,r.outer],`${label} existing shoulder changed`);
 }
}
function rect(x,z,hx,hz,label){for(let i=0;i<=12;i++) for(const side of [-1,1]){
 check(x-hx+2*hx*i/12,z+side*hz,label);check(x+side*hx,z-hz+2*hz*i/12,label);
}}
test('new Foundry coast preserves complete paving and retained building footprints',()=>{
 for(const c of pavingCells(projectWalks)) rect(c.x,c.z,pavingSize[0]/2,pavingSize[2]/2,'paving');
 for(const w of workshops) rect(w.position[0],w.position[2],1.95,1.95,w.id);
 for(const [id,s] of Object.entries(projectGallerySites)) rect(s.position[0],s.position[2],s.width/2,s.depth/2,id);
 const b=venueBounds;rect((b.x0+b.x1)/2,(b.z0+b.z1)/2,(b.x1-b.x0)/2,(b.z1-b.z0)/2,'venue');
 const built=buildTechDistrict();
 for(const g of Object.values(built)){const p=g.attributes.position;for(let i=0;i<p.count;i++) check(p.getX(i),p.getZ(i),'district geometry');g.dispose();}
});
test('unused northwest shoulder meets ocean while north bridge envelope stays unchanged',()=>{
 for(let z=-180;z<0;z+=2) for(const x of [0,10,25]) assert.deepEqual(foundryCoastEdges(x,z,r.inner,r.outer),[r.inner,r.outer]);
 const x=r.landCenter[0]-75,z=r.landCenter[1]-75;
 const ocean=Math.sqrt(WORLD_RADIUS**2-x*x-z*z)-WORLD_RADIUS;
 assert.ok(Math.abs(surfaceHeight('projects',x,z)-ocean)<.01);
});
