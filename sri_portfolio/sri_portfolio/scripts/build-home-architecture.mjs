// Original Home source build, meshopt publication and actual Three-loader contract.
// node scripts/build-home-architecture.mjs [--verify-only]
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, prune, weld, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import { Box3, Color, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const app=fileURLToPath(new URL('../',import.meta.url));
const asset=new URL('../public/models/islands/home-architecture.glb',import.meta.url);
const statfile=new URL('../asset-src/stats/home-architecture.json',import.meta.url);
await Promise.all([MeshoptDecoder.ready,MeshoptEncoder.ready]);
if(!process.argv.includes('--verify-only')) {
  const built=spawnSync(process.env.BLENDER_BIN||'/Applications/Blender.app/Contents/MacOS/Blender',
    ['-b','--disable-autoexec','--python-exit-code','1','--python','scripts/blender/build_home_architecture.py',...(process.argv.includes('--no-preview')?['--','--no-preview']:[])],{cwd:app,stdio:'inherit'});
  assert.equal(built.status,0,'Blender build failed');
  const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder,'meshopt.encoder':MeshoptEncoder});
  const doc=await io.read(fileURLToPath(new URL('../asset-src/authored/home/home-architecture-raw.glb',import.meta.url)));
  await doc.transform(weld(),dedup(),prune({keepLeaves:true,keepAttributes:true,keepExtras:true}),meshopt({encoder:MeshoptEncoder,level:'high'}));
  doc.createExtension(EXTMeshoptCompression).setRequired(true);
  await io.write(fileURLToPath(asset),doc);
}
const bytes=await readFile(asset),stats=JSON.parse(await readFile(statfile,'utf8'));
const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
assert.ok(json.extensionsRequired.includes('EXT_meshopt_compression'));
assert.ok(json.extensionsUsed.includes('KHR_mesh_quantization'));
assert.ok(json.meshes.every(m=>m.primitives.every(p=>p.attributes.COLOR_0!==undefined)),'COLOR_0 lost');
const gltf=await new Promise((ok,fail)=>new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',ok,fail));
const root=gltf.scene;root.updateMatrixWorld(true);
const node=n=>{const o=root.getObjectByName(n);assert.ok(o,`Missing ${n}`);return o;};
const rounded=a=>a.map(n=>+n.toFixed(4));
const box=b=>({min:rounded(b.min.toArray()),max:rounded(b.max.toArray()),size:rounded(b.getSize(new Vector3()).toArray())});
node('HomeArchitecture_Root');node('Summit_Root');
const actualAnchors={};
for(const [name,p] of Object.entries(stats.anchors)) {
  const actual=node(name).getWorldPosition(new Vector3()).toArray();
  assert.ok(actual.every((n,i)=>Math.abs(n-p[i])<.002),`Anchor moved ${name}`);
  actualAnchors[name]=rounded(actual);
}
let triangles=0,primitives=0,vertices=0;const colors=new Map();
root.traverse(o=>{if(!o.isMesh)return;primitives++;
  const g=o.geometry;triangles+=(g.index?.count??g.attributes.position.count)/3;vertices+=g.attributes.position.count;
  const c=g.attributes.color;assert.ok(c&&o.material.vertexColors,`Palette ignored ${o.name}`);
  for(let i=0;i<c.count;i++){const rgb=[c.getX(i),c.getY(i),c.getZ(i)];colors.set(rgb.map(n=>n.toFixed(6)).join(','),rgb);}
});
const palette={};
for(const [name,hex] of Object.entries(stats.paletteHex)){
  const target=new Color(`#${hex}`).toArray();
  const error=Math.min(...Array.from(colors.values(),rgb=>Math.hypot(...rgb.map((n,i)=>n-target[i]))));
  assert.ok(error<.009,`Palette ${name} missing or wrong gamma ${error}`);palette[name]=+error.toFixed(6);
}
const houseBounds=[];
for(let i=1;i<=15;i++) {
  const name=`Rowhouse_${String(i).padStart(2,'0')}_Root`,h=node(name),r=stats.reservations[i-1],bounds=new Box3().setFromObject(h,true);
  assert.equal(h.children.filter(n=>n.isMesh).length,2,`House ${i} semantic surfaces`);
  const b=box(bounds);houseBounds.push({name,...b});
  assert.ok(bounds.min.x>=r.boundsXZ[0]-.02&&bounds.max.x<=r.boundsXZ[2]+.02,`House ${i} roof width outside reservation`);
  assert.ok(bounds.min.z>=r.boundsXZ[1]-.02&&bounds.max.z<=r.boundsXZ[3]+.02,`House ${i} rendered footprint outside reservation`);
  assert.ok(Math.abs(bounds.min.y-r.ground)<.03,`House ${i} ground contact`);
}
const fronts=houseBounds.slice(0,9),backs=houseBounds.slice(9);
const alley=Math.min(...fronts.map(b=>b.min[2]))-Math.max(...backs.map(b=>b.max[2]));
assert.ok(alley>=5,`Full rendered alley only ${alley}m`);
for(const row of [fronts,backs])for(let i=1;i<row.length;i++)assert.ok(row[i].min[0]-row[i-1].max[0]>=.8,'Neighbouring roofs intersect');
assert.ok(triangles<65000,`Architecture ${triangles} triangles`);assert.ok(primitives<=36,`Architecture ${primitives} draw primitives`);
assert.ok(bytes.length<1500000,`Compressed architecture is ${bytes.length} bytes`);
const summit=box(new Box3().setFromObject(node('Summit_Root'),true));
Object.assign(stats,{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),triangles,primitives,vertices,
  bounds:box(new Box3().setFromObject(root,true)),summitBounds:summit,houseBounds,exportedAnchors:actualAnchors,
  paletteRoundTrip:{attribute:'COLOR_0',maximumLinearError:Math.max(...Object.values(palette)),perColorError:palette},
  integrity:{loader:'Three GLTFLoader + MeshoptDecoder',semanticHierarchy:true,anchorsRetained:true,quantized:true,
    fullRenderedFootprintChecked:true,actualAlleyClearWidthMetres:+alley.toFixed(4),browserVisualAcceptance:false}});
await writeFile(statfile,JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify({asset:stats.asset,bytes:stats.bytes,triangles,primitives,bounds:stats.bounds,summitBounds:summit,alley,paletteMaximumError:stats.paletteRoundTrip.maximumLinearError},null,2));
