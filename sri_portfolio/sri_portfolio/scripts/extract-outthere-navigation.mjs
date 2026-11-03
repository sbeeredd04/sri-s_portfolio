// Read-only geometric audit of supplied p11. Does not modify Blender or GLB.
// node scripts/extract-outthere-navigation.mjs [--inspect]
import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Vector3, Matrix4, Triangle, Box3, PerspectiveCamera } from 'three';
import { campsite } from '../app/lib/valley-layout.mjs';
import { campTent, campers } from '../app/lib/trail-life.mjs';

const app = fileURLToPath(new URL('../', import.meta.url));
const sourceFile = app + 'asset-src/authored/out-there/poly_dome11.blend';
const glbFile = app + 'public/models/islands/out-there-p11.glb';
const outFile = app + 'asset-src/authored/out-there/navigation-candidate.json';
if(process.argv.includes('--official-only')){
 await reconcileOfficial();
 await new Promise(resolve=>process.stdout.write('',resolve));
 process.exit(0);
}
const py = String.raw`
import bpy,json
from mathutils import Vector
bpy.context.scene.frame_set(1)
out={}
for name in ['bridges_paths_p8','dock_boats','lookout_vc','cable_station']:
 o=bpy.data.objects[name]; m=o.data; parent=list(range(len(m.vertices)))
 def find(i):
  while parent[i]!=i:
   parent[i]=parent[parent[i]]; i=parent[i]
  return i
 for p in m.polygons:
  a=find(p.vertices[0])
  for v in p.vertices[1:]: parent[find(v)]=a
 groups={}
 for p in m.polygons: groups.setdefault(find(p.vertices[0]),[]).append(p)
 ca=m.color_attributes.active_color
 parts=[]
 for polys in groups.values():
  ids=set(v for p in polys for v in p.vertices)
  ps=[o.matrix_world@m.vertices[i].co for i in ids]
  lo=[min(v[k] for v in ps) for k in range(3)]; hi=[max(v[k] for v in ps) for k in range(3)]
  tops=[]
  for p in polys:
   n=(o.matrix_world.to_3x3().inverted().transposed()@p.normal).normalized()
   if n.z>.707:
    vs=[list(o.matrix_world@m.vertices[i].co) for i in p.vertices]
    tops.append(dict(face=p.index,vertices=vs,normal=list(n),color=list(ca.data[p.loop_start].color[:3]) if ca else []))
  parts.append(dict(firstFace=min(p.index for p in polys),faces=len(polys),bounds=[lo,hi],tops=tops))
 out[name]=dict(vertices=len(m.vertices),faces=len(m.polygons),matrixWorld=[list(r) for r in o.matrix_world],parts=parts)
print('P11_SOURCE_JSON='+json.dumps(out,separators=(',',':')))
`;
const before = createHash('sha256').update(await readFile(sourceFile)).digest('hex');
if(before!=='6cdc050a69edf314711dab05980bba81bb2dca26143d4ebe46e81c2e5ac2090c')throw Error('Reviewed p11 source hash changed; re-review component classifications');
const proc = spawnSync('blender', ['-b','--disable-autoexec',sourceFile,'--python-expr',py], {encoding:'utf8',maxBuffer:40*1024*1024});
if(proc.status!==0) throw Error(proc.stderr || proc.stdout);
const raw = JSON.parse(proc.stdout.split('\n').find(l=>l.startsWith('P11_SOURCE_JSON=')).slice(16));
const after = createHash('sha256').update(await readFile(sourceFile)).digest('hex');
if(before!==after) throw Error('Supplied source changed');
const s=1.56;
const frame=([x,y,z])=>[x/s,(z+6)/s,-y/s];
const round=v=>Array.isArray(v)?v.map(round):typeof v==='number'?+v.toFixed(5):v;
const area=vs=>vs.slice(2).reduce((sum,p,i)=>sum+new Triangle(new Vector3(...vs[0]),new Vector3(...vs[i+1]),new Vector3(...p)).getArea(),0);
const sourceParts=Object.fromEntries(Object.entries(raw).map(([name,o])=>[name,o.parts.map(p=>({
 ...p,bounds:[frame([p.bounds[0][0],p.bounds[1][1],p.bounds[0][2]]),frame([p.bounds[1][0],p.bounds[0][1],p.bounds[1][2]])],
 tops:p.tops.map(t=>({...t,vertices:t.vertices.map(frame),slopeDegrees:Math.acos(t.normal[2])*180/Math.PI,area:area(t.vertices)/s**2})),
}))]));
if(process.argv.includes('--inspect')) {
 for(const [name,parts] of Object.entries(sourceParts)) {
  if(process.env.OBJECT && process.env.OBJECT!==name) continue;
  const useful=parts.filter(p=>p.tops.some(t=>t.area>.15));
  console.log(name,parts.length,'parts',useful.length,'with broad tops');
  console.log(JSON.stringify(useful.filter(p=>p.firstFace>=+(process.env.FROM??0)&&p.firstFace<=+(process.env.TO??Infinity)).map(p=>({id:p.firstFace,n:p.faces,b:round(p.bounds),top:p.tops.map(t=>({f:t.face,a:round(t.area),color:round(t.color),slope:round(t.slopeDegrees)}))})),null,0));
 }
 await new Promise(resolve=>process.stdout.write('',resolve));
 process.exit(0);
}

await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(glbFile);
const nodes=doc.getRoot().listNodes().filter(n=>n.getMesh());
const meshes=new Map();
for(const n of nodes) {
 const mat=new Matrix4().fromArray(n.getWorldMatrix());
 const tris=[];
 for(const [pi,p] of n.getMesh().listPrimitives().entries()) {
  const pos=p.getAttribute('POSITION'),ind=p.getIndices();
  const get=i=>new Vector3().fromArray(pos.getElement(ind?ind.getScalar(i):i,[])).applyMatrix4(mat).add(new Vector3(0,6,0)).multiplyScalar(1/s);
  for(let i=0;i<(ind?.getCount()??pos.getCount());i+=3) {
   const t=new Triangle(get(i),get(i+1),get(i+2)),normal=t.getNormal(new Vector3()),box=new Box3().setFromPoints([t.a,t.b,t.c]);
   tris.push({t,normal,box,primitive:pi,index:i/3,name:n.getName()});
  }
 }
 meshes.set(n.getName(),tris);
}

