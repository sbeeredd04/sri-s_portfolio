"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useQuality } from "./Quality";
import { grassProfile, grassCount, nearGrassCount, NEAR_EXTENT } from "../../lib/grass.mjs";
import { WORLD_RADIUS, regions } from "../../lib/world-layout.mjs";

const MAP = 512;
const CLEAR = 0.012; // metres a surface may sit above the soil and still be ground (trail paving sits 2.7cm up)

// A tuft of three curved, tapered blades (4 segments each). Each blade keeps
// its own lean and offset in the attribute "tuft" so wind moves them apart.
// Placement and wind happen on the GPU: tens of thousands of tufts cost one
// draw call.
function tuftGeometry() {
  const segments = 4,
    positions = [],
    uvs = [],
    tuft = [],
    indices = [];
  const blades = [
    [0, 0, 0, 1],
    [0.05, 0.035, 2.1, 0.8],
    [-0.045, -0.03, 4.2, 0.65],
  ];
  blades.forEach(([ox, oz, turn, scale], b) => {
    const base = positions.length / 3;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const w = 0.5 * (1 - t * 0.94);
      positions.push(-w, t * scale, 0, w, t * scale, 0);
      uvs.push(0, t, 1, t);
      tuft.push(ox, oz, turn, t, ox, oz, turn, t);
      if (i < segments) {
        const a = base + i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute("tuft", new THREE.Float32BufferAttribute(tuft, 4));
  g.setIndex(indices);
  return g;
}

// Renders the district from directly above twice: terrain alone and then
// everything. Where the two heights agree the ground is open soil; anywhere a
// path, court, deck, building or water surface sits higher, blades are culled.
function useGroundMaps(active, surfaceRef, anchorRef, extent) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const maps = useMemo(() => {
    const options = {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
    };
    return {
      soil: new THREE.WebGLRenderTarget(MAP, MAP, options),
      top: new THREE.WebGLRenderTarget(MAP, MAP, options),
      ready: { value: 0 },
    };
  }, []);
  useEffect(
    () => () => {
      maps.soil.dispose();
      maps.top.dispose();
    },
    [maps],
  );
  useEffect(() => {
    if (!active) return;
    const anchor = anchorRef.current,
      surface = surfaceRef.current;
    if (!anchor || !surface) return;
    const origin = new THREE.Vector3(),
      up = new THREE.Vector3();
    const heightMaterial = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
    const uniforms = { uOrigin: { value: origin }, uUp: { value: up } };
    heightMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        "varying vec3 vWorldH;\n" +
        shader.vertexShader.replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvec4 wH=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nwH=instanceMatrix*wH;\n#endif\nvWorldH=(modelMatrix*wH).xyz;",
        );
      shader.fragmentShader =
        "uniform vec3 uOrigin; uniform vec3 uUp; varying vec3 vWorldH;\n" +
        shader.fragmentShader.replace(
          "#include <dithering_fragment>",
          "#include <dithering_fragment>\ngl_FragColor=vec4(dot(vWorldH-uOrigin,uUp),0.,0.,1.);",
        );
    };
    const camera = new THREE.OrthographicCamera(
      -extent,
      extent,
      extent,
      -extent,
      0.1,
      160,
    );
    camera.layers.enableAll();
    const capture = () => {
      anchor.updateWorldMatrix(true, false);
      anchor.getWorldPosition(origin);
      up.set(0, 1, 0).transformDirection(anchor.matrixWorld);
      camera.position.copy(origin).addScaledVector(up, 80);
      camera.quaternion
        .setFromRotationMatrix(new THREE.Matrix4().extractRotation(anchor.matrixWorld))
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2));
      camera.updateMatrixWorld();
      const previous = {
        target: gl.getRenderTarget(),
        override: scene.overrideMaterial,
        background: scene.background,
        fog: scene.fog,
        autoClear: gl.autoClear,
        shadow: gl.shadowMap.autoUpdate,
      };
      const clear = new THREE.Color();
      const alpha = gl.getClearAlpha();
      gl.getClearColor(clear);
      const hidden = [];
      scene.traverse((o) => {
        if (o.userData.sky && o.visible) {
          o.visible = false;
          hidden.push(o);
        }
      });
      scene.overrideMaterial = heightMaterial;
      scene.background = null;
      scene.fog = null;
      gl.shadowMap.autoUpdate = false;
      gl.setClearColor(0x000000, 1);
      // Soil alone: render only the terrain mesh.
      gl.setRenderTarget(maps.soil);
      gl.clear();
      const material = surface.material;
      surface.material = heightMaterial;
      gl.render(surface, camera);
      surface.material = material;
      // Everything: first-hit (highest) surface under each texel.
      gl.setRenderTarget(maps.top);
      gl.clear();
      gl.render(scene, camera);
      hidden.forEach((o) => (o.visible = true));
      gl.setRenderTarget(previous.target);
      gl.setClearColor(clear, alpha);
      scene.overrideMaterial = previous.override;
      scene.background = previous.background;
      scene.fog = previous.fog;
      gl.shadowMap.autoUpdate = previous.shadow;
      maps.ready.value = 1;
      invalidate();
    };
    // Districts stream in behind Suspense; refresh as their models settle.
    const timers = [120, 900, 2600, 6000].map((t) => setTimeout(capture, t));
    return () => {
      timers.forEach(clearTimeout);
      heightMaterial.dispose();
    };
  }, [active, gl, scene, invalidate, maps, surfaceRef, anchorRef, extent]);
  return maps;
}

