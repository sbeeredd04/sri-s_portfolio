"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { regions, WORLD_RADIUS, worldPoint } from "../../lib/world-layout.mjs";
import { SKY_RADIUS } from "../../lib/camera-limits.mjs";
import { skyState } from "../../lib/atmosphere.mjs";

// A camera-centred scattering sky whose "up" is the planet normal under the
// eye, so every biome gets its own horizon, sun glow and haze. Near the ground
// it replaces the starfield by day and thins at night so stars still show.
// The same horizon colour drives exponential fog, which gives distance the
// aerial perspective that makes a small scene read as a large landscape.
export const skyFragment = `
          uniform vec3 uUp, uSun, uZenith, uHorizon, uGlow;
          uniform float uDay, uOpacity, uCloud, uRain, uTime;
          uniform vec2 uWind;
          varying vec3 vDir;
          float ch(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          float cn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
            return mix(mix(ch(i),ch(i+vec2(1,0)),f.x),mix(ch(i+vec2(0,1)),ch(i+1.),f.x),f.y);}
          float cfbm(vec2 p){float a=0.,w=.5;for(int i=0;i<5;i++){a+=w*cn(p);p=p*2.03+vec2(1.7,9.2);w*=.5;}return a;}
          // A cloud deck 1 unit up, seen in perspective: live cover sets how
          // much of the noise field survives, a second tap toward the sun
          // gives each cloud a lit crown and a darker belly.
          vec4 cloudLayer(vec3 d, float h) {
            vec3 ref = abs(uUp.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.);
            vec3 t = normalize(cross(ref, uUp)), b = cross(uUp, t);
            vec2 uv = vec2(dot(d, t), dot(d, b)) / (h + .06) * 1.6 + uWind * uTime;
            float cover = mix(.78, .18, uCloud);
            float n = cfbm(uv);
            float density = smoothstep(cover, cover + .28, n);
            vec2 toSun = vec2(dot(uSun, t), dot(uSun, b));
            float shade = smoothstep(cover - .1, cover + .45, cfbm(uv + toSun * .09));
            // Sunlit crowns go near white by day; bellies take the horizon grey.
            vec3 crown = mix(uHorizon * .6, vec3(.92, .93, .95) + uGlow * .12, uDay);
            vec3 belly = uHorizon * mix(.55, .78, uDay) + uZenith * .08;
            vec3 base = mix(crown, belly, shade * (.55 + uCloud * .35));
            base *= 1. - uRain * .5;
            float mu = max(dot(d, uSun), 0.);
            base += uGlow * pow(mu, 12.) * (1. - density) * .6;
            return vec4(base, density * smoothstep(0., .14, h) * (.55 + uCloud * .45));
          }
          void main() {
            vec3 d = normalize(vDir);
            float h = dot(d, uUp);
            float above = max(h, 0.);
            vec3 col = mix(uHorizon, uZenith, pow(above, .42));
            // Thick haze hugging the horizon, then a darker ground-haze below.
            col += uHorizon * exp(-abs(h) * 14.) * .22;
            col = mix(col, uHorizon * .55, smoothstep(0., -.35, h));
            // Mie forward scattering around the sun, strongest near sunset.
            float mu = max(dot(d, uSun), 0.);
            col += uGlow * (pow(mu, 6.) * .28 + pow(mu, 48.) * .9 + pow(mu, 900.) * 6.);
            if (h > 0.) {
              vec4 cloud = cloudLayer(d, h);
              col = mix(col, cloud.rgb, cloud.a);
            }
            // Stars stay visible overhead at night; the horizon keeps its glow.
            float nightAlpha = mix(.94, .18, smoothstep(-.05, .55, h));
            float alpha = uOpacity * mix(nightAlpha, 1., uDay);
            gl_FragColor = vec4(col, alpha);
          }
        `;

