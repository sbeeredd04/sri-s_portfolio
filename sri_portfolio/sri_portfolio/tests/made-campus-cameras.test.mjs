import test from 'node:test';
import * as THREE from 'three';
import CameraControlsPackage from 'camera-controls';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Box3, DoubleSide, Group, Mesh, MeshBasicMaterial, Matrix4, PerspectiveCamera, Raycaster, Triangle, Vector3 } from 'three';
import { madeCampus } from '../app/lib/made-campus-data.mjs';
import { madeProjectView, madeSitePoint, madeStop, madeGalleryOrbitLimits } from '../app/lib/made-campus-views.mjs';
import { buildMadeGallery, madeGalleryLayout, madeGalleryStories } from '../app/lib/made-gallery.mjs';
import { shippedModel } from './helpers/authored-model.mjs';

const {scene,bytes}=await shippedModel(madeCampus.source.split('?')[0]);
const material=new MeshBasicMaterial({side:DoubleSide});
const furnished=madeCampus.studios.filter(s=>madeGalleryStories[s.id]);
const obstacles=[];
scene.traverse(mesh=>{
  if(!mesh.isMesh || /water|wake|foam/i.test(mesh.name+' '+mesh.material?.name))return;
  const clone=new Mesh(mesh.geometry,material);clone.name=mesh.name;clone.matrix.copy(mesh.matrixWorld);clone.matrixAutoUpdate=false;clone.updateMatrixWorld();obstacles.push(clone);
});
for(const site of furnished){
  const group=new Group();group.position.set(...site.center);group.rotation.y=site.yaw;
  for(const [name,geometry] of Object.entries(buildMadeGallery(site))){const mesh=new Mesh(geometry,material);mesh.name=`${site.id} gallery ${name}`;group.add(mesh);}
  group.updateMatrixWorld(true);obstacles.push(group);
}
const triangles=[];
for(const obj of obstacles)obj.traverse(mesh=>{
  if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
  for(let i=0;i<(index?.count??p.count);i+=3){
    const vertices=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
    triangles.push({name:mesh.name,triangle:new Triangle(...vertices),bounds:new Box3().setFromPoints(vertices)});
  }
});
function assertEyeClear(eye,label){
  const body=new Box3(eye.clone().addScalar(-.22),eye.clone().addScalar(.22));
  const hits=triangles.filter(t=>body.intersectsBox(t.bounds)&&body.intersectsTriangle(t.triangle));
  assert.equal(hits.length,0,`${label}: camera intersects ${[...new Set(hits.map(h=>h.name))]}`);
}
function cameraFor(view,phone,arrival=false){
  const w=phone?390:1440,h=phone?844:900,camera=new PerspectiveCamera(view.fov,w/h,.22,1000);
  camera.position.set(...view.position);camera.lookAt(...view.target);
  camera.setViewOffset(w,h,arrival&&!phone?-w*.1:0,phone?-h*(arrival?.035:.025):0,w,h);
  camera.updateMatrixWorld(true);return camera;
}
function projectedBox(site,camera,min,max){
  const box=new Box3();for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]])box.expandByPoint(new Vector3(...madeSitePoint(site,[x,y,z])).project(camera));return box;
}

