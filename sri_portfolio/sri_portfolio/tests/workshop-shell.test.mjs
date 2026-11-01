import test from 'node:test';
import assert from 'node:assert/strict';
import {NodeIO,getBounds} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {stat} from 'node:fs/promises';
import {workshops,projectWalks} from '../app/lib/project-town-layout.mjs';
import {walkingJoins} from '../app/lib/walk-network.mjs';
import {pavingCells,pavingSize} from '../app/lib/paving-layout.mjs';
test('authored workshop shell stays inside all six sites and keeps full paving clear',async()=>{
 const d=await new NodeIO().registerExtensions(ALL_EXTENSIONS).read('public/models/workshop-shell.glb');
 const b=getBounds(d.getRoot().listScenes()[0]);
 assert.ok(Math.abs(b.min[1])<.001);assert.ok(b.max[1]<3.21);
 assert.ok(b.min[0]>=-1.726 && b.max[0]<=1.726 && b.min[2]>=-1.601 && b.max[2]<=1.601);
 for(const site of workshops) for(const stone of pavingCells([...projectWalks,...walkingJoins.projects])){
  const x=stone.x-site.position[0],z=stone.z-site.position[2];
  assert.ok(Math.abs(x)>=1.726+pavingSize[0]/2 || Math.abs(z)>=1.601+pavingSize[2]/2,`${site.id} paving intersects shell`);
 }
 const primitives=d.getRoot().listMeshes().flatMap(m=>m.listPrimitives());
 const tris=primitives.reduce((n,p)=>n+p.getIndices().getCount()/3,0);
 assert.ok(tris<12000);assert.equal(d.getRoot().listMaterials().length,3);
 for(const name of ['oiled_timber','mineral_plinth']){
  const m=d.getRoot().listMaterials().find(m=>m.getName()===name);
  assert.ok(m.getBaseColorTexture() && m.getNormalTexture() && m.getMetallicRoughnessTexture());
 }
 assert.ok((await stat('public/models/workshop-shell.glb')).size<1100000);
 console.log({bounds:b,triangles:tris,bytes:(await stat('public/models/workshop-shell.glb')).size});
});
