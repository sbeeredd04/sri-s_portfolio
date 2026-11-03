"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { outThereFallImpactNative } from "../../lib/out-there-water.mjs";

// One small draw close to the water. Soft alpha and spreading droplets
// replace the previous hard-edged mist geometry, without volume raymarching.
export default function LakeMist({ water, night, refined = false }) {
  const mist = useMemo(() => {
    const positions = [],
      phases = [];
    const [x, y, z] = refined ? outThereFallImpactNative : [-0.656, 0.7, 14.35];
    for (let i = 0; i < 19; i++) {
      const k = i * 2.39996;
      positions.push(
        x + Math.cos(k) * (0.7 + (i % 5) * 0.48),
        y + (i % 4) * (refined ? 0.14 : 0.22),
        z + Math.sin(k) * (refined ? 0.68 : 0.8),
      );
      phases.push((i * 0.61803399) % 1);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
    geometry.computeBoundingSphere();
    geometry.boundingSphere.radius += 6;
    return {
      geometry,
      uniforms: {
        uTime: water.time,
        uWind: water.wind,
        uPixels: { value: 500 },
        uOpacity: { value: 0.17 },
        uTint: { value: new THREE.Vector3(0.67, 0.79, 0.77) },
      },
    };
  }, [water, refined]);
  useFrame(({ size, gl }) => {
    mist.uniforms.uPixels.value = size.height * gl.getPixelRatio();
    const moonlit = refined && night;
    // These particles are unlit. Match their radiance to the dark lake as
    // well as reducing alpha, since several sprites overlap at impact.
    mist.uniforms.uTint.value.set(
      moonlit ? 0.10 : 0.67,
      moonlit ? 0.18 : 0.79,
      moonlit ? 0.23 : 0.77,
    );
    mist.uniforms.uOpacity.value = moonlit ? 0.038 : refined ? 0.19 : night ? 0.085 : 0.17;
  });
  useEffect(() => () => mist.geometry.dispose(), [mist]);
  return (
    <points geometry={mist.geometry} raycast={() => null} renderOrder={3}>
      <shaderMaterial
        uniforms={mist.uniforms}
        transparent
        depthWrite={false}
        vertexShader={`
        uniform float uTime,uWind,uPixels;
        attribute float phase;
        varying float vLife,vSeed;
        void main(){
          float age=fract(phase+uTime*.19);
          vec3 p=position;
          p.x+=(.7+uWind*3.)*age+.31*sin(phase*50.+age*2.);
          p.z+=age*(1.8+phase*2.8);
          p.y+=sin(age*3.14159)*(.45+phase*.8);
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp(uPixels*projectionMatrix[1][1]*(.65+age*1.85)/max(1.,-mv.z),1.,116.);
          vLife=sin(age*3.14159);
          vSeed=phase;
        }`}
        fragmentShader={`
        uniform float uOpacity;
        uniform vec3 uTint;
        varying float vLife,vSeed;
        void main(){
          vec2 p=(gl_PointCoord-.5)*vec2(2.,3.15);
          float r=dot(p,p);
          float a=(1.-smoothstep(.05,1.,r))*vLife*uOpacity;
          a*=.79+.21*sin(p.x*5.+vSeed*40.)*cos(p.y*6.);
          gl_FragColor=vec4(uTint,a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`}
      />
    </points>
  );
}