test('Made camera audit decodes the exact version served to the browser',()=>{
  const version=new URL(madeCampus.source,'https://local.invalid').searchParams.get('v');
  assert(version?.length>=16);assert.equal(createHash('sha256').update(bytes).digest('hex').slice(0,version.length),version);
});
test('Made arrival includes the rendered island and quay despite the reading-panel camera offset',()=>{
  for(const phone of [false,true]){
    const view=phone?madeStop('arrival').portrait:madeStop('arrival'),camera=cameraFor(view,phone,true),box=new Box3();
    scene.traverse(mesh=>{
      if(!mesh.isMesh || /wake|foam|water/i.test(mesh.name))return;
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i++){
        const point=new Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
        if(point.x>=-55&&point.x<=55&&point.z>=-45&&point.z<=60)box.expandByPoint(point.project(camera));
      }
    });
    assert(box.min.x>-.99&&box.max.x<.99,`arrival horizontal clip: ${box.min.x}..${box.max.x}`);
    assert(box.min.y>-.78&&box.max.y<.7,`arrival vertical clip: ${box.min.y}..${box.max.y}`);
    assert(box.max.x-box.min.x>(phone?1.7:1.15),'campus should fill the view, not shrink into distant scenery');
  }
});
test('all five project interiors frame the primary display at eye level, with desktop story panels',()=>{
  for(const site of furnished)for(const phone of [false,true]){
    const view=madeProjectView(site.id,'inside',phone),layout=madeGalleryLayout(site),camera=cameraFor(view,phone);
    const screen=projectedBox(site,camera,[-1.4,layout.floor+1.05,-2.45],[1.4,layout.floor+2.92,-2.0]);
    assert(screen.min.x>-.92&&screen.max.x<.92&&screen.min.y>-.48&&screen.max.y<.6,`${site.id} ${phone?'phone':'desktop'} exhibit clipped`);
    assert(screen.max.x-screen.min.x>(phone?1:.5),'display remains large enough to read the project identity');
    if(phone){
      const surface=projectedBox(site,camera,[-1.28,layout.floor+1.15,-2.319],[1.28,layout.floor+2.83,-2.319]);
      const pixels=(surface.max.x-surface.min.x)*390/2;
      assert(pixels>=295&&pixels<=330,`${site.id} phone interactive surface must remain readable at390px: ${pixels}px`);
    }
    const [x,y,z]=layout.board,[w,h]=layout.boardSize,board=projectedBox(site,camera,[x-w/2,y-h/2,z],[x+w/2,y+h/2,z]);
    // Phone keeps the interactive exhibit primary; the full project remains
    // directly readable in HTML. Desktop also frames the side purpose panel.
    if(!phone){
      assert(board.min.x>-.98&&board.max.x<.98&&board.min.y>-.55&&board.max.y<.7,`${site.id} story board clipped`);
      assert(screen.max.x+.02<board.min.x,`${site.id} interactive display covers the project-purpose panel`);
    }
    assertEyeClear(new Vector3(...view.position),`${site.id} ${phone?'phone':'desktop'}`);
  }
});
test('entry-to-reading cameras clear actual architecture and furniture throughout each approach',()=>{
  for(const site of furnished)for(const phone of [false,true]){
    const start=new Vector3(...madeProjectView(site.id,'entry',phone).position),end=new Vector3(...madeProjectView(site.id,'inside',phone).position);
    for(let i=0;i<=80;i++)assertEyeClear(start.clone().lerp(end,i/80),`${site.id} approach ${i}/80`);
    // Multiple display rays catch mullions and furniture missed by a focus ray.
    for(const x of [-1.2,0,1.2])for(const y of [1.3,2.0,2.7]){
      const target=new Vector3(...madeSitePoint(site,[x,madeGalleryLayout(site).floor+y,-2.0]));
      const ray=new Raycaster(end,target.clone().sub(end).normalize(),.03,end.distanceTo(target)-.04);
      const hits=ray.intersectObjects(obstacles,true);
      assert.equal(hits.length,0,`${site.id} display blocked by ${hits.map(h=>h.object.name)}`);
    }
  }
});

test('each rendered studio has a full-width pedestrian doorway, including its glass and metal',()=>{
  for(const site of madeCampus.studios){
    const frame=new Group();frame.position.set(...site.center);frame.rotation.y=site.yaw;frame.updateMatrixWorld(true);
    const inverse=frame.matrixWorld.clone().invert(),depth=site.size[2]/2;
    const doorway=new Box3(new Vector3(-.95,.225,depth-.65),new Vector3(.95,2.4,depth+.5));
    const outer=doorway.clone().applyMatrix4(frame.matrixWorld),hits=[];
    scene.traverse(mesh=>{
      if(!mesh.isMesh)return;
      mesh.geometry.computeBoundingBox();if(!outer.intersectsBox(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)))return;
      const matrix=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),p=mesh.geometry.attributes.position,index=mesh.geometry.index;
      for(let i=0;i<(index?.count??p.count);i+=3){
        const triangle=new Triangle(...[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix)));
        if(doorway.intersectsTriangle(triangle))hits.push(mesh.name);
      }
    });
    assert.equal(hits.length,0,`${site.id} full pedestrian doorway blocked by ${[...new Set(hits)]}`);
  }
});

