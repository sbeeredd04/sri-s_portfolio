"use client";
import { useEffect, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { WORLD_RADIUS } from "../../lib/world-layout.mjs";
import { cloudLayer, cloudSteps } from "../../lib/clouds.mjs";
import { skyUniforms } from "./AtmosphereSky";
import { useQuality } from "./Quality";

const fragment = `
uniform highp sampler3D uNoise;
uniform mat4 projectionMatrix;
uniform int uSteps;
uniform vec3 uSun, uHorizon, uGlow, uDrift;
uniform float uDay, uCover, uRain, uSkyOpacity;
varying vec3 vWorld;
vec2 sphere(vec3 eye, vec3 ray, float radius) {
  float b=dot(eye,ray), d=b*b-dot(eye,eye)+radius*radius;
  if(d<0.) return vec2(-1.);
  float root=sqrt(d); return vec2(-b-root,-b+root);
}
float density(vec3 p) {
  float height=(length(p)-${cloudLayer.base.toFixed(1)})/${(cloudLayer.top - cloudLayer.base).toFixed(1)};
  if(height<=0. || height>=1.) return 0.;
  // Coverage is a broad weather field; the cellular channel gives each bank
  // round, three-dimensional lobes instead of extruding a flat surface mask.
  vec3 advected=p+uDrift+vec3(173.,-97.,281.);
  vec2 region=texture(uNoise,advected/1100.).rg;
  vec3 uv=(advected+vec3(region.g,region.r,region.g-region.r)*72.)/380.;
  vec2 shape=texture(uNoise,uv).rg;
  float coverage=clamp(uCover*.82+(region.r-.5)*1.35,0.,1.);
  float threshold=mix(.76,.38,coverage);
  float bank=smoothstep(threshold,threshold+.23,shape.r*.72+shape.g*.28);
  bank*=smoothstep(.015,.15,uCover);
  // Uneven cloud tops and a soft base, with cellular erosion all the way
  // through the bank. No hard spherical cap or opaque outer skin.
  float base=.025+region.g*.12;
  float top=.30+bank*.42+shape.g*.28;
  float profile=smoothstep(base,base+.13,height)*(1.-smoothstep(top-.27,top,height));
  float billow=shape.g*.65+texture(uNoise,uv*2.7+vec3(.13,.41,.27)).g*.35;
  float mass=bank*profile;
  return max(0.,mass-(1.-billow)*.48)*(0.75+billow*.5);

}
void main() {
  vec3 ray=normalize(vWorld-cameraPosition);
  vec2 outer=sphere(cameraPosition,ray,${cloudLayer.top.toFixed(1)});
  vec2 inner=sphere(cameraPosition,ray,${cloudLayer.base.toFixed(1)});
  vec2 ground=sphere(cameraPosition,ray,${WORLD_RADIUS.toFixed(1)});
  if(outer.y<=0.) discard;
  float start=max(0.,outer.x), end=outer.y;
  if(inner.x>start) end=min(end,inner.x);
  else if(inner.y>start) start=inner.y;
  if(ground.x>0.) end=min(end,ground.x);
  if(end<=start) discard;
  // Long grazing rays need more samples than a short vertical crossing.
  // Spend those samples only at the horizon, where uniform slices band.
  int steps=int(min(float(${cloudSteps.high}), max(float(uSteps), ceil((end-start)/7.))));
  float stepSize=(end-start)/float(steps);
  // Stable subpixel dithering avoids visible slice bands without temporal noise.
  float jitter=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  float transmittance=1., firstCloud=-1.; vec3 scattering=vec3(0.);
  float forward=pow(max(0.,dot(ray,uSun)),10.);
  for(int i=0;i<${cloudSteps.high};i++) {
    if(i>=steps) break;
    float travel=start+(float(i)+jitter)*stepSize;
    vec3 p=cameraPosition+ray*travel;
    float d=density(p);
    if(d>.005) {
      if(firstCloud<0.) firstCloud=travel;
      // Two spaced light probes integrate shadow through the bank, retaining
      // bright rims and cool interiors rather than whitening every sample.
      float opticalDepth=density(p+uSun*8.)*8.+density(p+uSun*24.)*16.;
      float light=exp(-opticalDepth*.22);
      float height=clamp((length(p)-${cloudLayer.base.toFixed(1)})/${(cloudLayer.top - cloudLayer.base).toFixed(1)},0.,1.);
      vec3 ambient=mix(vec3(.013,.019,.034),uHorizon*.24+vec3(.055,.075,.105),uDay);
      vec3 sunlight=mix(vec3(.035,.045,.07),mix(vec3(.95,1.,1.04),uGlow,.25),uDay);
      vec3 color=ambient*(.45+height*.65)+sunlight*light*(.92+forward*.55)*smoothstep(-.12,.22,dot(normalize(p),uSun));
      color*=1.-uRain*.32;
      // Distant clouds merge with the horizon rather than ending in a hard rim.
      float haze=(1.-exp(-max(0.,start-70.)*.002))*uSkyOpacity;
      color=mix(color,uHorizon,haze*.55);
      float alpha=1.-exp(-d*stepSize*.11);
      scattering+=transmittance*color*alpha;
      transmittance*=1.-alpha;
      if(transmittance<.035) break;
    }
  }
  float alpha=1.-transmittance;
  if(alpha<.004) discard;
  // Test the first occupied sample against the scene, not the far proxy
  // sphere or the empty front of the deck. No depth is written for later passes.
  vec4 clip=projectionMatrix*viewMatrix*vec4(cameraPosition+ray*max(.01,firstCloud<0.?start:firstCloud),1.);
  gl_FragDepth=clip.z/clip.w*.5+.5;
  gl_FragColor=vec4(scattering/max(alpha,.001),alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export default function CloudVolume({ animate }) {
  const data = useLoader(
    THREE.FileLoader,
    "/atmosphere/cloud-noise-64.bin",
    (loader) => loader.setResponseType("arraybuffer"),
  );
  const { tier } = useQuality();
  const texture = useMemo(() => {
    const t = new THREE.Data3DTexture(
      new Uint8Array(data),
      cloudLayer.noiseSize,
      cloudLayer.noiseSize,
      cloudLayer.noiseSize,
    );
    t.format = THREE.RGFormat;
    t.type = THREE.UnsignedByteType;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.wrapS = t.wrapT = t.wrapR = THREE.RepeatWrapping;
    t.unpackAlignment = 1;
    t.needsUpdate = true;
    return t;
  }, [data]);
  const uniforms = useMemo(
    () => ({
      uNoise: { value: texture },
      uSteps: { value: cloudSteps[tier] },
      uSun: skyUniforms.uSun,
      uHorizon: skyUniforms.uHorizon,
      uGlow: skyUniforms.uGlow,
      uDay: skyUniforms.uDay,
      uCover: skyUniforms.uCloud,
      uRain: skyUniforms.uRain,
      uSkyOpacity: skyUniforms.uOpacity,
      uDrift: { value: new THREE.Vector3() },
    }),
    [texture],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame((_, dt) => {
    uniforms.uSteps.value = cloudSteps[tier];
    if (!animate) return;
    const wind = skyUniforms.uWind.value;
    uniforms.uDrift.value.x += wind.x * Math.min(dt, 0.05) * 24;
    uniforms.uDrift.value.z += wind.y * Math.min(dt, 0.05) * 24;
  });
  return (
    <mesh userData={{ sky: true }} renderOrder={20} raycast={() => null}>
      <sphereGeometry args={[cloudLayer.top, 64, 40]} />
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent
        depthWrite={false}
        vertexShader={`varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`}
        fragmentShader={fragment}
      />
    </mesh>
  );
}
