import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Box3, Mesh, MeshBasicMaterial, Raycaster, Vector3} from 'three';
import {shippedModel} from './helpers/authored-model.mjs';
import {fieldnotesCoastSource} from '../app/lib/fieldnotes-coast-site.mjs';
import {buildFieldnotesGeometry} from '../app/lib/fieldnotes-geometry.mjs';
import {fieldnotesDeckHeight,fieldnotesPaths,fieldnotesTerraces} from '../app/lib/fieldnotes-layout.mjs';

const {scene,bytes}=await shippedModel(fieldnotesCoastSource.split('?')[0]);
const land=scene.getObjectByName('Fieldnotes_LandSurface');
const cliff=scene.getObjectByName('Fieldnotes_BluffAndWaterline');
const ray=new Raycaster();
function down(x,z,meshes=[land]){
 ray.set(new Vector3(x,30,z),new Vector3(0,-1,0));return ray.intersectObjects(meshes,false)[0]?.point;
}
function triangles(mesh){
 const p=mesh.geometry.attributes.position,idx=mesh.geometry.index, result=[];
 for(let i=0;i<(idx?.count??p.count);i+=3)result.push([0,1,2].map(j=>new Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld)));
 return result;
}
const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function clipped(subject,clip){
 let poly=subject;
 const orientation=Math.sign(cross(...clip));
 if(!orientation)return [];
 for(let i=0;i<clip.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],inside=p=>cross(a,b,p)*orientation;
  const out=[];
  for(let j=0;j<poly.length;j++){
   const p=poly[j],q=poly[(j+1)%poly.length],dp=inside(p),dq=inside(q);
   if(dp>=-1e-8)out.push(p);
   if((dp>0)!==(dq>0))out.push(p.clone().lerp(q,dp/(dp-dq)));
  }
  poly=out;if(!poly.length)break;
 }
 return poly;
}
const bounds=t=>[Math.min(...t.map(p=>p.x)),Math.max(...t.map(p=>p.x)),Math.min(...t.map(p=>p.z)),Math.max(...t.map(p=>p.z))];
const overlap=(a,b)=>a[0]<=b[1]&&a[1]>=b[0]&&a[2]<=b[3]&&a[3]>=b[2];

test('shipped headland is the versioned compact two-lobed landform',()=>{
 assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0,16),fieldnotesCoastSource.split('v=')[1]);
 const b=new Box3().setFromObject(land,true);
 assert(b.max.x-b.min.x<44,'do not return to66m meadow around5.4m studio');
 assert(b.max.z-b.min.z<34);
 assert(down(-23,13.3),'fixed pier approach remains on land');
 assert(down(-18.4,2.6),'blade promontory remains on land');
 assert(down(0,17.2),'fixed lookout retains support');
 assert.equal(down(-10,17),undefined,'water inlet separates the west promontory from garden shoulder');
 assert(b.max.y>2.6 && b.max.y<4.3,'asymmetric planted shoulders have real relief');
 // Outer rock is a connected apron meeting the actual sea plane, not a
 // transparent gap or historical spherical-height assumption.
 const rock=new Box3().setFromObject(cliff,true);
 assert(rock.min.y<-.8 && rock.max.y>2);
});

test('all raised land triangles remain below the complete rendered courtyard paving and terraces',()=>{
 const g=buildFieldnotesGeometry();
 const paved=['paving','terraces'].flatMap(name=>{
  const m=new Mesh(g[name],new MeshBasicMaterial());m.updateMatrixWorld();
  return triangles(m).filter(t=>Math.abs(cross(...t))>1e-7&&Math.max(...t.map(p=>p.y))-Math.min(...t.map(p=>p.y))<.001);
 });
 let intersections=0;
 const surfaces=triangles(land).map(t=>({t,b:bounds(t)}));
 for(const path of paved){
  const b=bounds(path),height=Math.min(...path.map(p=>p.y));
  // Ignore slab undersides: the authored low garden ground is supposed to
  // meet those. Top surfaces are the actual walk/terrace clearance contract.
  if(height<fieldnotesDeckHeight()-.025)continue;
  for(const terrain of surfaces){
   if(!overlap(b,terrain.b))continue;
   const intersection=clipped(terrain.t,path);
   if(intersection.length<3)continue;
   for(const p of intersection)assert(p.y<height-.012,`raised land enters rendered paving at${p.x},${p.y},${p.z}`);
   intersections++;
  }
 }
 assert(intersections>500,'test must inspect complete paving, not only selected paths');
 for(const [a,b,width] of fieldnotesPaths){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
  for(let i=0;i<=Math.ceil(length/.25);i++)for(const side of [-.5,-.25,0,.25,.5]){
   const t=i/Math.ceil(length/.25),p=down(a[0]+dx*t-dz/length*width*side,a[1]+dz*t+dx/length*width*side);
   assert(p&&p.y<fieldnotesDeckHeight()-.012,'entire full-width path has unobstructed land support');
  }
 }
 for(const t of fieldnotesTerraces)assert(down(t.x,t.z));
});

