"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { bakeVat } from "../../lib/vat.mjs";

const CLIPS = [
  { name: "walk", frames: 18 },
  { name: "idle", frames: 24 },
];
// Metres covered by one walk cycle at scale 1 (1.2 m/s over 0.6 s).
const STRIDE = 0.72;

const skins = ["#8d5a3f", "#c89878", "#6e4630", "#e0b394", "#a8704f"];
const hairs = ["#1d1510", "#3b2618", "#6b4a2a", "#141414", "#8a8a88"];
const shirts = [
  "#a44a3f",
  "#2f5d7c",
  "#e1c16e",
  "#3d6b4f",
  "#d9d4c8",
  "#6a4c8c",
  "#c97a3d",
  "#24324a",
];
const trousers = ["#27303b", "#4b4f57", "#6e5c46", "#1f2226", "#3a4a63"];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function crowdMaterial(vat, uniforms) {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.78 });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform sampler2D uVatPos, uVatNor;
        uniform float uTime, uWidth, uHeight, uRows;
        attribute float vatId, part;
        attribute vec3 aClip;
        attribute float aPhase;
        attribute vec3 aSkin, aHair, aShirt, aTrousers;
        varying vec3 vTint;
        vec2 vatUv(float frame){
          float row=frame*uRows+floor(vatId/uWidth);
          return (vec2(mod(vatId,uWidth),row)+.5)/vec2(uWidth,uHeight);
        }`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float cycle=fract(uTime*aClip.z+aPhase)*aClip.y;
        float f0=floor(cycle), f1=mod(f0+1.,aClip.y), blend=cycle-f0;
        vec2 uv0=vatUv(aClip.x+f0), uv1=vatUv(aClip.x+f1);
        vec3 objectNormal=normalize(mix(texture2D(uVatNor,uv0).xyz,texture2D(uVatNor,uv1).xyz,blend));
        #ifdef USE_TANGENT
        vec3 objectTangent=vec3(1.,0.,0.);
        #endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed=mix(texture2D(uVatPos,uv0).xyz,texture2D(uVatPos,uv1).xyz,blend);
        vTint = part<.5?aSkin:part<1.5?aHair:part<2.5?aShirt:part<3.5?aTrousers:part<4.5?vec3(.86,.85,.82):vec3(.2);`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vTint;")
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\ndiffuseColor.rgb*=vTint;",
      );
  };
  return m;
}

// A crowd walking the given routes (polylines in the parent's frame), in one
// instanced draw. `ground(x, z)` places feet; idle agents stand and chat.
export default function Crowd({ src, agents, ground, scale = 1.25, animate }) {
  const { scene, animations } = useGLTF(src);
  const vat = useMemo(
    () => bakeVat(scene, animations, CLIPS),
    [scene, animations],
  );
  const uniforms = useMemo(
    () => ({
      uVatPos: { value: vat.positions },
      uVatNor: { value: vat.normals },
      uTime: { value: 0 },
      uWidth: { value: vat.size.width },
      uHeight: { value: vat.positions.image.height },
      uRows: { value: vat.size.rowsPerFrame },
    }),
    [vat],
  );
  const material = useMemo(() => crowdMaterial(vat, uniforms), [vat, uniforms]);
  const mesh = useRef();
  const state = useMemo(() => {
    const random = rng(97);
    return agents.map((agent, i) => ({
      ...agent,
      along: random() * (agent.length || 1),
      dir: random() < 0.5 ? 1 : -1,
      seed: i,
    }));
  }, [agents]);
  const geometry = useMemo(() => {
    const g = vat.geometry.clone();
    const n = agents.length,
      random = rng(311);
    const pick = (list) =>
      new THREE.Color(list[Math.floor(random() * list.length)]);
    const attr = (size) => new Float32Array(n * size);
    const clip = attr(3),
      phase = attr(1),
      skin = attr(3),
      hair = attr(3),
      shirt = attr(3),
      legs = attr(3);
    agents.forEach((agent, i) => {
      const c = vat.layout[agent.path ? "walk" : "idle"];
      const cps = agent.path
        ? agent.speed / (STRIDE * scale)
        : 1 / (c?.seconds || 4);
      clip.set([c?.row || 0, c?.frames || 1, cps], i * 3);
      phase[i] = random();
      pick(skins).toArray(skin, i * 3);
      pick(hairs).toArray(hair, i * 3);
      pick(shirts).toArray(shirt, i * 3);
      pick(trousers).toArray(legs, i * 3);
    });
    const set = (name, data, size) =>
      g.setAttribute(name, new THREE.InstancedBufferAttribute(data, size));
    set("aClip", clip, 3);
    set("aPhase", phase, 1);
    set("aSkin", skin, 3);
    set("aHair", hair, 3);
    set("aShirt", shirt, 3);
    set("aTrousers", legs, 3);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    return g;
  }, [vat, agents, scale]);
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useEffect(
    () => () => {
      vat.positions.dispose();
      vat.normals.dispose();
      vat.geometry.dispose();
    },
    [vat],
  );
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(scale, scale, scale), [scale]);
  const place = (dt) => {
    state.forEach((a, i) => {
      let x = a.x,
        z = a.z,
        yaw = a.yaw || 0;
      if (a.path) {
        a.along += a.dir * a.speed * dt;
        if (a.along > a.length || a.along < 0) {
          a.dir *= -1;
          a.along = Math.max(0, Math.min(a.length, a.along));
        }
        const [[ax, az], [bx, bz]] = a.path;
        const t = a.along / a.length;
        x = ax + (bx - ax) * t;
        z = az + (bz - az) * t;
        yaw = Math.atan2((bx - ax) * a.dir, (bz - az) * a.dir);
      }
      p.set(x, ground(x, z), z);
      q.setFromAxisAngle(up, yaw);
      matrix.compose(p, q, s);
      mesh.current.setMatrixAt(i, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  };
  useEffect(() => {
    if (mesh.current) place(0);
  });
  useFrame((_, dt) => {
    if (!animate || !mesh.current) return;
    const step = Math.min(dt, 0.05);
    uniforms.uTime.value += step;
    place(step);
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, agents.length]}
      // The shadow pass would draw the bind pose; people only receive.
      receiveShadow
      frustumCulled={false}
    />
  );
}
