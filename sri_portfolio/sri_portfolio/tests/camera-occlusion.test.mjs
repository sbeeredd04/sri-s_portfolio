import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Ray, Triangle } from 'three';
import { authoredModel } from './helpers/authored-model.mjs';
import { apartmentPoint, studioDeskView } from '../app/lib/studio-layout.mjs';
import { cameraCutawayAlpha, isHomeOccluder, cameraCutawayMaterial } from '../app/lib/camera-occlusion.mjs';

const { scene } = await authoredModel('home-architecture');
const shell=scene.getObjectByName('Summit_Structure');
assert(shell?.isMesh);
const triangles=[];
const g=shell.geometry,p=g.attributes.position,index=g.index;
for(let i=0;i<(index?.count??p.count);i+=3){
  const vertices=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(shell.matrixWorld));
  const triangle=new Triangle(...vertices);
  triangles.push({triangle,up:triangle.getNormal(new Vector3()).y});
}
const focus=new Vector3(...apartmentPoint(studioDeskView.target));
function hits(eye,target){
  const length=eye.distanceTo(target),ray=new Ray(eye,target.clone().sub(eye).normalize());
  return triangles.flatMap(({triangle,up})=>{
    const hit=ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,new Vector3());
    return hit && hit.distanceTo(eye)<length ? [{point:hit,up,distance:hit.distanceTo(eye)}] : [];
  }).sort((a,b)=>a.distance-b.distance);
}
test('Home rear-wall obstruction clears across the view width without fading the rest of the wall',()=>{
  const eye=new Vector3(focus.x,focus.y+.4,-33);
  for(const x of [-.45,0,.45]){
    const path=hits(eye,focus.clone().add(new Vector3(x,0,0)));
    assert(path.length>0,'the camera really encounters the shipped rear wall');
    const wall=path.find(hit=>Math.abs(hit.up)<.2);
    assert(wall,'solid vertical wall is present');
    assert(cameraCutawayAlpha(wall.point,wall.up,eye,focus)<.05);
    assert.equal(cameraCutawayAlpha(wall.point.clone().add(new Vector3(3,0,0)),wall.up,eye,focus),1);
  }
});
test('an orbit above the desk cuts the real upper floor plate, while the room floor stays opaque',()=>{
  const above=focus.clone().add(new Vector3(0,5,0));
  const ceiling=hits(above,focus).find(hit=>Math.abs(hit.up)>.9);
  assert(ceiling,'actual upper floor/ceiling intersects the orbit');
  assert(cameraCutawayAlpha(ceiling.point,ceiling.up,above,focus)<.05);
  const below=focus.clone().add(new Vector3(0,-4,0));
  const floor=hits(below,focus).find(hit=>Math.abs(hit.up)>.9);
  assert(floor,'the occupied room has an actual supporting floor');
  assert.equal(cameraCutawayAlpha(floor.point,floor.up,below,focus),1);
});
test('cutaway retains its target, camera-behind surfaces, distant overview and disabled state',()=>{
  const eye=focus.clone().add(new Vector3(0,0,-10));
  assert.equal(cameraCutawayAlpha(focus.clone().add(new Vector3(0,0,-.3)),0,eye,focus),1);
  assert.equal(cameraCutawayAlpha(eye.clone().add(new Vector3(0,0,-1)),0,eye,focus),1);
  const wall=hits(eye,focus)[0];
  assert(wall);
  assert.equal(cameraCutawayAlpha(wall.point,wall.up,eye,focus,0),1);
  assert.equal(cameraCutawayAlpha(wall.point,wall.up,focus.clone().add(new Vector3(0,0,-70)),focus),1);
});
test('only the actual Home shell receives its own hashed-depth material',()=>{
  const chosen=[];
  scene.traverse(mesh=>{if(mesh.isMesh&&isHomeOccluder(mesh.name))chosen.push(mesh);});
  assert.deepEqual(chosen.map(m=>m.name),['Summit_Structure']);
  for(const name of ['Summit_CraftAndInteriors','Summit_Glazing','Summit_PoolWater','Home_ContinuousHill','Rowhouse_01_Structure'])assert(!isHomeOccluder(name));
  const source=Array.isArray(shell.material)?shell.material[0]:shell.material;
  const original=source.alphaHash;
  const clone=cameraCutawayMaterial(source,{});
  assert.notStrictEqual(clone,source);
  assert(clone.alphaHash);assert(!clone.transparent);assert(clone.depthWrite);
  assert.equal(source.alphaHash,original);
  clone.dispose();
});
