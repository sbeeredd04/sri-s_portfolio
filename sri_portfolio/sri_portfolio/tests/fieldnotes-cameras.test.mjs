import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Box3, DoubleSide, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, Raycaster, Triangle, Vector3 } from 'three';
import { fieldnotesArrival, fieldnotesCameras, fieldnotesCanopy, fieldnotesCanopyY, fieldnotesDesk, fieldnotesLounge, fieldnotesStudio } from '../app/lib/fieldnotes-layout.mjs';
import { quarterViews, newsstand } from '../app/lib/fieldnotes-quarter.mjs';
import { buildFieldnotesGeometry } from '../app/lib/fieldnotes-geometry.mjs';
import { fieldnotesCoastSource, fieldnotesCoastGroundY } from '../app/lib/fieldnotes-coast-site.mjs';
import { districtSigns, boardYaw } from '../app/lib/district-signs.mjs';
import { shippedModel } from './helpers/authored-model.mjs';

const built=buildFieldnotesGeometry(),material=new MeshBasicMaterial({side:DoubleSide});
const architecture=Object.entries(built).filter(([name])=>name!=='glass').map(([name,geometry])=>{
  const mesh=new Mesh(geometry,material);mesh.name=name;mesh.updateMatrixWorld();return mesh;
});
const {scene:coast}=await shippedModel(fieldnotesCoastSource.split('?')[0]);
const obstacles=[...architecture,coast];
const views={arrival:fieldnotesArrival,writing:fieldnotesCameras.writing,lounge:fieldnotesCameras.collaborate,kiosk:quarterViews.find(v=>v.id==='newsstand')};
function cameraFor(shot,phone) {
  const view=phone?shot.portrait:shot;
  const width=phone?390:1440,height=phone?844:900;
  const camera=new PerspectiveCamera(view.fov,width/height,.22,1000);
  camera.position.set(...view.position);
  camera.lookAt(...view.target);
  const arrival=shot===fieldnotesArrival;
  camera.setViewOffset(width,height,arrival&&!phone?-width*.1:0,
    phone?-height*(arrival?.035:.025):0,width,height);
  camera.updateMatrixWorld();
  return camera;
}
function projectBox(camera,min,max) {
  const box=new Box3();
  for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]])box.expandByPoint(new Vector3(x,y,z).project(camera));
  return box;
}
const studioBox=[[fieldnotesCanopy.x0,0,fieldnotesCanopy.zFront],[fieldnotesCanopy.x1,fieldnotesCanopyY(0,fieldnotesCanopy.zBack)+.1,fieldnotesCanopy.zBack]];
const kioskBox=[[newsstand.x-newsstand.size[1]/2,0,newsstand.z-newsstand.size[0]/2],[newsstand.x+newsstand.size[1]/2,newsstand.height+.2,newsstand.z+newsstand.size[0]/2]];

test('Fieldnotes phone arrival fills the clear viewport with the inhabited garden',()=>{
  const camera=cameraFor(fieldnotesArrival,true),occupied=new Box3();
  for(const [min,max] of [studioBox,kioskBox])occupied.union(projectBox(camera,min,max));
  assert(occupied.min.x>-.9 && occupied.max.x<.9,'studio and newsstand clear both viewport sides');
  assert(occupied.min.y>-.4 && occupied.max.y<.55,'content sits between title and bottom reading controls');
  assert(occupied.max.x-occupied.min.x>1.4,'garden remains legible at phone size');
  const feet=new Vector3(0,0,-4.7).project(camera),head=new Vector3(0,1.75,-4.7).project(camera);
  assert((head.y-feet.y)*844/2>40,'adult scale remains readable at arrival');
});

test('Fieldnotes desktop arrival frames the rebuilt coast, blade, pier and inhabited garden',()=>{
  const camera=cameraFor(fieldnotesArrival,false);
  for(const [name,minX,maxX,minY,maxY] of [
    ['Fieldnotes_LandSurface',-.56,.94,-.94,.68],
    ['Fieldnotes_BluffAndWaterline',-.56,.94,-.94,.68],
    ['Fieldnotes_SignalBlade',.22,.85,-.5,.62],
    ['Fieldnotes_Pier',.32,.91,-.5,.48],
  ]){
    const mesh=coast.getObjectByName(name);
    assert.ok(mesh?.isMesh,name);
    const positions=mesh.geometry.attributes.position;
    const vertex=new Vector3();
    for(let i=0;i<positions.count;i++){
      vertex.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);
      if(vertex.y<-.36)continue; // Underwater rock toes and pier piles.
      vertex.project(camera);
      assert.ok(vertex.x>minX && vertex.x<maxX && vertex.y>minY && vertex.y<maxY,
        `${name} leaves its clear desktop frame at ${vertex.toArray()}`);
    }
  }
  const occupied=new Box3();
  const loungeBox=[
    [Math.min(...fieldnotesLounge.map(({x})=>x))-.36,0,Math.min(...fieldnotesLounge.map(({z})=>z))-.45],
    [Math.max(...fieldnotesLounge.map(({x})=>x))+.36,1.75,Math.max(...fieldnotesLounge.map(({z})=>z))+.45],
  ];
  for(const [min,max] of [studioBox,kioskBox,loungeBox])occupied.union(projectBox(camera,min,max));
  assert.ok(occupied.min.x>-.52 && occupied.max.x<.78 && occupied.min.y>-.5 && occupied.max.y<.58);
  assert.ok(occupied.max.x-occupied.min.x>.35,'publishing garden still reads at the wide arrival');
});

