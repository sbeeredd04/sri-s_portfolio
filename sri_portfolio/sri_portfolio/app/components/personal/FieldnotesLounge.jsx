"use client";
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide } from 'three';
import { buildFieldnotesLounge, fieldnotesFlameGeometry } from '../../lib/fieldnotes-lounge.mjs';
import { fieldnotesFire, fieldnotesLounge } from '../../lib/fieldnotes-layout.mjs';
import SoftHuman from './SoftHuman';

export default function FieldnotesLounge({ animate, detailed }) {
  const built=useMemo(buildFieldnotesLounge,[]);
  const flame=useMemo(fieldnotesFlameGeometry,[]);
  const flames=useRef();const time=useRef(0);
  useEffect(()=>()=>{Object.values(built).forEach(g=>g.dispose());flame.dispose();},[built,flame]);
  useFrame((_,dt)=>{
    if(!animate||!flames.current)return;
    time.current+=Math.min(dt,.05);
    flames.current.children.forEach((mesh,i)=>{
      mesh.scale.y=.62+i*.12+Math.sin(time.current*4.7+i*1.8)*.14;
      mesh.rotation.z=Math.sin(time.current*2.2+i)*.08;
    });
  });
  return <group>
    <mesh geometry={built.chairs} castShadow receiveShadow><meshStandardMaterial vertexColors roughness={.82}/></mesh>
    <mesh geometry={built.bowl} castShadow receiveShadow><meshStandardMaterial color="#685244" roughness={.78} metalness={.28} flatShading/></mesh>
    <mesh geometry={built.logs} castShadow><meshStandardMaterial vertexColors roughness={.94}/></mesh>
    <group ref={flames} position={[fieldnotesFire.x,.28,fieldnotesFire.z]}>
      {[0,1,2].map(i=><mesh key={i} geometry={flame} rotation={[0,i*2.1,0]} scale={[.8,.7+i*.12,.8]}>
        <meshBasicMaterial color={i===1?'#ffe1a0':'#ff9f42'} side={DoubleSide} toneMapped={false}/>
      </mesh>)}
    </group>
    {detailed&&<Suspense fallback={null}>{fieldnotesLounge.filter((_,i)=>i%2===1).map((seat,i)=><group key={i} position={[seat.x,.031,seat.z]} rotation={[0,seat.yaw,0]}>
      <SoftHuman variation={i+2} seated seatHeight={.40} animate={animate} phase={i*2.7}/>
    </group>)}</Suspense>}
  </group>;
}
