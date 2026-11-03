// Separate geometry revision; never mutates the official delivered/public p11.
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {mergeDocuments,prune,dedup,weld,meshopt,unpartition} from '@gltf-transform/functions';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
import {Vector3,Matrix4,Triangle,Box3,Ray} from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {walkingRoutes,pathSample,pathHalfWidth} from '../app/lib/world-paths.mjs';
import {regions,WORLD_RADIUS} from '../app/lib/world-layout.mjs';
const app=fileURLToPath(new URL('../',import.meta.url)),dir=app+'asset-src/authored/out-there/refinement/';
if(process.argv.includes('--build-source')){
 const region=regions.find(r=>r.id==='trail');const samples=[];
 for(const route of walkingRoutes.filter(r=>r.from==='trail'||r.to==='trail')){
  const steps=Math.ceil(route.length/.2);
  for(let i=0;i<=steps;i++){
   const t=i/steps,p=pathSample(route,t,0,.115).position;
   const x=p.x-region.offset[0],z=p.z-region.offset[2];
   if(x < -55 || x > 75 || z < -55 || z > 72)continue;
   // Includes the bevel and the full outside curb, not only the walk centre.
   samples.push([x,p.y-WORLD_RADIUS,z,pathHalfWidth(route,t)+.15]);
  }
 }
 await writeFile(dir+'world-approaches.json',JSON.stringify({schema:'out-there-world-approaches/v1',sampleSpacingMaximum:.2,margin: .24,samples},null,2)+'\n');
 const run=spawnSync('blender',['-b','--disable-autoexec','--python','scripts/blender/build_outthere_refinement.py'],{cwd:app,stdio:'inherit'});assert.equal(run.status,0);}