function seedGeometry(count, square) {
  const g = new THREE.InstancedBufferGeometry().copy(tuftGeometry());
  const seeds = new Float32Array(count * 4);
  const spacing = Math.sqrt(Math.PI / count);
  for (let i = 0; i < count; i++) {
    if (square) {
      // Stratified square for the wrapping near layer.
      seeds[i * 4] = Math.random() * 2 - 1;
      seeds[i * 4 + 1] = Math.random() * 2 - 1;
    } else {
      // Golden-ratio scatter, jittered by about one spacing: the pure spiral
      // lattice reads as concentric moire rings from orbit.
      const r = Math.sqrt((i + 0.5) / count);
      const a = i * 2.39996323;
      let x = Math.cos(a) * r + (Math.random() - 0.5) * spacing * 1.3;
      let y = Math.sin(a) * r + (Math.random() - 0.5) * spacing * 1.3;
      const len = Math.hypot(x, y);
      if (len > 1) {
        x /= len;
        y /= len;
      }
      seeds[i * 4] = x;
      seeds[i * 4 + 1] = y;
    }
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();
  }
  g.setAttribute("seed", new THREE.InstancedBufferAttribute(seeds, 4));
  g.instanceCount = count;
  return g;
}

function grassMaterial(profile, maps, biome, near) {
    const m = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      roughness: 0.78,
      metalness: 0,
    });
    const uniforms = {
      uTime: { value: 0 },
      uExtent: { value: profile.extent },
      // Near layer: a dense square of tufts that recycles around the point
      // the camera is looking at, so close shots are full, not ribbons.
      uPlace: { value: near ? NEAR_EXTENT : profile.extent },
      uCenter: { value: new THREE.Vector2() },
      uNear: { value: near ? 1 : 0 },
      uHeight: { value: profile.height },
      uWidth: { value: profile.width * (near ? 0.8 : 1) },
      uBase: { value: new THREE.Color(profile.base) },
      uTip: { value: new THREE.Color(profile.tip) },
      uDry: { value: new THREE.Color(profile.dry) },
      uSoil: { value: maps.soil.texture },
      uTop: { value: maps.top.texture },
      uReady: maps.ready,
      uClear: { value: CLEAR },
      uR: { value: WORLD_RADIUS },
      uInner: {
        value: (regions.find((r) => r.id === biome)?.inner || 0) - 1,
      },
      uCam: { value: new THREE.Vector3() },
      uFade: { value: profile.fade },
      uSun: { value: new THREE.Vector3(0, 1, 0) },
    };
    m.userData.uniforms = uniforms;
    m.userData.maps = maps;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
          attribute vec4 seed;
          attribute vec4 tuft;
          uniform float uTime, uExtent, uPlace, uNear, uHeight, uWidth, uReady, uClear, uFade, uR, uInner;
          uniform sampler2D uSoil, uTop;
          uniform vec3 uCam; uniform vec2 uCenter;
          varying float vT; varying float vShade; varying float vDry;
          float gh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float gn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gh(i),gh(i+vec2(1,0)),f.x),mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),f.x),f.y);}`,
        )
        .replace(
          "#include <beginnormal_vertex>",
          `#include <beginnormal_vertex>
          objectNormal=vec3(0.,1.,0.);`,
        )
        .replace(
          "#include <begin_vertex>",
          `vec2 local=seed.xy*uPlace;
          float edge=1.;
          if(uNear>.5){
            local=mod(local-uCenter+uPlace,vec2(2.*uPlace))-uPlace+uCenter;
            edge=1.-smoothstep(uPlace*.55,uPlace,length(local-uCenter));
          }
          vec2 uvMap=vec2(local.x/uExtent*.5+.5,.5-local.y/uExtent*.5);
          float soil=texture2D(uSoil,uvMap).r;
          float top=texture2D(uTop,uvMap).r;
          // Land is the plateau standing above the bare sphere; the sea is not.
          float rr=dot(local,local);
          float sphereY=sqrt(max(0.,uR*uR-rr))-uR;
          float land=max(step(rr,uInner*uInner),step(.12,soil-sphereY));
          float open=uReady*step(top-soil,uClear)*land*edge
            *step(abs(local.x),uExtent)*step(abs(local.y),uExtent);
          // Patchy density and height: meadows have clearings and tall tufts.
          float meadowPatch=gn(local*.09+seed.z*.1);
          float clump=gn(local*.55);
          open*=step(.18,meadowPatch*.8+clump*.35);
          vec3 root=vec3(local.x,soil,local.y);
          vec4 worldRoot=modelMatrix*vec4(root,1.);
          float dist=distance(worldRoot.xyz,uCam);
          float lod=1.-smoothstep(uFade*.55,uFade,dist);
          float h=uHeight*(.45+meadowPatch*.55+clump*.35)*(.7+seed.w*.6)*open*lod;
          float angle=seed.z*6.2831853+tuft.z;
          float ca=cos(angle),sa=sin(angle);
          vec3 transformed=vec3(position.x*uWidth*(.7+seed.w*.6),position.y*h,0.);
          // Natural lean plus travelling gusts; tips move most.
          float gust=gn(local*.05+vec2(uTime*.35,uTime*.12));
          float sway=sin(uTime*1.9+local.x*.4+local.y*.3+seed.w*6.)*.12+gust*.55;
          float tip=tuft.w;
          float bend=(tip*tip)*(.25+sway+tuft.x*2.)*h;
          transformed.z+=bend;
          transformed.y-=bend*bend*.35/max(h,.001);
          transformed=vec3(transformed.x*ca+transformed.z*sa,transformed.y,-transformed.x*sa+transformed.z*ca);
          transformed+=root+vec3(tuft.x,0.,tuft.y)*(.6+h);
          vT=tip; vShade=.65+clump*.35; vDry=smoothstep(.55,.95,gn(local*.03+3.));`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform vec3 uBase,uTip,uDry,uSun; varying float vT; varying float vShade; varying float vDry;`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          vec3 blade=mix(uBase,mix(uTip,uDry,vDry),smoothstep(0.,1.,vT));
          diffuseColor.rgb=blade*vShade*(.55+.45*vT);`,
        )
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>
          // Light scattering through thin blades toward a low sun.
          vec3 viewDir=normalize(vViewPosition);
          float back=pow(max(dot(-viewDir,normalize((viewMatrix*vec4(uSun,0.)).xyz)),0.),4.);
          totalEmissiveRadiance+=mix(uTip,uDry,vDry)*back*vT*vT*.45;`,
        );
    };
    return m;
}

