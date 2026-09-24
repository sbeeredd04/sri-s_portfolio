"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { skyFragment, skyUniforms } from "./AtmosphereSky";

// Image-based lighting from the live sky: a small probe scene renders the same
// scattering sky (with a soft dark ground below the horizon) into a PMREM, so
// metal, glass, water and every rough surface pick up the true time of day.
// It refreshes only when the sky has visibly changed, never every frame.
export default function MaterialLighting({ daylight }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const invalidate = useThree((s) => s.invalidate);
  const probe = useMemo(() => {
    const probeScene = new THREE.Scene();
    const material = new THREE.ShaderMaterial({
      uniforms: { ...skyUniforms, uOpacity: { value: 1 } },
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: skyFragment,
    });
    probeScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 32), material));
    return { scene: probeScene, material, generator: new THREE.PMREMGenerator(gl) };
  }, [gl]);
  const current = useRef(null);
  const last = useRef({ key: "", at: -Infinity });
  useEffect(() => {
    const previous = scene.environment;
    return () => {
      scene.environment = previous;
      current.current?.dispose();
      probe.generator.dispose();
      probe.material.dispose();
      probe.scene.children[0].geometry.dispose();
    };
  }, [scene, probe]);
  useFrame(({ clock }) => {
    const u = skyUniforms;
    // Quantised signature: regenerate on a meaningful change, at most 2/s.
    const key = [
      u.uHorizon.value.getHexString(),
      u.uZenith.value.getHexString(),
      u.uUp.value.x.toFixed(2),
      u.uUp.value.y.toFixed(2),
      u.uUp.value.z.toFixed(2),
      u.uSun.value.y.toFixed(2),
    ].join();
    const now = clock.getElapsedTime();
    if (key === last.current.key || now - last.current.at < 0.5) return;
    last.current = { key, at: now };
    const target = probe.generator.fromScene(probe.scene, 0, 0.1, 50);
    current.current?.dispose();
    current.current = target;
    scene.environment = target.texture;
    invalidate();
  });
  useEffect(() => {
    scene.environmentIntensity = 0.45 + daylight * 0.55;
    invalidate();
  }, [scene, daylight, invalidate]);
  return null;
}
