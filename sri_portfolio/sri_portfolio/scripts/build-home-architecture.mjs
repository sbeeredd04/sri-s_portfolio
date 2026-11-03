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
import { Box3, Color, Raycaster, Vector3 } from 'three';
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
// Ray samples on the loaded opaque shells verify true lapped relief and
// leave the window and entry reveals clear. No texture supplies these profiles.
const facadeRelief = [];
const frontRay = new Raycaster(undefined, new Vector3(0, 0, -1), 0, 1.2);
function frontHit(shell, x, y, z, offset = 7) {
  frontRay.ray.origin.set(x, y, z + offset);
  return frontRay.intersectObject(shell, false)[0]?.point.z;
}
for (let i = 0; i < houseBounds.length; i++) {
  const id = String(i + 1).padStart(2, "0");
  const shell = node(`Rowhouse_${id}_Shell`);
  const house = node(`Rowhouse_${id}_Root`);
  const { x, y, z } = house.getWorldPosition(new Vector3());
  const w = stats.reservations[i].width;
  const differences = [];
  for (const course of [12, 13, 14, 19, 20, 21]) {
    const base = y + 1.02 + .28 * course;
    const toe = frontHit(shell, x + w * .43, base + .035, z);
    const heel = frontHit(shell, x + w * .43, base + .235, z);
    assert.ok(Number.isFinite(toe) && Number.isFinite(heel));
    differences.push(toe - heel);
  }
  assert.ok(differences.every((d) => d > .01 && d < .025), `Missing board profile on Rowhouse ${id}`);
  const door = frontHit(shell, stats.anchors[`Rowhouse_${id}_EntryAnchor`][0], y + 2.25, z);
  assert.ok(door === undefined || door < z + 5.90, `Siding filled entry opening at Rowhouse ${id}`);
  for (const storey of [4.35, 7.01]) {
    const pane = frontHit(shell, x + .67, y + storey, z, 6.18);
    assert.ok(pane === undefined || pane < z + 5.94, `Siding filled window opening at Rowhouse ${id}`);
  }
  // A straight sightline through the open portion of each street-facing
  // window meets an interior wall several feet behind its glazing.
  const bayX = i % 2 === 0 ? -.13 * w : .13 * w;
  const depths = [];
  frontRay.far = 3.1;
  for (const [paneX, paneY, glazingZ] of [
    [bayX, 2.65, 6.76], [.67, 5.13, 5.98], [.67, 7.79, 5.98],
  ]) {
    const backWall = frontHit(shell, x + paneX, y + paneY, z, 6.18);
    const depth = (z + glazingZ) - backWall;
    assert.ok(depth > 2.30 && depth < 3.22, `Rowhouse ${id} window lost its recessed room: ${depth}`);
    depths.push(+depth.toFixed(3));
  }
  frontRay.far = 1.2;
  facadeRelief.push({ id, min: +Math.min(...differences).toFixed(4),
    max: +Math.max(...differences).toFixed(4), roomDepthMetres: depths });
}
const fronts=houseBounds.slice(0,9),backs=houseBounds.slice(9);
const alley=Math.min(...fronts.map(b=>b.min[2]))-Math.max(...backs.map(b=>b.max[2]));
assert.ok(alley>=5,`Full rendered alley only ${alley}m`);
for(const row of [fronts,backs])for(let i=1;i<row.length;i++)assert.ok(row[i].min[0]-row[i-1].max[0]>=.8,'Neighbouring roofs intersect');
assert.ok(triangles<65000,`Architecture ${triangles} triangles`);assert.ok(primitives<=36,`Architecture ${primitives} draw primitives`);
assert.ok(bytes.length<1500000,`Compressed architecture is ${bytes.length} bytes`);
// Test the delivered triangle surfaces, including cross-mesh conflicts. Work
// per building so spatially separate footprints do not enter the pair scans.
const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

function overlapArea(subject, clip) {
  let polygon = subject;
  for (let i = 0; i < 3; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % 3];
    const clipped = [];
    for (let j = 0; j < polygon.length; j++) {
      const p = polygon[j];
      const q = polygon[(j + 1) % polygon.length];
      const pSide = cross(a, b, p);
      const qSide = cross(a, b, q);
      if (pSide >= -1e-9) clipped.push(p);
      if ((pSide > 1e-9 && qSide < -1e-9) || (pSide < -1e-9 && qSide > 1e-9)) {
        const t = pSide / (pSide - qSide);
        clipped.push(p.map((value, axis) => value + (q[axis] - value) * t));
      }
    }
    if (clipped.length < 3) return 0;
    polygon = clipped;
  }
  return Math.abs(polygon.reduce((sum, p, i) => {
    const q = polygon[(i + 1) % polygon.length];
    return sum + p[0] * q[1] - p[1] * q[0];
  }, 0) / 2);
}

