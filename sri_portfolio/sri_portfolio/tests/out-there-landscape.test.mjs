import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, Triangle, Ray } from 'three';
import { shippedModel } from './helpers/authored-model.mjs';
import { walkingRoutes, pathSample, pathHalfWidth } from '../app/lib/world-paths.mjs';
import { regions, WORLD_RADIUS } from '../app/lib/world-layout.mjs';
import { readFile } from 'node:fs/promises';
const {scene,animations}=await shippedModel('/models/islands/out-there-refined.glb');
const groups=new Map();
scene.traverse(mesh=>{
 if(!mesh.isMesh)return;
 let owner=mesh;while(!owner.name&&owner.parent)owner=owner.parent;
 const name=owner.name,p=mesh.geometry.attributes.position,ix=mesh.geometry.index;
 const get=i=>new Vector3().fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(mesh.matrixWorld).add(new Vector3(0,6,0)).multiplyScalar(1/1.56);
 if(!groups.has(name))groups.set(name,[]);
 for(let i=0;i<(ix?.count??p.count);i+=3)groups.get(name).push(new Triangle(get(i),get(i+1),get(i+2)));
});
test('sculpted granite is predominantly one connected formation with summit support intact',()=>{
 const rock=groups.get('rock'),parent=new Map(),weights=new Map();
 const key=p=>p.toArray().map(v=>Math.round(v*500)).join(',');
 const find=k=>{if(!parent.has(k))parent.set(k,k);if(parent.get(k)!==k)parent.set(k,find(parent.get(k)));return parent.get(k);};
 for(const t of rock){const a=find(key(t.a));for(const v of [t.b,t.c])parent.set(find(key(v)),a);}
 for(const t of rock){const k=find(key(t.a));weights.set(k,(weights.get(k)??0)+1);}
 const primary=[...weights].sort((a,b)=>b[1]-a[1])[0][0];
 for(const t of rock)if(Math.min(t.a.y,t.b.y,t.c.y)<19)assert.equal(find(key(t.a)),primary,'all cliff faces below the preserved summit must belong to one connected formation');
 const top=rock.flatMap(t=>[t.a,t.b,t.c]).filter(v=>v.y>=19);
 assert(top.length>30);assert(top.some(v=>v.y>22));
 assert(!groups.has('cliff_foot_shoulders'),'old disconnected foot shells retired');
});
test('all waterfall vertices stay in front of final granite and land in the lake',()=>{
 const rock=groups.get('rock'),seen=new Set();let probes=0,lowest=Infinity;
 for(const t of groups.get('waterfall'))for(const p of [t.a,t.b,t.c]){
  const k=p.toArray().map(v=>v.toFixed(5)).join(',');if(seen.has(k))continue;seen.add(k);
  const ray=new Ray(new Vector3(p.x,p.y,60),new Vector3(0,0,-1));
  for(const r of rock){const hit=ray.intersectTriangle(r.a,r.b,r.c,false,new Vector3());if(hit)assert(p.z-hit.z>.06,'water penetrates sculpted rock');}
  lowest=Math.min(lowest,p.y);probes++;
 }
 assert(probes>600);assert(Math.abs(lowest-3.89)<.06);assert.equal(animations.length,22);
});
test('actual bank and ledge foliage clears full authored paths and external bridge approaches',async()=>{
 const audit=JSON.parse(await readFile(new URL('../app/lib/out-there-refined-walk-profiles.json',import.meta.url)));
 const points=audit.profiles.flatMap(p=>p.points.map(s=>[...s.position,s.rawPavingHalfWidth??s.halfWidth+.3])).filter(p=>p[1]!==null);
 const region=regions.find(r=>r.id==='trail');let external=0;
 for(const route of walkingRoutes.filter(r=>r.from==='trail'||r.to==='trail')){
  const n=Math.ceil(route.length/.2);
  for(let i=0;i<=n;i++){
   const t=i/n,p=pathSample(route,t,0,.115).position,x=p.x-region.offset[0],z=p.z-region.offset[2];
   if(x< -55||x>75||z< -55||z>72)continue;
   points.push([x,p.y-WORLD_RADIUS,z,pathHalfWidth(route,t)+.15]);external++;
  }
 }
 assert(external>=603);
 const cells=new Map(),size=4;
 for(const p of points){const k=Math.floor(p[0]/size)+','+Math.floor(p[2]/size);if(!cells.has(k))cells.set(k,[]);cells.get(k).push(p);}
 let probes=0;
 for(const name of ['lake_shore_ferns','lake_shore_shrubs','ferns_cliff_ledge']){
  const triangles=groups.get(name);assert(triangles?.length>100);
  for(const t of triangles)for(const v of [t.a,t.b,t.c,t.getMidpoint(new Vector3())]){
   const cx=Math.floor(v.x/size),cz=Math.floor(v.z/size);
   for(let x=cx-2;x<=cx+2;x++)for(let z=cz-2;z<=cz+2;z++)for(const p of cells.get(x+','+z)??[])
    assert(Math.hypot(v.x-p[0],v.z-p[2])>p[3]+.12,`${name} intrudes full path width at ${v.toArray()}`);
   probes++;
  }
 }
 assert(probes>100000);
});