// One set of sky values per page. The environment probe reads the same
// colour/vector instances, so reflections always match the visible sky.
export const skyUniforms = {
  uUp: { value: new THREE.Vector3(0, 1, 0) },
  uSun: { value: new THREE.Vector3(0, 1, 0) },
  uZenith: { value: new THREE.Color() },
  uHorizon: { value: new THREE.Color() },
  uGlow: { value: new THREE.Color() },
  uDay: { value: 0 },
  uOpacity: { value: 0 },
  uCloud: { value: 0.3 },
  uRain: { value: 0 },
  uTime: { value: 0 },
  uWind: { value: new THREE.Vector2(0.004, 0.0015) },
};

export default function AtmosphereSky({ world, solar }) {
  const mesh = useRef();
  const scene = useThree((s) => s.scene);
  const fog = useMemo(() => new THREE.FogExp2("#000000", 0), []);
  const scratch = useMemo(
    () => ({ up: new THREE.Vector3(), sun: new THREE.Vector3() }),
    [],
  );
  const uniforms = skyUniforms;
  useEffect(() => {
    const previous = scene.fog;
    scene.fog = fog;
    return () => {
      scene.fog = previous;
    };
  }, [scene, fog]);
  useFrame(({ camera }, dt) => {
    const altitude = camera.position.length() - WORLD_RADIUS;
    scratch.up.copy(camera.position).normalize();
    scratch.sun.set(...solar.direction).normalize();
    const region = regions.find((r) => r.id === world);
    if (region) scratch.sun.applyQuaternion(region.rotation);
    const state = skyState({
      world,
      altitude,
      focusDistance: region
        ? camera.position.distanceTo(worldPoint(world, [0, 0, 0]))
        : 100,
      daylight: solar.daylight,
      warmth: solar.warmth || 0,
      sunHeight: scratch.sun.dot(scratch.up),
      weather: solar.weather,
    });
    const blend = 1 - Math.exp(-Math.min(dt, 0.1) * 4);
    uniforms.uUp.value.copy(scratch.up);
    uniforms.uSun.value.copy(scratch.sun);
    uniforms.uZenith.value.lerp(state.zenith, blend);
    uniforms.uHorizon.value.lerp(state.horizon, blend);
    uniforms.uGlow.value.lerp(state.glow, blend);
    uniforms.uDay.value = state.day;
    uniforms.uOpacity.value = state.opacity;
    const weather = solar.weather;
    if (weather) {
      uniforms.uCloud.value = THREE.MathUtils.lerp(
        uniforms.uCloud.value,
        weather.cloud,
        blend,
      );
      uniforms.uRain.value = THREE.MathUtils.lerp(
        uniforms.uRain.value,
        weather.rain,
        blend,
      );
      // Wind blows from windDirection (meteorological); clouds drift downwind.
      const heading = ((weather.windDirection + 180) * Math.PI) / 180;
      const speed = 0.0012 + weather.wind * 0.0005;
      uniforms.uWind.value.set(
        Math.sin(heading) * speed,
        Math.cos(heading) * speed,
      );
    }
    uniforms.uTime.value = (uniforms.uTime.value + Math.min(dt, 0.1)) % 20000;
    fog.color.copy(uniforms.uHorizon.value);
    fog.density = THREE.MathUtils.lerp(fog.density, state.fog, blend);
  });
  return (
    <mesh
      ref={mesh}
      userData={{ sky: true }}
      renderOrder={-99}
      frustumCulled={false}
      raycast={() => null}
      onBeforeRender={(_, __, camera) => {
        camera.getWorldPosition(mesh.current.position);
        mesh.current.updateMatrixWorld();
      }}
    >
      <sphereGeometry args={[SKY_RADIUS * 0.96, 64, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        side={THREE.BackSide}
        // Stay in the opaque list (drawn right after the stars, before the
        // world) while still alpha-blending over the starfield.
        transparent={false}
        blending={THREE.CustomBlending}
        blendSrc={THREE.SrcAlphaFactor}
        blendDst={THREE.OneMinusSrcAlphaFactor}
        depthWrite={false}
        depthTest={false}
        fog={false}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
          }
        `}
        fragmentShader={skyFragment}
      />
    </mesh>
  );
}
