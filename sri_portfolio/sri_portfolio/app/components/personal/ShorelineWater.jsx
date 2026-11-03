"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createShorelineRibbons } from "../../lib/shoreline-ribbons.mjs";

// One transparent draw over the shared sea. Streaks advance toward the actual
// coast, break along its length and fade before the open navigation channels.
export default function ShorelineWater({ animate = true, weather }) {
  const geometry = useMemo(createShorelineRibbons, []);
  const uniforms = useMemo(
    () => ({ time: { value: 0 }, wind: { value: 0.28 } }),
    [],
  );
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#d3e3db",
      roughness: 0.44,
      metalness: 0,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uShoreTime = uniforms.time;
      shader.uniforms.uShoreWind = uniforms.wind;
      shader.vertexShader =
        "attribute float shorePerimeter; varying vec3 vShore;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvShore=vec3(uv,shorePerimeter);",
        );
      shader.fragmentShader =
        `varying vec3 vShore; uniform float uShoreTime,uShoreWind;
float coastPhase(float frequency) {
  return vShore.y/vShore.z*6.28318530718*max(1.,floor(vShore.z*frequency/6.28318530718+.5));
}
` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>
        float across=vShore.x;
        float bend=.13*sin(coastPhase(.62))+.07*sin(coastPhase(1.79)+uShoreTime*.3);
        float speed=.32+uShoreWind*.24;
        float phase=(across+bend+uShoreTime*speed)/1.63;
        float dist=abs(fract(phase)-.5)*1.63;
        float aa=max(.018,fwidth(across)*.7);
        float line=1.-smoothstep(.035,.095+aa,dist);
        float broken=smoothstep(-.48,.42,sin(coastPhase(.39)+sin(coastPhase(.11))*2.4-uShoreTime*.24));
        broken*=.55+.45*sin(coastPhase(1.83)+uShoreTime*.4)*sin(coastPhase(.71)-uShoreTime*.21);
        float contact=(1.-smoothstep(.0,.32,across))*(.13+.10*sin(coastPhase(.9)+uShoreTime));
        float edge=smoothstep(-.12,.05,across)*(1.-smoothstep(1.3,3.1,across));
        diffuseColor.a=clamp((line*broken*.72+contact)*edge,0.,.66);
        if(diffuseColor.a<.006) discard;
      `,
      );
    };
    m.customProgramCacheKey = () => "coast-waterline-v2";
    return m;
  }, [uniforms]);
  useFrame((_, dt) => {
    if (animate) uniforms.time.value += Math.min(0.05, dt);
    uniforms.wind.value = THREE.MathUtils.damp(
      uniforms.wind.value,
      Math.min(1, (weather?.wind ?? 4) / 15),
      1.8,
      Math.min(0.05, dt),
    );
  });
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <mesh
      geometry={geometry}
      material={material}
      receiveShadow
      renderOrder={1}
    />
  );
}
