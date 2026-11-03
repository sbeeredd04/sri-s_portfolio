import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BufferGeometry, DoubleSide, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { madeCampus } from '../app/lib/made-campus-data.mjs';
import { auditMadeFacades } from '../scripts/lib/made-facade-audit.mjs';
import { buildMadeGallery } from '../app/lib/made-gallery.mjs';
import { shippedModel } from './helpers/authored-model.mjs';

const site={id:'fixture',name:'Fixture',center:[0,0,0],yaw:0,size:[4,4,4]};
function facadeFixture(relief=0,partial=false){
  const positions=[],colors=[];
  function quad(x0,x1,y0,y1,z,color,reverse=false){
    const corners=[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]];
    for(const i of reverse?[2,1,0,3,2,0]:[0,1,2,0,2,3]){positions.push(...corners[i]);colors.push(...color);}
  }
  quad(-2,2,0,4,2,[.2,.3,.2]);
  // The trim's rear contact deliberately has opposite winding. Double-sided
  // rendering still flickers if it is exposed; winding cannot exempt it.
  quad(-1,1,1,2,2,[.8,.7,.6],true);
  if(relief)quad(-1,partial?0:1,1,2,2+relief,[.8,.7,.6]);
  const geometry=new BufferGeometry();
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
  const mesh=new Mesh(geometry,new MeshBasicMaterial());mesh.name='Fixture_Architecture';
  const scene=new Group();scene.add(mesh);scene.updateMatrixWorld(true);
  return scene;
}

test('all six decoded studio facades have no exposed competing wall/trim surfaces',async()=>{
  const {scene}=await shippedModel(madeCampus.source.split('?')[0]);
  const planes=auditMadeFacades(scene,madeCampus.studios);
  assert.equal(planes.length,24);
  assert.equal(new Set(planes.map(p=>p.studio)).size,6);
  for(const plane of planes){
    assert.ok(plane.triangles>0,`Actual plane missing: ${JSON.stringify(plane)}`);
    assert.equal(plane.visiblePairs,0,JSON.stringify(plane));
    assert.equal(plane.visibleOverlapM2,0,JSON.stringify(plane));
  }
  assert.ok(planes.some(p=>p.coveredContacts>0),'Real protruding trim retains hidden wall contact');
});

test('audit catches opposite-winding coplanar trim and accepts genuinely covered contact',()=>{
  const front=scene=>auditMadeFacades(scene,[site]).find(p=>p.face==='front');
  assert.ok(front(facadeFixture()).visibleOverlapM2>1.9,'Two square metres of exposed competing colour must fail');
  const raised=front(facadeFixture(.12));
  assert.equal(raised.visiblePairs,0);
  assert.ok(raised.coveredContacts>0);
  assert.ok(front(facadeFixture(.12,true)).visiblePairs>0,'Covering only half the overlap must not exempt the exposed half');
  assert.ok(front(facadeFixture(.001)).visiblePairs>0,'A one-millimetre decal is not robust architectural relief');
});

test('Agentex retains its full adult-height entrance and deep glazing within the original footprint', async () => {
  const { scene } = await shippedModel(madeCampus.source.split('?')[0]);
  const site = madeCampus.studios.find(({ id }) => id === 'agentex');
  const root = scene.getObjectByName('Agentex_Root');
  const origin = root.getWorldPosition(new Vector3());
  const meshes = root.children.filter((mesh) => mesh.isMesh);
  assert.equal(meshes.length, 4);
  for (const mesh of meshes) mesh.material.side = DoubleSide;
  const cast = (x, y, far) => new Raycaster(
    new Vector3(x, y, 8).add(origin), new Vector3(0, 0, -1), 0, far,
  ).intersectObjects(meshes, false);

  // Sample the complete usable width and height between the fitted jambs.
  for (const x of [-1.09, -.55, 0, .55, 1.09]) {
    for (const y of [.21, .8, 1.75, 2.2, 2.49]) {
      assert.deepEqual(cast(x, y, 5), [], `Entrance obstructed at ${x}, ${y}`);
    }
  }
  for (const x of [-1.135, 1.135]) {
    assert.equal(cast(x, 1.75, 5)[0]?.object.name, 'Agentex_MetalDetails');
  }
  const wall = cast(3.8, 1.75, 5)[0];
  const pane = cast(2.9, 1.75, 5)[0];
  assert.equal(pane.object.name, 'Agentex_Glazing');
  const reveal = wall.point.z - pane.point.z;
  assert.ok(reveal >= .32 && reveal <= .36, `Glazing reveal is ${reveal} m`);
  const bounds = (mesh) => new Box3().setFromObject(mesh, true).translate(origin.clone().negate());
  const shell = bounds(scene.getObjectByName('Agentex_Architecture'));
  const roof = bounds(scene.getObjectByName('Agentex_SedumHVAC'));
  assert.ok(shell.max.x <= site.size[0] / 2 + .026);
  assert.ok(shell.max.z <= site.size[2] / 2 + .026);
  assert.ok(roof.max.y < shell.max.y - .1, 'Roof plant stays below the coping');
  const ceiling = new Raycaster(
    origin.clone().add(new Vector3(0, 3, -1)), new Vector3(0, 1, 0),
  ).intersectObjects(meshes, false)[0].point.y - origin.y;
  const built = buildMadeGallery(site);
  assert.ok(ceiling - built.light.boundingBox.max.y < .05);
  assert.ok(ceiling > built.light.boundingBox.max.y);
  for (const geometry of Object.values(built)) geometry.dispose();
});
