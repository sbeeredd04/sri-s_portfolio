import test from 'node:test';
import assert from 'node:assert/strict';
import { Mesh, MeshBasicMaterial, DoubleSide, Raycaster, Vector3 } from 'three';
import { buildFieldnotesGeometry, disposeFieldnotes } from '../app/lib/fieldnotes-geometry.mjs';
import { fieldnotesSheltered } from '../app/lib/fieldnotes-shelter.mjs';
import { fieldnotesDesk, fieldnotesCanopy as roof } from '../app/lib/fieldnotes-layout.mjs';

test('rain shelter agrees with the rendered roof and walls for vertical and wind-driven drops', () => {
 const built=buildFieldnotesGeometry(), material=new MeshBasicMaterial({side:DoubleSide});
 const meshes=[built.timber,built.stone].map(g=>new Mesh(g,material));
 meshes.forEach(m=>m.updateMatrixWorld());
 let samples=0;
 for(const fall of [[0,-1,0],[.45,-1,.2],[-.4,-1,-.3]])
  for(let x=-5.1;x<.9;x+=.4) for(let z=1.1;z<5.5;z+=.4) for(const y of [.3,1.2,3.18]) {
   const origin=new Vector3(x,y,z), direction=new Vector3(...fall).negate().normalize();
   const hit=new Raycaster(origin,direction,.001,20).intersectObjects(meshes)[0];
   assert.equal(fieldnotesSheltered([x,y,z],fall),Boolean(hit),`${x},${y},${z} fall ${fall}`);
   samples++;
  }
 assert.ok(samples>1000);
 material.dispose();disposeFieldnotes(built);
});

test('the full desk is dry under vertical rain while the open garden remains exposed', () => {
 for(let x=fieldnotesDesk.x-fieldnotesDesk.hx;x<=fieldnotesDesk.x+fieldnotesDesk.hx;x+=.04)
  for(let z=fieldnotesDesk.z-fieldnotesDesk.hz;z<=fieldnotesDesk.z+fieldnotesDesk.hz;z+=.04)
   assert.ok(fieldnotesSheltered([x,fieldnotesDesk.top,z],[0,-1,0]));
 assert.ok(!fieldnotesSheltered([0,1,0],[0,-1,0]));
 assert.ok(!fieldnotesSheltered([(roof.x0+roof.x1)/2,4,3],[0,-1,0]));
});
