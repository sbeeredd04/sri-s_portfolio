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
          uniform float uDay, uOpacity, uCloud, uOverview, uRain;
          uniform vec2 uWind;
          varying vec3 vDir;
          float skyHash(vec2 p) {
            return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);
          }
          float skyNoise(vec2 p) {
            vec2 i=floor(p), f=fract(p);
            f=f*f*(3.-2.*f);
            return mix(mix(skyHash(i),skyHash(i+vec2(1.,0.)),f.x),
                       mix(skyHash(i+vec2(0.,1.)),skyHash(i+1.),f.x),f.y);
          }
          void main() {
            vec3 d = normalize(vDir);
            float h = dot(d, uUp);
            float viewHeight = (viewMatrix * vec4(d,0.)).y;
            float above = clamp(mix(h, -.11 + viewHeight*1.65, uOverview), 0., 1.);
            vec3 col = mix(uHorizon, uZenith, pow(above, .42));
            // Thick haze hugging the horizon, then a darker ground-haze below.
            col += uHorizon * exp(-abs(h) * 14.) * .055;
            col = mix(col, uHorizon * .84, (1. - uOverview) * (1. - smoothstep(-.35, 0., h)));
            vec2 field=vec2(d.x*9. + d.z*3.,mix(h,viewHeight,uOverview)*19.) + uWind;
            float wisps=skyNoise(field)*.55+skyNoise(field*2.25+11.7)*.3+skyNoise(field*5.4-3.8)*.15;
            float cloud=smoothstep(.47-uCloud*.12,.73,wisps)*smoothstep(.04,.32,above);
            vec3 cloudLight=mix(uHorizon*.78,uHorizon*1.18,smoothstep(.48,.78,wisps));
            cloudLight*=1.-uRain*.18;
            col=mix(col,cloudLight,cloud*(.18+uDay*.5));
            // Mie forward scattering around the sun, strongest near sunset.
            float mu = max(dot(d, uSun), 0.);
            col += uGlow * (pow(mu, 6.) * .28 + pow(mu, 48.) * .9 + pow(mu, 900.) * 6.);
            // Stars stay visible overhead at night; the horizon keeps its glow.
            float nightAlpha = mix(.98, .72, smoothstep(-.05, .55, h));
            float alpha = uOpacity * mix(nightAlpha, 1., uDay);
            gl_FragColor = vec4(col, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
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
  uOverview: { value: 0 },
  uCloud: { value: 0.3 },
  uRain: { value: 0 },
  uWind: { value: new THREE.Vector2(0.004, 0.0015) },
};

export default function AtmosphereSky({ world, solar, animate = true }) {
  const mesh = useRef();
  const drift = useRef(new THREE.Vector2());
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
    if (region) {
      // The inhabited bay uses one level tangent plane. A radial up-vector
      // tilted the sky at shoreline cameras even though buildings stayed up.
      scratch.up.copy(region.normal);
      scratch.sun.applyQuaternion(region.rotation);
    }
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
    // A paused camera jumps to its destination; its old ground fog must not
    // remain on the distant planet while no further frames are scheduled.
    const blend = animate ? 1 - Math.exp(-Math.min(dt, 0.1) * 4) : 1;
    uniforms.uUp.value.copy(scratch.up);
    uniforms.uSun.value.copy(scratch.sun);
    uniforms.uZenith.value.lerp(state.zenith, blend);
    uniforms.uHorizon.value.lerp(state.horizon, blend);
    uniforms.uGlow.value.lerp(state.glow, blend);
    uniforms.uDay.value = state.day;
    uniforms.uOpacity.value = state.opacity;
    uniforms.uOverview.value = world === "planet" ? 1 : 0;
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
      const speed = weather.wind * 0.0005;
      if (animate) {
        drift.current.x += Math.sin(heading) * speed * Math.min(dt,.1);
        drift.current.y += Math.cos(heading) * speed * Math.min(dt,.1);
      }
      uniforms.uWind.value.copy(drift.current);
    }
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
