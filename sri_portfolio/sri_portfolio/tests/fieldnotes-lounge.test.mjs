import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Line3, Mesh, MeshBasicMaterial, Raycaster, Triangle, Vector3 } from 'three';
import { buildFieldnotesLounge, makeFieldnotesChair } from '../app/lib/fieldnotes-lounge.mjs';
import { buildFieldnotesGeometry } from '../app/lib/fieldnotes-geometry.mjs';
import { fieldnotesFire, fieldnotesLounge, fieldnotesPaths, fieldnotesTerraces, fieldnotesTable } from '../app/lib/fieldnotes-layout.mjs';

const lounge=buildFieldnotesLounge(),garden=buildFieldnotesGeometry(),material=new MeshBasicMaterial();
const terrace=new Mesh(garden.terraces,material);terrace.updateMatrixWorld();
const supportAt=(x,z)=>new Raycaster(new Vector3(x,2,z),new Vector3(0,-1,0),0,2.2).intersectObject(terrace)[0];
function triangles(geometry) {
  const p=geometry.attributes.position,index=geometry.index,result=[];
  for(let i=0;i<(index?.count??p.count);i+=3)result.push(new Triangle(...[0,1,2].map(j=>new Vector3().fromBufferAttribute(p,index?index.getX(i+j):i+j))));
  return result;
}
function footprintDistance(triangle,point) {
  const flat=new Triangle(...[triangle.a,triangle.b,triangle.c].map(v=>new Vector3(v.x,0,v.z)));
  // Vertical boards project to a segment, not a nondegenerate triangle.
  if(flat.getArea()<1e-10)return Math.min(...[[flat.a,flat.b],[flat.b,flat.c],[flat.c,flat.a]].map(([a,b])=>a.distanceToSquared(b)<1e-15?a.distanceTo(point):new Line3(a,b).closestPointToPoint(point,true,new Vector3()).distanceTo(point)));
  return flat.closestPointToPoint(point,new Vector3()).distanceTo(point);
}
test('complete rendered chairs and bowl sit on the terrace rather than floating',()=>{
  const pad=fieldnotesTerraces[1],bounds=new Box3(new Vector3(pad.x-pad.width/2,-.1,pad.z-pad.depth/2),new Vector3(pad.x+pad.width/2,2,pad.z+pad.depth/2));
  for(const name of ['chairs','bowl']) {
    const geometry=lounge[name];geometry.computeBoundingBox();
    const p=geometry.attributes.position;
    let bearings=0;
    for(let i=0;i<p.count;i++) {
      const vertex=new Vector3().fromBufferAttribute(p,i);
      assert(bounds.containsPoint(vertex),`${name} hangs past its terrace`);
      if(vertex.y>geometry.boundingBox.min.y+.002)continue;
      const hit=supportAt(vertex.x,vertex.z);
      assert(hit,`${name} bearing misses actual terrace`);
      assert(vertex.y-hit.point.y>=-.002 && vertex.y-hit.point.y<.013,`${name} floats ${vertex.y-hit.point.y}m`);
      bearings++;
    }
    assert(bearings>=4,`${name} has actual ground-contact vertices`);
  }
});
test('all rendered chair triangles clear complete path widths, the fire bowl and side table',()=>{
  const paths=fieldnotesPaths.map(([a,b,width])=>new Box3(
    new Vector3(Math.min(a[0],b[0])-(a[0]===b[0]?width/2:0),-.1,Math.min(a[1],b[1])-(a[1]===b[1]?width/2:0)),
    new Vector3(Math.max(a[0],b[0])+(a[0]===b[0]?width/2:0),2,Math.max(a[1],b[1])+(a[1]===b[1]?width/2:0)),
  ));
  const fire=new Vector3(fieldnotesFire.x,0,fieldnotesFire.z),table=new Vector3(fieldnotesTable.x,0,fieldnotesTable.z);
  for(const triangle of triangles(lounge.chairs)) {
    for(const path of paths)assert(!path.intersectsTriangle(triangle),'chair triangle enters full walking width');
    assert(footprintDistance(triangle,fire)>fieldnotesFire.radius+.25,`chair crowds fire bowl: ${footprintDistance(triangle,fire)}; ${[triangle.a,triangle.b,triangle.c].map(v=>v.toArray())}`);
    assert(footprintDistance(triangle,table)>fieldnotesTable.radius+.08,'chair intersects conversation table');
  }
});
test('four distinct chair footprints face the fire with usable separation',()=>{
  const geometry=makeFieldnotesChair(),footprints=[];
  assert.equal(fieldnotesLounge.length,4);
  for(const seat of fieldnotesLounge) {
    const copy=geometry.clone().rotateY(seat.yaw).translate(seat.x,.031,seat.z);copy.computeBoundingBox();
    for(const other of footprints)assert(!copy.boundingBox.intersectsBox(other),'adjacent rendered chairs overlap');
    footprints.push(copy.boundingBox.clone());
    const forward=new Vector3(Math.sin(seat.yaw),0,Math.cos(seat.yaw));
    const focus=new Vector3(fieldnotesFire.x-seat.x,0,fieldnotesFire.z-seat.z).normalize();
    assert(forward.dot(focus)>.995,'seat points at the conversation focus');
    copy.dispose();
  }
  geometry.dispose();
});
