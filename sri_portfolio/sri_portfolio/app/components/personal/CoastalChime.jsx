"use client";
import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { chimeAnchor, createChimeState, stepChime, chimeAudibility } from '../../lib/coastal-chime.mjs';
export default function CoastalChime({windField,animate,detailed}) {
 const {scene}=useGLTF('/models/coastal-chime.glb');
 const model=useMemo(()=>scene.clone(true),[scene]);
 const parts=useMemo(()=>({clapper:model.getObjectByName('clapper'),tubes:Array.from({length:6},(_,i)=>model.getObjectByName(`tube_${i}`))}),[model]);
 const state=useRef(createChimeState()), root=useRef();
 const points=useMemo(()=>({world:new Vector3(),view:new Vector3()}),[]);
 const kicks=useRef(Array(6).fill(-Infinity));
 useFrame(({camera},delta)=>{
  if(!animate || document.hidden || !root.current) return;
  const time=windField.uWindTime.value,dir=windField.uWindDirection.value;
  const hit=stepChime(state.current,delta,time,windField.uWindStrength.value,[dir.x,dir.y]);
  parts.clapper.rotation.set(-state.current.z,0,state.current.x);
  if(hit) {
   kicks.current[hit.tube]=time;
   root.current.getWorldPosition(points.world);
   points.view.copy(points.world).applyMatrix4(camera.matrixWorldInverse);
   const gain=chimeAudibility(camera.position.distanceTo(points.world));
   if(detailed && gain>0) window.dispatchEvent(new CustomEvent('sri:environment-contact',{detail:{source:'coastal-chime',...hit,gain,pan:Math.max(-1,Math.min(1,points.view.x/8))}}));
  }
  parts.tubes.forEach((tube,i)=>{
   const age=time-kicks.current[i];
   tube.rotation.z=age<3?Math.sin(age*22)*Math.exp(-age*3)*.05:0;
  });
 });
 return <group ref={root} position={chimeAnchor()}><primitive object={model} /></group>;
}
