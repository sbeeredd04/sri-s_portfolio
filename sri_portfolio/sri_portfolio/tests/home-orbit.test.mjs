import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import CameraControlsPackage from 'camera-controls';
import { authoredModel } from './helpers/authored-model.mjs';
import { apartmentPoint, APARTMENT_LEVEL, studioDeskView, studioBookView, studioInteriorOrbit, studioInteriorPolarLimits } from '../app/lib/studio-layout.mjs';

const CameraControls=CameraControlsPackage.default || CameraControlsPackage;
CameraControls.install({ THREE });
// No DOM is connected; the controller still allocates its viewport rectangle.
globalThis.DOMRect ||= class { constructor(x=0,y=0,width=0,height=0) { Object.assign(this,{x,y,width,height}); } };
const { scene } = await authoredModel('home-architecture');
const panels = [];
scene.traverse(mesh => {
  if (!mesh.isMesh || !['Summit_Structure','Summit_CraftAndInteriors'].includes(mesh.name)) return;
  const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3) {
    const vertices=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
    const triangle=new THREE.Triangle(...vertices);
    if(Math.abs(triangle.getNormal(new THREE.Vector3()).y)>.95)panels.push({name:mesh.name,triangle});
  }
});
function panelHits(eye,focus) {
  const ray=new THREE.Ray(eye,focus.clone().sub(eye).normalize()),length=eye.distanceTo(focus);
  return panels.filter(({triangle})=>{
    const hit=ray.intersectTriangle(triangle.a,triangle.b,triangle.c,false,new THREE.Vector3());
    // The mesh also contains tables/bookcase shelves inside the occupied
    // room. Inspect all floor/ceiling bands, including the rendered timber
    // detail faces above the concrete slab, without classifying furniture as
    // a ceiling. Existing wall cutaway handles the vertical shell separately.
    return hit && hit.distanceTo(eye)<length &&
      (hit.y<APARTMENT_LEVEL+.3 || hit.y>APARTMENT_LEVEL+3.1);
  });
}
function rig(shot) {
  const camera=new THREE.PerspectiveCamera(),controls=new CameraControls(camera);
  controls.setLookAt(...apartmentPoint(shot.position),...apartmentPoint(shot.target),false);
  controls.update(0);
  return {camera,controls,focus:new THREE.Vector3(...apartmentPoint(shot.target))};
}
function limits(controls,targetHeight) {
  const bounds=studioInteriorPolarLimits(controls.distance,targetHeight);
  controls.minPolarAngle=bounds.min;controls.maxPolarAngle=bounds.max;
  return bounds;
}
test('captured downward desk drag encounters real timber floor without bounds and clears it with bounds',()=>{
  const drag=2*Math.PI*310/900;
  const broken=rig(studioDeskView);
  broken.controls.rotate(0,drag,false);broken.controls.update(0);
  assert(panelHits(broken.camera.position,broken.focus).some(p=>p.name==='Summit_CraftAndInteriors'),'regression genuinely crosses shipped timber boards');
  const fixed=rig(studioDeskView);
  limits(fixed.controls,studioDeskView.target[1]);
  fixed.controls.rotate(0,drag,false);fixed.controls.update(0);
  assert.equal(panelHits(fixed.camera.position,fixed.focus).length,0);
});
test('desktop and phone close orbits stay between actual slabs over drag and zoom extremes',()=>{
  for(const shot of [studioDeskView,studioDeskView.portrait,studioBookView,studioBookView.portrait]) {
    const {camera,controls,focus}=rig(shot);
    for(const distance of [3.2,4.5,8,16,24]) {
      controls.dollyTo(distance,false);controls.update(0);
      const bounds=limits(controls,shot.target[1]);
      for(const polar of [bounds.min,bounds.max])for(let turn=0;turn<12;turn++) {
        controls.rotateTo(turn*Math.PI/6,polar,false);controls.update(0);
        const height=camera.position.y-apartmentPoint([0,0,0])[1];
        assert(height>=studioInteriorOrbit.minHeight-1e-6 && height<=studioInteriorOrbit.maxHeight+1e-6);
        assert.equal(panelHits(camera.position,focus).length,0,`no actual slab or timber floor cuts across focused room: target=${shot.target} radius=${distance} polar=${polar} turn=${turn} hits=${panelHits(camera.position,focus).map(p=>p.name+':'+p.triangle.a.y)}`);
      }
    }
  }
});
