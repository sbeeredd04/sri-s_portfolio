"use client";
import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createTerrainGeometry } from "../../lib/terrain-geometry.mjs";
import { seaHeightGLSL } from "../../lib/sea-motion.mjs";
import { regions } from "../../lib/world-layout.mjs";

// A single water body. Broad moving normals and a shallows gradient keep the
// polygons legible; the shader uses the existing sky probe and one render pass.
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
    const coast = regions.filter((r) => r.id !== "entertainment");
    m.onBeforeCompile = (s) => {
      s.uniforms.uBayTime = time;
      s.uniforms.uBayWind = wind;
      s.uniforms.uCoasts = {
        value: coast.map((r) => new THREE.Vector2(r.center.x, r.center.z)),
      };
      s.vertexShader =
        "varying vec3 vBay;\n" +
        s.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvBay=position;",
        );
      s.fragmentShader =
        `varying vec3 vBay; uniform float uBayTime,uBayWind; uniform vec2 uCoasts[${coast.length}];\n` +
        seaHeightGLSL + s.fragmentShader;
      s.fragmentShader = s.fragmentShader
        .replace(
          "#include <color_fragment>",
          `
        #include <color_fragment>
        float shelf=0.;
        for(int i=0;i<${coast.length};i++){
          vec2 delta=vBay.xz-uCoasts[i];
          float d=length(delta/vec2(1.,.90));
          float limit=i==0?83.:i==4?40.:62.;
          shelf=max(shelf,1.-smoothstep(limit-13.,limit+18.,d));
        }
        shelf*=smoothstep(422.,448.,vBay.y);
        vec3 deep=vec3(.019,.112,.140), shallows=vec3(.062,.243,.245);
        diffuseColor.rgb=mix(deep,shallows,shelf*.72);
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
    m.customProgramCacheKey = () => "painted-bay-v2";
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
