import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3, Ray, Vector3, Triangle } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { homeSite } from '../app/lib/home-site.mjs';
import { apartmentPoint, studioDeskView, studioBookView, studioMonitors, studioSurfaces, studioDeskFrame, APARTMENT_YAW } from '../app/lib/studio-layout.mjs';
import { worldPoint } from '../app/lib/world-layout.mjs';

async function architectureTriangles() {
  const bytes = await readFile(new URL('../public'+homeSite.architecture.split('?')[0],import.meta.url));
  await MeshoptDecoder.ready;
  const {scene} = await new Promise((yes,no)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',yes,no));
  scene.updateMatrixWorld(true);
  const triangles=[];
  scene.traverse(mesh=>{
    // Windows transmit the view. Only solid architecture obstructs cameras.
    if(!mesh.isMesh || /glaz|water|glow/i.test(mesh.name))return;
    const g=mesh.geometry,p=g.attributes.position,index=g.index;
    for(let i=0;i<(index?.count??p.count);i+=3){
      const v=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
      const triangle=new Triangle(...v),bounds=new Box3().setFromPoints(v);
      if(bounds.max.y>29.65 && bounds.min.y<32.95)triangles.push({name:mesh.name,triangle,bounds});
    }
  });
  return triangles;
}
const architecture = await architectureTriangles();
function bodyAt(local, half=.18) {
  const p=new Vector3(...apartmentPoint(local));
  return new Box3(p.clone().addScalar(-half),p.clone().addScalar(half));
}
test('Home desk and book cameras stay inside the furnished floor and clear shipped architecture',()=>{
  for(const shot of [studioDeskView,studioDeskView.portrait,studioBookView,studioBookView.portrait]) {
    const camera=bodyAt(shot.position);
    for(const t of architecture)if(camera.intersectsBox(t.bounds))assert(!camera.intersectsTriangle(t.triangle),`Camera intersects ${t.name}`);
    const position=new Vector3(...apartmentPoint(shot.position));
    assert(position.z>-28 && position.z<-19.2,'Camera remains inside the actual north wall and front glazing');
  }
});
test('both desk cameras see the display faces with the populated bay behind them',()=>{
  for(const shot of [studioDeskView,studioDeskView.portrait]) {
    const eye=new Vector3(...apartmentPoint(shot.position));
    for(const monitor of studioMonitors) {
      const screen=new Vector3(...apartmentPoint([monitor.position[0],monitor.position[1]+.15,monitor.position[2]]));
      const normal=new Vector3(Math.sin(APARTMENT_YAW+monitor.rotation),0,Math.cos(APARTMENT_YAW+monitor.rotation));
      assert(normal.dot(eye.clone().sub(screen).normalize())>.75,'Monitor face must point toward reader');
      const direction=screen.clone().sub(eye),length=direction.length(),ray=new Ray(eye,direction.normalize());
      for(const t of architecture){const hit=ray.intersectTriangle(t.triangle.a,t.triangle.b,t.triangle.c,false,new Vector3());assert(!hit||hit.distanceTo(eye)>length-.04,`Screen blocked by ${t.name}`);}
    }
    const forward=new Vector3(...apartmentPoint(shot.target)).sub(eye).normalize();
    const made=worldPoint('projects',[0,8,0]).sub(worldPoint('studio',eye.toArray())).normalize();
    assert(forward.dot(made)>.88,'Camera looks across the bay toward the portfolio islands');
  }
});
test('rotated desk, sofa and task-chair envelopes clear actual stairs, walls and bookshelf',()=>{
  for(const [name,surface] of [...Object.entries(studioSurfaces).filter(([name])=>!['floor','rug'].includes(name)),...studioDeskFrame.map((s,i)=>['frame'+i,s])]) {
    const p=apartmentPoint([surface.position[0],surface.position[1]+.15,surface.position[2]]),h=surface.size.map(x=>x/2-.007);
    const body=new Box3(new Vector3(...p.map((x,i)=>x-h[i])),new Vector3(...p.map((x,i)=>x+h[i])));
    for(const t of architecture)if(body.intersectsBox(t.bounds))assert(!body.intersectsTriangle(t.triangle),`${name} intersects ${t.name}`);
  }
});