test('desktop writing camera sees both bookshelf fronts through the clear central pane',()=>{
  const shot=fieldnotesCameras.writing,eye=new Vector3(...shot.position);
  assert.ok(eye.z<fieldnotesStudio.front,'camera stays outside the glass');
  const shelves=fieldnotesStudio.shelfBays.flatMap(([left,right])=>
    [left+.04,(left+right)/2,right-.04].flatMap((x)=>[.35,1.4,2.65].map((y)=>[x,y,3.48])));
  const desk=[-.6,0,.6].map((offset)=>[fieldnotesDesk.x+offset,1.14,fieldnotesDesk.z-.22]);
  const camera=cameraFor(shot,false);
  for(const point of [...shelves,...desk]){
    const target=new Vector3(...point),direction=target.clone().sub(eye);
    const ray=new Raycaster(eye,direction.clone().normalize(),.03,direction.length()-.02);
    const hits=ray.intersectObjects(obstacles,true);
    assert.equal(hits.length,0,`studio joinery obscures ${point}: ${hits.map(h=>h.object.name)}`);
    const screen=target.project(camera);
    assert.ok(Math.abs(screen.x)<.89 && screen.y>-.73 && screen.y<.73,
      `library detail ${point} leaves frame: ${screen.toArray()}`);
  }
});
test('writing, kiosk and four-seat lounge focus fit at desktop and phone sizes',()=>{
  for(const phone of [false,true]) {
    const kiosk=projectBox(cameraFor(views.kiosk,phone),...kioskBox);
    assert(kiosk.min.x>-.9 && kiosk.max.x<.9 && kiosk.min.y>-.5 && kiosk.max.y<.6);
    const writing=projectBox(cameraFor(views.writing,phone),[fieldnotesDesk.x-.8,.8,fieldnotesDesk.z-.2],[fieldnotesDesk.x+.8,2,fieldnotesDesk.z]);
    assert(writing.min.x>-.9 && writing.max.x<.9 && writing.min.y>-.5 && writing.max.y<.6);
    const loungeCamera=cameraFor(views.lounge,phone);
    for(const seat of fieldnotesLounge) {
      const seatView=projectBox(loungeCamera,[seat.x-.36,0,seat.z-.45],[seat.x+.36,1.65,seat.z+.45]);
      assert(seatView.min.x>-.95 && seatView.max.x<.95 && seatView.min.y>-.65 && seatView.max.y<.6,'each chair and seated person remains inside the composition');
    }
    const view=phone?views.kiosk.portrait:views.kiosk;
    const toReader=new Vector3(...view.position).sub(new Vector3(newsstand.x,1.2,newsstand.z)).normalize();
    assert(toReader.dot(new Vector3(Math.sin(newsstand.yaw),0,Math.cos(newsstand.yaw)))>.95,'camera faces magazine covers rather than side wall');
  }
});
test('Fieldnotes close cameras and approach rays clear the rendered architecture and shipped coast',()=>{
  const triangles=[];
  for(const object of obstacles)object.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const p=mesh.geometry.attributes.position,index=mesh.geometry.index;
    for(let i=0;i<(index?.count??p.count);i+=3){
      const vertices=[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
      triangles.push({name:mesh.name,triangle:new Triangle(...vertices),bounds:new Box3().setFromPoints(vertices)});
    }
  });
  for(const [name,shot] of Object.entries(views))for(const phone of [false,true]) {
    const view=phone?shot.portrait:shot,eye=new Vector3(...view.position),focus=new Vector3(...view.target);
    const body=new Box3(eye.clone().addScalar(-.16),eye.clone().addScalar(.16));
    for(const t of triangles)if(body.intersectsBox(t.bounds))assert(!body.intersectsTriangle(t.triangle),`${name} camera enters ${t.name}`);
    const ray=new Raycaster(eye,focus.clone().sub(eye).normalize(),.05,eye.distanceTo(focus)-.25);
    const hits=ray.intersectObjects(obstacles,true);
    assert.equal(hits.length,0,`${name} ${phone?'phone':'desktop'} focus is obstructed by ${hits.map(h=>h.object.name)}`);
  }
});
test('phone lounge omits the redundant foreground wayfinding board that covered the fire',async()=>{
  // Regression fixture uses the removed Signpost's actual board size, offset
  // and three heading transforms. A focus-center ray alone missed this bug:
  // the board covered the lower seated bodies/fire, just below that ray.
  const sign=districtSigns.future,post=new Group();
  post.position.set(sign.x,fieldnotesCoastGroundY,sign.z);
  const geometry=new PlaneGeometry(1.5,.3);
  sign.boards.forEach((board,index)=>{
    const heading=new Group();heading.position.y=2.3-index*.38;heading.rotation.y=-boardYaw(sign,board.to);
    const face=new Mesh(geometry,material);face.position.set(.79,0,.028);heading.add(face);post.add(heading);
  });
  post.updateMatrixWorld(true);
  const view=fieldnotesCameras.collaborate.portrait,eye=new Vector3(...view.position),fire=new Vector3(.1,.4,-2.12);
  const ray=new Raycaster(eye,fire.clone().sub(eye).normalize(),.01,eye.distanceTo(fire));
  assert(ray.intersectObject(post,true).length>0,'removed board really occluded the phone fire-bowl view');
  const runtime=await readFile(new URL('../app/components/personal/FieldnotesQuarter.jsx',import.meta.url),'utf8');
  assert(!/<Signpost\b/.test(runtime),'keep courtyard sightlines open; kiosk already carries its own sign');
  geometry.dispose();
});
