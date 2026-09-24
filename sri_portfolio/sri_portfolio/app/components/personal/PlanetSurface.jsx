"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  walkingRoutes,
  causeway,
  bayCrossing,
  isBayCrossing,
} from "../../lib/world-paths.mjs";
import { WORLD_RADIUS, regions } from "../../lib/world-layout.mjs";
import { streetsGlsl } from "../../lib/sf-streets.mjs";

import { createTerrainGeometry } from "../../lib/terrain-geometry.mjs";
import { applyTriplanar } from "../../lib/triplanar.mjs";
import usePbrSet from "./usePbrSet";

// One designed landscape, with the same material scale from orbit to the garden.
export default function PlanetSurface({ surfaceRef, weather }) {
  const geometry = useMemo(createTerrainGeometry, []);
  const ground = usePbrSet("grass");
  const seaTime = useMemo(() => ({ value: 0 }), []);
  const seaState = useMemo(() => ({ value: 0.3 }), []);
  const wet = useMemo(() => ({ value: 0 }), []);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    // Live wind drives sea state (0 calm .. 1 at ~15 m/s); rain wets land.
    const blend = 1 - Math.exp(-step * 0.8);
    seaState.value +=
      (Math.min(1, (weather?.wind ?? 4) / 15) - seaState.value) * blend;
    wet.value += (((weather?.rain ?? 0) > 0.05 ? 1 : 0) - wet.value) * blend;
    wet.value = Math.min(1, Math.max(0, wet.value));
    seaTime.value += step * (0.7 + seaState.value * 0.9);
  });
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: "#96abbf",
      roughness: 0.82,
      envMapIntensity: 0.35,
    });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uSeaTime = seaTime;
      shader.uniforms.uSeaState = seaState;
      shader.uniforms.uWet = wet;
      shader.uniforms.uRegionCenter = { value: regions.map((r) => r.center) };
      shader.uniforms.uLandCenter = {
        value: regions.map(
          (r) => new THREE.Vector2(...(r.landCenter || [0, 0])),
        ),
      };
      shader.uniforms.uRegionEast = { value: regions.map((r) => r.east) };
      shader.uniforms.uRegionNorth = { value: regions.map((r) => r.north) };
      shader.uniforms.uRegionColor = {
        value: [
          "#5e5b57",
          "#223e36",
          "#3a4930",
          "#424b36",
          "#29331f",
          "#484e3b",
        ].map((c) => new THREE.Color(c)),
      };
      shader.uniforms.uRegionShape = {
        value: [
          [1, 1],
          [1.12, 0.8],
          [0.88, 1.23],
          [1.14, 0.84],
          [0.96, 1.05],
          [1.24, 0.8],
        ].map((v) => new THREE.Vector2(...v)),
      };
      shader.uniforms.uRegions = { value: regions.map((r) => r.normal) };
      shader.uniforms.uRegionEdges = {
        value: regions.map(
          (r) =>
            new THREE.Vector2(
              (r.shoreInner || r.inner) + 4,
              (r.shoreOuter || r.outer) + 3,
            ),
        ),
      };
      shader.uniforms.uRouteStart = {
        value: walkingRoutes.map((r) => r.start),
      };
      shader.uniforms.uRouteEnd = { value: walkingRoutes.map((r) => r.end) };
      shader.uniforms.uRouteAxis = { value: walkingRoutes.map((r) => r.axis) };
      shader.uniforms.uRouteAngle = {
        value: walkingRoutes.map((r) => r.start.angleTo(r.end)),
      };
      shader.vertexShader =
        "varying vec3 vSurface;\n" +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvSurface=position;",
        );
      shader.fragmentShader =
        `
        varying vec3 vSurface;
        uniform float uSeaTime, uSeaState, uWet;
        uniform vec3 uRegions[${regions.length}];
        uniform vec3 uRegionCenter[${regions.length}];
        uniform vec2 uLandCenter[${regions.length}];
        uniform vec3 uRegionEast[${regions.length}], uRegionNorth[${regions.length}], uRegionColor[${regions.length}];
        uniform vec2 uRegionShape[${regions.length}];
        uniform vec2 uRegionEdges[${regions.length}];
        uniform vec3 uRouteStart[${walkingRoutes.length}], uRouteEnd[${walkingRoutes.length}], uRouteAxis[${walkingRoutes.length}];
        uniform float uRouteAngle[${walkingRoutes.length}];
        float worldHash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
        float worldNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(worldHash(i),worldHash(i+vec3(1,0,0)),f.x),mix(worldHash(i+vec3(0,1,0)),worldHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(worldHash(i+vec3(0,0,1)),worldHash(i+vec3(1,0,1)),f.x),mix(worldHash(i+vec3(0,1,1)),worldHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        float worldFbm(vec3 p){return worldNoise(p)*.58+worldNoise(p*2.03)*.28+worldNoise(p*4.07)*.14;}
        ${streetsGlsl()}
      ` +
        shader.fragmentShader
          .replace(
            "#include <map_fragment>",
            `
        vec3 p=normalize(vSurface);
        float terrain=worldFbm(p*6.);
        float places=0.;
        vec3 meadow=vec3(.11,.14,.15);
        float best=0.;
        float city=0.;
        float cityRoad=0.;
        vec2 cityLocal=vec2(0.);
        float shoreVariation=(worldFbm(vSurface*.17)-.5)*7.;
        for(int i=0;i<${regions.length};i++) {
          vec3 delta=p*(${WORLD_RADIUS.toFixed(1)}/max(.2,dot(p,uRegions[i])))-uRegionCenter[i];
          vec2 local=vec2(dot(delta,uRegionEast[i]),dot(delta,uRegionNorth[i]))-uLandCenter[i];
          float angle=atan(local.y,local.x);
          float asymmetry=1.+.1*sin(angle*3.+float(i)*1.7)+.055*cos(angle*5.+float(i));
          float distance=length(local/uRegionShape[i])*asymmetry;
          float facing=step(.76,dot(p,uRegions[i]));
          float region=facing*(1.-smoothstep(uRegionEdges[i].x,uRegionEdges[i].y,distance+shoreVariation));
          places=max(places,region);
          if(i==0){city=region;cityLocal=local+uLandCenter[i];}
          if(region>best){
            best=region;meadow=uRegionColor[i]*(.88+terrain*.23);
            if(i==2){
              float pockets=smoothstep(.43,.76,worldNoise(vec3(local.x*.24,0.,local.y*.24)));
              meadow=mix(meadow,vec3(.074,.061,.035),pockets*.65);
            }
            if(i==3){
              float orchard=smoothstep(.4,.77,worldNoise(vec3(local.x*.15,2.,local.y*.15)));
              meadow=mix(meadow,vec3(.048,.064,.035),orchard*.38);
            }
          }
        }
        float corridor=0.;
        for(int i=0;i<${walkingRoutes.length};i++){
          float a=acos(clamp(dot(p,uRouteStart[i]),-1.,1.));
          float b=acos(clamp(dot(p,uRouteEnd[i]),-1.,1.));
          float t=clamp(a/uRouteAngle[i],0.,1.);
          float sideways=abs(dot(p,uRouteAxis[i])-sin(t*6.283185)*.018)*${WORLD_RADIUS.toFixed(1)};
          float beyond=max(0.,(a+b-uRouteAngle[i])*.5)*${WORLD_RADIUS.toFixed(1)};
          float distanceToPath=max(sideways,beyond);
          float bridgeWater=(i==${walkingRoutes.findIndex(isBayCrossing)}) ? smoothstep(${bayCrossing.start.toFixed(2)},.43,t)*(1.-smoothstep(.78,${bayCrossing.end.toFixed(2)},t)) : 0.;
          corridor=max(corridor,(1.-bridgeWater)*(1.-smoothstep(${causeway.solidHalfWidth.toFixed(2)},${causeway.shoreHalfWidth.toFixed(2)},distanceToPath)));
        }
        // Land belongs to the authored places and their connections. Noise
        // gives those shores variation without inventing Earth-like islands.
        float coast=max(places*(.78+(terrain-.5)*.035),.61*corridor);
        // Raised geometry is shore, never water. The old independent painted
        // mask made the plateau's shoulder look like an impossible ocean wave.
        float elevation=max(0.,length(vSurface)-${WORLD_RADIUS.toFixed(1)});
        float raised=smoothstep(.015,.12,elevation);
        float land=max(smoothstep(.48,.54,coast),raised);
        float shallows=smoothstep(.36,.49,coast);
        // Shader colours are linear. Keep the glacial palette subdued rather
        // than lifting sRGB values a second time and bleaching the landscape.
        vec3 deep=vec3(.009,.021,.029);
        vec3 shallow=vec3(.025,.06,.07);
        vec3 ocean=mix(deep,shallow,shallows);
        float beach=smoothstep(.48,.53,coast)*(1.-smoothstep(.54,.58,coast));
        vec3 rock=vec3(.035,.044,.043)*( .9+terrain*.2 );
        float cliff=raised*(1.-smoothstep(.5,.67,coast));
        vec3 ground=mix(ocean,mix(meadow,rock,cliff),land);
        ground=mix(ground,vec3(.28,.31,.32),beach*.32);
        // Filter the fine grain out before it becomes sub-pixel from orbit.
        float footprint=max(length(dFdx(vSurface)),length(dFdy(vSurface)));
        float grain=(worldNoise(vSurface*16.)-.5)*.018*(1.-smoothstep(.035,.11,footprint));
        diffuseColor.rgb=ground+grain*land;
        {
          // Breaking surf: crests march shoreward through the shallows and
          // fade before they alias from orbit. Rougher seas break harder.
          float surf=shallows*(1.-land);
          float crest=pow(.5+.5*sin(coast*190.-uSeaTime*1.7+worldNoise(vSurface*.35)*7.),5.);
          float froth=smoothstep(.42,.49,coast)*(1.-land)*(.6+worldNoise(vSurface*3.+uSeaTime*.4)*.8);
          float surfMask=max(surf*crest,froth)*(.25+uSeaState*.5)*(1.-smoothstep(.05,.35,footprint));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.5,.55,.57),clamp(surfMask,0.,.85));
          // Rain-darkened ground.
          diffuseColor.rgb*=1.-uWet*land*.22;
        }
        {
          // City floor: poured concrete in 1.6 m slabs with sawn joints and
          // per-slab tone, instead of bare paint. Joints fade before they
          // become sub-pixel so orbit views do not shimmer.
          vec2 g=cityLocal/1.6;
          vec2 f=abs(fract(g)-.5);
          float joint=smoothstep(.465,.5,max(f.x,f.y))*(1.-smoothstep(.04,.14,footprint));
          float slab=worldHash(vec3(floor(g),7.));
          vec3 concrete=vec3(.165,.158,.146)*(.9+slab*.18)*(.94+terrain*.12);
          concrete*=1.-joint*.45;
          // Streets: asphalt, sidewalks, zebra crossings and a yellow line.
          // Parks keep their lawn; plazas are pale paving.
          vec4 st=sfStreets(cityLocal);
          float fine=1.-smoothstep(.04,.16,footprint);
          vec3 asphalt=vec3(.042,.045,.049)*(.86+worldNoise(vSurface*2.2)*.28);
          vec3 sidewalk=vec3(.2,.195,.185)*(.92+slab*.12)*(1.-joint*.35);
          vec3 street=mix(concrete,sidewalk,st.y);
          street=mix(street,asphalt,st.x);
          street=mix(street,vec3(.5,.5,.48),st.z*fine*.8);
          street=mix(street,vec3(.48,.36,.08),st.w*fine*.8);
          if(st.w<-1.5)street=vec3(.24,.225,.205)*(.9+slab*.14)*(1.-joint*.4);
          float lawn=step(st.w,-.5)*step(-1.5,st.w);
          street=mix(street,meadow*vec3(.9,1.25,.75),lawn);
          diffuseColor.rgb=mix(diffuseColor.rgb,street,city*land);
          cityRoad=st.x*city*land;
        }
      `,
          )
          .replace(
            "#include <roughnessmap_fragment>",
            "#include <roughnessmap_fragment>\n// Distant water: sub-pixel waves average into a rougher, dimmer glint.\nroughnessFactor=mix(mix(.07,.42,smoothstep(.03,.4,footprint)),.94-uWet*(.38+cityRoad*.3),land);",
          )
          .replace(
            "#include <lights_fragment_maps>",
            // The surface's low env intensity suits matte land; open water
            // mirrors the sky, so its image-based specular is lifted back up
            // near the camera. From orbit the blurred sky would read milky.
            "#include <lights_fragment_maps>\nradiance*=mix(mix(3.2,1.,smoothstep(.06,.3,footprint)),1.,land);",
          )
          .replace(
            "#include <normal_fragment_maps>",
            `#include <normal_fragment_maps>
            {
              // Open water: travelling wind-wave normals so the sea carries a
              // moving sky reflection and sun glint instead of flat paint.
              float sea=1.-land;
              vec3 wp=vSurface*.55;
              float waves=(worldNoise(wp+vec3(uSeaTime*.35,0.,uSeaTime*.2))
                +worldNoise(wp*2.3-vec3(0.,uSeaTime*.5,uSeaTime*.3))*.5
                +worldNoise(wp*6.1+vec3(uSeaTime*.9,uSeaTime*.4,0.))*.2)*(.05+uSeaState*.1)*sea;
              vec3 sx=dFdx(-vViewPosition), sy=dFdy(-vViewPosition);
              vec3 ay=cross(sy,normal), ax=cross(normal,sx);
              float det=dot(sx,ay)*faceDirection;
              normal=normalize(abs(det)*normal-sign(det)*(dFdx(waves)*ay+dFdy(waves)*ax));
            }`,
          );
    };
    // Photographed ground structure on land only; the sea keeps its colour.
    return applyTriplanar(m, {
      ...ground,
      mode: "detail",
      mask: "land*(1.-cliff*.6)*(1.-city)",
      scale: 0.42,
      strength: 0.85,
      normalStrength: 0.9,
      meanLuminance: 0.18,
    });
  }, [ground, seaTime, seaState, wet]);
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
