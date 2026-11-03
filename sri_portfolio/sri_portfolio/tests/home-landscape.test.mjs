import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Raycaster, Triangle, Vector3 } from 'three';
import { homeSite } from '../app/lib/home-site.mjs';
import { authoredModel } from './helpers/authored-model.mjs';

const {scene}=await authoredModel('home-landform');
const terrain=scene.getObjectByName('Home_ContinuousHill');
const plants=homeSite.landscape.forms.map(name=>{const mesh=scene.getObjectByName(name);assert(mesh?.isMesh);return mesh;});
function triangles(mesh){const p=mesh.geometry.attributes.position,idx=mesh.geometry.index,out=[];for(let i=0;i<(idx?.count??p.count);i+=3)out.push([0,1,2].map(j=>new Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld)));return out;}
const ray=new Raycaster();
function ground(x,z){ray.set(new Vector3(x,75,z),new Vector3(0,-1,0));return ray.intersectObject(terrain)[0]?.point.y;}
function overlaps(a,b){for(const poly of [a,b])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],dx=q[0]-p[0],dz=q[1]-p[1],len=Math.hypot(dx,dz);if(len<1e-8)continue;const project=points=>points.map(v=>(-dz*v[0]+dx*v[1])/len),aa=project(a),bb=project(b);if(Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))<=.022)return false;}return true;}

test('Home plants root into the actual hillside and include distinct full-scale forms',()=>{
  let roots=0;
  const counts={};
  for(const mesh of plants){
    const p=mesh.geometry.attributes.position,vertexCells=new Map();
    const key=v=>`${Math.floor(v.x/.12)},${Math.floor(v.z/.12)}`;
    for(let i=0;i<p.count;i++){const v=new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),k=key(v);if(!vertexCells.has(k))vertexCells.set(k,[]);vertexCells.get(k).push(v);}
    counts[mesh.name]=mesh.userData.plantRoots.length;
    for(const point of mesh.userData.plantRoots){
      const root=new Vector3(...point),height=ground(root.x,root.z);
      assert(height!==undefined&&Math.abs(root.y-height-.015)<.025,`${mesh.name}: root misses actual terrain ${point}`);
      // Ensure these metadata points actually describe the visible plant,
      // not decorative anchors with no geometry rooted there.
      let nearest=Infinity;for(const dx of [-.12,0,.12])for(const dz of [-.12,0,.12])for(const v of vertexCells.get(key(root.clone().add(new Vector3(dx,0,dz))))??[])nearest=Math.min(nearest,v.distanceTo(root));
      assert(nearest<.037,`${mesh.name}: declared root has no visible stem/leaf contact (${nearest})`);
      roots++;
    }
  }
  assert.equal(roots,homeSite.landscape.plants);
  assert(roots>1800,'connected hillside colonies should materially replace the sparse old scrub');
  assert(counts.Home_FlowerDrifts>350&&counts.Home_BranchedShrubs>350&&counts.Home_CoastalUnderstory>900);
});

test('every exported leaf and stem clears full rendered roads, doors, houses and benches',()=>{
  const reserved=[...homeSite.landscape.reservations];
  // Derive all route polygons from decoded rendered geometry. This includes
  // the 9m harbour promenade, alley ramps, every stoop and summit trail.
  for(const walk of homeSite.walks)for(const tri of triangles(scene.getObjectByName(walk.name)))reserved.push(tri.map(p=>[p.x,p.z]));
  const grid=new Map(),cell=4;
  function visit(poly,fn){const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]);for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++)fn(`${x},${z}`);}
  for(const poly of reserved)visit(poly,key=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(poly);});
  let checked=0;
  for(const mesh of plants)for(const tri of triangles(mesh)){
    const footprint=tri.map(v=>[v.x,v.z]),candidates=new Set();visit(footprint,key=>(grid.get(key)??[]).forEach(p=>candidates.add(p)));
    for(const polygon of candidates)assert(!overlaps(footprint,polygon),`${mesh.name}: foliage crosses a usable route/building footprint`);
    checked++;
  }
  assert(checked>140000,'audit must include the entire visible planting');
});