test('irregular planting pockets support roots on actual granite without continuous shelf bands',()=>{
 let pockets;
 scene.traverse(n=>{if(n.userData.plantingPockets)pockets=JSON.parse(n.userData.plantingPockets);});
 assert(pockets?.length>=4,'multiple localized soil pockets must exist');
 const rock=groups.get('rock');
 assert(Math.max(...pockets.map(p=>p.y))-Math.min(...pockets.map(p=>p.y))>5,'planting must occupy varied elevations');
 for(const p of pockets){
  assert(p.rootRadius>.15&&p.rootRadius<.8,'a root pocket is localized, not a full-width terrace');
  assert(pockets.filter(q=>Math.abs(q.y-p.y)<.3).length<=2,'planting cannot form one level facade row');
  for(let j=0;j<9;j++){
   const radius=j===8?0:p.rootRadius*.85, x=p.x+Math.cos(j*Math.PI/4)*radius,z=p.z+Math.sin(j*Math.PI/4)*radius;
   const ray=new Ray(new Vector3(x,p.y+4,z),new Vector3(0,-1,0));let highest=null;
   for(const t of rock){const hit=ray.intersectTriangle(t.a,t.b,t.c,false,new Vector3());if(hit&&(!highest||hit.y>highest.hit.y))highest={hit,normal:t.getNormal(new Vector3())};}
   assert(highest&&Math.abs(highest.hit.y-p.y)<.012&&highest.normal.y>.98,`unsupported root pocket at ${x},${z}`);
  }
 }
});

test('reshaped granite clears full-width enabled trails and every external approach segment',async()=>{
 const {outThereWalks}=await import('../app/lib/out-there-walk-runtime.mjs');
 const audit=JSON.parse(await readFile(new URL('../app/lib/out-there-refined-walk-profiles.json',import.meta.url)));
 const enabled=new Set(outThereWalks.map(w=>w.id));
 const routes=audit.profiles.filter(p=>enabled.has(p.id)).map(p=>p.points.map(q=>[...q.position,q.rawPavingHalfWidth]));
 for(const p of audit.profiles.filter(p=>enabled.has(p.id)))assert(p.usable,`${p.id} lost its clearance`);
 const region=regions.find(r=>r.id==='trail');
 for(const route of walkingRoutes.filter(r=>r.from==='trail'||r.to==='trail')){
  const points=[],n=Math.ceil(route.length/.2);
  for(let i=0;i<=n;i++){
   const t=i/n,p=pathSample(route,t,0,.115).position,x=p.x-region.offset[0],z=p.z-region.offset[2];
   if(x>=-55&&x<=75&&z>=-55&&z<=72)points.push([x,p.y-WORLD_RADIUS,z,pathHalfWidth(route,t)+.15]);
  }routes.push(points);
 }
 const rock=groups.get('rock').map(t=>({t,minX:Math.min(t.a.x,t.b.x,t.c.x),maxX:Math.max(t.a.x,t.b.x,t.c.x),minZ:Math.min(t.a.z,t.b.z,t.c.z),maxZ:Math.max(t.a.z,t.b.z,t.c.z)}));
 function clip(poly,outline){let result=poly;for(let i=0;i<outline.length&&result.length;i++){
  const a=outline[i],b=outline[(i+1)%outline.length],side=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]),input=result;result=[];
  for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);if(sp>=-1e-9)result.push(p);if((sp>=0)!==(sq>=0)){const t=sp/(sp-sq);result.push(p.map((v,k)=>v+(q[k]-v)*t));}}
 }return result;}
 let sections=0;
 for(const route of routes)for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<1e-7)continue;
  const nx=-dz/len,nz=dx/len,half=Math.max(a[3],b[3]);
  const outline=[[a[0]+nx*half,0,a[2]+nz*half],[a[0]-nx*half,0,a[2]-nz*half],[b[0]-nx*half,0,b[2]-nz*half],[b[0]+nx*half,0,b[2]+nz*half]];
  const minX=Math.min(...outline.map(p=>p[0])),maxX=Math.max(...outline.map(p=>p[0])),minZ=Math.min(...outline.map(p=>p[2])),maxZ=Math.max(...outline.map(p=>p[2]));
  for(const q of rock){if(q.maxX<minX||q.minX>maxX||q.maxZ<minZ||q.minZ>maxZ)continue;
   const polygon=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(!polygon.length)continue;
   const offsets=polygon.map(p=>p[1]-(a[1]+(b[1]-a[1])*((p[0]-a[0])*dx+(p[2]-a[2])*dz)/(len*len)));
   assert(!(Math.max(...offsets)>.23&&Math.min(...offsets)<2.1),`granite blocks full-width route section ${a} -> ${b}`);
  }sections++;
 }
 const expectedSections=routes.reduce((sum,r)=>sum+r.slice(1).filter((p,i)=>Math.hypot(p[0]-r[i][0],p[2]-r[i][2])>=1e-7).length,0);
 assert.equal(sections,expectedSections,'every nondegenerate route section must be audited');
 assert.equal(routes.length,outThereWalks.length+walkingRoutes.filter(r=>r.from==='trail'||r.to==='trail').length);
});
