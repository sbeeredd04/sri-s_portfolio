"use client";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useQuality } from "./Quality";
import { WORLD_RADIUS } from "../../lib/world-layout.mjs";

// Streaks per tier at full rain; lighter rain shows a share of them.
const DROPS = { low: 1400, medium: 3600, high: 7000 };
const BOX = [34, 22, 34];
const Y = new THREE.Vector3(0, 1, 0),
  X = new THREE.Vector3(1, 0, 0);

// One draw call of camera-wrapped rain. Drops live in a box that tiles space
// around the eye, so walking moves through the rain instead of dragging it.
// "Down" is the planet normal under the camera; wind leans every streak.
export default function WeatherRain({ weather, animate }) {
  const quality = useQuality();
  const count = DROPS[quality.tier] || DROPS.medium;
  const geometry = useMemo(() => {
    const seeds = new Float32Array(count * 2 * 4);
    let s = 7919;
    const random = () => {
      s = (s * 16807) % 2147483647;
      return s / 2147483647;
    };
    for (let i = 0; i < count; i++) {
      const x = random(),
        y = random(),
        z = random(),
        pick = random();
      for (let end = 0; end < 2; end++)
        seeds.set([x, y, z, pick + end * 2], (i * 2 + end) * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("seed", new THREE.BufferAttribute(seeds, 4));
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3),
    );
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity);
    return g;
  }, [count]);
  const uniforms = useMemo(
    () => ({
      uCam: { value: new THREE.Vector3() },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uEast: { value: new THREE.Vector3(1, 0, 0) },
      uNorth: { value: new THREE.Vector3(0, 0, 1) },
      uFall: { value: 0 },
      uRain: { value: 0 },
      uLean: { value: new THREE.Vector2() },
      uBox: { value: new THREE.Vector3(...BOX) },
    }),
    [],
  );
  const lines = useRef();
  const fall = useRef(0);
  useFrame(({ camera }, dt) => {
    const target = weather?.rain ?? 0;
    const u = uniforms;
    u.uRain.value = THREE.MathUtils.lerp(
      u.uRain.value,
      target,
      1 - Math.exp(-Math.min(dt, 0.1) * 1.5),
    );
    const altitude = camera.position.length() - WORLD_RADIUS;
    if (lines.current)
      lines.current.visible = u.uRain.value > 0.01 && altitude < 80;
    if (!lines.current?.visible) return;
    if (animate) fall.current = (fall.current + Math.min(dt, 0.1)) % 1000;
    u.uFall.value = fall.current;
    u.uCam.value.copy(camera.position);
    u.uUp.value.copy(camera.position).normalize();
    const ref = Math.abs(u.uUp.value.y) < 0.9 ? Y : X;
    u.uEast.value.crossVectors(ref, u.uUp.value).normalize();
    u.uNorth.value.crossVectors(u.uUp.value, u.uEast.value);
    const heading = (((weather?.windDirection ?? 290) + 180) * Math.PI) / 180;
    const lean = Math.min(0.6, (weather?.wind ?? 0) * 0.045);
    u.uLean.value.set(Math.sin(heading) * lean, Math.cos(heading) * lean);
  });
  return (
    <lineSegments
      ref={lines}
      geometry={geometry}
      frustumCulled={false}
      renderOrder={5}
      raycast={() => null}
      visible={false}
    >
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          attribute vec4 seed;
          uniform vec3 uCam, uUp, uEast, uNorth, uBox;
          uniform float uFall, uRain;
          uniform vec2 uLean;
          varying float vAlpha;
          void main() {
            float tail = step(1.5, seed.w);
            float pick = seed.w - tail * 2.;
            float speed = 8.5 + fract(pick * 91.7) * 3.;
            vec3 camLocal = vec3(dot(uCam, uEast), dot(uCam, uUp), dot(uCam, uNorth));
            vec3 fallDir = normalize(vec3(uLean.x, -1., uLean.y));
            vec3 p = seed.xyz * uBox + fallDir * uFall * speed - camLocal;
            p = mod(p, uBox) - uBox * .5;
            p -= fallDir * tail * (.22 + uRain * .2);
            vec3 world = uCam + uEast * p.x + uUp * p.y + uNorth * p.z;
            float shown = step(pick, uRain);
            vAlpha = shown * (1. - smoothstep(6., 16., length(p))) * (.22 + uRain * .2) * (1. - tail * .7);
            gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.);
          }
        `}
        fragmentShader={`
          varying float vAlpha;
          void main() { gl_FragColor = vec4(.78, .82, .88, vAlpha); }
        `}
      />
    </lineSegments>
  );
}
