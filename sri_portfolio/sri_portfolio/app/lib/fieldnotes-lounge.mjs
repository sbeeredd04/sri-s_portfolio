import { Color, CylinderGeometry, ExtrudeGeometry, Float32BufferAttribute, LatheGeometry, Shape, Vector2 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { roundedBox } from './model-geometry.mjs';
import { fieldnotesFire, fieldnotesLounge } from './fieldnotes-layout.mjs';

function tint(geometry, hex) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g !== geometry) geometry.dispose();
  const c = new Color(hex), colors = [];
  for (let i=0; i<g.attributes.position.count; i++) colors.push(c.r,c.g,c.b);
  g.setAttribute('color',new Float32BufferAttribute(colors,3));
  g.deleteAttribute('uv');
  return g;
}
function merge(parts) {
  const result = mergeGeometries(parts);
  parts.forEach(g=>g.dispose());
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}

// A full-size timber chair: splayed legs, dished seat and five fan-shaped
// back boards. The rounded crown is cut into each board, not a stack of cubes.
export function makeFieldnotesChair() {
  const parts=[];
  const board=(size,position,rotation=[0,0,0],color='#a77950')=>{
    const g=roundedBox(size,.012,1);
    g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);
    g.translate(...position); parts.push(tint(g,color));
  };
  for (let i=0;i<6;i++) {
    const z=-.24+i*.094;
    board([.53,.038,.087],[0,.39+.06*(z+.15)**2,z],[-.04,0,0],i%2?'#a6784f':'#b18559');
  }
  for (let i=-2;i<=2;i++) {
    const left=i*.104-.049, right=i*.104+.049;
    const top=.96-Math.abs(i)*.035;
    const s=new Shape();
    s.moveTo(left,.38);s.lineTo(right,.38);s.lineTo(right+.025*i,top-.025);
    s.lineTo(right+.025*i-.018,top);s.lineTo(left+.025*i+.018,top);
    s.lineTo(left+.025*i,top-.025);s.closePath();
    const g=new ExtrudeGeometry(s,{depth:.034,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.006,bevelThickness:.006,curveSegments:1});
    g.rotateX(-.15);g.translate(0,0,-.22);
    parts.push(tint(g,i%2?'#9e7049':'#b08255'));
  }
  for (const side of [-1,1]) {
    board([.055,.6,.065],[side*.265,.30,.29],[0,0,side*-.06],'#795638');
    board([.055,.5,.065],[side*.25,.25,-.25],[-.27,0,side*.07],'#795638');
    board([.12,.045,.68],[side*.29,.59,.0],[-.025,0,0],'#b3865b');
    board([.06,.09,.61],[side*.245,.31,.03],[-.02,0,0],'#845f3e');
  }
  board([.55,.06,.045],[0,.34,-.25],[0,0,0],'#795638');
  return merge(parts);
}

export function buildFieldnotesLounge() {
  const chair=makeFieldnotesChair();
  const chairs=fieldnotesLounge.map(seat=>chair.clone().rotateY(seat.yaw).translate(seat.x,.031,seat.z));
  chair.dispose();
  // Closed double-wall spun bowl with a visible lip and hollow interior.
  const profile=[[0,-.009],[.13,-.009],[.15,.10],[.26,.15],[.35,.29],[.36,.34],[.335,.35],[.31,.29],[.23,.18],[.12,.15],[0,.15]];
  const bowl=new LatheGeometry(profile.map(p=>new Vector2(...p)),20);
  bowl.translate(fieldnotesFire.x,fieldnotesFire.y,fieldnotesFire.z);
  const logs=[];
  for(let i=0;i<3;i++){
    const g=new CylinderGeometry(.035,.042,.42,7);
    g.rotateZ(Math.PI/2);g.rotateY(i*2.1);g.translate(fieldnotesFire.x,.25+i*.022,fieldnotesFire.z);
    logs.push(tint(g,i%2?'#483829':'#654732'));
  }
  return {chairs:merge(chairs),bowl,logs:merge(logs)};
}

// Tapered, bent ribbons produce a small flame silhouette without a cone stack.
export function fieldnotesFlameGeometry() {
  const shape=new Shape();
  shape.moveTo(-.12,0);shape.quadraticCurveTo(-.16,.18,-.06,.30);
  shape.quadraticCurveTo(.03,.38,.025,.55);shape.quadraticCurveTo(.16,.27,.10,.14);
  shape.quadraticCurveTo(.17,.04,.12,0);shape.closePath();
  const g=new ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false,curveSegments:5});
  g.translate(0,0,-.0125);return g;
}
