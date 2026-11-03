import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Box3, Triangle, Vector3, Matrix4, Quaternion } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { streetRoutes } from '../app/lib/street-view.mjs';
import { madeCampus } from '../app/lib/made-campus-data.mjs';
import { aetherSite } from '../app/lib/made-stage.mjs';
import { makeWalkNetwork, nearestWalk } from '../app/lib/walk-network.mjs';
import { worldPoint } from '../app/lib/world-layout.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
test('every rendered connecting ribbon clears the shipped islands and playing aprons, with full-width landing support', () => {
  const check = spawnSync(process.execPath,['scripts/check-authored-bay-paths.mjs','--check-only'],{cwd:root,encoding:'utf8'});
  assert.equal(check.status,0,check.stderr+'\n'+check.stdout);
  const routes = JSON.parse(check.stdout);
  assert.equal(routes.length,5);
  for(const route of routes) {
    assert.equal(route.hits.length,0,route.id);
    assert.equal(route.reserved,0,route.id);
    assert.equal(route.endpoints.length,2);
    assert(route.endpoints.every(e=>e.lanes.length===9&&e.lanes.every(l=>l.support)));
  }
});

async function triangles(url, outer = new Matrix4()) {
  const bytes = await readFile(new URL('../public'+url.split('?')[0],import.meta.url));
  await MeshoptDecoder.ready;
  const {scene} = await new Promise((yes,no)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',yes,no));
  scene.updateMatrixWorld(true);
  const result=[];
  scene.traverse(mesh=>{
    if(!mesh.isMesh || /water|glow|emissive/i.test(mesh.name))return;
    const g=mesh.geometry,p=g.attributes.position,index=g.index,matrix=outer.clone().multiply(mesh.matrixWorld);
    for(let i=0;i<(index?.count??p.count);i+=3){
      const v=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix));
      const bounds=new Box3().setFromPoints(v);
      // All visitors remain on the authored plaza level. Exclude only triangles
      // definitively below their feet or above their complete standing envelope.
      if(bounds.max.y<2.42||bounds.min.y>4.31)continue;
      result.push({name:mesh.name,triangle:new Triangle(...v),bounds});
    }
  });
  return result;
}
test('the guided Made walk stays on real circulation and clears the current studio bodies; Bay is a separate journey',async()=>{
  const aetherMatrix = new Matrix4().compose(new Vector3(...aetherSite.center),new Quaternion().setFromAxisAngle(new Vector3(0,1,0),aetherSite.yaw),new Vector3(1,1,1));
  const bodies=[...await triangles(madeCampus.source),...await triangles('/models/islands/made-aether.glb',aetherMatrix)];
  const network=makeWalkNetwork().filter(s=>s.world==='projects'&&!s.connection);
  const route=streetRoutes.projects.filter(n=>!n.group);
  assert(route.length>=6);
  let samples=0;
  for(let i=1;i<route.length;i++) {
    const a=route[i-1].point,b=route[i].point,n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15);
    for(let j=0;j<=n;j++) {
      const x=a[0]+(b[0]-a[0])*j/n,z=a[1]+(b[1]-a[1])*j/n;
      const near=nearestWalk(worldPoint('projects',[x,2.208,z]),network);
      assert(Math.sqrt(near.distance)+.3<=near.segment.half+.04,`Guided walk outside paving at${x},${z}`);
      const body=new Box3(new Vector3(x-.3,2.428,z-.3),new Vector3(x+.3,4.308,z+.3));
      for(const obstacle of bodies)if(body.intersectsBox(obstacle.bounds))assert(!body.intersectsTriangle(obstacle.triangle),`Guided walk enters ${obstacle.name} at${x},${z}`);
      samples++;
    }
  }
  assert(samples>250);
});

test('Made plaza reaches both bridge landings through joined rendered circulation',()=>{
  const network=makeWalkNetwork().filter(s=>s.world==='projects'&&!s.connection);
  const parent=network.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
  const distance=(p,s)=>{
    const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,dz=s.b.z-s.a.z;
    const t=Math.max(0,Math.min(1,((p.x-s.a.x)*dx+(p.y-s.a.y)*dy+(p.z-s.a.z)*dz)/(dx*dx+dy*dy+dz*dz)));
    return Math.hypot(p.x-s.a.x-t*dx,p.y-s.a.y-t*dy,p.z-s.a.z-t*dz);
  };
  for(let i=0;i<network.length;i++)for(let j=i+1;j<network.length;j++){
    const a=network[i],b=network[j];
    // Compare usable body-center envelopes, not the outer edges that a walker
    // cannot reach. Heights must agree: nearby stacked decks do not connect.
    if(Math.abs(a.a.y-b.a.y)>.2)continue;
    const reach=Math.max(.08,a.half-.5)+Math.max(.08,b.half-.5);
    if(Math.min(distance(a.a,b),distance(a.b,b),distance(b.a,a),distance(b.b,a))<=reach)
      parent[find(j)]=find(i);
  }
  const at=([x,z])=>network.indexOf(nearestWalk(worldPoint('projects',[x,2.208,z]),network).segment);
  const start=find(at([0,24]));
  for(const point of [[37,-38],[-44,-34],[-45.5,4]])assert.equal(find(at(point)),start,`Disconnected Made landing ${point}`);
});

test('moving vessel envelopes clear all island meshes, bridge decks, cables and support piers',()=>{
  const check=spawnSync(process.execPath,['scripts/check-authored-bay-paths.mjs','--traffic'],{cwd:root,encoding:'utf8'});
  assert.equal(check.status,0,check.stderr+'\n'+check.stdout);
  const vessels=check.stdout.trim().split('\n').map(line=>JSON.parse(line));
  assert(vessels.length>=7);
  assert(vessels.every(v=>Object.keys(v.collisions).length===0));
});
