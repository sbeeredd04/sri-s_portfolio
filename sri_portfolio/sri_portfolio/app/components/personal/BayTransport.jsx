"use client";
import { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { WORLD_RADIUS } from '../../lib/world-layout.mjs';
import { seaHeight } from '../../lib/sea-motion.mjs';
import { bayTraffic } from '../../lib/bay-traffic.mjs';
import { homeCableLanes as lanes, homeCableSupports } from '../../lib/home-cables.mjs';

const craft='/models/islands/bay-craft.glb?v=b9f86974607784b6';
const ease=t=>t*t*(3-2*t);
const shuttle=(t,period,offset)=>{
  const k=(t/period+offset)%1;
  return k<.5?ease(THREE.MathUtils.clamp((k-.03)/.44,0,1)):1-ease(THREE.MathUtils.clamp((k-.53)/.44,0,1));
};
function Cable({line,offset}){
  const geometry=useMemo(()=>{
    const points=Array.from({length:61},(_,i)=>{
      const p=line.getPointAt(i/60),t=line.getTangentAt(i/60);
      return p.add(new THREE.Vector3(t.z,0,-t.x).normalize().multiplyScalar(offset));
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.026,4,false);
  },[line,offset]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} raycast={()=>null}><meshStandardMaterial color="#71645a" roughness={.72}/></mesh>;
}
const wakeVertex = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`;
const wakeFragment = `
varying vec2 vUv;
uniform float time;
void main() {
  float distance = 1. - vUv.y;
  float side = abs(vUv.x - .5);
  float edge = abs(side - (.12 + distance * .32));
  float rails = 1. - smoothstep(.012, .075, edge);
  float pulse = pow(.5+.5*sin(distance*41. - time*4. + side*7.), 3.);
  float foam = (1. - smoothstep(.04,.2,side)) * (1. - smoothstep(0.,.48,distance));
  float alpha = (rails*(.26+.74*pulse)*.53 + foam*.32)
    * (1. - smoothstep(.19,1.,distance)) * smoothstep(0.,.07,distance);
  gl_FragColor = vec4(.66,.89,.86,alpha);
  #include <colorspace_fragment>
}
`;
function Wake({ vessel, clock, wind }) {
  const [width, length, stern] = vessel.wake;
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry(), positions = new Float32Array(33 * 6), uvs = [], indices = [];
    for (let i = 0; i <= 32; i++) {
      uvs.push(0, 1-i/32, 1, 1-i/32);
      if (i < 32) { const a=i*2; indices.push(a,a+2,a+1,a+1,a+2,a+3); }
    }
    g.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    g.setIndex(indices);
    return g;
  }, []);
  const scratch = useMemo(() => ({ p:new THREE.Vector3(), d:new THREE.Vector3() }),[]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(()=>{
    const time=clock.time.value, perimeter=vessel.line.getLength();
    const head=vessel.phase+time*vessel.speed/perimeter;
    const positions=geometry.attributes.position;
    for(let i=0;i<=32;i++) {
      const distance=stern+length*i/32;
      const u=((head-distance/perimeter)%1+1)%1;
      vessel.line.getPointAt(u,scratch.p);
      vessel.line.getTangentAt(u,scratch.d);
      for(let side=0;side<2;side++) {
        const offset=(side-.5)*width;
        const x=scratch.p.x+scratch.d.z*offset, z=scratch.p.z-scratch.d.x*offset;
        positions.setXYZ(i*2+side,x,seaHeight(x,z,time,wind)+.035,z);
      }
    }
    positions.needsUpdate=true;
  });
  return <mesh geometry={geometry} frustumCulled={false} raycast={()=>null}>
    <shaderMaterial uniforms={clock} vertexShader={wakeVertex} fragmentShader={wakeFragment} transparent depthWrite={false} side={THREE.DoubleSide}/>
  </mesh>;
}
export default function BayTransport({animate,wind=4}){
  const {scene}=useGLTF(craft);
  const assets = useMemo(() => [
    ...bayTraffic.map(({ root }) => root),
    ...lanes.map(() => "Gondola_Root"),
  ].map(name => scene.getObjectByName(name).clone(true)), [scene]);
  const refs = useRef([]);
  const clock = useMemo(() => ({ time: { value: 0 } }), []);
  const scratch = useMemo(() => ({ point: new THREE.Vector3(), direction: new THREE.Vector3() }), []);
  useFrame((_, delta) => {
    if (animate) clock.time.value += Math.min(.05, delta);
    const t = clock.time.value;
    bayTraffic.forEach(({ line, phase, speed, at, yaw }, i) => {
      const obj = refs.current[i];
      if (!obj) return;
      if (line) {
        const u = (phase + t * speed / line.getLength()) % 1;
        line.getPointAt(u, scratch.point);
        line.getTangentAt(u, scratch.direction);
        obj.position.copy(scratch.point);
        yaw = Math.atan2(scratch.direction.x, scratch.direction.z);
      } else obj.position.set(...at);
      obj.rotation.y = yaw;
      const x=obj.position.x, z=obj.position.z;
      const dx=Math.sin(yaw), dz=Math.cos(yaw);
      const height=(sx,sz)=>seaHeight(sx,sz,t,wind);
      obj.children[0].position.y = height(x,z);
      obj.children[0].rotation.x = -(height(x+dx,z+dz)-height(x-dx,z-dz))*.5;
      obj.children[0].rotation.z = (height(x+dz,z-dx)-height(x-dz,z+dx))*.5;
    });
    lanes.forEach(({line,offset,period,phase},i)=>{
      const obj=refs.current[i + bayTraffic.length];if(!obj)return;
      const u=shuttle(t,period,phase),p=line.getPointAt(u),d=line.getTangentAt(u);
      p.add(new THREE.Vector3(d.z,0,-d.x).normalize().multiplyScalar(offset));
      obj.position.copy(p);obj.position.y-=2.68;
      obj.rotation.set(0,Math.atan2(d.x,d.z),Math.sin(t*.87+i)*Math.min(.034,wind*.003));
    });
  });
  return <group position={[0,WORLD_RADIUS,0]}>
    {lanes.map(({line,offset},i)=><Cable key={i} {...{line,offset}}/>)}
    {bayTraffic.filter(v=>v.wake&&v.line).map(v=><Wake key={v.id} vessel={v} clock={clock} wind={wind}/>)}
    {assets.map((asset,i)=><group key={i} ref={o=>{refs.current[i]=o;}}><primitive object={asset}/></group>)}
    {homeCableSupports.map(({name,point,ground,height})=><mesh key={name} position={[point.x,ground+height/2,point.z]} castShadow>
      <cylinderGeometry args={[.15,.26,height,6]}/><meshStandardMaterial color="#8b6954" roughness={.9}/>
    </mesh>)}
  </group>;
}