export default function GrassField({ biome, active, surfaceRef, animate, sun }) {
  const quality = useQuality();
  const profile = grassProfile[biome];
  const count = grassCount(biome, quality.tier);
  const near = nearGrassCount(biome, quality.tier);
  const enabled = Boolean(profile && count && active);
  const anchor = useRef();
  const mesh = useRef();
  const time = useRef(0);
  const maps = useGroundMaps(enabled, surfaceRef, anchor, profile?.extent || 1);
  const geometry = useMemo(
    () => (enabled ? seedGeometry(count, false) : null),
    [enabled, count],
  );
  const nearGeometry = useMemo(
    () => (enabled && near ? seedGeometry(near, true) : null),
    [enabled, near],
  );
  const material = useMemo(
    () => (profile ? grassMaterial(profile, maps, biome, false) : null),
    [profile, maps, biome],
  );
  const nearMaterial = useMemo(
    () => (profile ? grassMaterial(profile, maps, biome, true) : null),
    [profile, maps, biome],
  );
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => nearGeometry?.dispose(), [nearGeometry]);
  useEffect(() => () => material?.dispose(), [material]);
  useEffect(() => () => nearMaterial?.dispose(), [nearMaterial]);
  const ray = useMemo(
    () => ({
      origin: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      hit: new THREE.Vector3(),
    }),
    [],
  );
  useFrame(({ camera }, dt) => {
    if (!enabled || !material) return;
    if (animate) time.current += Math.min(dt, 0.05);
    // Where the view meets the ground (in the district frame), held within a
    // short distance in front of the camera for wide establishing shots.
    const group = anchor.current;
    ray.origin.copy(camera.position);
    group.worldToLocal(ray.origin);
    camera.getWorldDirection(ray.direction);
    ray.direction.transformDirection(group.matrixWorld.clone().invert());
    const t = ray.direction.y < -0.05 ? -ray.origin.y / ray.direction.y : 10;
    ray.hit.copy(ray.origin).addScaledVector(ray.direction, Math.min(t, 14));
    for (const m of [material, nearMaterial]) {
      if (!m) continue;
      const u = m.userData.uniforms;
      u.uTime.value = time.current;
      u.uCam.value.copy(camera.position);
      u.uCenter.value.set(ray.hit.x, ray.hit.z);
      if (sun) u.uSun.value.copy(sun);
    }
  });
  return (
    <group ref={anchor}>
      {enabled && geometry && (
        <mesh
          ref={mesh}
          geometry={geometry}
          material={material}
          frustumCulled={false}
          receiveShadow
          raycast={() => null}
        />
      )}
      {enabled && nearGeometry && (
        <mesh
          geometry={nearGeometry}
          material={nearMaterial}
          frustumCulled={false}
          receiveShadow
          raycast={() => null}
        />
      )}
    </group>
  );
}