const original=app+'asset-src/reference/world-pack/models/out-there/glb/poly_dome11_web.glb',target=app+'public/models/islands/out-there-refined.glb';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const before=hash(await readFile(original)),manifest=JSON.parse(await readFile(dir+'manifest.json','utf8'));
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
const doc=await io.read(original),patch=await io.read(dir+'landscape-raw.glb');
function clipContract(doc){return doc.getRoot().listAnimations().map(a=>({name:a.getName(),channels:a.listChannels().map(c=>({target:c.getTargetNode().getName(),path:c.getTargetPath(),interpolation:c.getSampler().getInterpolation(),input:[...c.getSampler().getInput().getArray()],output:[...c.getSampler().getOutput().getArray()]}))})).sort((a,b)=>a.name.localeCompare(b.name));}
function retainedGeometryContract(document,excluded){
 const groups={};
 for(const node of document.getRoot().listNodes()){
  if(!node.getMesh())continue;let owner=node;while(!owner.getName()&&owner.getParentNode())owner=owner.getParentNode();const name=owner.getName();if(excluded.has(name))continue;
  const h=createHash('sha256');h.update(JSON.stringify(node.getWorldMatrix()));
  for(const p of node.getMesh().listPrimitives()){
   for(const sem of p.listSemantics().sort()){const a=p.getAttribute(sem),v=a.getArray();h.update(sem+':'+a.getNormalized()+':'+a.getComponentType());h.update(Buffer.from(v.buffer,v.byteOffset,v.byteLength));}
   const ix=p.getIndices()?.getArray();if(ix)h.update(Buffer.from(ix.buffer,ix.byteOffset,ix.byteLength));
  }
  (groups[name]??=[]).push(h.digest('hex'));
 }
 for(const group of Object.values(groups))group.sort();return groups;
}
const retainedContract=retainedGeometryContract(doc,new Set(manifest.replaceOrRemoveOfficialNodes));
const expectedClips=clipContract(doc);assert.equal(expectedClips.length,22);
await patch.transform(weld(),dedup(),meshopt({encoder:MeshoptEncoder,level:"medium",quantizePosition:16,quantizeColor:12,quantizeNormal:12}));
const removed=[],animatedTargets=new Set(doc.getRoot().listAnimations().flatMap(a=>a.listChannels().map(c=>c.getTargetNode())));
function disposeTree(n){assert.ok(!animatedTargets.has(n),'Cannot remove animated target '+n.getName());for(const c of [...n.listChildren()])disposeTree(c);n.dispose();}
for(const name of manifest.replaceOrRemoveOfficialNodes){const nodes=doc.getRoot().listNodes().filter(n=>n.getName()===name);for(const n of nodes){removed.push(name);disposeTree(n);}}
const originalScene=doc.getRoot().getDefaultScene()??doc.getRoot().listScenes()[0];
mergeDocuments(doc,patch);
for(const scene of [...doc.getRoot().listScenes()])if(scene!==originalScene){for(const n of [...scene.listChildren()]){scene.removeChild(n);originalScene.addChild(n);}scene.dispose();}
doc.getRoot().setDefaultScene(originalScene);
await doc.transform(prune({keepAttributes:true,keepLeaves:true}));
await doc.transform(unpartition());
await io.write(target,doc);
const check=await io.read(target);assert.deepEqual(clipContract(check),expectedClips,'Original animation data changed');
assert.equal(hash(await readFile(original)),before,'Source model was modified');
const exportedContract=retainedGeometryContract(check,new Set());for(const [name,expected]of Object.entries(retainedContract))assert.deepEqual(exportedContract[name],expected,'Retained geometry/transform/palette changed: '+name);
for(const name of ['rock','lookout_vc','cable_station','terrain','pool','trail_continuous','lake_skiff_1','lake_skiff_2'])assert.ok(check.getRoot().listNodes().some(n=>n.getName()===name),'Missing '+name);
for(const mesh of check.getRoot().listMeshes())for(const p of mesh.listPrimitives())if(p.getMaterial()?.getName()==='PT_Flat')assert.ok(p.getAttribute('COLOR_0'),'Lost palette '+mesh.getName());
const tris=[],byName=new Map();
for(const node of check.getRoot().listNodes()){
 if(!node.getMesh())continue;let owner=node;while(!owner.getName()&&owner.getParentNode())owner=owner.getParentNode();const name=owner.getName(),matrix=new Matrix4().fromArray(node.getWorldMatrix());
 for(const [primitive,p]of node.getMesh().listPrimitives().entries()){
 const positions=p.getAttribute('POSITION'),indices=p.getIndices(),get=i=>new Vector3().fromArray(positions.getElement(indices?indices.getScalar(i):i,[])).applyMatrix4(matrix).add(new Vector3(0,6,0)).multiplyScalar(1/1.56);
 for(let i=0;i<(indices?.getCount()??positions.getCount());i+=3){const t=new Triangle(get(i),get(i+1),get(i+2)),q={t,name,primitive,triangle:i/3,box:new Box3().setFromPoints([t.a,t.b,t.c]),normal:t.getNormal(new Vector3())};tris.push(q);if(!byName.has(name))byName.set(name,[]);byName.get(name).push(q);}
 }
}
console.log('Decoded triangles',tris.length);
class Index{constructor(ts,size=3){this.size=size;this.cells=new Map();for(const q of ts)for(let x=Math.floor(q.box.min.x/size);x<=Math.floor(q.box.max.x/size);x++)for(let z=Math.floor(q.box.min.z/size);z<=Math.floor(q.box.max.z/size);z++){const k=x+','+z;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(q);}}query(x,z,r=0){const found=new Set();for(let i=Math.floor((x-r)/this.size);i<=Math.floor((x+r)/this.size);i++)for(let j=Math.floor((z-r)/this.size);j<=Math.floor((z+r)/this.size);j++)for(const q of this.cells.get(i+','+j)??[])found.add(q);return [...found];}}
function height(q,x,z){const a=q.t.a,b=q.t.b,c=q.t.c,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(d)<1e-10)return null;const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d,w=1-u-v;return Math.min(u,v,w)>=-1e-6?u*a.y+v*b.y+w*c.y:null;}
const pavement=new Index(tris.filter(q=>q.name==='trail_continuous'&&q.normal.y>.2));
const terrain=new Index(tris.filter(q=>q.name==='terrain'&&q.normal.y>.05));
const ignored=/^(ocean|pool|tarn|creek$|lake_outflow|waterfall|falls_|plunge_pool|lake_ripples|coast_foam|outflow_rapids|sky_|hills|ground|ferns|coast_shrubs|coast_flowers|grass|trail_continuous|trail_camp_embankment)/;
const solid=tris.filter(q=>!ignored.test(q.name));const collisions=new Index(solid);
function top(index,x,z,guide=Infinity){let best=null;for(const q of index.query(x,z)){const y=height(q,x,z);if(y!==null&&y<guide+.3&&(!best||y>best.y))best={q,y};}return best;}
// Convex clipping against the full ribbon section, not just a centre ray.
function clip(poly,outline){let out=poly;for(let i=0;i<outline.length&&out.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],side=p=>(b[0]-a[0])*(p[2]-a[2])-(b[2]-a[2])*(p[0]-a[0]),input=out;out=[];for(let j=0;j<input.length;j++){const p=input[j],q=input[(j+1)%input.length],sp=side(p),sq=side(q);if(sp>=-1e-9)out.push(p);if((sp>=0)!==(sq>=0)){const t=sp/(sp-sq);out.push(p.map((v,k)=>v+(q[k]-v)*t));}}}return out;}
function swept(a,b,halfWidth){const dx=b[0]-a[0],dz=b[2]-a[2],d=Math.hypot(dx,dz);if(d<1e-8)return [];const nx=-dz/d,nz=dx/d;let outline=[[a[0]+nx*halfWidth,0,a[2]+nz*halfWidth],[a[0]-nx*halfWidth,0,a[2]-nz*halfWidth],[b[0]-nx*halfWidth,0,b[2]-nz*halfWidth],[b[0]+nx*halfWidth,0,b[2]+nz*halfWidth]],found=[];
for(const q of collisions.query((a[0]+b[0])/2,(a[2]+b[2])/2,d/2+halfWidth)){if(q.box.max.y<Math.min(a[1],b[1])+.23||q.box.min.y>Math.max(a[1],b[1])+2.1)continue;const ps=clip([q.t.a.toArray(),q.t.b.toArray(),q.t.c.toArray()],outline);if(!ps.length)continue;const offsets=ps.map(p=>p[1]-(a[1]+(b[1]-a[1])*((p[0]-a[0])*dx+(p[2]-a[2])*dz)/(d*d)));if(Math.max(...offsets)>.23&&Math.min(...offsets)<2.1)found.push(q.name);}
return [...new Set(found)];}
const profiles=[];
for(const path of manifest.profiles){
 const points=[],issues=new Set(),obstacles=new Set();let maxGrade=0,maxSpacing=0,maxStep=0,minWidth=Infinity;
 for(let i=0;i<path.points.length;i++){
  const sample=path.points[i],p=sample.position,hit=top(pavement,p[0],p[2],p[1]);
  if(!hit){issues.add('missing_actual_exported_support');points.push({...sample,position:[p[0],null,p[2]],usable:false});continue;}
  const actual=[p[0],hit.y,p[2]],width=sample.halfWidth,normal=sample.normalXZ;
  let min=Infinity,max=-Infinity,missing=0;
  for(let lateral=-width;lateral<=width+.0001;lateral+=.1){const s=top(pavement,p[0]+normal[0]*lateral,p[2]+normal[1]*lateral,p[1]);if(!s){missing++;continue;}min=Math.min(min,s.y);max=Math.max(max,s.y);}
  if(missing)issues.add('full_width_support_gap');if(max-min>.22)issues.add('cross_slope_or_step_over_0.22m');
  const prev=points.at(-1)?.position;
  if(prev&&prev[1]!==null){const distance=Math.hypot(p[0]-prev[0],p[2]-prev[2]),rise=Math.abs(hit.y-prev[1]);maxSpacing=Math.max(maxSpacing,distance);maxGrade=Math.max(maxGrade,Math.atan2(rise,distance)*180/Math.PI);maxStep=Math.max(maxStep,rise);for(const name of swept(prev,actual,width))obstacles.add(name);}
  minWidth=Math.min(minWidth,width-.3);points.push({position:actual,halfWidth:width-.3,rawPavingHalfWidth:width,normalXZ:normal,face:hit.q.triangle});
 }
 if(maxGrade>20)issues.add('grade_over_20_degrees');if(maxSpacing>.3)issues.add('sample_spacing_over_0.3m');if(obstacles.size)issues.add('full_width_head_or_body_collision');
 profiles.push({...path,points,usable:issues.size===0,status:issues.size?'blocked':'walkable',problems:[...issues],obstacles:[...obstacles],maxGradeDegrees:maxGrade,maxSampleSpacing:maxSpacing,maxSampleRise:maxStep,minimumVerifiedHalfWidth:minWidth});
}
// Certify the replacement curtain against the actual exported granite,
// not an analytical approximation of its face. A forward-facing fall vertex
// must lie beyond every rock intersection at the same x/height.
const waterfallValidation = {samples:0,minimumRockClearance:Infinity,impactHeight:null};
if(manifest.waterfall){
 const rockTriangles=byName.get('rock')??[], seen=new Set();
 for(const q of byName.get('waterfall')??[])for(const p of [q.t.a,q.t.b,q.t.c]){
  const key=p.toArray().map(v=>v.toFixed(5)).join(',');if(seen.has(key))continue;seen.add(key);
  const ray=new Ray(new Vector3(p.x,p.y,60),new Vector3(0,0,-1));let front=-Infinity;
  for(const rock of rockTriangles){const hit=ray.intersectTriangle(rock.t.a,rock.t.b,rock.t.c,false,new Vector3());if(hit)front=Math.max(front,hit.z);}
  if(Number.isFinite(front))waterfallValidation.minimumRockClearance=Math.min(waterfallValidation.minimumRockClearance,p.z-front);
  waterfallValidation.samples++;
  waterfallValidation.impactHeight=waterfallValidation.impactHeight===null?p.y:Math.min(waterfallValidation.impactHeight,p.y);
 }
 assert.ok(waterfallValidation.samples>500,'Missing waterfall surface');
 assert.ok(waterfallValidation.minimumRockClearance>=manifest.waterfall.clearanceMinimumMetres,'Waterfall passes through granite');
 assert.ok(Math.abs(waterfallValidation.impactHeight-manifest.waterHeight)<.06,'Waterfall fails to meet lake');
 const rows=manifest.waterfall.profile;
 for(let i=1;i<rows.length;i++){
  assert.ok(rows[i].height<rows[i-1].height,'Waterfall moves uphill');
  assert.ok(rows[i].front>rows[i-1].front,'Waterfall folds back toward rock');
 }
 waterfallValidation.monotonicGravityCurtain=true;
 console.log('Waterfall validation',JSON.stringify(waterfallValidation));
}
const bounds=name=>{const b=new Box3();for(const q of byName.get(name)??[])b.union(q.box);return {min:b.min.toArray(),max:b.max.toArray(),size:b.getSize(new Vector3()).toArray()};};
const exportedTreeContacts=[];
for(const c of manifest.retainedTreeContacts){const hit=top(terrain,c.root[0],c.root[2]);exportedTreeContacts.push({...c,exportedGround:hit?.y??null,exportedGroundDelta:hit?hit.y-c.sourceGround:null});}
const hooksForContacts=JSON.parse(await readFile(app+'asset-src/reference/world-pack/models/out-there/glb/poly_dome11_hooks.json','utf8'));
const perchIndex=new Index(solid.filter(q=>q.normal.y>.05&&!/^(bird|gull|deer|rabbit)/.test(q.name)));
const animalAnchorContacts=Object.entries(hooksForContacts.animals).filter(([name])=>!name.startsWith('gull')).map(([name,data])=>{
 const [x,y,z]=data.three,position=[x/1.56,(y+6)/1.56,z/1.56],hit=top(perchIndex,position[0],position[2],position[1]-.29);
 return {node:name,hookPosition:position,support:hit?{owner:hit.q.name,height:hit.y,anchorGap:position[1]-hit.y}:null,scope:'Official hook origin versus highest solid support at frame zero; not a foot/hop-animation certificate'};
});
const bytes=await readFile(target),sha256=hash(bytes),revision='refined-coast-lake-paths-'+sha256.slice(0,16);
const output={schema:'out-there-walk-profiles/v2',geometryRevision:revision,modelSha256:sha256,units:manifest.units,assumptions:{bodyDiameter:.6,headHeight:2.1,fullPavingWidths:[1.2,2],widthMeaning:'halfWidth is body-centre displacement inside the actual rendered width, with .3m body radius already subtracted',maxGradeDegrees:20,source:'Actual decoded final GLB triangles; all visible solid nodes included; animals checked at frame zero'},profiles,summary:{walkable:profiles.filter(p=>p.usable).map(p=>p.id),blocked:profiles.filter(p=>!p.usable).map(p=>({id:p.id,problems:p.problems,obstacles:p.obstacles})),unmodified:['FB_W__FB_E','J3__STAIR_TOP'],removed:['EAST_HEAD__CENTRE_LINK'],interactionTransition:'STAIR_TOP__DOOR'},adjustedHooks:manifest.adjustedHooks,camp:manifest.camp,limitations:['Offline certificate candidate; full main-world browser journey acceptance is required.','Unmodified timber bridges/stair not re-certified by this revision.','Body obstacles include authored people and frame-zero animals.','Finite 0.1m transverse support probes accompany exact full-width swept triangle obstacle clipping.']};
await writeFile(app+'app/lib/out-there-refined-walk-profiles.json',JSON.stringify(output,(_,v)=>typeof v==='number'?+v.toFixed(6):v,2)+'\n');
const stats={revision,sourceSha256:before,sha256,asset:'/models/islands/out-there-refined.glb?v='+sha256.slice(0,16),bytes:bytes.length,triangles:tris.length,animationClips:expectedClips.map(c=>c.name),animationDataExactlyRetained:true,retainedMeshTransformsAndAttributesExactlyRetained:true,paletteRetained:true,removedSemanticNodes:removed,sourceFacesRemoved:manifest.removedSourceFaces,terrainBounds:bounds('terrain'),lakeBounds:bounds('pool'),lakeAreaRatio:manifest.lakeArea/manifest.originalLakeArea,boats:manifest.boats,waterfall:waterfallValidation,forest:manifest.forest,animalAnchorContacts,treeContacts:exportedTreeContacts,clearance:output.summary,limits:output.limitations};
await writeFile(app+'asset-src/stats/out-there-refined.json',JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify({asset:stats.asset,bytes:stats.bytes,triangles:stats.triangles,clips:stats.animationClips.length,terrain:stats.terrainBounds,lake:stats.lakeBounds,walkable:output.summary.walkable,blocked:output.summary.blocked},null,2));
