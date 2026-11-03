import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, DoubleSide, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { madeCampus } from '../app/lib/made-campus-data.mjs';
import { shippedModel } from './helpers/authored-model.mjs';

const {scene}=await shippedModel(madeCampus.source.split('?')[0]);
const names=['Made_GardenGroundcover','Made_GardenFlowerDrifts','Made_GardenWoodyShrubs'];
const mesh=name=>{const obj=scene.getObjectByName(name);assert(obj?.isMesh,`${name} must be rendered geometry`);return obj;};
function triangles(obj){
  const p=obj.geometry.attributes.position,idx=obj.geometry.index,result=[];
  for(let i=0;i<(idx?.count??p.count);i+=3)result.push([0,1,2].map(j=>new Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(obj.matrixWorld)));
  return result;
}
const soil=mesh('Made_GalleryGardenSoil'),ground=mesh('Made_CampusGroundTop'),plaza=mesh('Made_FilmPlazaPaving');
const area=tri=>Math.abs((tri[1].x-tri[0].x)*(tri[2].z-tri[0].z)-(tri[1].z-tri[0].z)*(tri[2].x-tri[0].x))/2;
const material=new MeshBasicMaterial({side:DoubleSide});
for(const obj of [soil,ground,plaza])obj.material=material;
const ray=new Raycaster();
function topAt(objects,x,z){ray.set(new Vector3(x,10,z),new Vector3(0,-1,0));ray.far=11;return ray.intersectObjects(objects,false);}
function penetration(a,b){
  for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
    const p=polygon[i],q=polygon[(i+1)%polygon.length],dx=q[0]-p[0],dz=q[1]-p[1],length=Math.hypot(dx,dz);if(length<1e-7)continue;
    const project=points=>points.map(v=>(-dz*v[0]+dx*v[1])/length),aa=project(a),bb=project(b);
    if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=.025)return false;
  }
  return true;
}

test('continuous beds replace ground rather than sitting on a duplicate surface',()=>{
  const soilTriangles=triangles(soil),bedArea=soilTriangles.reduce((a,t)=>a+area(t),0);
  assert(bedArea>1700&&bedArea<2000,`Full garden composition, measured in shipped mesh: ${bedArea}m²`);
  assert(Math.abs(bedArea-madeCampus.landscape.bedAreaMetres2)<1,'metadata describes actual exported bed area');
  const total=bedArea+triangles(ground).reduce((a,t)=>a+area(t),0);
  assert(Math.abs(total-7453.5)<2,`Campus top must contain exactly one continuous 7453.5m² surface: ${total}`);
  let probes=0;
  for(let x=-40.137;x<40;x+=3.01)for(let z=-34.193;z<34;z+=3.13){
    const hits=topAt([soil,ground],x,z);
    assert.equal(hits.length,1,`Campus ground hole/overlap at ${x},${z}`);
    assert(Math.abs(hits[0].point.y-madeCampus.landscape.groundDatum)<.005,'no floating bed disc');probes++;
  }
  assert(probes>500);
});

test('film plaza has real planted side pockets and a continuous usable production floor',()=>{
  for(const x of [-15.5,15.5]){
    assert.equal(topAt([plaza],x,7).length,0,'plaza slab must actually stop at planted pocket');
    assert.equal(topAt([ground],x,7).length,0,'ordinary paved campus ground must also be removed');
    assert.equal(topAt([soil],x,7).length,1,'pocket has supported planted soil');
  }
  const plazaArea=triangles(plaza).reduce((a,t)=>a+area(t),0);
  assert(plazaArea<850&&plazaArea>800,`Plaza should be sculpted below old884m² slab: ${plazaArea}`);
  for(const [x,z] of [[0,6],[4,11],[6,11],[-8,7],[13,4],[0,-5],[0,16]]){
    assert(topAt([plaza],x+.037,z+.019).length>=1,`Working film stage/crew contact lost at ${x},${z}`);
  }
});

test('groundcover, flower drifts and branched shrubs have distinct human-scale geometry',()=>{
  const heights=names.map(name=>{const b=new Box3().setFromObject(mesh(name));assert(Math.abs(b.min.y-2.21)<.025,`${name} starts at soil`);return b.max.y-2.2;});
  assert(heights[0]>.25&&heights[0]<.4,`folded low groundcover:${heights[0]}`);
  assert(heights[1]>.9&&heights[1]<1.1,`flower spikes:${heights[1]}`);
  assert(heights[2]>1.1&&heights[2]<1.45,`woody shrub branches:${heights[2]}`);
  assert.equal(scene.getObjectByName('Made_GalleryGardenLeavesFlowers').isMesh,undefined,'old repeated rosettes are not duplicated');
});

test('every rendered planted triangle clears complete paths, studio approaches, props and crew',()=>{
  const cells=new Map(),cell=4;
  function visit(poly,fn){const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++)fn(`${x},${z}`);}
  for(const polygon of madeCampus.landscape.reservations)visit(polygon,key=>{if(!cells.has(key))cells.set(key,[]);cells.get(key).push(polygon);});
  let count=0;
  for(const name of ['Made_GalleryGardenSoil',...names])for(const tri of triangles(mesh(name))){
    const poly=tri.map(p=>[p.x,p.z]),candidates=new Set();visit(poly,key=>(cells.get(key)??[]).forEach(p=>candidates.add(p)));
    for(const reserved of candidates)assert.equal(penetration(poly,reserved),false,`${name}: actual foliage/soil intrudes reserved footprint ${JSON.stringify(poly)}`);
    count++;
  }
  assert(count>120000,'test must inspect whole exported planting, not sample centres');
});

test('plaza facets stay at stone scale with restrained warm colour variation',()=>{
  const surfaces=triangles(plaza).filter(t=>area(t)>.0001);
  const longest=surfaces.map(t=>Math.max(t[0].distanceTo(t[1]),t[1].distanceTo(t[2]),t[2].distanceTo(t[0]))).sort((a,b)=>a-b);
  assert(longest.at(-1)<1.15,`No oversized edge fans: maximum stone diagonal ${longest.at(-1)}m`);
  assert(longest[Math.floor(longest.length*.95)]<1.05,'95% of surface triangles fit a one-metre stone diagonal');
  const color=plaza.geometry.attributes.color;
  for(const component of ['getX','getY','getZ']){
    const values=Array.from({length:color.count},(_,i)=>color[component](i));
    assert(Math.max(...values)-Math.min(...values)<.015,'Limestone variations must not read as a high-contrast patchwork');
  }
});
