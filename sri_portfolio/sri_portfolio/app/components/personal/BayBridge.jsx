"use client";
import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bridgeGeometry,bridgePoint } from "../../lib/bay-bridge.mjs";
import {bayCrossing} from "../../lib/world-paths.mjs";
export default function BayBridge({ daylight, animate, wind=4 }) {
  const { geometries } = useMemo(bridgeGeometry, []);
  const glow=useRef(null);
  const movement=useMemo(()=>{
    const [a,b]=bayCrossing.towers;
    const anchor=bridgePoint(a), end=bridgePoint(b);
    const axis=end.clone().sub(anchor), length=axis.length();
    axis.normalize();
    return {t:{value:0},wind:{value:.25},anchor:{value:anchor},axis:{value:axis},length:{value:length},side:{value:new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),axis).normalize()}};
  },[]);
  const cableCompile=useMemo(()=>shader=>{
    shader.uniforms.uSpanTime=movement.t; shader.uniforms.uSpanWind=movement.wind;
    shader.uniforms.uSpanStart=movement.anchor; shader.uniforms.uSpanAxis=movement.axis;
    shader.uniforms.uSpanSide=movement.side; shader.uniforms.uSpanLength=movement.length;
    shader.vertexShader=`
      uniform float uSpanTime,uSpanWind,uSpanLength;
      uniform vec3 uSpanStart,uSpanAxis,uSpanSide;
    `+shader.vertexShader.replace('#include <begin_vertex>',`
      #include <begin_vertex>
      vec3 rel=position-uSpanStart;
      float progress=clamp(dot(rel,uSpanAxis)/uSpanLength,0.,1.);
      float fixedEnds=pow(sin(progress*3.14159265),2.);
      float fixedDeck=smoothstep(.25,2.6,rel.y);
      transformed+=uSpanSide*sin(progress*8.-uSpanTime*1.1)*fixedEnds*fixedDeck*(.022+.055*uSpanWind);
    `);
  },[movement]);
  useFrame((_,dt)=>{
    if(animate)movement.t.value+=Math.min(.05,dt);
    movement.wind.value=Math.min(1,Math.max(0,wind/15));
    if(glow.current)glow.current.emissiveIntensity=(1-daylight*.82)*(1.35+.2*Math.sin(movement.t.value*1.52));
  });
  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries],
  );
  return (
    <group>
      {Object.entries(geometries).map(([kind, geometry]) => (
        <mesh
          key={kind}
          geometry={geometry}
          castShadow={kind !== "light"}
          receiveShadow
        >
          <meshStandardMaterial
            ref={kind==="light"?glow:undefined}
            onBeforeCompile={kind==="cable"?cableCompile:undefined}
            color={
              kind === "stone"
                ? "#96938a"
                : kind === "light"
                  ? "#ffe3af"
                  : kind === "cable"
                    ? "#a44735"
                    : "#c45237"
            }
            roughness={kind === "stone" ? 0.9 : 0.55}
            metalness={kind === "stone" ? 0 : 0.42}
            emissive={kind === "light" ? "#ffd29c" : "#000000"}
            emissiveIntensity={kind === "light" ? 1.6 - daylight * 1.3 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}