const CameraControls=CameraControlsPackage.default || CameraControlsPackage;
CameraControls.install({THREE});
globalThis.DOMRect ||= class { constructor(x=0,y=0,width=0,height=0){Object.assign(this,{x,y,width,height});} };
function galleryController(site,phone){
  const view=madeProjectView(site.id,'inside',phone),camera=new PerspectiveCamera(),controls=new CameraControls(camera);
  controls.setLookAt(...view.position,...view.target,false);controls.update(0);
  return {camera,controls,focus:new Vector3(...view.target),height:view.target[1]-site.center[1]};
}
function applyGalleryLimits(site,controls,height){
  const b=madeGalleryOrbitLimits(site,controls.distance,height);
  controls.minDistance=b.minDistance;controls.maxDistance=b.maxDistance;
  controls.minPolarAngle=b.minPolar;controls.maxPolarAngle=b.maxPolar;
  controls.minAzimuthAngle=b.minAzimuth;controls.maxAzimuthAngle=b.maxAzimuth;
  return b;
}
function obstructionBetween(eye,focus){
  return new Raycaster(eye,focus.clone().sub(eye).normalize(),.03,eye.distanceTo(focus)-.12).intersectObjects(obstacles,true);
}
test('captured floor-producing downward drag is blocked in Made rooms too',()=>{
  const site=furnished[0],broken=galleryController(site,false);
  broken.controls.rotate(0,2*Math.PI*310/900,false);broken.controls.update(0);
  assert(obstructionBetween(broken.camera.position,broken.focus).length>0,'unbounded drag really crosses shipped room panels');
  const fixed=galleryController(site,false);applyGalleryLimits(site,fixed.controls,fixed.height);
  fixed.controls.rotate(0,2*Math.PI*310/900,false);fixed.controls.update(0);
  assert.equal(obstructionBetween(fixed.camera.position,fixed.focus).length,0);
});
test('all furnished gallery orbit/zoom extremes clear actual walls, floors, ceiling, glazing and furniture',()=>{
  for(const site of furnished)for(const phone of [false,true]){
    const {camera,controls,focus,height}=galleryController(site,phone);
    let bounds=applyGalleryLimits(site,controls,height);
    for(const distance of [bounds.minDistance,(bounds.minDistance+bounds.maxDistance)/2,bounds.maxDistance]){
      controls.dollyTo(distance,false);controls.update(0);bounds=applyGalleryLimits(site,controls,height);
      for(const polar of [bounds.minPolar,(bounds.minPolar+bounds.maxPolar)/2,bounds.maxPolar])for(const azimuth of [bounds.minAzimuth,site.yaw,bounds.maxAzimuth]){
        controls.rotateTo(azimuth,polar,false);controls.update(0);
        const localHeight=camera.position.y-site.center[1];
        assert(localHeight>=bounds.minHeight-1e-6&&localHeight<=bounds.maxHeight+1e-6);
        assertEyeClear(camera.position,`${site.id} orbit radius${distance} angle${azimuth}`);
        const hits=obstructionBetween(camera.position,focus);
        assert.equal(hits.length,0,`${site.id} orbit crosses ${hits.map(h=>h.object.name)}`);
      }
    }
    controls.dispose();
  }
});

test('rear editorial boards sit in front of opaque shells across their full printed surface',()=>{
  // Audit the complete board plane against the actual shell/furnishings. The
  // console intentionally occupies part of the lower centre in the composition;
  // this test detects the separate defect where an entire board was buried
  // 19mm behind the new .48m-thick rear wall.
  for(const site of furnished)for(const phone of [false,true]){
    const layout=madeGalleryLayout(site),view=madeProjectView(site.id,'inside',phone),eye=new Vector3(...view.position);
    for(let ix=0;ix<=8;ix++)for(let iy=0;iy<=6;iy++){
      const point=new Vector3(...madeSitePoint(site,[layout.board[0]-layout.boardSize[0]/2+.1+ix*(layout.boardSize[0]-.2)/8,layout.board[1]-layout.boardSize[1]/2+.1+iy*(layout.boardSize[1]-.2)/6,layout.board[2]+.011]));
      const ray=new Raycaster(eye,point.clone().sub(eye).normalize(),.03,eye.distanceTo(point)-.01);
      const hits=ray.intersectObjects(obstacles,true);
      assert.equal(hits.length,0,`${site.id} board region${ix},${iy} obscured by ${[...new Set(hits.map(h=>h.object.name))]}`);
    }
  }
});

test('the actual purpose-panel frame clears the rear and side masonry walls',()=>{
  for(const site of furnished){
    const geometry=buildMadeGallery(site).wood,positions=geometry.attributes.position,frameBox=new Box3();
    // The shared wood mesh contains floor and bench below1m; its only raised
    // wood is the panel frame. Inspect those actual vertices, not a proxy size.
    for(let i=0;i<positions.count;i++)if(positions.getY(i)>1.2)frameBox.expandByPoint(new Vector3().fromBufferAttribute(positions,i));
    assert(!frameBox.isEmpty());
    const frame=new Group();frame.position.set(...site.center);frame.rotation.y=site.yaw;frame.updateMatrixWorld(true);
    const inverse=frame.matrixWorld.clone().invert(),outer=frameBox.clone().applyMatrix4(frame.matrixWorld),hits=[];
    scene.traverse(mesh=>{
      if(!mesh.isMesh)return;mesh.geometry.computeBoundingBox();
      if(!outer.intersectsBox(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld)))return;
      const matrix=new Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),p=mesh.geometry.attributes.position,index=mesh.geometry.index;
      for(let i=0;i<(index?.count??p.count);i+=3){
        const triangle=new Triangle(...[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(matrix)));
        if(frameBox.intersectsTriangle(triangle))hits.push(mesh.name);
      }
    });
    assert.equal(hits.length,0,`${site.id} editorial frame intersects ${[...new Set(hits)]}`);
  }
});
