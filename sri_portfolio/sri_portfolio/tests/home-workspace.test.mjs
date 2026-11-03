import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3, PerspectiveCamera, Ray, Vector3, Triangle } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { madeCampus } from '../app/lib/made-campus-data.mjs';
import { homeSite } from '../app/lib/home-site.mjs';
import { apartmentPoint, studioDeskView, studioBookView, studioMonitors, studioSurfaces, studioDeskFrame, studioInteriorOrbit, studioMonitorScale, APARTMENT_YAW } from '../app/lib/studio-layout.mjs';
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
      if(mesh.name.startsWith("Summit_"))triangles.push({name:mesh.name,triangle,bounds});
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

test('phone desk keeps the full displays readable and sees Made over the actual balcony rail', () => {
  const shot = studioDeskView.portrait;
  assert.ok(shot.position[1] <= studioInteriorOrbit.maxHeight);
  const width = 390, height = 844;
  const eye = new Vector3(...apartmentPoint(shot.position));
  const camera = new PerspectiveCamera(shot.fov, width / height, 0.22, 1000);
  camera.position.copy(eye);
  camera.lookAt(...apartmentPoint(shot.target));
  camera.setViewOffset(width, height, 0, -height * 0.025, width, height);
  camera.updateMatrixWorld(true);

  function assertClear(point, label) {
    const toward = point.clone().sub(eye), distance = toward.length();
    const ray = new Ray(eye, toward.normalize());
    const intersection = new Vector3();
    for (const { name, triangle, bounds } of architecture) {
      if (!ray.intersectsBox(bounds)) continue;
      const hit = ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, intersection);
      assert.ok(!hit || hit.distanceTo(eye) >= distance, `${label} blocked by ${name} at ${intersection.toArray()}`);
    }
    const projected = point.clone().project(camera);
    const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
    assert.ok(x > 4 && x < width - 4 && y > 185 && y < 655,
      `${label} leaves the unobscured phone viewport at ${x.toFixed(1)}, ${y.toFixed(1)}`);
  }

  for (const [i, monitor] of studioMonitors.entries()) {
    // DeskHardware's display face is 1.457 × .91 model units, z=.028,
    // mounted in the Workspace group .15m above the apartment origin.
    for (const x of [-1.457 / 2, 1.457 / 2]) for (const y of [-0.91 / 2, 0.91 / 2]) {
      const corner = new Vector3(x, y, 0.028).multiplyScalar(studioMonitorScale);
      corner.applyAxisAngle(new Vector3(0, 1, 0), monitor.rotation);
      corner.add(new Vector3(...monitor.position));
      corner.y += 0.15;
      assertClear(new Vector3(...apartmentPoint(corner.toArray())), `monitor ${i + 1} corner`);
    }
  }

  const homeOrigin = worldPoint('studio', [0, 0, 0]);
  const made = (local) => worldPoint('projects', local).sub(homeOrigin);
  assertClear(made(madeCampus.anchors.Made_TowerBeaconAnchor), 'Made tower');
  assertClear(made([0, 2, 0]), 'Made plaza');
  assertClear(made([0, 2.2, 20]), 'Made promenade over the balcony rail');
});