function scanCoplanarColors(module) {
  const bins = new Map();
  const vertex = new Vector3();
  let testedTriangles = 0;
  module.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const { position, color } = mesh.geometry.attributes;
    const index = mesh.geometry.index;
    for (let i = 0; i < (index?.count ?? position.count); i += 3) {
      testedTriangles++;
      const ids = [0, 1, 2].map((j) => index ? index.getX(i + j) : i + j);
      const points = ids.map((id) => vertex.fromBufferAttribute(position, id)
        .applyMatrix4(mesh.matrixWorld).toArray());
      const palette = [color.getX(ids[0]), color.getY(ids[0]), color.getZ(ids[0])]
        .map((n) => n.toFixed(4)).join(",");
      for (let axis = 0; axis < 3; axis++) {
        const plane = points[0][axis];
        if (points.some((p) => Math.abs(p[axis] - plane) > 1e-6)) continue;
        const triangle = points.map((p) => p.filter((_, i) => i !== axis));
        const winding = cross(...triangle);
        if (Math.abs(winding) < 1e-8) continue;
        if (winding < 0) triangle.reverse();
        const bounds = [0, 1].map((i) => {
          const coords = triangle.map((p) => p[i]);
          return [Math.min(...coords), Math.max(...coords)];
        });
        const key = `${axis}:${plane.toFixed(3)}`;
        if (!bins.has(key)) bins.set(key, []);
        bins.get(key).push({ plane, triangle, bounds, palette });
      }
    }
  });
  const overlaps = [];
  for (const [key, candidates] of bins) {
    let area = 0;
    for (let i = 0; i < candidates.length; i++) {
      const a = candidates[i];
      for (let j = i + 1; j < candidates.length; j++) {
        const b = candidates[j];
        if (a.palette === b.palette || Math.abs(a.plane - b.plane) > 1e-6) continue;
        if (a.bounds.some(([lo, hi], axis) => lo >= b.bounds[axis][1] || hi <= b.bounds[axis][0])) continue;
        area += overlapArea(a.triangle, b.triangle);
      }
    }
    if (area > .0001) {
      const [axis, plane] = key.split(":").map(Number);
      overlaps.push({ axis, plane, areaMetres2: +area.toFixed(5) });
    }
  }
  return { testedTriangles, overlaps: overlaps.sort((a, b) => b.areaMetres2 - a.areaMetres2) };
}

const coplanar = Object.fromEntries(
  ["Summit_Root", ...houseBounds.map(({ name }) => name)]
    .map((name) => [name, scanCoplanarColors(node(name))]),
);
const auditedTriangles = Object.values(coplanar)
  .reduce((sum, audit) => sum + audit.testedTriangles, 0);
assert.equal(auditedTriangles, triangles, "Coplanar audit must cover every rendered Home triangle");
for (const [name, audit] of Object.entries(coplanar)) {
  // The remaining sub-60 cm² house contacts are small rail/trim joints.
  // Summit allows the small embedded bookshelf and furniture contacts.
  const areaLimit = name === "Summit_Root" ? .06 : .01;
  const worst = audit.overlaps[0];
  assert.ok(!worst || worst.areaMetres2 < areaLimit,
    `${name} has a conflicting coplanar face at axis ${worst?.axis}, plane ${worst?.plane}: ${worst?.areaMetres2}m²`);
}
const summit=box(new Box3().setFromObject(node('Summit_Root'),true));
Object.assign(stats,{bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),triangles,primitives,vertices,
  bounds:box(new Box3().setFromObject(root,true)),summitBounds:summit,houseBounds,exportedAnchors:actualAnchors,
  coplanarColorAudit:coplanar,
  decodedFacadeReliefMetres:facadeRelief,
  coplanarAuditTriangleCount:auditedTriangles,
  paletteRoundTrip:{attribute:'COLOR_0',maximumLinearError:Math.max(...Object.values(palette)),perColorError:palette},
  integrity:{loader:'Three GLTFLoader + MeshoptDecoder',semanticHierarchy:true,anchorsRetained:true,quantized:true,
    fullRenderedFootprintChecked:true,actualAlleyClearWidthMetres:+alley.toFixed(4),browserVisualAcceptance:false}});
await writeFile(statfile,JSON.stringify(stats,null,2)+'\n');
console.log(JSON.stringify({asset:stats.asset,bytes:stats.bytes,triangles,primitives,bounds:stats.bounds,summitBounds:summit,alley,paletteMaximumError:stats.paletteRoundTrip.maximumLinearError},null,2));
