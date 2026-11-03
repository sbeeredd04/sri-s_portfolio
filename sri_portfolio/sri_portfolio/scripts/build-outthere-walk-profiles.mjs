// Official p11 geometric walk audit. Writes data, never changes the model.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import { Vector3, Matrix4, Triangle, Box3 } from 'three';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const app=fileURLToPath(new URL('../',import.meta.url));
const base=app+'asset-src/reference/world-pack/models/out-there/glb/';
const modelFile=base+'poly_dome11_web.glb',hooksFile=base+'poly_dome11_hooks.json';
const output=app+'app/lib/out-there-walk-profiles.json';
const hooks=JSON.parse(await readFile(hooksFile,'utf8'));
const history=JSON.parse(await readFile(app+'asset-src/authored/out-there/navigation-candidate.json','utf8'));
const sha=async f=>createHash('sha256').update(await readFile(f)).digest('hex');
const modelSha=await sha(modelFile);
assert.equal(modelSha,'e37085a9dcca13354ef44fe7432747bea666ea7410f4e7e2e4c6432e1ff4e724','Official geometry changed: re-review semantic source matches');
const metres=([x,y,z])=>[x/1.56,(z+6)/1.56,-y/1.56];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const area=p=>Math.abs(p.reduce((s,v,i)=>s+v[0]*p[(i+1)%p.length][2]-v[2]*p[(i+1)%p.length][0],0))/2;
function clip(subject,polygon){
 let out=subject;
 for(let i=0;i<polygon.length&&out.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],side=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]),input=out;out=[];
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);
   if(sp>=-1e-9)out.push(p);
   if((sp>=0)!==(sq>=0))out.push(lerp(p,q,sp/(sp-sq)));
  }
 }return out;
}
function height(q,x,z){
 const a=q.t.a,b=q.t.b,c=q.t.c,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
 if(Math.abs(d)<1e-12)return null;
 const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d,w=1-u-v;
 return u>=-1e-7&&v>=-1e-7&&w>=-1e-7?u*a.y+v*b.y+w*c.y:null;
}
class Index{
 constructor(tris,size=3){this.size=size;this.cells=new Map();for(const q of tris)for(let x=Math.floor(q.box.min.x/size);x<=Math.floor(q.box.max.x/size);x++)for(let z=Math.floor(q.box.min.z/size);z<=Math.floor(q.box.max.z/size);z++){const k=x+','+z;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(q);}}
 query(x,z,r=0){const out=new Set();for(let i=Math.floor((x-r)/this.size);i<=Math.floor((x+r)/this.size);i++)for(let j=Math.floor((z-r)/this.size);j<=Math.floor((z+r)/this.size);j++)for(const q of this.cells.get(i+','+j)??[])out.add(q);return [...out];}
}
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const doc=await io.read(modelFile),triangles=[],byName=new Map();
for(const [nodeIndex,node]of doc.getRoot().listNodes().entries()){
 if(!node.getMesh())continue;
 let owner=node;while(!owner.getName()&&owner.getParentNode())owner=owner.getParentNode();
 const name=owner.getName()||'unnamed_'+nodeIndex,matrix=new Matrix4().fromArray(node.getWorldMatrix());
 for(const [primitive,p]of node.getMesh().listPrimitives().entries()){
  const pos=p.getAttribute('POSITION'),ix=p.getIndices(),get=i=>new Vector3().fromArray(pos.getElement(ix?ix.getScalar(i):i,[])).applyMatrix4(matrix).add(new Vector3(0,6,0)).multiplyScalar(1/1.56);
  for(let i=0;i<(ix?.getCount()??pos.getCount());i+=3){
   const t=new Triangle(get(i),get(i+1),get(i+2)),q={t,name,nodeIndex,primitive,triangle:i/3,normal:t.getNormal(new Vector3()),box:new Box3().setFromPoints([t.a,t.b,t.c])};
   triangles.push(q);if(!byName.has(name))byName.set(name,[]);byName.get(name).push(q);
  }
 }
}
// Original source face classes are evidence for semantics only. Re-match the
// official triangles; historical primitive indices are never reused.
const semantic=history.supportPolygons.map(p=>({
 id:p.id,kind:p.kind,owner:p.id.split(':')[0],vertices:p.sourceVertices,
 box:new Box3().setFromPoints(p.sourceVertices.map(v=>new Vector3(...v))).expandByScalar(.085),
 tris:p.sourceVertices.slice(2).map((v,i)=>new Triangle(...[p.sourceVertices[0],p.sourceVertices[i+1],v].map(p=>new Vector3(...p)))),
}));
let maximumMatchError=0;
for(const name of ['bridges_paths_p8','dock_boats'])for(const q of byName.get(name)??[]){
 if(q.normal.y<.65)continue;
 const middle=q.t.getMidpoint(new Vector3());let best=null,error=.085;
 for(const p of semantic){
  if(p.owner!==name||!p.box.containsPoint(middle))continue;
  const e=Math.max(...[q.t.a,q.t.b,q.t.c].map(v=>Math.min(...p.tris.map(t=>t.closestPointToPoint(v,new Vector3()).distanceTo(v)))));
  if(e<error){error=e;best=p;}
 }
 if(best){q.walkClass=best.kind;q.sourceFace=best.id;maximumMatchError=Math.max(maximumMatchError,error);}
}
const support=triangles.filter(q=>q.walkClass),supportIndex=new Index(support),terrain=byName.get('terrain').filter(q=>q.normal.y>.01),terrainIndex=new Index(terrain);
// Complete collision inventory. Water/sky are visual volumes. Soft planting
// remains separately measured and must be clipped for a new camp clearing.
const visual=/^(ocean|pool|tarn|creek$|lake_outflow|waterfall|falls_|plunge_pool|lake_ripples|coast_foam|outflow_rapids|sky_)/;
const soft=/^(ferns|bushes|grass|coast_shrubs|coast_flowers)/;
const animal=/^(bird|gull|deer|rabbit)/;
const collisionInventory=[...byName.entries()].map(([name,ts])=>({name,triangles:ts.length,role:visual.test(name)?'visual_only':soft.test(name)?'soft_planting':animal.test(name)?'animated_animal_frame_zero':name==='terrain'?'terrain':'solid'}));
// Paving shell faces below their classified top are walk structure, not rails.
// Removing only these shells avoids falsely treating stair risers as furniture.
const shells=semantic.map(p=>({...p,y:Math.max(...p.vertices.map(v=>v[1])),xz:p.vertices}));
function shell(q){
 if(!['bridges_paths_p8','dock_boats'].includes(q.name))return false;
 if(q.walkClass)return true;
 const c=q.t.getMidpoint(new Vector3());
 return shells.some(p=>p.owner===q.name&&c.y<=p.y+.065&&c.y>=p.y-.82&&p.box.clone().expandByVector(new Vector3(0,.82,0)).containsPoint(c)&&
  [q.t.a,q.t.b,q.t.c].every(v=>p.tris.some(t=>{const flat=v.clone();flat.y=p.y;return t.closestPointToPoint(flat,new Vector3()).distanceTo(flat)<.09;})));
}
const hard=triangles.filter(q=>!visual.test(q.name)&&!soft.test(q.name)&&q.name!=='terrain'&&!shell(q));
const hardIndex=new Index(hard),softIndex=new Index(triangles.filter(q=>soft.test(q.name)));
if(process.argv.includes('--connector-probe')){
 for(const [ex,ez]of [[20.64103,20.89744],[18.08021,24.83235],[16,28],[19.2,26.4],[20,28.2]]){
  const hit=surface(supportIndex,ex,ez),end=[ex,hit?.y??4.5,ez],d=Math.hypot(ex-32,ez-34),dx=(ex-32)/d,dz=(ez-34)/d,start=[32+dx*3.466,4.34,34+dz*3.466],nx=-dz,nz=dx;
  const outline=[[start[0]+nx*.6,0,start[2]+nz*.6],[start[0]-nx*.6,0,start[2]-nz*.6],[ex-nx*.6,0,ez-nz*.6],[ex+nx*.6,0,ez+nz*.6]],contacts=[];
  for(const q of hardIndex.query((start[0]+ex)/2,(start[2]+ez)/2,d/2+.8)){
   const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(!ps.length)continue;
   const signed=ps.map(p=>p[1]-(4.34+(end[1]-4.34)*((p[0]-start[0])*dx+(p[2]-start[2])*dz)/dist(start,end)));
   if(Math.max(...signed)>.23&&Math.min(...signed)<2.1)contacts.push({name:q.name,triangle:q.triangle,box:[q.box.min.toArray(),q.box.max.toArray()],signed:[Math.min(...signed),Math.max(...signed)]});
  }
  const ground=[],foundation=[];
  for(const q of terrainIndex.query((start[0]+ex)/2,(start[2]+ez)/2,d/2+.8)){const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(ps.length>=3&&area(ps)>1e-8)ground.push(...ps.map(p=>p[1]));}
  const bottom=Math.floor((Math.min(...ground)-.15)*100)/100;
  for(const q of hardIndex.query((start[0]+ex)/2,(start[2]+ez)/2,d/2+.8)){const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(!ps.length)continue; const signed=ps.map(p=>p[1]-(4.34+(end[1]-4.34)*((p[0]-start[0])*dx+(p[2]-start[2])*dz)/dist(start,end)));if(Math.min(...signed)<0&&Math.max(...ps.map(p=>p[1]))>bottom)foundation.push({name:q.name,triangle:q.triangle,box:[q.box.min.toArray(),q.box.max.toArray()],signed:[Math.min(...signed),Math.max(...signed)]});}
  console.log(JSON.stringify({start,end,ground:[Math.min(...ground),Math.max(...ground)],bottom,contacts:contacts.slice(0,10),total:contacts.length,foundation:foundation.slice(0,15),foundationTotal:foundation.length}));
 }
 await new Promise(resolve=>process.stdout.write('',resolve));process.exit(0);
}
if(process.argv.includes('--camp-probe')){
 const sites=[[10,35],[4,35],[3,35],[4,38],[6,38],[32,34]];
 for(const [x,z]of sites){
  const r=3.766/Math.cos(Math.PI/192),outline=Array.from({length:192},(_,i)=>[x+r*Math.cos(i*Math.PI/96),0,z+r*Math.sin(i*Math.PI/96)]),ps=[];
  for(const q of terrainIndex.query(x,z,3.766)){const p=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(p.length>=3&&area(p)>1e-8)ps.push({p,slope:Math.acos(q.normal.y)*180/Math.PI});}
  const ys=ps.flatMap(p=>p.p.map(v=>v[1])),low=Math.min(...ys),high=Math.max(...ys),top=Math.ceil((high+.06)*100)/100;
  const pavingOverlap=supportIndex.query(x,z,3.766).filter(q=>{const p=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);return p.length>=3&&area(p)>.001;});
  console.log(JSON.stringify({x,z,height:[low,high],slope:Math.max(...ps.map(p=>p.slope)),terraceTop:top,bottom:Math.floor((low-.15)*100)/100,
   hard:prismObjects(outline,low+.02,top+2.1,hardIndex),soft:prismObjects(outline,low,top+2.1,softIndex),pavingOverlapTriangles:pavingOverlap.length}));
 }
 await new Promise(resolve=>process.stdout.write('',resolve));process.exit(0);
}
function surface(index,x,z,maxY=Infinity){let best=null;for(const q of index.query(x,z)){const y=height(q,x,z);if(y!==null&&y<=maxY&&(!best||y>best.y))best={q,y};}return best;}
function hits(point,r=.3,head=2.1,index=hardIndex){
 const box=new Box3(new Vector3(point[0]-r,point[1]+.23,point[2]-r),new Vector3(point[0]+r,point[1]+head,point[2]+r));
 return [...new Set(index.query(point[0],point[2],r).filter(q=>q.box.intersectsBox(box)&&box.intersectsTriangle(q.t)).map(q=>q.name))];
}
const allowed=(kind,q)=>kind==='arch bridge'?['sea_bridge_board','sea_bridge_landing','timber_paving_slab'].includes(q.walkClass):true;
function top(x,z,kind,guide){
 const found=supportIndex.query(x,z).filter(q=>allowed(kind,q)).map(q=>({q,y:height(q,x,z)})).filter(s=>s.y!==null&&Math.abs(s.y-guide)<(kind==='arch bridge'?6:1.9));
 return found.sort((a,b)=>b.y-a.y)[0]??null;
}
function lineInterval(q,a,b){
 // Clip a projected line segment to a triangle using barycentric half-planes.
 const vs=[q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()];
 if((vs[1][0]-vs[0][0])*(vs[2][2]-vs[0][2])-(vs[1][2]-vs[0][2])*(vs[2][0]-vs[0][0])<0)vs.reverse();
 let lo=0,hi=1;
 for(let i=0;i<3;i++){
  const p=vs[i],r=vs[(i+1)%3],side=v=>(r[0]-p[0])*(v[2]-p[2])-(r[2]-p[2])*(v[0]-p[0]),sa=side(a),sb=side(b);
  if(sa<0&&sb<0)return null;
  if((sa<0)!==(sb<0)){const t=sa/(sa-sb);if(sa<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}
 }return lo<=hi?[lo,hi]:null;
}
function mergedIntervals(intervals){
 const out=[];for(const p of intervals.sort((a,b)=>a[0]-b[0])){const last=out.at(-1);if(last&&p[0]<=last[1]+1e-7)last[1]=Math.max(last[1],p[1]);else out.push([...p]);}return out;
}
function segmentSupport(a,b,kind){
 const length=dist(a,b),mid=lerp(a,b,.5),candidates=supportIndex.query(mid[0],mid[2],length/2+.5).filter(q=>allowed(kind,q)&&q.box.max.y>=Math.min(a[1],b[1])-.25&&q.box.min.y<=Math.max(a[1],b[1])+.25);
 const spans=mergedIntervals(candidates.map(q=>lineInterval(q,a,b)).filter(Boolean)),gaps=[];let cursor=0;
 for(const [lo,hi]of spans){if(lo>cursor+1e-7)gaps.push([cursor*length,lo*length]);cursor=Math.max(cursor,hi);}if(cursor<1-1e-7)gaps.push([cursor*length,length]);
 return {spans,gaps,maxGap:Math.max(0,...gaps.map(g=>g[1]-g[0]))};
}
function fullStrip(a,b,half=.3){
 // Clipping the complete swept rectangle catches obstacles BETWEEN samples.
 const d=dist(a,b);if(d<1e-7)return [];
 const nx=-(b[2]-a[2])/d,nz=(b[0]-a[0])/d;
 const polygon=[[a[0]+nx*half,0,a[2]+nz*half],[a[0]-nx*half,0,a[2]-nz*half],[b[0]-nx*half,0,b[2]-nz*half],[b[0]+nx*half,0,b[2]+nz*half]],mid=lerp(a,b,.5),blocked=new Set();
 const low=Math.min(a[1],b[1])+.23,high=Math.max(a[1],b[1])+2.1;
 for(const q of hardIndex.query(mid[0],mid[2],d/2+half)){
  if(q.box.max.y<low||q.box.min.y>high)continue;const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],polygon);
  if(ps.length&&Math.max(...ps.map(p=>p[1]))>=low&&Math.min(...ps.map(p=>p[1]))<=high)blocked.add(q.name);
 }return [...blocked];
}
const profiles=[];
for(const [from,to,kind]of hooks.path_edges){
 const start=metres(hooks.path_nodes[from].blender),end=metres(hooks.path_nodes[to].blender),length=dist(start,end),count=Math.ceil(length/.25),normal=[-(end[2]-start[2])/length,(end[0]-start[0])/length],points=[];
 for(let i=0;i<=count;i++){
  const at=lerp(start,end,i/count),guide=at[1],found=top(at[0],at[2],kind,guide);
  const y=found?.y??null,position=[at[0],y,at[2]],left=[],right=[];
  if(found)for(const sign of [-1,1])for(let w=0;w<=1.5+.001;w+=.05){
   const x=at[0]+normal[0]*w*sign,z=at[2]+normal[1]*w*sign,s=top(x,z,kind,found.y);
   if(!s||Math.abs(s.y-found.y)>.22||hits([x,s.y,z]).length)break;
   (sign<0?left:right).push(w);
  }
  const obstacles=found?hits(position):[];
  points.push({position,halfWidth:found?Math.max(0,Math.min(left.at(-1)??0,right.at(-1)??0)):0,
   support:found?{owner:found.q.name,node:found.q.nodeIndex,primitive:found.q.primitive,triangle:found.q.triangle,sourceFace:found.q.sourceFace}:null,
   slopeDegrees:found?Math.acos(Math.min(1,found.q.normal.y))*180/Math.PI:null,obstacles});
 }
 const segments=[];
 for(let i=1;i<points.length;i++){
  const a=points[i-1].position,b=points[i].position;
  if(a[1]===null||b[1]===null){segments.push({from:i-1,to:i,status:'unsupported_sample'});continue;}
  const d=dist(a,b),nx=-(b[2]-a[2])/d,nz=(b[0]-a[0])/d,seams=[];
  // Eleven exact longitudinal strips cover the complete 0.6m body width at
  // 6cm increments; additionally all triangle-boundary cross sections below.
  const query=supportIndex.query((a[0]+b[0])/2,(a[2]+b[2])/2,d/2+.4);
  const lateralCuts=new Set(Array.from({length:11},(_,i)=>-.3+i*.06));
  for(const q of query)for(const v of [q.t.a,q.t.b,q.t.c]){
   const u=(v.x-a[0])*nx+(v.z-a[2])*nz;if(u>-.3&&u<.3)lateralCuts.add(u);
  }
  const sorted=[...lateralCuts].sort((a,b)=>a-b),cuts=sorted.flatMap((v,j)=>j?[v,(v+sorted[j-1])/2]:[v]);
  for(const w of cuts){const aa=[a[0]+nx*w,a[1],a[2]+nz*w],bb=[b[0]+nx*w,b[1],b[2]+nz*w],s=segmentSupport(aa,bb,kind);if(s.maxGap>1e-5)seams.push({lateral:w,maxGap:s.maxGap,gaps:s.gaps});}
  const blocked=fullStrip(a,b),step=Math.abs(b[1]-a[1]),maxGap=Math.max(0,...seams.map(s=>s.maxGap));
  const status=blocked.length?'obstructed':maxGap>.03?'open_seam':step>.22?'step_too_high':Math.min(points[i-1].halfWidth,points[i].halfWidth)<.3?'narrow':'verified';
  segments.push({from:i-1,to:i,status,maxSeam:maxGap,heightChange:step,obstacles:blocked,seamStrips:seams});
 }
 const problems=[...new Set(segments.filter(s=>s.status!=='verified').map(s=>s.status))];
 if(points.some(p=>p.slopeDegrees>30))problems.push('slope_over_30_degrees');
 const transition=to==='DOOR'||from==='DOOR';
 profiles.push({id:from+'__'+to,from,to,kind,status:transition?'interaction_transition':problems.length?'blocked':'walkable',usable:!transition&&!problems.length,
  length,sampleSpacing:length/count,minimumVerifiedHalfWidth:Math.min(...points.map(p=>p.halfWidth)),maxFaceSlopeDegrees:Math.max(...points.map(p=>p.slopeDegrees??0)),problems,
  points,segments,transition:transition?{stopAt:'STAIR_TOP',action:'open_outdoor_journal_or_use_authored_interior_camera',reason:'Official DOOR intersects the rear wall; no straight-through walk'}:null});
}