test('flower drifts root on decoded terrain and form genuine human-scale plants',()=>{
 const roots=JSON.parse(land.userData.plantRoots);
 assert(roots.length>600,'connected drifts need substantial planted coverage');
 for(const [x,y,z]of roots){
  const p=down(x,z);assert(p&&Math.abs(p.y-y)<.008,`floating/buried plant root at${x},${z}`);
 }
 const flowers=scene.getObjectByName('Fieldnotes_CoastalDrifts');
 const foliage=triangles(flowers);let stems=0;
 for(const t of foliage){
  const lo=Math.min(...t.map(p=>p.y)),hi=Math.max(...t.map(p=>p.y));
  if(hi-lo>.1)stems++;
 }
 assert(stems>roots.length*6,'folded leaves and rooted stems retain volume rather than a flat dotted decal');
});

test('land and granite form one welded connected surface with matching coastline seams',()=>{
 const vertices=[],parents=[],grid=new Map(),epsilon=.006;
 const find=i=>{while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;};
 const join=(a,b)=>{parents[find(a)]=find(b);};
 function welded(p){
  const cell=[p.x,p.y,p.z].map(n=>Math.floor(n/epsilon));
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
   for(const id of grid.get([cell[0]+x,cell[1]+y,cell[2]+z].join(','))??[])if(vertices[id].distanceTo(p)<epsilon)return id;
  }
  const id=vertices.length;vertices.push(p);parents.push(id);
  const key=cell.join(',');if(!grid.has(key))grid.set(key,[]);grid.get(key).push(id);return id;
 }
 for(const mesh of[land,cliff])for(const tri of triangles(mesh)){
  const [a,b,c]=tri.map(welded);join(a,b);join(b,c);
 }
 assert.equal(new Set(parents.map((_,i)=>find(i))).size,1,'no disconnected coastal slab or detached granite band');
 const outline=JSON.parse(land.userData.coastOutlineXZ),landVertices=triangles(land).flat(),rockVertices=triangles(cliff).flat();
 for(const [x,z]of outline){
  const upper=landVertices.filter(p=>Math.hypot(p.x-x,p.z-z)<.006);
  assert(upper.length,'authored dry coast vertex exists in exported land');
  assert(upper.some(p=>p.y>.005),'each coastal lip is above current local sea0');
  assert(upper.some(p=>rockVertices.some(q=>q.distanceTo(p)<.006)),'land/rock seam closes within mesh quantization');
 }
});

test('pier deck stands above live water and fixed practical props retain level support',async()=>{
 const {lanternPosts,lookout}=await import('../app/lib/fieldnotes-quarter.mjs');
 const pier=scene.getObjectByName('Fieldnotes_Pier');
 for(let z=17;z<=31.8;z+=.25){
  const p=down(-23,z,[pier]);assert(p&&p.y>=.38&&p.y<=.46,'walk deck must clear bay0 plus wave crests');
 }
 for(const[x,z]of [...lanternPosts(),[0,lookout.bench],[-2.4,lookout.bench],[-3,lookout.z],[3,lookout.z]]){
  const p=down(x,z);assert(p&&Math.abs(p.y-.015)<.008,`fixed runtime prop buried/floating at${x},${z}`);
 }
});
