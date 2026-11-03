// Read-only, hash-pinned audit of rendered world road strips against shipped GLBs.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {Vector3,Matrix4,Quaternion,Triangle,Box3,BoxGeometry,CatmullRomCurve3} from 'three';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {regions,WORLD_RADIUS} from '../app/lib/world-layout.mjs';
import {walkingRoutes,pathSample,pathHalfWidth,worldPavingGeometry,walkwayPlacements} from '../app/lib/world-paths.mjs';
import {bayTraffic} from '../app/lib/bay-traffic.mjs';
import {bridgeGeometry} from '../app/lib/bay-bridge.mjs';
import {homeSite} from '../app/lib/home-site.mjs';
import {madeCampus} from '../app/lib/made-campus-data.mjs';
import {aetherSite} from '../app/lib/made-stage.mjs';
import {afterHoursCoastSource} from '../app/lib/authored-island-sites.mjs';
import {fieldnotesCoastSource} from '../app/lib/fieldnotes-coast-site.mjs';
import {outThereLiveSource} from '../app/lib/out-there-site.mjs';
import {courts} from '../app/lib/court-layout.mjs';
const app=fileURLToPath(new URL('../',import.meta.url)),reportDir=app+'../../research/island-polish-2026-11-02/';
const hash=s=>createHash('sha256').update(s).digest('hex');
const configHashes={};for(const p of ['world-layout.mjs','world-paths.mjs','made-stage.mjs','out-there-site.mjs'])configHashes[p]=hash(await readFile(app+'app/lib/'+p));
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const specifications=[['home-land','studio',homeSite.landform],['home-architecture','studio',homeSite.architecture],['made-campus','projects',madeCampus.source],['aether','projects','/models/islands/made-aether.glb',aetherSite],['afterhours','court',afterHoursCoastSource],['outthere','trail',outThereLiveSource],['fieldnotes','future',fieldnotesCoastSource]];
const triangles=[],assets=[],inventory={};
const hiddenOutthere=/^(ground|plunge_pool|lake_ripples|falls_mist|ocean|hills|sky_card|sky_ridge|cable_line|cable_towers|gondolas)$/;
const visual=/water|ocean|pool|tarn|foam|mist|ripple|glow|emissive|lakewater/i;
for(const [id,regionId,url,local]of specifications){
 const file=app+'public'+url.split('?')[0],bytes=await readFile(file),doc=await io.read(file),region=regions.find(r=>r.id===regionId);
 const outer=new Matrix4().makeTranslation(region.offset[0],0,region.offset[2]);
 if(id==='outthere')outer.multiply(new Matrix4().makeTranslation(0,6/1.56,0)).multiply(new Matrix4().makeScale(1/1.56,1/1.56,1/1.56));
 if(local)outer.multiply(new Matrix4().compose(new Vector3(...local.center),new Quaternion().setFromAxisAngle(new Vector3(0,1,0),local.yaw),new Vector3(1,1,1)));
 let count=0;
 for(const node of doc.getRoot().listNodes()){
  if(!node.getMesh())continue;let owner=node;while(!owner.getName()&&owner.getParentNode())owner=owner.getParentNode();const name=owner.getName()||'unnamed';
  if(id==='outthere'&&hiddenOutthere.test(name))continue;
  const matrix=outer.clone().multiply(new Matrix4().fromArray(node.getWorldMatrix()));
  for(const [primitive,p]of node.getMesh().listPrimitives().entries()){
   const mat=p.getMaterial()?.getName()??'',isVisual=visual.test(mat)||(/water|ocean|pool|tarn|foam|mist|ripple/i.test(name)&&!/(Tower|House|Walk|Deck|Stone|Wall|Border)/i.test(name));
   const positions=p.getAttribute('POSITION'),ix=p.getIndices(),get=i=>new Vector3().fromArray(positions.getElement(ix?ix.getScalar(i):i,[])).applyMatrix4(matrix);
   for(let i=0;i<(ix?.getCount()??positions.getCount());i+=3){
    const t=new Triangle(get(i),get(i+1),get(i+2)),q={t,id,regionId,name,primitive,triangle:i/3,material:mat,visual:isVisual,normal:t.getNormal(new Vector3()),box:new Box3().setFromPoints([t.a,t.b,t.c])};
    triangles.push(q);count++;const key=id+'/'+name;if(!inventory[key])inventory[key]={triangles:0,bounds:new Box3()};inventory[key].triangles++;inventory[key].bounds.union(q.box);
   }
  }
 }
 assets.push({id,regionId,file,sha256:hash(bytes),triangles:count,outerMatrix:outer.toArray()});
}
class Index{constructor(ts,size=4){this.size=size;this.map=new Map();for(const q of ts){const sx=Math.floor(q.box.min.x/size),ex=Math.floor(q.box.max.x/size),sz=Math.floor(q.box.min.z/size),ez=Math.floor(q.box.max.z/size);if((ex-sx+1)*(ez-sz+1)>30000)throw Error('Unexpected large visible mesh '+q.id+'/'+q.name);for(let x=sx;x<=ex;x++)for(let z=sz;z<=ez;z++){let k=x+','+z;if(!this.map.has(k))this.map.set(k,[]);this.map.get(k).push(q);}}}query(box){let found=new Set();for(let x=Math.floor(box.min.x/this.size);x<=Math.floor(box.max.x/this.size);x++)for(let z=Math.floor(box.min.z/this.size);z<=Math.floor(box.max.z/this.size);z++)for(const q of this.map.get(x+','+z)??[])found.add(q);return [...found];}}
const index=new Index(triangles.filter(t=>!t.visual));
// Junction landings are supported by the other route's actual ribbon triangles,
// never by the new branch's own deck (which would make this check vacuous).
function joinedDeckIndex(route) {
 if(!route.joinsRoute)return null;
 const r=walkingRoutes.find(r=>r.from===route.joinsRoute.from&&r.to===route.joinsRoute.to);
 const geometry=worldPavingGeometry([r]),p=geometry.attributes.position,ix=geometry.index,faces=[];
 for(let i=0;i<ix.count;i+=3){const v=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,ix.getX(i+j)).add(new Vector3(0,-WORLD_RADIUS,0))),t=new Triangle(...v);faces.push({t,id:'shared-approach',name:r.from+'__'+r.to,normal:t.getNormal(new Vector3()),box:new Box3().setFromPoints(v)});}
 geometry.dispose();return new Index(faces);
}

