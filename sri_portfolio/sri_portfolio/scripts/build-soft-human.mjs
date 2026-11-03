// Rebuild and verify the delivered skinned geometry and both animation clips.
// node scripts/build-soft-human.mjs [--verify-only] [--no-preview]
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { AnimationMixer, Box3, Color, LoopOnce, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const url=p=>new URL(`../${p}`,import.meta.url);
const app=fileURLToPath(url(''));
const asset=url('public/models/characters/soft-human.glb');
const statfile=url('asset-src/stats/soft-human.json');
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
if(!process.argv.includes('--verify-only')) {
  const args=['-b','--disable-autoexec','--python-exit-code','1','--python','scripts/blender/build_soft_human.py'];
  if(process.argv.includes('--no-preview'))args.push('--','--no-preview');
  const built=spawnSync(process.env.BLENDER_BIN||'/Applications/Blender.app/Contents/MacOS/Blender',args,{cwd:app,stdio:'inherit'});
  assert.equal(built.status,0,'Blender source build failed');
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
  const doc=await io.read(fileURLToPath(url('asset-src/authored/soft-human/soft-human-raw.glb')));
  await doc.transform(weld(),dedup(),prune({keepLeaves:true,keepAttributes:true,keepExtras:true}),meshopt({encoder:MeshoptEncoder,level:'high'}));
  doc.createExtension(EXTMeshoptCompression).setRequired(true);
  await io.write(fileURLToPath(asset),doc);
}
const bytes=await readFile(asset),stats=JSON.parse(await readFile(statfile,'utf8'));
const manifest=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
assert.ok(manifest.extensionsRequired.includes('EXT_meshopt_compression'),'Required meshopt missing');
assert.ok(manifest.extensionsUsed.includes('KHR_mesh_quantization'),'Quantization missing');
assert.ok(manifest.skins.length>0&&manifest.skins.every(s=>s.joints.length===20)&&new Set(manifest.skins.map(s=>s.joints.join(','))).size===1,'Armature lost');
assert.ok(!manifest.images?.length,'Unexpected texture');
const gltf=await new Promise((ok,fail)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',ok,fail));
const root=gltf.scene;root.updateMatrixWorld(true);
const node=n=>{const o=root.getObjectByName(n);assert.ok(o,`Missing ${n}`);return o;};
assert.equal(node(stats.rootNode).userData.forward,'+Z');
assert.equal(node(stats.shirtNode).userData.tintChannel,'shirt');
let triangles=0;const meshes=[],colors=new Map();
root.traverse(o=>{
  if(!o.isMesh)return;
  assert.ok(o.isSkinnedMesh,`Unskinned geometry ${o.name}`);meshes.push(o);
  const g=o.geometry;triangles+=(g.index?.count??g.attributes.position.count)/3;
  const c=g.attributes.color;assert.ok(c&&o.material.vertexColors,`Palette ignored ${o.name}`);
  assert.ok(g.attributes.skinWeight&&g.attributes.skinIndex,`Weight loss ${o.name}`);
  for(let i=0;i<c.count;i++){const rgb=[c.getX(i),c.getY(i),c.getZ(i)];colors.set(rgb.map(n=>n.toFixed(6)).join(','),rgb);}
});
assert.ok(triangles<=4000,`${triangles} triangles exceed adult character budget`);
assert.ok(meshes.length===7,`${meshes.length} unexpected draws`);
assert.ok(bytes.length<150000,`${bytes.length} bytes exceed animated character budget`);
const errors={};for(const [name,hex] of Object.entries(stats.paletteHex)){
  const target=new Color(`#${hex}`).toArray();
  const error=Math.min(...Array.from(colors.values(),rgb=>Math.hypot(...rgb.map((n,i)=>n-target[i]))));
  assert.ok(error<.009,`Palette ${name} missing or wrong gamma ${error}`);errors[name]=+error.toFixed(6);
}
const p=new Vector3();
function bounds(objects) {
  const b=new Box3();
  for(const m of objects)for(let i=0;i<m.geometry.attributes.position.count;i++){
    m.getVertexPosition(i,p).applyMatrix4(m.matrixWorld);b.expandByPoint(p);
  }
  return b;
}
const rest=bounds(meshes);
assert.ok(Math.abs(rest.min.y)<.002,`Rest sole y=${rest.min.y}`);
assert.ok(Math.abs(rest.max.y-1.75)<.002,`Rest crown y=${rest.max.y}`);
for(const side of ['L','R']){
  const foot=bounds([node(`Human_Shoe_${side}`)]);
  assert.ok(foot.max.z>0.15&&foot.min.z<-.08,'Toe direction/length changed');
}
const clipEvidence={};
const feet={L:node('Human_Shoe_L'),R:node('Human_Shoe_R')};
const bones={L:node('Foot_L'),R:node('Foot_R')};
for(const [name,expected] of Object.entries(stats.clips)){
  const clip=gltf.animations.find(c=>c.name===name);assert.ok(clip,`Missing ${name}`);
  assert.ok(Math.abs(clip.duration-expected)<.005,`${name} duration ${clip.duration}`);
  const mixer=new AnimationMixer(root),action=mixer.clipAction(clip);
  action.setLoop(LoopOnce,1);action.clampWhenFinished=true;action.play();
  const sampleCount=129, contact={L:[],R:[]},swing={L:[],R:[]},soleY={L:[],R:[]},plantedZ={L:[[],[]],R:[[],[]]};
  let startPose,endPose;
  for(let i=0;i<sampleCount;i++){
    const phase=i/(sampleCount-1),t=phase*clip.duration;
    mixer.setTime(t);root.updateMatrixWorld(true);
    if(i===0||i===sampleCount-1){
      const snapshot=[];root.traverse(o=>{if(o.isBone)snapshot.push([...o.position.toArray(),...o.quaternion.toArray()]);});
      if(i===0)startPose=snapshot;else endPose=snapshot;
    }
    for(const side of ['L','R']){
      const y=bounds([feet[side]]).min.y;soleY[side].push(y);
      const shift=side==='R'?.5:0, footPhase=(phase+shift)%1;
      if(name==='Idle'||footPhase<stats.walk.contactPhase-.025) {
        contact[side].push(y);
        if(name==='Walk')plantedZ[side][Math.floor(phase+shift)].push(bones[side].getWorldPosition(new Vector3()).z+stats.walk.calibratedSpeedMetresPerSecond*t);
      } else swing[side].push(y);
    }
  }
  const closure=Math.max(...startPose.flatMap((row,i)=>row.map((v,j)=>Math.abs(v-endPose[i][j]))));
  assert.ok(closure<.004,`${name} loop does not close (${closure})`);
  const range=a=>[+Math.min(...a).toFixed(5),+Math.max(...a).toFixed(5)];
  const stance={};
  for(const side of ['L','R']){
    const span=range(contact[side]),swingSpan=swing[side].length?range(swing[side]):null;
    assert.ok(span[0]>-.003&&span[1]<.004,`${name} ${side} stance ground contact ${span}`);
    assert.ok(Math.min(...soleY[side])>-.003,`${name} ${side} sole clips floor`);
    if(swingSpan)assert.ok(swingSpan[1]>.06&&swingSpan[1]<.085,`${side} swing clearance ${swingSpan}`);
    const drift=Math.max(0,...plantedZ[side].filter(a=>a.length>1).map(a=>Math.max(...a)-Math.min(...a)));
    assert.ok(drift<.006,`${name} ${side} compensated ankle slide ${drift}`);
    stance[side]={contactMinMaxMetres:span,swingMinMaxMetres:swingSpan,maxCompensatedAnkleSlideMetres:+drift.toFixed(5)};
  }
  clipEvidence[name]={duration:+clip.duration.toFixed(6),tracks:clip.tracks.length,sampleCount,closureComponentDelta:+closure.toFixed(6),feet:stance};
  mixer.stopAllAction();mixer.uncacheRoot(root);root.updateMatrixWorld(true);
}
const arr=v=>v.toArray().map(x=>+x.toFixed(6));
Object.assign(stats,{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),triangles,primitives:meshes.length,
  joints:manifest.skins[0].joints.length,restBounds:{min:arr(rest.min),max:arr(rest.max)},paletteRoundTripMaxLinearError:Math.max(...Object.values(errors)),clipEvidence,
  integrity:{loader:'Three GLTFLoader + MeshoptDecoder',actualSkinnedSolesChecked:true,quantized:true,vertexColorsRetained:true,browserVisualAcceptance:false}});
await writeFile(statfile,JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify({bytes:stats.bytes,triangles,primitives:stats.primitives,joints:stats.joints,restBounds:stats.restBounds,clipEvidence},null,2));