// Analysis is appended below; source face ids are retained alongside exported triangles.
const distanceXZ=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const pointIn=(p,vs)=>{
 let inside=false;
 for(let i=0,j=vs.length-1;i<vs.length;j=i++) {
  const a=vs[i],b=vs[j];
  if((a[2]>p[2])!==(b[2]>p[2])&&p[0]<(b[0]-a[0])*(p[2]-a[2])/(b[2]-a[2])+a[0]) inside=!inside;
 }
 return inside;
};
const segmentPoint=(p,a,b)=>{
 const d=[b[0]-a[0],b[2]-a[2]],k=Math.max(0,Math.min(1,((p[0]-a[0])*d[0]+(p[2]-a[2])*d[1])/(d[0]**2+d[1]**2||1)));
 return a.map((v,i)=>v+(b[i]-v)*k);
};
const hull=vs=>{
 const ps=[...new Map(vs.map(p=>[p.map(x=>x.toFixed(5)).join(','),p])).values()].sort((a,b)=>a[0]-b[0]||a[2]-b[2]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]);
 const lower=[],upper=[];
 for(const p of ps){while(lower.length>=2&&cross(lower.at(-2),lower.at(-1),p)<=1e-7)lower.pop();lower.push(p);}
 for(const p of ps.toReversed()){while(upper.length>=2&&cross(upper.at(-2),upper.at(-1),p)<=1e-7)upper.pop();upper.push(p);}
 return lower.slice(0,-1).concat(upper.slice(0,-1));
};
const projectedArea=vs=>Math.abs(vs.reduce((a,p,i)=>a+p[0]*vs[(i+1)%vs.length][2]-p[2]*vs[(i+1)%vs.length][0],0))/2;
function closestPolygons(a,b) {
 let best={gap:Infinity,a:null,b:null};
 for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){
  const p=a[i],q=a[(i+1)%a.length],r=b[j],s=b[(j+1)%b.length];
  const dx=q[0]-p[0],dz=q[2]-p[2],ex=s[0]-r[0],ez=s[2]-r[2],den=dx*ez-dz*ex;
  if(Math.abs(den)<1e-9)continue;
  const t=((r[0]-p[0])*ez-(r[2]-p[2])*ex)/den,u=((r[0]-p[0])*dz-(r[2]-p[2])*dx)/den;
  if(t>=0&&t<=1&&u>=0&&u<=1)return {gap:0,a:p.map((v,k)=>v+(q[k]-v)*t),b:r.map((v,k)=>v+(s[k]-v)*u)};
 }
 for(const [vs,other,flip] of [[a,b,false],[b,a,true]]) for(const p of vs) {
  if(pointIn(p,other)) {
   const t=new Triangle(...other.slice(0,3).map(v=>new Vector3(...v))),n=t.getNormal(new Vector3());
   const q=[p[0],other[0][1]-(n.x*(p[0]-other[0][0])+n.z*(p[2]-other[0][2]))/n.y,p[2]];
   return {gap:0,a:flip?q:p,b:flip?p:q};
  }
  for(let i=0;i<other.length;i++) {
   const q=segmentPoint(p,other[i],other[(i+1)%other.length]),gap=distanceXZ(p,q);
   if(gap<best.gap)best={gap,a:flip?q:p,b:flip?p:q};
  }
 }
 return best;
}
// Reviewed source signatures are deliberately narrower than "all horizontal faces".
// Thick timber paving slabs are 1.2 Blender units deep; dark side curbs are rejected.
// Thin board ranges were inspected independently: lake dock and two bridge decks.
const classifications=[];
for(const name of ['bridges_paths_p8','dock_boats']) for(const p of sourceParts[name]) {
 for(const t of p.tops) {
  const height=p.bounds[1][1]-p.bounds[0][1],id=p.firstFace;
  let kind=null;
  if(Math.abs(height-1.2/s)<.002&&t.slopeDegrees<.1&&t.color[0]>.25&&t.area>.3)kind='timber_paving_slab';
  if(name==='bridges_paths_p8'&&id>=2904&&id<2964&&t.color[0]>.25)kind='upper_stream_bridge_board';
  if(name==='bridges_paths_p8'&&id>=3134&&id<=3494&&t.color[0]>.25&&t.area>1)kind='sea_bridge_board';
  if(name==='bridges_paths_p8'&&id===4664)kind='sea_bridge_landing';
  if(name==='dock_boats'&&id<306&&t.area>.3)kind='lake_dock_board';
  if(name==='dock_boats'&&id>=800&&id<8910&&p.faces===150&&t.slopeDegrees<6&&t.area>.3)kind='wide_trail_board_patch';
  // The actual summit doorstep (not the furniture/roof above it).
  if(name==='dock_boats'&&id===12310)kind='lookout_doorstep';
  if(name==='dock_boats'&&id>=12106&&id<=12280&&t.slopeDegrees<.1&&Math.abs(height-.18/s)<.002&&t.area>.4&&t.area<.5)kind='lookout_stair_tread';
  if(kind)classifications.push({name,part:id,face:t.face,kind,source:t});
 }
}
const polygons=[],unmatched=[];
let maxMatchError=0;
for(const c of classifications){c.matched=[];c.box=new Box3().setFromPoints(c.source.vertices.map(v=>new Vector3(...v))).expandByScalar(.02);c.tris=c.source.vertices.slice(2).map((v,i)=>new Triangle(...[c.source.vertices[0],c.source.vertices[i+1],v].map(p=>new Vector3(...p))));}
for(const name of ['bridges_paths_p8','dock_boats'])for(const q of meshes.get(name)??[]){
 if(q.normal.y<.7)continue;let best=null,error=.02;const centre=q.t.getMidpoint(new Vector3());
 for(const c of classifications.filter(c=>c.name===name)){
  if(!c.box.containsPoint(centre))continue;
  const e=Math.max(...[q.t.a,q.t.b,q.t.c].map(v=>Math.min(...c.tris.map(t=>t.closestPointToPoint(v,new Vector3()).distanceTo(v)))));
  if(e<error){best=c;error=e;}
 }
 if(best){best.matched.push(q);maxMatchError=Math.max(maxMatchError,error);}
}
for(const c of classifications) {
 const matched=c.matched;
 if(!matched.length){unmatched.push({name:c.name,face:c.face});continue;}
 const vs=hull(matched.flatMap(q=>[q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()]));
 const summed=matched.reduce((a,q)=>a+q.t.getArea()*q.normal.y,0),hullArea=projectedArea(vs);
 if(Math.abs(summed-hullArea)>.035){unmatched.push({name:c.name,face:c.face,reason:'Non-convex/overlapping reconstruction; not promoted to support polygon'});continue;}
 const centre=vs.reduce((a,v)=>a.map((x,i)=>x+v[i]/vs.length),[0,0,0]);
 polygons.push({id:`${c.name}:${c.face}`,sourcePartFirstFace:c.part,kind:c.kind,vertices:round(vs),sourceVertices:round(c.source.vertices),
  exportedTriangles:matched.map(t=>[t.primitive,t.index]),area:round(hullArea),slopeDegrees:round(Math.max(...matched.map(t=>Math.acos(t.normal.y)*180/Math.PI))),centre:round(centre)});
}
const edges=[],nearGaps=[];
for(let i=0;i<polygons.length;i++)for(let j=i+1;j<polygons.length;j++){
 const a=polygons[i],b=polygons[j];
 if(distanceXZ(a.centre,b.centre)>12)continue;
 const closest=closestPolygons(a.vertices,b.vertices),step=Math.abs(closest.a[1]-closest.b[1]);
 if(closest.gap>.8||step>2)continue;
 const record={a:a.id,b:b.id,gap:round(closest.gap),stepHeight:round(step),from:round(closest.a),to:round(closest.b)};
 if(closest.gap<=.03&&step<=.22)edges.push(record);else nearGaps.push(record);
}
const parents=polygons.map((_,i)=>i),find=i=>parents[i]===i?i:(parents[i]=find(parents[i]));
const indexById=new Map(polygons.map((p,i)=>[p.id,i]));
for(const e of edges)parents[find(indexById.get(e.a))]=find(indexById.get(e.b));
const components=new Map();
polygons.forEach((p,i)=>{const id=find(i);if(!components.has(id))components.set(id,[]);components.get(id).push(p);});
const componentData=[...components.values()].map((ps,i)=>{
 const box=new Box3().setFromPoints(ps.flatMap(p=>p.vertices.map(v=>new Vector3(...v))));
 return {id:i,polygonIds:ps.map(p=>p.id),area:round(ps.reduce((s,p)=>s+p.area,0)),bounds:round([box.min.toArray(),box.max.toArray()])};
}).sort((a,b)=>b.area-a.area);
const componentByPolygon=new Map(componentData.flatMap(c=>c.polygonIds.map(p=>[p,c.id])));
const disconnectedNearest=[];
for(let i=0;i<componentData.length;i++)for(let j=i+1;j<componentData.length;j++) {
 const aa=componentData[i],bb=componentData[j];let best=null;
 for(const ai of aa.polygonIds)for(const bi of bb.polygonIds){
  const a=polygons[indexById.get(ai)],b=polygons[indexById.get(bi)],q=closestPolygons(a.vertices,b.vertices),step=Math.abs(q.a[1]-q.b[1]);
  const cost=Math.hypot(q.gap,step);
  if(!best||cost<best.cost)best={componentA:aa.id,componentB:bb.id,a:ai,b:bi,gap:round(q.gap),stepHeight:round(step),from:round(q.a),to:round(q.b),cost};
 }
 if(best.gap<2||i<5&&j<5){delete best.cost;disconnectedNearest.push(best);}
}
// Broad-phase spatial index followed by actual triangle tests, never AABB height alone.
class Spatial {
 constructor(tris,size=4){this.size=size;this.cells=new Map();for(const q of tris)for(let x=Math.floor(q.box.min.x/size);x<=Math.floor(q.box.max.x/size);x++)for(let z=Math.floor(q.box.min.z/size);z<=Math.floor(q.box.max.z/size);z++){
  const key=x+','+z;if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(q);
 }}
 query(x,z,r=0){const set=new Set();for(let i=Math.floor((x-r)/this.size);i<=Math.floor((x+r)/this.size);i++)for(let j=Math.floor((z-r)/this.size);j<=Math.floor((z+r)/this.size);j++)for(const q of this.cells.get(i+','+j)??[])set.add(q);return [...set];}
}
const terrain=new Spatial(meshes.get('terrain').filter(q=>q.normal.y>.01));
const waterNames=['pool','plunge_pool','tarn','creek','lake_outflow','ocean'];
const water=new Spatial(waterNames.flatMap(n=>meshes.get(n)??[]),8);
const treeNames=[...meshes.keys()].filter(n=>/^(pine|redwood)/.test(n));
const treeIndex=new Spatial(treeNames.flatMap(n=>meshes.get(n)));
const obstacleNames=[...meshes.keys()].filter(n=>/^(pine|redwood|lookout|cable_station|cable_towers|rock$|lake_rocks|coast_ledges)/.test(n));
const obstacles=new Spatial(obstacleNames.flatMap(n=>meshes.get(n)));
const fullObstacles=new Spatial([...obstacleNames,'bridges_paths_p8','dock_boats'].flatMap(n=>meshes.get(n)??[]));
const supportIndex=new Spatial(classifications.flatMap(c=>c.matched));
function hit(q,x,z) {
 const a=q.t.a,b=q.t.b,c=q.t.c,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
 if(Math.abs(d)<1e-10)return null;
 const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d,w=1-u-v;
 return u>=-1e-6&&v>=-1e-6&&w>=-1e-6?u*a.y+v*b.y+w*c.y:null;
}
function surfaceAt(x,z,index=terrain){let best=null;for(const q of index.query(x,z)){const y=hit(q,x,z);if(y!==null&&(!best||y>best.y))best={y,slope:Math.acos(Math.min(1,Math.max(-1,q.normal.y)))*180/Math.PI,triangle:q.index,name:q.name};}return best;}
function obstacleHits(x,z,y,r=.18,h=2.1,index=obstacles){const b=new Box3(new Vector3(x-r,y+.08,z-r),new Vector3(x+r,y+h,z+r));return [...new Set(index.query(x,z,r).filter(q=>q.box.intersectsBox(b)&&b.intersectsTriangle(q.t)).map(q=>q.name))];}
const nearestPath=p=>{
 let best=null;
 for(const q of polygons){if(q.kind==='lookout_doorstep')continue;
  for(let i=0;i<q.vertices.length;i++){const at=segmentPoint(p,q.vertices[i],q.vertices[(i+1)%q.vertices.length]),d=distanceXZ(p,at);if(!best||d<best.distance)best={distance:d,point:at,polygon:q.id,component:componentByPolygon.get(q.id)};}
 }return best;
};
// Full camp footprint: disk's actual outer cylinder radius plus every tent corner.
const radius=campsite.radius+.25,circumscribedRadius=radius/Math.cos(Math.PI/144),footPoints=Array.from({length:144},(_,i)=>[circumscribedRadius*Math.cos(i*Math.PI/72),0,circumscribedRadius*Math.sin(i*Math.PI/72)]);
for(const x of [-.95,.95])for(const z of [-1.2,1.2])footPoints.push([campTent.x-campsite.x+x*Math.cos(campTent.yaw)+z*Math.sin(campTent.yaw),0,campTent.z-campsite.z-x*Math.sin(campTent.yaw)+z*Math.cos(campTent.yaw)]);
const flyHalfWidth=.52+.015*Math.cos(.76)+.75*Math.sin(.76);
for(const x of [-flyHalfWidth,flyHalfWidth])for(const z of [-1.1,1.1])footPoints.push([campTent.x-campsite.x+x*Math.cos(campTent.yaw)+z*Math.sin(campTent.yaw),0,campTent.z-campsite.z-x*Math.sin(campTent.yaw)+z*Math.cos(campTent.yaw)]);
const footprint=hull(footPoints),maxCampRadius=Math.max(...footprint.map(p=>Math.hypot(p[0],p[2])));
const campSamples=spacing=>{const out=[];for(let x=-maxCampRadius;x<=maxCampRadius;x+=spacing)for(let z=-maxCampRadius;z<=maxCampRadius;z+=spacing)if(pointIn([x,0,z],footprint))out.push([x,z]);return out.concat(footprint.map(p=>[p[0],p[2]]),[[0,0]]);};
function evaluateCamp(x,z,spacing=.75,includeSamples=false){
 const data=[],blocked=new Set();let missing=0,wet=0,maxSlope=0,min=Infinity,max=-Infinity,minWaterGap=Infinity;
 for(const [dx,dz] of campSamples(spacing)){
  const p=[x+dx,z+dz],g=surfaceAt(...p);if(!g){missing++;continue;}
  min=Math.min(min,g.y);max=Math.max(max,g.y);maxSlope=Math.max(maxSlope,g.slope);
  const w=surfaceAt(...p,water);if(w){minWaterGap=Math.min(minWaterGap,g.y-w.y);if(w.y>=g.y-.05)wet++;}
  for(const n of obstacleHits(p[0],p[1],g.y,.14,2.1))blocked.add(n);
  if(includeSamples)data.push({x:round(p[0]),z:round(p[1]),height:round(g.y),slopeDegrees:round(g.slope),terrainTriangle:g.triangle});
 }
 const path=nearestPath([x,(min+max)/2,z]),distanceFromFootprint=path.distance-maxCampRadius;
 return {centre:[x,(min+max)/2,z],heightRange:[min,max],heightVariation:max-min,maxSlope,missing,wet,minWaterGap,blocked:[...blocked],nearestPath:path,distanceFromFootprint,samples:data};
}
const coarse=[],rejected=[];
for(let x=24;x<=88;x+=2)for(let z=-48;z<=50;z+=2){
 const middle=surfaceAt(x,z);if(!middle||middle.y<1||middle.slope>8)continue;
 const path=nearestPath([x,middle.y,z]);if(path.distance<maxCampRadius+1.2||path.distance>18)continue;
 const c=evaluateCamp(x,z);
 rejected.push(c);
 if(c.missing===0&&c.wet===0&&c.blocked.length===0&&c.maxSlope<12&&c.heightVariation<1.3)coarse.push(c);
}
coarse.sort((a,b)=>(a.heightVariation*5+a.maxSlope*.1+a.nearestPath.distance*.04)-(b.heightVariation*5+b.maxSlope*.1+b.nearestPath.distance*.04));
rejected.sort((a,b)=>(a.missing*100+a.wet*50+a.blocked.length*2+a.heightVariation*5+a.maxSlope*.08+a.nearestPath.distance*.04)-(b.missing*100+b.wet*50+b.blocked.length*2+b.heightVariation*5+b.maxSlope*.08+b.nearestPath.distance*.04));
const shortlist=[...new Map([...coarse,...rejected].map(c=>[c.centre[0]+','+c.centre[2],c])).values()].slice(0,8);
const candidates=shortlist.map(c=>evaluateCamp(c.centre[0],c.centre[2],.2,true));
const camera=new PerspectiveCamera(32.3,1280/720,.1,1000);camera.position.fromArray(frame([68,-296,230]));camera.lookAt(...frame([8,-8,4]));camera.updateMatrixWorld();
const projectedBox=points=>{const ps=points.map(p=>new Vector3(...p).project(camera));return [[Math.min(...ps.map(p=>p.x)),Math.min(...ps.map(p=>p.y))],[Math.max(...ps.map(p=>p.x)),Math.max(...ps.map(p=>p.y))]];};
const heroProjection=projectedBox(['rock','waterfall','lookout_vc'].flatMap(n=>meshes.get(n).flatMap(q=>[q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()])));
for(const c of candidates){
 const [x,y,z]=c.centre;
 c.heroProjection=projectedBox(footprint.flatMap(p=>[[x+p[0],y,z+p[2]],[x+p[0],y+2.1,z+p[2]]]));
 const a=c.heroProjection,b=heroProjection;c.overlapsHeroProjection=!(a[1][0]<b[0][0]||a[0][0]>b[1][0]||a[1][1]<b[0][1]||a[0][1]>b[1][1]);
 const end=c.nearestPath.point,d=Math.hypot(end[0]-x,end[2]-z),perp=[-(end[2]-z)/d,(end[0]-x)/d],rows=[];
 // This is a measured corridor probe to an actual path edge, not a new approved route.
 for(let t=maxCampRadius;t<=d;t+=.2)for(const lateral of [-.6,-.3,0,.3,.6]){
  const px=x+(end[0]-x)*t/d+perp[0]*lateral,pz=z+(end[2]-z)*t/d+perp[1]*lateral,g=surfaceAt(px,pz);
  rows.push({position:[px,g?.y??null,pz],slope:g?.slope??null,blocked:g?obstacleHits(px,pz,g.y):['no terrain']});
 }
 c.approachProbe={width:1.2,length:Math.max(0,d-maxCampRadius),pathPolygon:c.nearestPath.polygon,pathEndpoint:end,
  maxSlope:Math.max(...rows.map(r=>r.slope??90)),blocked:[...new Set(rows.flatMap(r=>r.blocked))],samples:rows,
  terrainToPavingStep:Math.abs((surfaceAt(end[0],end[2])?.y??Infinity)-end[1]),status:'Measured undeveloped ground corridor; not added to support graph'};
}
const selected=candidates.find(c=>!c.overlapsHeroProjection&&c.blocked.length===0&&c.maxSlope<8&&c.heightVariation<.5)??candidates[0]??null;
// Exact convex clipping over every exported terrain triangle intersecting the
// footprint replaces the dense sample estimate for camp support extrema.
function clipToPolygon(subject,clip) {
 let out=subject;
 for(let i=0;i<clip.length&&out.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],side=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]);
  const input=out;out=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);
   if(sp>=-1e-9)out.push(p);
   if((sp>=0)!==(sq>=0)){const t=sp/(sp-sq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}
  }
 }
 return out;
}
if(selected){
 const [x,,z]=selected.centre,outline=footprint.map(p=>[x+p[0],0,z+p[2]]),pieces=[];
 for(const q of terrain.query(x,z,maxCampRadius)){
  const clipped=clipToPolygon([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);
  if(clipped.length>=3&&projectedArea(clipped)>1e-8)pieces.push({triangle:q.index,polygon:clipped,area:projectedArea(clipped),slopeDegrees:Math.acos(q.normal.y)*180/Math.PI});
 }
 const heights=pieces.flatMap(p=>p.polygon.map(v=>v[1])),lo=Math.min(...heights),hi=Math.max(...heights),blocked=[];
 for(const q of obstacles.query(x,z,maxCampRadius)){
  if(q.box.max.y<lo+.08||q.box.min.y>hi+2.1)continue;
  const clipped=clipToPolygon([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);
  if(clipped.length&&Math.max(...clipped.map(p=>p[1]))>=lo+.08&&Math.min(...clipped.map(p=>p[1]))<=hi+2.1)blocked.push(q.name);
 }
 selected.exactFootprintSupport={method:'Convex footprint clipped against all intersecting upward exported terrain triangles; linear face extrema occur at clipped vertices',
  footprintArea:projectedArea(outline),coveredAreaSum:pieces.reduce((s,p)=>s+p.area,0),heightRange:[lo,hi],heightVariation:hi-lo,maxSlopeDegrees:Math.max(...pieces.map(p=>p.slopeDegrees)),pieces,
  conservativeHeadPrism:{heightRange:[lo+.08,hi+2.1],blockedObjects:[...new Set(blocked)],meaning:'Entire footprint prism, not just head ray samples; bounds are conservative across terrain relief'}};
 const horizontalClearance=(names)=>{
  let best={distance:Infinity,name:null,point:null};
  for(const name of names)for(const q of meshes.get(name)??[]){
   const vertices=[q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()];
   const c=closestPolygons(outline,vertices);
   if(c.gap<best.distance)best={distance:c.gap,name,point:c.b};
  }return best;
 };
 selected.clearanceToWater=horizontalClearance(waterNames);
 selected.clearanceToBuildings=horizontalClearance(['lookout_vc','cable_station']);
 selected.clearanceToRenderedPaving=polygons.reduce((best,p)=>{
  const c=closestPolygons(outline,p.vertices);return c.gap<best.distance?{distance:c.gap,polygon:p.id,point:c.b}:best;
 },{distance:Infinity});
 // A low-step endpoint search is evidence for the next connector design. It
 // does not invent paving or skip the full approach corridor test.
 const lowStep=[];
 for(const p of polygons)for(let i=0;i<p.vertices.length;i++){
  const a=p.vertices[i],b=p.vertices[(i+1)%p.vertices.length],n=Math.ceil(distanceXZ(a,b)/.4);
  for(let j=0;j<=n;j++){
   const v=a.map((x,k)=>x+(b[k]-x)*j/(n||1)),d=distanceXZ(selected.centre,v);if(d>30)continue;
   const g=surfaceAt(v[0],v[2]);if(!g||Math.abs(g.y-v[1])>.22||g.slope>12)continue;
   if(obstacleHits(v[0],v[2],Math.max(g.y,v[1]),.3).length)continue;
   lowStep.push({point:v,polygon:p.id,distanceFromCampCentre:d,terrainToPavingStep:Math.abs(g.y-v[1]),terrainSlope:g.slope});
  }
 }
 lowStep.sort((a,b)=>a.distanceFromCampCentre-b.distanceFromCampCentre);
 selected.nearestLowStepEndpoint=lowStep[0]??null;
 if(lowStep[0]){
  const end=lowStep[0].point,d=distanceXZ(selected.centre,end),u=[(end[0]-x)/d,(end[2]-z)/d],perp=[-u[1],u[0]],rows=[];
  for(let t=maxCampRadius;t<=d+.01;t+=.2)for(const lateral of [-.6,-.3,0,.3,.6]){
   const px=x+u[0]*t+perp[0]*lateral,pz=z+u[1]*t+perp[1]*lateral,g=surfaceAt(px,pz);
   const w=surfaceAt(px,pz,water);
   rows.push({point:[px,g?.y??null,pz],slope:g?.slope??90,wet:!g||(!!w&&w.y>=g.y-.05),
    obstacles:g?obstacleHits(px,pz,g.y,.14,2.1):['no terrain']});
  }
  const landing=[];
  for(let along=0;along<=.9;along+=.15)for(const lateral of [-.6,-.3,0,.3,.6]){
   const px=end[0]+u[0]*along+perp[0]*lateral,pz=end[2]+u[1]*along+perp[1]*lateral,paving=surfaceAt(px,pz,supportIndex),g=surfaceAt(px,pz);
   landing.push({point:[px,paving?.y??g?.y??null,pz],pavingPresent:!!paving,terrainToPavingStep:paving&&g?Math.abs(paving.y-g.y):null,
    obstacles:paving?obstacleHits(px,pz,paving.y,.15,2.1,fullObstacles):[]});
  }
  selected.nearestLowStepEndpoint.approachProbe={width:1.2,length:d-maxCampRadius,maxSlope:Math.max(...rows.map(r=>r.slope)),
   blocked:[...new Set(rows.flatMap(r=>r.obstacles))],wetSamples:rows.filter(r=>r.wet).length,samples:rows,
   landing:{length:.9,width:1.2,pavingSamples:landing.filter(p=>p.pavingPresent).length,totalSamples:landing.length,
    maximumGroundToPavingStep:Math.max(...landing.map(p=>p.terrainToPavingStep??0)),blocked:[...new Set(landing.flatMap(r=>r.obstacles))],samples:landing},
   status:'Measured candidate; slope, landing support and side clearance are not waived by the centre endpoint passing a step test'};
 }
 selected.status='Rejected for direct existing-camp reanchor; ground is not level and no fully verified connecting path exists';
}
const pavingClearance=[];
for(const p of polygons){
 const vs=p.vertices,lo=Math.min(...vs.map(v=>v[1])),hi=Math.max(...vs.map(v=>v[1])),r=Math.max(...vs.map(v=>distanceXZ(v,p.centre))),blocked=[];
 for(const q of fullObstacles.query(p.centre[0],p.centre[2],r)){
  // Skip geometry completely below the allowed step height; count higher
  // curbs, railings, props and trunks across the entire polygon footprint.
  if(q.box.max.y<=lo+.23||q.box.min.y>hi+2.1)continue;
  const clipped=clipToPolygon([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],vs);
  if(clipped.length&&Math.max(...clipped.map(v=>v[1]))>lo+.23&&Math.min(...clipped.map(v=>v[1]))<hi+2.1)blocked.push(q.name);
 }
 if(blocked.length)pavingClearance.push({polygon:p.id,objects:[...new Set(blocked)]});
}
const measuredSequences=['sea_bridge_board','lake_dock_board','lookout_stair_tread'].map(kind=>{
 const ps=polygons.filter(p=>p.kind===kind).sort((a,b)=>a.sourcePartFirstFace-b.sourcePartFirstFace);
 const transitions=ps.slice(1).map((p,i)=>{const q=closestPolygons(ps[i].vertices,p.vertices);return {a:ps[i].id,b:p.id,gap:q.gap,stepHeight:Math.abs(q.a[1]-q.b[1])};});
 const widths=ps.map(p=>Math.max(...p.vertices.map((v,i)=>distanceXZ(v,p.vertices[(i+1)%p.vertices.length]))));
 return {kind,count:ps.length,maxFaceSlopeDegrees:Math.max(...ps.map(p=>p.slopeDegrees)),boardLongEdgeRange:[Math.min(...widths),Math.max(...widths)],
  consecutiveBoundaryGapRange:[Math.min(...transitions.map(t=>t.gap)),Math.max(...transitions.map(t=>t.gap))],
  consecutiveStepRange:[Math.min(...transitions.map(t=>t.stepHeight)),Math.max(...transitions.map(t=>t.stepHeight))],transitions};
});
const landmarkFloorClasses=[['lookout_vc',[0,24]],['cable_station',[108]]];
const landmarks=landmarkFloorClasses.map(([name,ids])=>{
 const ps=sourceParts[name].filter(p=>ids.includes(p.firstFace));
 const boundary=ps.flatMap(p=>p.tops.flatMap(t=>t.vertices));
 let nearest=null;for(const floor of ps.flatMap(p=>p.tops))for(const path of polygons){
  const q=closestPolygons(floor.vertices,path.vertices),step=Math.abs(q.a[1]-q.b[1]),distance=Math.hypot(q.gap,step);
  if(!nearest||distance<nearest.distance)nearest={distance,landmarkPoint:q.a,pathPoint:q.b,pathPolygon:path.id,gap:q.gap,stepHeight:step};
 }
 const approachSamples=[];
 if(name==='lookout_vc')for(let z=-6;z<=-2.5;z+=.2)approachSamples.push({point:[2.05128,22.20897,z],blocked:obstacleHits(2.05128,z,22.20897,.3,2.1)});
 return {name,sourceFloorPartIds:ids,floorPolygons:ps.flatMap(p=>p.tops.map(t=>({sourceFace:t.face,vertices:round(t.vertices)}))),nearestPavingBoundary:nearest,approachSamples,
  status:'Measured floor boundary; door/guard aperture clearance must be verified before enabling entry'};
});
const result={schema:'p11-navigation-candidate/v1',status:'measurement candidate; not a production navmesh',
 source:{file:sourceFile,sha256:before,unchanged:before===after},export:{file:glbFile,sha256:createHash('sha256').update(await readFile(glbFile)).digest('hex')},
 frame:{units:'metres',threeFromBlender:'[x,z+6,-y]/1.56',scale:1/s},
 method:{sourceTopology:'Original polygon/component ids from read-only Blender load at frame 1',exportGeometry:'Decoded meshopt GLB, world transforms applied before island scale/lift',
  supportSelection:'Reviewed 1.2-unit thick timber paving slab signature and explicit dock/bridge board ranges; no generic tabletop/rail-top support',
  adjacency:{maxPlanGap:.03,maxStep:.22,meaning:'Point/edge proximity only; NOT full agent-width portal clearance'},
  missingClasses:'Complex dock_boats furnishings/wood assemblies outside explicit ranges are left unclassified, not assumed walkable',maxSourceExportMatchError:round(maxMatchError),unmatched},
 supportPolygons:polygons,polygonAdjacencyCandidates:edges,components:componentData,nearGaps:nearGaps.sort((a,b)=>b.stepHeight-a.stepHeight),disconnectedComponentNearest:disconnectedNearest,
 fullWidthClearance:{method:'Every polygon footprint clipped against rendered obstacle triangles in conservative floor+.23 to floor+2.1m body prism; NOT a navigable free-width solution',
  obstructedPolygonCount:pavingClearance.length,obstructedPolygons:pavingClearance,remainingWork:'Subtract obstacle footprints, resolve stacked paving and erode free regions for agent radius before claiming a walkable width'},
 measuredSequences,
 landmarks,camp:{existingFootprint:{clearingOuterRadius:radius,tentOffset:[campTent.x-campsite.x,campTent.z-campsite.z],tentYaw:campTent.yaw,
  conservativeHull:round(footprint),maximumRadius:round(maxCampRadius),tentFlyHalfWidth:flyHalfWidth,circleApproximation:'144-sided circumscribed polygon; covers the entire rendered clearing circle',campers:campers().map(p=>[p.x-campsite.x,p.z-campsite.z]),
  excludedFromLocalCamp:'District Signpost is at a separate old route location; hiking trajectories must be rebuilt from validated support. Neither may be copied verbatim.'},
  search:{eastRegion:[24,88,-48,50],coarseGridMetres:2,coarseValid:coarse.length,fineSpacing:.2,headClearanceMetres:2.1,bodyProbeRadius:.14},
  heroSightline:{cameraBlender:[68,-296,230],targetBlender:[8,-8,4],fov:32.3,aspect:1280/720,criticalObjectProjection:heroProjection,limitation:'Current accepted arrival-camera projection proxy; not a reference-image pixel match'},
  selected,candidates:candidates.filter(c=>c!==selected).map(({samples,approachProbe,...rest})=>rest),reanchorApproved:false},
 limitations:['No centre lines were invented; graph edges are surface boundary proximity candidates only.',
 'A 3cm support seam tolerance is explicit; it does not add rendered paving or establish full-width walking clearance.',
 'Terrain can be sampled directly but steep/wet/blocked terrain is not promoted to a navmesh.',
 'Furniture, rails, people and foliage require agent-radius swept clearance; support connectivity alone is insufficient.',
 'Selected camp support uses exact terrain-triangle clipping over a conservative hull. Headroom is a conservative full-footprint prism; approach probes remain sampled and are not an approved route.',
 'Existing TrailCamp remains unchanged; no placement is approved by this analysis.']};
await mkdir(new URL('../asset-src/authored/out-there/',import.meta.url),{recursive:true});
await writeFile(outFile,JSON.stringify(result,(_,v)=>typeof v==='number'&&Number.isFinite(v)?+v.toFixed(5):v,2)+'\n');
console.log(JSON.stringify({polygons:polygons.length,edges:edges.length,components:componentData.length,maxMatchError,unmatched:unmatched.length,
 largestComponents:componentData.slice(0,8).map(({polygonIds,...rest})=>({...rest,polygons:polygonIds.length})),coarseCampCandidates:coarse.length,
 selectedCamp:selected?{centre:selected.centre,variation:selected.heightVariation,slope:selected.maxSlope,blocked:selected.blocked,nearestPath:selected.nearestPath,approach:{slope:selected.approachProbe.maxSlope,step:selected.approachProbe.terrainToPavingStep,blocked:selected.approachProbe.blocked}}:null},null,2));
await reconcileOfficial();

async function reconcileOfficial(){
 const directory=app+'asset-src/reference/world-pack/models/out-there/';
 const modelFile=directory+'glb/poly_dome11_web.glb',hooksFile=directory+'glb/poly_dome11_hooks.json',viewerFile=directory+'viewer/main.js';
 const history=JSON.parse(await readFile(outFile,'utf8')),hooks=JSON.parse(await readFile(hooksFile,'utf8')),viewer=await readFile(viewerFile,'utf8');
 await MeshoptDecoder.ready;
 const reader=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 const official=await reader.read(modelFile),geometry=new Map(),scale=1.56;
 const convert=([x,y,z])=>[x/scale,(z+6)/scale,-y/scale];
 const round=x=>typeof x==='number'&&Number.isFinite(x)?+x.toFixed(5):x;
 for(const node of official.getRoot().listNodes()){
  if(!node.getMesh())continue;const transform=new Matrix4().fromArray(node.getWorldMatrix()),tris=[];
  let owner=node;while(!owner.getName()&&owner.getParentNode())owner=owner.getParentNode();
  const name=owner.getName()||`unnamed_${official.getRoot().listNodes().indexOf(node)}`;
  for(const [primitive,p]of node.getMesh().listPrimitives().entries()){
   const pos=p.getAttribute('POSITION'),indices=p.getIndices(),get=i=>new Vector3().fromArray(pos.getElement(indices?indices.getScalar(i):i,[])).applyMatrix4(transform).add(new Vector3(0,6,0)).multiplyScalar(1/scale);
   for(let i=0;i<(indices?.getCount()??pos.getCount());i+=3){const t=new Triangle(get(i),get(i+1),get(i+2));tris.push({t,normal:t.getNormal(new Vector3()),box:new Box3().setFromPoints([t.a,t.b,t.c]),name,primitive,index:i/3});}
  }
  if(!geometry.has(name))geometry.set(name,[]);geometry.get(name).push(...tris);
 }
 for(const name of ['terrain','bridges_paths_p8','dock_boats','lookout_vc','cable_station'])if(!geometry.get(name)?.length)throw Error(`Official ancestor mesh resolution failed: ${name}`);
 const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
 const keys=Object.keys(hooks.path_nodes),adj=new Map(keys.map(k=>[k,[]]));
 for(const [a,b]of hooks.path_edges){if(!adj.has(a)||!adj.has(b))throw Error('Official edge references absent node');adj.get(a).push(b);adj.get(b).push(a);}
 const seen=new Set(),components=[];
 for(const start of keys){if(seen.has(start))continue;const queue=[start],c=[];seen.add(start);for(let i=0;i<queue.length;i++){const n=queue[i];c.push(n);for(const v of adj.get(n))if(!seen.has(v)){seen.add(v);queue.push(v);}}components.push(c);}
 function height(q,x,z){const a=q.t.a,b=q.t.b,c=q.t.c,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(d)<1e-10)return null;const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d,w=1-u-v;return u>=-1e-6&&v>=-1e-6&&w>=-1e-6?u*a.y+v*b.y+w*c.y:null;}
 const pathTris=['bridges_paths_p8','dock_boats'].flatMap(n=>geometry.get(n)??[]).filter(q=>q.normal.y>.7);
 const spatial=new Map(),cell=4;
 for(const q of pathTris)for(let x=Math.floor(q.box.min.x/cell);x<=Math.floor(q.box.max.x/cell);x++)for(let z=Math.floor(q.box.min.z/cell);z<=Math.floor(q.box.max.z/cell);z++){const k=x+','+z;if(!spatial.has(k))spatial.set(k,[]);spatial.get(k).push(q);}
 const supports=(x,z)=>((spatial.get(Math.floor(x/cell)+','+Math.floor(z/cell)))??[]).map(q=>({q,y:height(q,x,z)})).filter(v=>v.y!==null);
 const physicalObstacles=[...geometry.entries()].filter(([n])=>/^(pine|redwood|lookout|cable_station|cable_towers|rock$|lake_rocks|coast_ledges)/.test(n)).flatMap(([,ts])=>ts);
 function body(point,r=.3){const box=new Box3(new Vector3(point[0]-r,point[1]+.1,point[2]-r),new Vector3(point[0]+r,point[1]+2.1,point[2]+r));return [...new Set(physicalObstacles.filter(q=>box.intersectsBox(q.box)&&box.intersectsTriangle(q.t)).map(q=>q.name))];}
 const nodeChecks=keys.map(id=>{
  const p=convert(hooks.path_nodes[id].blender),matches=supports(p[0],p[2]).sort((a,b)=>Math.abs(a.y-p[1])-Math.abs(b.y-p[1]));
  const support=matches[0];return {id,metres:p,nearestUpwardPavingAtXZ:support?{height:support.y,offset:p[1]-support.y,mesh:support.q.name,primitive:support.q.primitive,triangle:support.q.index}:null,
   standingBodyObstacles:body(p),note:'Upward paving probe at an authoritative hook; semantic surface classification still required before using arbitrary nearby faces'};
 });
 const edgeChecks=hooks.path_edges.map(([a,b,kind])=>{
  const p=convert(hooks.path_nodes[a].blender),q=convert(hooks.path_nodes[b].blender),distance=Math.hypot(q[0]-p[0],q[2]-p[2]),n=Math.ceil(distance/.25),perp=[-(q[2]-p[2])/distance,(q[0]-p[0])/distance],samples=[];
  for(let i=0;i<=n;i++)for(const lateral of [-.6,0,.6]){
   const t=i/n,at=p.map((v,k)=>v+(q[k]-v)*t);at[0]+=perp[0]*lateral;at[2]+=perp[1]*lateral;
   const hs=supports(at[0],at[2]).sort((a,b)=>Math.abs(a.y-at[1])-Math.abs(b.y-at[1])),best=hs[0];samples.push({at,t,lateral,support:best?best.y:null,offset:best?best.y-at[1]:null});
  }
  const centres=samples.filter(s=>s.lateral===0),ok=centres.filter(s=>s.support!==null),extreme=ok.toSorted((a,b)=>Math.abs(b.offset)-Math.abs(a.offset))[0];
  return {a,b,kind,chordLength:distance,centreSamples:centres.length,centreNoUpwardPaving:centres.filter(s=>s.support===null).length,
   fullWidthProbeSamples:samples.length,fullWidthNoUpwardPaving:samples.filter(s=>s.support===null).length,
   maximumAbsoluteHeightOffset:Math.max(0,...ok.map(s=>Math.abs(s.offset))),extremeSample:extreme,
   meaning:'Straight chord through supplied endpoints only; hooks do not specify a continuous height profile, curve or free walking width'};
 });
 const geometryComparison=[];
 for(const name of ['bridges_paths_p8','dock_boats','lookout_vc','cable_station','terrain']){
  const ts=geometry.get(name)??[],box=new Box3();for(const q of ts)box.union(q.box);
  const historical=history.supportPolygons.filter(p=>p.id.startsWith(name+':')),differences=[];
  for(const p of historical){const point=new Vector3(...p.centre);let nearest=Infinity;for(const q of ts){if(q.box.distanceToPoint(point)>.05)continue;nearest=Math.min(nearest,q.t.closestPointToPoint(point,new Vector3()).distanceTo(point));}differences.push(nearest);}
  geometryComparison.push({name,officialTriangles:ts.length,bounds:[box.min.toArray(),box.max.toArray()],historicalSupportSamples:differences.length,
   maximumHistoricalCentreToOfficialSurfaceDistance:differences.length?Math.max(...differences):null,unmatchedHistoricalCentres:differences.filter(d=>d>.02).length});
 }
 function clip(subject,polygon){let out=subject;for(let i=0;i<polygon.length&&out.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],side=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]);const input=out;out=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);if(sp>=-1e-9)out.push(p);if((sp>=0)!==(sq>=0)){const t=sp/(sp-sq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}}}return out;}
 const area=vs=>Math.abs(vs.reduce((a,p,i)=>a+p[0]*vs[(i+1)%vs.length][2]-p[2]*vs[(i+1)%vs.length][0],0))/2;
 const candidate=history.camp.selected,outline=history.camp.existingFootprint.conservativeHull.map(v=>[candidate.centre[0]+v[0],0,candidate.centre[2]+v[2]]),campPieces=[];
 for(const q of geometry.get('terrain')??[]){if(q.normal.y<=0)continue;const points=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(points.length>=3&&area(points)>1e-8)campPieces.push({points,area:area(points),slope:Math.acos(q.normal.y)*180/Math.PI});}
 const hs=campPieces.flatMap(p=>p.points.map(v=>v[1])),lo=Math.min(...hs),hi=Math.max(...hs),campBlocked=new Set();
 for(const q of physicalObstacles){if(q.box.max.y<lo+.08||q.box.min.y>hi+2.1)continue;const pts=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(pts.length&&Math.max(...pts.map(p=>p[1]))>=lo+.08&&Math.min(...pts.map(p=>p[1]))<=hi+2.1)campBlocked.add(q.name);}
 const officialCamp={centreXZ:[candidate.centre[0],candidate.centre[2]],footprintArea:area(outline),coveredAreaSum:campPieces.reduce((s,p)=>s+p.area,0),heightRange:[lo,hi],variation:hi-lo,maxSlope:Math.max(...campPieces.map(p=>p.slope)),headPrismBlocked:[...campBlocked],hookPresent:Object.keys(hooks.interactables).some(k=>/camp/i.test(k))};
 const presetText=viewer.match(/const PRESETS = \[([\s\S]*?)\n\];/)?.[1]??'';
 const presets=[];for(const match of presetText.matchAll(/\['([^']+)'\s*,\s*\[([^\]]+)\],\s*\[([^\]]+)\],\s*([\d.]+)\]/g)){
  const eye=match[2].split(',').map(Number),target=match[3].split(',').map(Number);presets.push({name:match[1],blenderEye:eye,blenderTarget:target,eyeMetres:convert(eye),targetMetres:convert(target),fov:+match[4]});
 }
 history.officialReconciliation={status:'Official hooks supersede inferred connectivity; geometry measurements remain audit evidence',
  files:{model:modelFile,modelSha256:await sha(modelFile),modelBytes:(await readFile(modelFile)).length,hooks:hooksFile,hooksSha256:await sha(hooksFile),viewer:viewerFile},
  scale:{deliveredUnits:hooks.units,adapter:'For hooks.three and GLB coordinates, add [0,6,0] then divide by 1.56 once. Do not reapply Blender axis conversion to hooks.three.',seaLevelMetres:0},
  graph:{nodes:keys.length,edges:hooks.path_edges.length,components,connected:components.length===1,authoritative:hooks.path_edges,limitations:'Topological waypoint graph; no navmesh polygons, edge widths, continuous height profiles or collision clearance are supplied'},
  nodeChecks,edgeChordChecks:edgeChecks,geometryComparison,cameras:{hooksCameraPresetCount:Object.keys(hooks.camera_presets).length,viewerPresets:presets,viewerInitialPreset:'Target overlook',
   viewerLoadsHooks:/fetch\([^)]*hooks|hooks\.path_edges/.test(viewer),viewerNavigation:'OrbitControls and tweened presets; no walk collision or graph traversal implementation'},
  camp:officialCamp,assessment:{continuousTopologyResolved:true,continuousPhysicalNavigationResolved:false,
   lookoutDoor:'Official DOOR is the same rear-wall location probed historically; see standingBodyObstacles for actual official GLB.',
   station:'Official STATION is a spur interaction point outside/below the platform. Historical platform-entry gap does not invalidate clicking this hook; walking onto the platform remains separate.',
   camp:'No official camp hook exists. Re-clipping official terrain confirms whether old camp can be reanchored; reanchor remains unapproved.',
   geometry:'Do not reuse historical primitive/triangle indices against this official GLB. Match its hash and reclassify its own triangles when producing runtime support data.'}};
 await writeFile(outFile,JSON.stringify(history,(_,v)=>round(v),2)+'\n');
 console.log(JSON.stringify({officialGraph:history.officialReconciliation.graph,geometryComparison,camp:officialCamp,
  keyHooks:nodeChecks.filter(n=>['ENTRY','DOOR','STAIR_TOP','STATION','EAST_HEAD','CENTRE_LINK'].includes(n.id)),
  bridgeChord:edgeChecks.find(e=>e.kind==='arch bridge'),cameras:history.officialReconciliation.cameras},null,2));
}
