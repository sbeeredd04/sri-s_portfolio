// Connect the shipped western landing to the court promenade using its actual
// top-ribbon polygons. No generated shortcut crosses the playing areas.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'meshoptimizer';
import { Vector3, Raycaster } from 'three';
import { afterHoursCoastSource } from '../app/lib/authored-island-sites.mjs';
const bytes = await readFile(new URL('../public' + afterHoursCoastSource.split('?')[0], import.meta.url));
const stats = JSON.parse(await readFile(new URL('../asset-src/stats/after-hours-coast.json',import.meta.url)));
await MeshoptDecoder.ready;
const {scene} = await new Promise((yes,no) => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',yes,no));
scene.updateMatrixWorld(true);
const ribbon = stats.newPaths.find(p => p.name === 'AfterHours_WestLandingWalk');
const support = ['AfterHours_WestLandingWalk','AfterHours_WestBridgeLandingDeck'].map(name => scene.getObjectByName(name));
assert(support.every(Boolean));
const midpoint = (a,b) => [(a[0]+b[0])/2,(a[1]+b[1])/2];
const knots = [[-40.5,12.3], midpoint(ribbon.segments[0][0],ribbon.segments[0][1]), ...ribbon.segments.map(p => midpoint(p[2],p[3]))];
const ray = new Raycaster(), points=[];
let samples=0;
for(let i=1;i<knots.length;i++) {
  const a=knots[i-1],b=knots[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/.35);
  for(let j=0;j<=steps;j++) {
    if(i>1&&j===0)continue;
    const t=j/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
    const cross=[-(b[1]-a[1])/length,(b[0]-a[0])/length];
    let y;
    for(const lane of [-1,-.75,-.5,-.25,0,.25,.5,.75,1]) {
      ray.set(new Vector3(x+cross[0]*lane,20,z+cross[1]*lane),new Vector3(0,-1,0));
      const hit=ray.intersectObjects(support,true)[0];
      assert(hit,`No rendered landing support at ${x},${z}, lane ${lane}`);
      assert(Math.abs(hit.point.y-2.82)<.035, 'Landing step');
      if(lane===0)y=hit.point.y+.004;
      ray.set(hit.point.clone().add(new Vector3(0,.22,0)),new Vector3(0,1,0));ray.far=1.88;
      assert.equal(ray.intersectObject(scene,true).length,0,'Landing body collision');ray.far=Infinity;
      samples++;
    }
    points.push([x,y,z].map(v=>+v.toFixed(6)));
  }
}
const result={source:afterHoursCoastSource,sha256:createHash('sha256').update(bytes).digest('hex'),width:2,points};
await writeFile(new URL('../app/lib/afterhours-landing-walk.mjs',import.meta.url),'// Generated from decoded landing + full-width ribbon support audit.\nexport const afterHoursLandingWalk = '+JSON.stringify(result,null,2)+';\n');
console.log(JSON.stringify({points:points.length,supportAndBodyProbes:samples}));
