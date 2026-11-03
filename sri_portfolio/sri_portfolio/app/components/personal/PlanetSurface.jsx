"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createTerrainGeometry } from "../../lib/terrain-geometry.mjs";
import { seaHeightGLSL } from "../../lib/sea-motion.mjs";

// One continuous bay uses crossed swell normals and the shared sky probe.
// Separate coast ribbons add whitewater at decoded island waterlines.
export default function PlanetSurface({ surfaceRef, weather, animate = true }) {
  const geometry = useMemo(createTerrainGeometry, []);
  const time = useMemo(() => ({ value: 0 }), []),
    wind = useMemo(() => ({ value: 0.28 }), []);
  useFrame((_, dt) => {
    const step = Math.min(0.05, dt);
    if (animate) time.value += step;
    wind.value = THREE.MathUtils.damp(
      wind.value,
      Math.min(1, (weather?.wind ?? 4) / 15),
      1.8,
      step,
    );
  });
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#357d85",
      roughness: 0.23,
      envMapIntensity: 0.9,
    });

    m.onBeforeCompile = (s) => {
      s.uniforms.uBayTime = time;
      s.uniforms.uBayWind = wind;

      s.vertexShader =
        "varying vec3 vBay;\n" +
        s.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvBay=position;",
        );
      s.fragmentShader =
        `varying vec3 vBay; uniform float uBayTime,uBayWind;\n` +
        seaHeightGLSL + s.fragmentShader;
      s.fragmentShader = s.fragmentShader
        .replace(
          "#include <color_fragment>",
          `
        #include <color_fragment>
        // Coastal whitewater follows decoded waterlines in ShorelineWater.
        // The open bay has no circular per-island color halos.
        diffuseColor.rgb=vec3(.019,.112,.140);
      `,
        )
        .replace(
          "#include <normal_fragment_maps>",
          `
        #include <normal_fragment_maps>
        vec2 q=vBay.xz;
        float px=max(length(dFdx(vBay)),length(dFdy(vBay)));
        float strength=(.024+uBayWind*.071)*(1.-smoothstep(.35,1.8,px));
        float waterWaves=bayHeight(q,uBayTime,uBayWind)*(1.-smoothstep(.35,1.8,px));
        vec3 bayX=dFdx(-vViewPosition),bayY=dFdy(-vViewPosition);
        vec3 bayA=cross(bayY,normal),bayB=cross(normal,bayX);
        float bayDet=dot(bayX,bayA)*faceDirection;
        if(abs(bayDet)>.00000001)normal=normalize(abs(bayDet)*normal-sign(bayDet)*(dFdx(waterWaves)*bayA+dFdy(waterWaves)*bayB));
      `,
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor=mix(.18,.39,smoothstep(.1,1.6,max(length(dFdx(vBay)),length(dFdy(vBay)))));",
        );
    };
    m.customProgramCacheKey = () => "painted-bay-v3";
    return m;
  }, [time, wind]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  return (
    <mesh
      ref={surfaceRef}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
}