const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
function signed(poly){return poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a[0]*b[2]-b[0]*a[2];},0)/2;}
function clip(subject,boundary){let out=subject,outline=signed(boundary)<0?[...boundary].reverse():boundary;for(let i=0;i<outline.length&&out.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],side=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]),input=out;out=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);if(sp>=-1e-8)out.push(p);if((sp>=0)!==(sq>=0))out.push(lerp(p,q,sp/(sp-sq)));}}return out;}
function height(t,x,z){const a=t.a,b=t.b,c=t.c,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(d)<1e-10)return null;const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d,w=1-u-v;return u>=-1e-7&&v>=-1e-7&&w>=-1e-7?u*a.y+v*b.y+w*c.y:null;}
if (process.argv.includes('--traffic')) {
 const decks = worldPavingGeometry();
 const positions = decks.attributes.position, indices = decks.index;
 const pavement = [];
 for (let i = 0; i < indices.count; i += 3) {
  const vertices = [0,1,2].map(j => new Vector3().fromBufferAttribute(positions,indices.getX(i+j)).add(new Vector3(0,-WORLD_RADIUS,0)));
  pavement.push({t:new Triangle(...vertices),name:'bay deck',box:new Box3().setFromPoints(vertices)});
 }
 const structure = bridgeGeometry();
 for (const [kind, geometry] of Object.entries(structure.geometries)) {
  if (kind === 'light') continue;
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i += 3) {
   const vertices = [0,1,2].map(j => new Vector3().fromBufferAttribute(p,i+j).add(new Vector3(0,-WORLD_RADIUS,0)));
   pavement.push({t:new Triangle(...vertices),name:'red span '+kind,box:new Box3().setFromPoints(vertices)});
  }
 }
 // Conservative bounds of the drawn bevelled pier and curb instances. Boat
 // clearance must include their full below-deck volume, not just the roadway.
 for(const [kind,pieces] of Object.entries(walkwayPlacements())){
  if(kind==='tiles')continue;
  for(const piece of pieces){
   const geometry=new BoxGeometry(...piece.size).toNonIndexed();
   const matrix=new Matrix4().makeBasis(piece.right,piece.up,piece.forward);
   matrix.setPosition(piece.position.clone().add(new Vector3(0,-WORLD_RADIUS,0)));
   geometry.applyMatrix4(matrix);const p=geometry.attributes.position;
   for(let i=0;i<p.count;i+=3){const v=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,i+j));pavement.push({t:new Triangle(...v),name:'walkway '+kind,box:new Box3().setFromPoints(v)});}
   geometry.dispose();
  }
 }
 const trafficIndex = new Index([...triangles.filter(t=>!t.visual), ...pavement]);
 for (const vessel of bayTraffic) {
  const [halfWidth, halfLength, top] = vessel.envelope;
  const n = vessel.line ? Math.ceil(vessel.line.getLength() / .5) : 1;
  const collisions = new Map();
  for (let i = 0; i < n; i++) {
   const center = vessel.line?.getPointAt(i/n) ?? new Vector3(...vessel.at);
   const tangent = vessel.line?.getTangentAt(i/n) ?? new Vector3(Math.sin(vessel.yaw),0,Math.cos(vessel.yaw));
   const side = new Vector3(tangent.z,0,-tangent.x);
   const outline = [[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,z]) =>
    center.clone().addScaledVector(side,x*halfWidth).addScaledVector(tangent,z*halfLength).toArray());
   const bounds = new Box3().setFromPoints(outline.map(v=>new Vector3(...v)));
   for (const candidate of trafficIndex.query(bounds)) {
    if (candidate.box.max.y < -.42 || candidate.box.min.y > top) continue;
    const polygon = clip([candidate.t.a.toArray(),candidate.t.b.toArray(),candidate.t.c.toArray()],outline);
    if (polygon.length && Math.max(...polygon.map(v=>v[1])) > -.42 &&
      Math.min(...polygon.map(v=>v[1])) < top && !collisions.has(candidate.name))
     collisions.set(candidate.name,center.toArray().map(v=>+v.toFixed(2)));
   }
  }
  console.log(JSON.stringify({ vessel:vessel.id, samples:n, collisions:Object.fromEntries(collisions) }));
  if (collisions.size) process.exitCode=1;
 }
 process.exit();
}
if(process.argv.includes('--proposals')){
 const R=id=>walkingRoutes.find(r=>r.from+'__'+r.to===id),point=(r,end)=>[...(end?r.endPoint:r.startPoint).clone().add(new Vector3(0,-WORLD_RADIUS,0)).toArray()];
 const bay=R('projects__court'),future=R('trail__future'),made=R('trail__projects'),court=R('studio__court');
 const trials=[
 ['bay-east-over',bay,[point(bay,0),[-61,2.65,-29],[-58,4.4,-12],[-57,6,19],[-75,4.7,34],[-114,3.8,45],[-128,4,34],[-125,4,27],point(bay,1)]],
 ['bay-east-over2',bay,[point(bay,0),[-61,2.65,-29],[-58,4.5,-12],[-57,7,19],[-75,4.7,34],[-114,3.8,45],[-128,4,34],[-125,4,27],point(bay,1)]],
 ['made-dogleg',made,[point(made,0),[-36.5,4.72,26.3],[-36.2,4.72,30.2],point(made,1)]],
 ['made-dogleg-west',made,[point(made,0),[-36.9,4.72,26.3],[-36.8,4.72,30.2],point(made,1)]],
 ['bay-west-core',bay,[point(bay,0),[-61,2.65,-29],[-78,2.8,-12],[-80,2.8,19],[-82,3.15,34],[-114,3.8,45],[-128,4,34],[-125,4,27],point(bay,1)]],
 ['bay-west-core2',bay,[point(bay,0),[-61,2.65,-29],[-75,2.8,-12],[-76,2.8,19],[-80,3.15,34],[-114,3.8,45],[-128,4,34],[-125,4,27],point(bay,1)]],
 ['bay-west-core3',bay,[point(bay,0),[-61,2.65,-29],[-77,2.8,-12],[-78,2.8,19],[-81,3.15,34],[-114,3.8,45],[-128,4,34],[-125,4,27],point(bay,1)]],
 ['home-court-inset',court,[[61.4,2.63,-58],[104.5,2.821,-26.7]]],
 ['made-level-east-exit',made,[point(made,0),[-33,4.72,27],[-32,4.72,32],point(made,1)]],
 ['made-level-south-exit',made,[point(made,0),[-38,4.72,30.5],[-36,4.4,33.5],point(made,1)]],
 ['bay-east-westtail',bay,[point(bay,0),[-61,2.65,-29],[-58,2.8,-12],[-57,2.8,19],[-75,3.15,34],[-114,3.8,45],[-128,4,34],[-125,4,27],point(bay,1)]],
 ['bay-westtail2',bay,[point(bay,0),[-61,2.65,-29],[-58,2.8,-12],[-57,2.8,19],[-75,3.15,34],[-124,3.8,45],[-130,4,30],[-125,4,24],point(bay,1)]],
 ['bay-westtail3',bay,[point(bay,0),[-61,2.65,-29],[-58,2.8,-12],[-57,2.8,19],[-75,3.15,34],[-120,3.8,47],[-128,4,39],[-130,4,28],[-124,4,24],point(bay,1)]],
 ['future-west-exit',future,[point(future,0),[-126,4.05,27],[-130,4.2,38],[-128,3.9,50],[-112,1.7,75],point(future,1)]],
 ['future-west-exit2',future,[point(future,0),[-126,4.05,25],[-132,4.2,34],[-130,3.9,49],point(future,1)]],
 ];
 for(const [id,base,pts]of trials){const curve=new CatmullRomCurve3(pts.map(p=>new Vector3(p[0],p[1]+WORLD_RADIUS,p[2]))),route={...base,curve,length:curve.getLength()},count=Math.ceil(route.length/.5),hits=new Map();let grade=0;
 for(let i=0;i<count;i++){const t0=i/count,t1=(i+1)/count,a=pathSample(route,t0,0,.116).position.add(new Vector3(0,-WORLD_RADIUS,0)),b=pathSample(route,t1,0,.116).position.add(new Vector3(0,-WORLD_RADIUS,0)),outline=[[t0,-1],[t0,1],[t1,1],[t1,-1]].map(([t,s])=>pathSample(route,t,s*(pathHalfWidth(route,t)+.055),.115).position.add(new Vector3(0,-WORLD_RADIUS,0)).toArray()),box=new Box3().setFromPoints(outline.map(v=>new Vector3(...v))),dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz);grade=Math.max(grade,Math.atan2(Math.abs(b.y-a.y),l)*180/Math.PI);
 for(const q of index.query(box)){if(q.box.max.y<Math.min(a.y,b.y)+.22||q.box.min.y>Math.max(a.y,b.y)+2.1)continue;const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(!ps.length)continue;const ds=ps.map(p=>p[1]-(a.y+(b.y-a.y)*((p[0]-a.x)*dx+(p[2]-a.z)*dz)/(l*l)));if(Math.max(...ds)>.22&&Math.min(...ds)<2.1){const k=q.id+'/'+q.name,h=hits.get(k);if(h)h.t[1]=t1;else hits.set(k,{t:[t0,t1],point:a.toArray()});}}
 }
 const endpoints=[];for(const t of [0,1]){const lanes=[];for(const ratio of [-1,-.5,0,.5,1]){const p=pathSample(route,t,ratio*(pathHalfWidth(route,t)+.055),.115).position.add(new Vector3(0,-WORLD_RADIUS,0)),box=new Box3(new Vector3(p.x-.001,-100,p.z-.001),new Vector3(p.x+.001,100,p.z+.001));let hs=index.query(box).filter(q=>q.normal.y>.5).map(q=>({mesh:q.id+'/'+q.name,y:height(q.t,p.x,p.z)})).filter(h=>h.y!==null&&Math.abs(h.y-p.y)<2).sort((a,b)=>Math.abs(a.y-p.y)-Math.abs(b.y-p.y));lanes.push({ratio,step:hs[0]?hs[0].y-p.y:null,mesh:hs[0]?.mesh});}endpoints.push({t,lanes});}
 console.log(JSON.stringify({id,points:pts,grade,hits:[...hits.entries()].map(([mesh,d])=>({mesh,...d})),endpoints}));
 }
 process.exit(0);
}
const paving=worldPavingGeometry(),vp=paving.attributes.position,results=[];let vertexOffset=0;
for(const route of walkingRoutes){
 const joinedIndex=joinedDeckIndex(route);
 const steps=Math.ceil(route.length/.72),bodyHits=new Map(),surfaceContacts=new Map(),reservedHits=[],sections=[];let maxGrade=0,gradeAt=null;
 for(let i=0;i<steps;i++){
  const t0=i/steps,t1=(i+1)/steps,tm=(t0+t1)/2;
  const centre0=pathSample(route,t0,0,.116).position.clone().add(new Vector3(0,-WORLD_RADIUS,0)),centre1=pathSample(route,t1,0,.116).position.clone().add(new Vector3(0,-WORLD_RADIUS,0));
  let outline;
  if(!route.authored){const get=(row,j)=>new Vector3().fromBufferAttribute(vp,vertexOffset+row*6+j).add(new Vector3(0,-WORLD_RADIUS,0)).toArray();outline=[get(i,0),get(i,5),get(i+1,5),get(i+1,0)];}
  else{outline=[[t0,-1],[t0,1],[t1,1],[t1,-1]].map(([t,s])=>pathSample(route,t,s*(pathHalfWidth(route,t)+.055),.115).position.add(new Vector3(0,-WORLD_RADIUS,0)).toArray());}
  const box=new Box3().setFromPoints(outline.map(v=>new Vector3(...v))),dx=centre1.x-centre0.x,dz=centre1.z-centre0.z,len=Math.hypot(dx,dz),floorAt=p=>centre0.y+(centre1.y-centre0.y)*((p[0]-centre0.x)*dx+(p[2]-centre0.z)*dz)/(len*len);
  const grade=Math.atan2(Math.abs(centre1.y-centre0.y),len)*180/Math.PI;if(grade>maxGrade){maxGrade=grade;gradeAt={t:tm,point:centre0.clone().add(centre1).multiplyScalar(.5).toArray()};}
  const endpoint=Math.min(t0,1-t1)*route.length<4;
  for(const q of index.query(box)){
   if(q.box.max.y<Math.min(centre0.y,centre1.y)-.2||q.box.min.y>Math.max(centre0.y,centre1.y)+2.1)continue;
   const polygon=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(!polygon.length)continue;
   const gaps=polygon.map(v=>v[1]-floorAt(v)),lo=Math.min(...gaps),hi=Math.max(...gaps),key=q.id+'/'+q.name;
   const hit={key,tRange:[t0,t1],point:centre0.clone().add(centre1).multiplyScalar(.5).toArray(),intersection:polygon,gap:[lo,hi],primitive:q.primitive,triangle:q.triangle,normalY:q.normal.y,endpoint};
   if(hi>.22&&lo<2.1){const prev=bodyHits.get(key);if(!prev)bodyHits.set(key,{...hit,segments:1,lastT:t1,maxAboveDeck:hi});else{prev.segments++;prev.lastT=t1;prev.maxAboveDeck=Math.max(prev.maxAboveDeck,hi);}}
   else if(q.normal.y>.6&&hi>=-.12&&lo<=.12){const prev=surfaceContacts.get(key);if(!prev)surfaceContacts.set(key,{...hit,segments:1,lastT:t1,intentionalEndpointSupport:endpoint});else{prev.segments++;prev.lastT=t1;prev.intentionalEndpointSupport&&=endpoint;}}
  }
  for(const [name,c]of Object.entries(courts)){const r=regions.find(r=>r.id==='court'),x=r.offset[0]+c.center[0],z=r.offset[2]+c.center[1],hx=c.width/2+c.apron,hz=c.depth/2+c.apron,poly=[[x-hx,0,z-hz],[x+hx,0,z-hz],[x+hx,0,z+hz],[x-hx,0,z+hz]];const overlap=clip(outline,poly);if(overlap.length>=3&&Math.abs(signed(overlap))>1e-6)reservedHits.push({name,tRange:[t0,t1],point:centre0.toArray(),area:Math.abs(signed(overlap))});}
  sections.push({tRange:[t0,t1],outline,centre:[centre0.toArray(),centre1.toArray()]});
 }
 if(!route.authored)vertexOffset+=(steps+1)*6;
 // Endpoint support uses all actual width lanes, not just the centre or a
 // navigation hook. The road's own triangles are not counted as island support.
 const endpoints=[];
 for(const t of [0,1]){const lanes=[];for(const ratio of [-1,-.75,-.5,-.25,0,.25,.5,.75,1]){const p=pathSample(route,t,ratio*(pathHalfWidth(route,t)+.055),.115).position.add(new Vector3(0,-WORLD_RADIUS,0)),b=new Box3(new Vector3(p.x-.001,-100,p.z-.001),new Vector3(p.x+.001,100,p.z+.001));const hits=[...index.query(b),...(t===0&&joinedIndex?joinedIndex.query(b):[])].filter(q=>q.normal.y>.5).map(q=>({q,y:height(q.t,p.x,p.z)})).filter(h=>h.y!==null&&Math.abs(h.y-p.y)<2).sort((a,b)=>Math.abs(a.y-p.y)-Math.abs(b.y-p.y));lanes.push({lane:ratio,point:p.toArray(),support:hits[0]?{mesh:hits[0].q.id+'/'+hits[0].q.name,y:hits[0].y,step:hits[0].y-p.y}:null});}endpoints.push({t,lanes});}
 const authoredSupport=[];
 if(route.authored){const n=Math.ceil(route.length/.3);for(let i=0;i<=n;i++)for(const ratio of [-1,-.5,0,.5,1]){const t=i/n,p=pathSample(route,t,ratio*(pathHalfWidth(route,t)+.055),.115).position.add(new Vector3(0,-WORLD_RADIUS,0)),box=new Box3(new Vector3(p.x-.001,-100,p.z-.001),new Vector3(p.x+.001,100,p.z+.001));const hs=index.query(box).filter(q=>q.normal.y>.5).map(q=>({name:q.id+'/'+q.name,y:height(q.t,p.x,p.z)})).filter(h=>h.y!==null&&Math.abs(h.y-p.y)<=.22);if(!hs.length)authoredSupport.push({t,lane:ratio,point:p.toArray(),problem:'No upward shipped support within .22m'});}}
 results.push({id:route.from+'__'+route.to,authored:route.authored,length:route.length,renderedWidth:[2*(pathHalfWidth(route,0)+.055),Math.max(...sections.map(s=>2*(pathHalfWidth(route,(s.tRange[0]+s.tRange[1])/2)+.055)))],maxGradeDegrees:maxGrade,gradeAt,authoredSupportFailures:authoredSupport,bodyHits:[...bodyHits.values()],surfaceContacts:[...surfaceContacts.values()],reservedHits,endpoints,sections});
}
const report={schema:'authored-bay-physical-audit/v1',frame:'Bay-relative metres: global world Y minus WORLD_RADIUS=450; X/Z identical to rendered world',configHashes,assets,body:{clearanceAboveDeck:.22,headroom:2.1},method:'Decoded shipped mesh triangles, full actual worldPavingGeometry outer strip edges including bevel. Every source triangle is clipped against each rendered section in XZ, then measured against the slope-following deck height. Low upward surfaces within ±.12m at first/last4m are intentional endpoint support, not collisions. Legacy playing rectangles include complete apron.',routes:results,limitations:['Bounded initial physical audit; static frame/closed Aether facade only.','Runtime legacy furniture beyond the reserved court rectangles is not a GLB and is not fully reconstructed in this pass.','Render-only water/foam/glow materials excluded; soft planting remains included.','No physical-device/browser acceptance claim. Open-water bridge structural foundations are not certified by a walk-support surface audit.','Declared authored court→entertainment route has no global paving geometry; its corridor is checked against the shipped authored coast.']};
if(!process.argv.includes('--check-only')){await mkdir(reportDir,{recursive:true});await writeFile(reportDir+'authored-bay-paths.json',JSON.stringify(report,(_,v)=>typeof v==='number'?+v.toFixed(6):v,2)+'\n');}
console.log(JSON.stringify(results.map(({id,length,maxGradeDegrees,gradeAt,bodyHits,reservedHits,endpoints})=>({id,length,maxGradeDegrees,gradeAt,hits:bodyHits.map(h=>({mesh:h.key,t:[h.tRange[0],h.lastT],point:h.point,maxAboveDeck:h.maxAboveDeck,segments:h.segments})),reserved:reservedHits.length,endpoints:endpoints.map(e=>({t:e.t,lanes:e.lanes.map(l=>({lane:l.lane,support:l.support}))}))})),null,2));

if(process.argv.includes("--check-only") && results.some(r=>r.bodyHits.length||r.reservedHits.length||r.authoredSupportFailures.length||r.endpoints.some(e=>e.lanes.some(l=>!l.support||Math.abs(l.support.step)>.22))))process.exitCode=1;
