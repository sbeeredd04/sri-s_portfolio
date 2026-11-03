"use client";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import { WORLD_RADIUS, surfaceHeight } from "../../lib/world-layout.mjs";

// A few uninhabited silhouettes beyond the navigable bay. Fixed seeds keep
// the landmarks stable between visits; none is a destination or boat lane.
const islands = [
  [-255, -180, 18, 12, 11, 1.3], [-168, -280, 25, 14, 16, 2.7],
  [-65, -310, 10, 8, 5, 4.1], [92, -286, 21, 15, 13, 5.8],
  [244, -199, 15, 9, 8, 8.2], [302, 54, 12, 18, 10, 9.4],
];
function buildIslets() {
  const positions = [], colors = [];
  const stone = ["#747e78", "#87908a", "#8f9384", "#66746c"].map(c=>new THREE.Color(c));
  const green = ["#65784c", "#798952", "#586e48"].map(c=>new THREE.Color(c));
  const water = (x,z) => WORLD_RADIUS + surfaceHeight("projects",x-9,z-72);
  for (const [x,z,rx,rz,height,seed] of islands) {
    const count=17, rings=[];
    for (let layer=0;layer<4;layer++) {
      const r=[1,.88,.57,.16][layer];
      rings.push(Array.from({length:count},(_,i)=>{
        const a=i/count*Math.PI*2;
        const jag=1+.12*Math.sin(a*3+seed)+.1*Math.cos(a*5-seed);
        const px=x+Math.cos(a)*rx*r*jag-layer*rx*.08;
        const pz=z+Math.sin(a)*rz*r*jag+layer*rz*.07;
        const y=water(px,pz)+[-2.5,1.2,height*.58,height][layer]+(layer>1?Math.sin(a*2+seed)*height*.12:0);
        return [px,y,pz];
      }));
    }
    const face=(a,b,c,palette,i)=>{
      positions.push(...a,...b,...c);
      const color=palette[(i+Math.floor(seed))%palette.length];
      for(let k=0;k<3;k++)colors.push(color.r,color.g,color.b);
    };
    for(let l=0;l<3;l++)for(let i=0;i<count;i++){
      const j=(i+1)%count, palette=l===2?green:stone;
      face(rings[l][i],rings[l+1][j],rings[l][j],palette,i);
      face(rings[l][i],rings[l+1][i],rings[l+1][j],palette,i+1);
    }
    const center=[x-rx*.27,water(x,z)+height*.96,z+rz*.22];
    for(let i=0;i<count;i++)face(rings[3][i],center,rings[3][(i+1)%count],green,i);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}
export default function DistantIslets(){
  const geometry=useMemo(buildIslets,[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} raycast={()=>null}>
    <meshStandardMaterial vertexColors roughness={.94} side={THREE.DoubleSide}/>
  </mesh>;
}