test('planting makes the trail and eastern hillside fuller without changing island bounds',()=>{
  const all=plants.flatMap(mesh=>mesh.userData.plantRoots);
  assert(all.filter(([x,,z])=>x>20&&x<51&&z>-27&&z<12).length>400,'eastern bald wedge needs a connected planted mass');
  const trail=homeSite.walks.find(p=>p.name==='Home_SummitTrail');
  const trailSide=all.filter(([x,,z])=>trail.points.some(([px,,pz])=>Math.hypot(x-px,z-pz)<5));
  assert(trailSide.length>130,'walking view should have foreground plant detail along the trail');
  const box=new Box3().setFromObject(scene);
  for(const [actual,expected] of [[box.min.toArray(),[-67.135994,-.900029,-67.488996]],[box.max.toArray(),[67,29.638636,71.300003]]])assert(actual.every((v,i)=>Math.abs(v-expected[i])<.01),'island footprint and height must stay stable');
});

test('plant colonies fill the central bank and stair-side gardens without crop-row alignment',()=>{
  const roots=plants.flatMap(mesh=>mesh.userData.plantRoots);
  assert(roots.filter(([x,,z])=>x>-18&&x<20&&z>-8&&z<.5).length>180,'steep central bank must not be excluded from planting');
  assert(roots.filter(([,,z])=>z>36.08&&z<39.8).length>270,'actual lawns beside the projecting stairs must be inhabited');
  // The previous regular lattice strongly concentrated positions modulo its
  //1.08m/1.04m spacing. Test both axes, independently of plant count.
  for(const [axis,period] of [[0,1.08],[2,1.04]]){
    const phase=roots.reduce((a,p)=>[a[0]+Math.cos(p[axis]/period*Math.PI*2),a[1]+Math.sin(p[axis]/period*Math.PI*2)],[0,0]);
    assert(Math.hypot(...phase)/roots.length<.07,'plant positions must not resolve into regular rows');
  }
});

test('new stair-side gardens clear actual decoded architecture, including all projecting steps',async()=>{
  const architecture=(await authoredModel('home-architecture')).scene;
  const grid=new Map(),cell=3;
  function keys(box,fn){for(let x=Math.floor(box.min.x/cell);x<=Math.floor(box.max.x/cell);x++)for(let z=Math.floor(box.min.z/cell);z<=Math.floor(box.max.z/cell);z++)fn(`${x},${z}`);}
  architecture.traverse(mesh=>{
    if(!mesh.isMesh)return;
    for(const vertices of triangles(mesh)){
      const bounds=new Box3().setFromPoints(vertices);
      if(bounds.max.z<13||bounds.min.z>40||bounds.min.y>8)continue;
      const value={triangle:new Triangle(...vertices),bounds,name:mesh.name};
      keys(bounds,key=>{if(!grid.has(key))grid.set(key,[]);grid.get(key).push(value);});
    }
  });
  let count=0;
  for(const mesh of plants)for(const vertices of triangles(mesh)){
    const box=new Box3().setFromPoints(vertices);
    if(box.max.z<13||box.min.z>40||box.min.y>8)continue;
    const candidates=new Set();keys(box,key=>(grid.get(key)??[]).forEach(t=>candidates.add(t)));
    for(const candidate of candidates)if(box.intersectsBox(candidate.bounds))assert(!box.intersectsTriangle(candidate.triangle),`${mesh.name} meets actual ${candidate.name} masonry/glazing at ${box.min.toArray()}`);
    count++;
  }
  assert(count>30000,'check the complete new low garden geometry against real architecture');
});

test('steep hillside foliage stays low instead of stretching into upright stalks',()=>{
  const mat=scene.getObjectByName('Home_SlopeLeafMats');assert(mat?.isMesh);
  const spans=triangles(mat).map(t=>Math.max(...t.map(v=>v.y))-Math.min(...t.map(v=>v.y))).sort((a,b)=>a-b);
  assert(spans[Math.floor(spans.length*.99)]<.25,'99% of terrain-following mat faces must stay below a25cm vertical span');
  assert(spans.at(-1)<1,'terrain facets must never stretch individual leaves into metre-tall stalks');
  assert(mat.userData.plantRoots.length>1000,'steep banks retain substantial low mat coverage');
});