// A FULL radius of 3.766m is used here, more conservative than the previous
// camp's circle+tent hull. Every actual terrain triangle and solid is queried.
const campRadius=3.766,campCentre=[32,0,34];
const circle=Array.from({length:192},(_,i)=>{const r=campRadius/Math.cos(Math.PI/192),a=i*Math.PI/96;return [campCentre[0]+r*Math.cos(a),0,campCentre[2]+r*Math.sin(a)];});
const campTerrain=[];
for(const q of terrainIndex.query(32,34,campRadius)){const p=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],circle);if(p.length>=3&&area(p)>1e-9)campTerrain.push({triangle:q.triangle,points:p,area:area(p),slope:Math.acos(q.normal.y)*180/Math.PI});}
const campHeights=campTerrain.flatMap(p=>p.points.map(v=>v[1])),low=Math.min(...campHeights),high=Math.max(...campHeights),terraceTop=Math.ceil((high+.06)*100)/100,terraceBottom=Math.floor((low-.15)*100)/100;
function prismObjects(polygon,lo,hi,index){
 const box=new Box3().setFromPoints(polygon.map(p=>new Vector3(...p))),centre=box.getCenter(new Vector3()),r=box.getSize(new Vector3()).length()/2,found=new Set();
 for(const q of index.query(centre.x,centre.z,r)){if(q.box.max.y<lo||q.box.min.y>hi)continue;const p=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],polygon);if(p.length&&Math.max(...p.map(v=>v[1]))>=lo&&Math.min(...p.map(v=>v[1]))<=hi)found.add(q.name);}
 return [...found];
}
const campHard=prismObjects(circle,low+.02,terraceTop+2.1,hardIndex),campSoft=prismObjects(circle,low,terraceTop+2.1,softIndex);
// Search actual main-trail positions for a complete landing, then propose a
// supported new connector. This is proposed geometry, not phantom walk support.
const landingCandidates=[];
for(const p of profiles.filter(p=>['ENTRY__J1','J1__T1','T1__T2'].includes(p.id)))for(const sample of p.points){
 if(!sample.support||sample.halfWidth<.6)continue;
 const end=sample.position,d=dist(campCentre,end);if(d>24||d<campRadius+2)continue;
 const dx=(end[0]-32)/d,dz=(end[2]-34)/d,start=[32+dx*(campRadius-.3),terraceTop,34+dz*(campRadius-.3)],normal=[-dz,dx],w=.6;
 const outline=[[start[0]+normal[0]*w,0,start[2]+normal[1]*w],[start[0]-normal[0]*w,0,start[2]-normal[1]*w],[end[0]-normal[0]*w,0,end[2]-normal[1]*w],[end[0]+normal[0]*w,0,end[2]+normal[1]*w]];
 const terrainPieces=[];
 for(const q of terrainIndex.query((start[0]+end[0])/2,(start[2]+end[2])/2,d/2+.7)){const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(ps.length>=3&&area(ps)>1e-8)terrainPieces.push({triangle:q.triangle,points:ps,area:area(ps)});}
 const hs=terrainPieces.flatMap(p=>p.points.map(v=>v[1]));if(!hs.length)continue;
 const minGround=Math.min(...hs),maxGround=Math.max(...hs),bottom=Math.floor((minGround-.15)*100)/100;
 const hardObjects=prismObjects(outline,Math.min(terraceTop,end[1])+.23,Math.max(terraceTop,end[1])+2.1,hardIndex);
 const subgradeObstacles=prismObjects(outline,bottom,Math.max(terraceTop,end[1]),hardIndex);
 const planting=prismObjects(outline,minGround,Math.max(terraceTop,end[1])+2.1,softIndex);
 const samples=[],N=Math.ceil(dist(start,end)/.25);
 for(let i=0;i<=N;i++){const at=lerp(start,end,i/N);samples.push(at);}
 const landing=[];
 for(const t of [-.45,-.3,-.15,0,.15,.3,.45])for(const lateral of [-.6,-.45,-.3,-.15,0,.15,.3,.45,.6]){
  const x=end[0]+dx*t+normal[0]*lateral,z=end[2]+dz*t+normal[1]*lateral,s=surface(supportIndex,x,z,end[1]+.22);
  landing.push({position:[x,s?.y??null,z],step:s?Math.abs(s.y-end[1]):null,obstacles:s?hits([x,s.y,z],.15):[]});
 }
 const landingMissing=landing.filter(s=>s.position[1]===null).length,landingStep=Math.max(0,...landing.map(s=>s.step??0)),landingObstacles=[...new Set(landing.flatMap(s=>s.obstacles))];
 landingCandidates.push({endProfile:p.id,start,end,width:1.2,outline,topProfile:samples,bottom,depthRange:[Math.min(terraceTop,end[1])-bottom,Math.max(terraceTop,end[1])-bottom],
  terrainHeightRange:[minGround,maxGround],terrainCoveredArea:terrainPieces.reduce((s,p)=>s+p.area,0),footprintArea:area(outline),gradeDegrees:Math.atan2(Math.abs(end[1]-terraceTop),dist(start,end))*180/Math.PI,
  headObstacles:hardObjects,foundationObstacles:subgradeObstacles,planting,landing:{samples:landing,missing:landingMissing,maxStep:landingStep,obstacles:landingObstacles},
  status:hardObjects.length||subgradeObstacles.length||landingMissing||landingStep>.22||landingObstacles.length?'rejected':'proposed_not_built'});
}
landingCandidates.sort((a,b)=>(a.status==='rejected')-(b.status==='rejected')||dist(a.start,a.end)-dist(b.start,b.end));
const connector=landingCandidates[0]??null;
const result={schema:'out-there-walk-profiles/v1',units:'Three metres: [Blender.x, Blender.z+6, -Blender.y]/1.56',source:{geometryRevision:'official-p11-web-current-layered-treads',invalidatedByLandscapeRefinement:true,officialModel:'models/out-there/glb/poly_dome11_web.glb',sha256:modelSha,hooksSha256:await sha(hooksFile)},
 assumptions:{bodyDiameter:.6,headHeight:2.1,maxStep:.22,maxSeam:.03,sampleSpacingLimit:.3,widthProbeSpacing:.05,triangleMatchingTolerance:.085,
  widthMeaning:'halfWidth is allowable lateral CENTRE displacement for a 0.6m body, after body probes; minimum0.3 gives additional side margin. It is not a raw paving width.',
  safety:'usable only when all sampled stations and swept full-width strips pass; topology alone never enables an edge. Animated-animal clearance is frame-zero only.'},
 geometry:{officialTriangles:triangles.length,classifiedSupportTriangles:support.length,maximumSourceMatchError:maximumMatchError,collisionInventory},
 profiles,summary:{walkable:profiles.filter(p=>p.usable).map(p=>p.id),blocked:profiles.filter(p=>p.status==='blocked').map(p=>({id:p.id,problems:p.problems})),transitions:profiles.filter(p=>p.status==='interaction_transition').map(p=>p.id)},
 camp:{status:campHard.length?'site_collision':'terrace_and_connector_proposal_required',centre:campCentre,radius:campRadius,terrain:{heightRange:[low,high],relief:high-low,maxSlope:Math.max(...campTerrain.map(p=>p.slope)),footprintArea:area(circle),coveredAreaSum:campTerrain.reduce((s,p)=>s+p.area,0),pieces:campTerrain},
  terrace:{top:terraceTop,bottom:terraceBottom,totalDepth:terraceTop-terraceBottom,fillAboveTerrain:[terraceTop-high,terraceTop-low],shape:'192-sided circumscribed circular solid; underside below the entire measured terrain footprint; no floating plane',hardObstacles:campHard,plantingToClip:campSoft},
  connector,otherConnectorCandidates:landingCandidates.slice(1,6).map(({topProfile,landing,...c})=>({...c,landing:{missing:landing.missing,maxStep:landing.maxStep,obstacles:landing.obstacles}})),built:false,reanchorApproved:false},
 limitations:['Profiles are an offline geometric certificate candidate; browser/physical-device journey validation remains required.','Official source/model is unchanged. Proposed camp terrace/connector is not rendered, navigable or approved until implemented and inspected.','DOOR remains an interaction transition, with no walking through the rear wall.','Planting conflicts are reported separately; a terrace requires explicit localized clipping of intersecting planting.','Finite width sampling supplements exact swept-triangle obstacle clipping; seam/width proof is conservative within the stated discretization.']};
assert.ok(profiles.every(p=>p.sampleSpacing<=.3));
assert.ok(profiles.filter(p=>p.usable).every(p=>p.points.every(q=>q.position.every(Number.isFinite)&&q.halfWidth>=.3)&&p.segments.every(s=>s.status==='verified')));
assert.equal(await sha(modelFile),modelSha);
await writeFile(output,JSON.stringify(result,(_,v)=>typeof v==='number'&&Number.isFinite(v)?+v.toFixed(5):v,2)+'\n');
console.log(JSON.stringify({support:support.length,matchError:maximumMatchError,summary:result.summary,camp:{terrain:result.camp.terrain.heightRange,terrace:result.camp.terrace,connector:connector?{status:connector.status,start:connector.start,end:connector.end,depth:connector.depthRange,head:connector.headObstacles,foundation:connector.foundationObstacles,landing:{missing:connector.landing.missing,step:connector.landing.maxStep,obstacles:connector.landing.obstacles}}:null}},null,2));
